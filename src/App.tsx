import React, { useMemo, useRef, useState } from 'react'
import Message from './components/Message'
import Card from './components/Card'
import type { EditCard, StreamEvent } from './types'

/**
 * Some backends escape `<`/`>` as \u003c / \u003e (or &lt; / &gt;).
 * Convert those so downstream parsing sees real tags.
 */
function decodeEscapedTags(s: string) {
  if (!s) return s
  return s
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
}

/**
 * Regex for extracting <edit_card> blocks safely in TSX.
 * Using `new RegExp(String.raw...)` avoids the `</...>` JSX parsing pitfall.
 */
const EDIT_BLOCK_REGEX = new RegExp(
  String.raw`<edit_card>\s*cardid:([^\n]+)\nold_text:([\s\S]*?)\nnew_text:([\s\S]*?)\n<\/edit_card>`,
  'g'
)
const REMOVE_EDIT_BLOCKS_REGEX = new RegExp(String.raw`<edit_card>[\s\S]*?<\/edit_card>`, 'g')

/**
 * Pull any complete <edit_card> blocks out of the current text.
 * If the closing tag isn't present yet (mid-stream), skip work.
 */
function extractEditBlocksMaybe(text: string): EditCard[] {
  const decoded = decodeEscapedTags(text)
  if (!decoded.includes('</edit_card>')) return []
  const edits: EditCard[] = []
  EDIT_BLOCK_REGEX.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = EDIT_BLOCK_REGEX.exec(decoded)) !== null) {
    edits.push({
      cardid: m[1].trim(),
      old_text: m[2].trim().replace(/^"+|"+$/g, ''),
      new_text: m[3].trim().replace(/^"+|"+$/g, '')
    })
  }
  return edits
}

type ChatMsg = { id: number; isUser: boolean; text: string }
type UICard = EditCard & { finalized: boolean }

export default function App() {
  // Chat transcript (user + assistant bubbles)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  // Raw assistant text as it streams in (may include <edit_card> blocks)
  const [assistantText, setAssistantText] = useState('')
  // Parsed <edit_card> items shown as actionable cards
  const [cards, setCards] = useState<UICard[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the chat bubble tidy: show a short snippet, not the full assistant text
  const assistantBrief = useMemo(() => {
    const clean = decodeEscapedTags(assistantText)
      .replace(REMOVE_EDIT_BLOCKS_REGEX, '')
      .replace(/^\[\]/, '')
      .trim()
    if (clean.length > 120) return clean.slice(0, 120) + '…'
    return clean
  }, [assistantText])

  // If the stream stalls for a bit, surface a gentle hint
  function armWatchdog() {
    if (watchdog.current) clearTimeout(watchdog.current)
    watchdog.current = setTimeout(() => {
      setHint('Connection is slow. If nothing appears, check the server (npm run dev).')
      setIsStreaming(false)
    }, 2000)
  }

  /**
   * Merge newly parsed cards into state while preserving any finalized ones.
   * (Finalized cards should not get "un-finalized" by later chunks.)
   */
  function mergeCards(parsed: EditCard[]) {
    setCards(prev => {
      const map = new Map<string, UICard>()
      for (const c of prev) map.set(c.cardid, c)
      for (const p of parsed) {
        const existing = map.get(p.cardid)
        map.set(p.cardid, { ...p, finalized: existing?.finalized ?? false })
      }
      return [...map.values()]
    })
  }

  /**
   * Open the SSE stream for the given prompt, read chunks,
   * and update both the brief assistant bubble and the edit cards.
   */
  async function streamFor(prompt: string) {
    setHint(null)
    setIsStreaming(true)
    setAssistantText('')
    setCards([])
    armWatchdog()

    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message: prompt })
      })
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let finished = false

      while (!finished) {
        const { value, done } = await reader.read()
        if (done) break
        armWatchdog()

        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by a blank line
        let idx: number
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 2)
          if (!raw.startsWith('data:')) continue

          const json = raw.replace(/^data:\s*/, '')
          try {
            const evt = JSON.parse(json) as StreamEvent

            // Final states the server may send
            if ('status' in evt && (evt.status === 'complete' || evt.status === 'done')) {
              if (evt.text && !evt.text.includes('(truncated for brevity)')) {
                setAssistantText(evt.text)
                const parsed = extractEditBlocksMaybe(evt.text)
                if (parsed.length) mergeCards(parsed)
              }
              finished = true
              break
            }

            // Another common final form
            if ('type' in evt && evt.type === 'final_message') {
              if (evt.message && !evt.message.includes('(truncated for brevity)')) {
                setAssistantText(evt.message)
                const parsed = extractEditBlocksMaybe(evt.message)
                if (parsed.length) mergeCards(parsed)
              }
              continue
            }

            // Some backends bundle a "complete" object with IDs
            if ('assistantMessageId' in evt && (evt as any).status) {
              const finalText = (evt as any).text || (evt as any).message || ''
              if (!finalText.includes('(truncated for brevity)')) {
                setAssistantText(finalText)
                const parsed = extractEditBlocksMaybe(finalText)
                if (parsed.length) mergeCards(parsed)
              }
              finished = true
              break
            }

            // Normal streaming event with either `text` or `token`
            if ('status' in evt && evt.status === 'streaming') {
              const t = ('token' in evt ? evt.token : evt.text) ?? ''
              if (t && !t.includes('(truncated for brevity)')) {
                setAssistantText(t)
                const parsed = extractEditBlocksMaybe(t)
                if (parsed.length) mergeCards(parsed)
              }
            }
          } catch {
            // If a frame isn't valid JSON, ignore and keep reading
          }
        }
      }
    } catch (err) {
      setHint('Request failed. Make sure the server is running and no firewall blocks localhost:3001.')
      console.error(err)
    } finally {
      setIsStreaming(false)
      if (watchdog.current) clearTimeout(watchdog.current)
    }
  }

  // Submit handler: push user bubble, add assistant placeholder, then start streaming
  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim() || ''
    if (!value) return

    const id = Date.now()
    setMessages(prev => [...prev, { id, isUser: true, text: value }])
    setMessages(prev => [...prev, { id: id + 1, isUser: false, text: '' }])
    streamFor(value)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Card actions from the UI
  function handleApply(cardid: string) {
    setCards(prev => prev.map(c => (c.cardid === cardid ? { ...c, finalized: true } : c)))
  }
  function handleReject(cardid: string) {
    setCards(prev => prev.filter(c => c.cardid !== cardid))
  }

  /**
   * Mirror the latest assistant snippet into the last assistant bubble,
   * so the chat updates live while streaming.
   */
  const viewMessages = useMemo(() => {
    const list = [...messages]
    const lastAssistantIndex = [...list].reverse().findIndex(m => !m.isUser)
    if (lastAssistantIndex !== -1) {
      const idx = list.length - 1 - lastAssistantIndex
      list[idx] = { ...list[idx], text: assistantBrief || list[idx].text }
    }
    return list
  }, [messages, assistantBrief])

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Streaming Chat
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Try:&nbsp;
            <span className="font-mono text-zinc-300">"Hey, can you help me improve my outline?"</span>
          </p>
          {hint && <p className="mt-3 text-xs text-amber-300 animate-pulse">{hint}</p>}
        </header>

        {viewMessages.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-zinc-400 text-sm mb-6 shadow-lg">
            Your messages will appear here.
          </div>
        )}

        <section className="space-y-4">
          {viewMessages.map(m => (
            <Message
              key={m.id}
              role={m.isUser ? 'user' : 'assistant'}
              text={m.text}
              streaming={!m.isUser && isStreaming}
              className={
                m.isUser
                  ? 'bg-indigo-600/15 border-indigo-800/50 shadow-md'
                  : 'bg-zinc-800/50 border-zinc-700/60 shadow-sm'
              }
            />
          ))}
        </section>

        {cards.length > 0 && (
          <section className="space-y-4 mt-6">
            {cards.map(c => (
              <Card
                key={c.cardid}
                card={c}
                onApply={handleApply}
                onReject={handleReject}
                className="hover:scale-[1.01] transition-transform shadow-md"
              />
            ))}
          </section>
        )}

        <form onSubmit={onSubmit} className="mt-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 pr-2 flex items-center gap-3 shadow-lg">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-700 to-purple-700 border border-indigo-600" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none placeholder-zinc-500 text-zinc-100"
              placeholder="Ask anything…"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isStreaming}
            >
              {isStreaming ? 'Streaming…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
