import React from 'react'

type Props = {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  className?: string
}

export default function Message({
  role,
  text,
  streaming = false,
  className = ''
}: Props) {
  const isUser = role === 'user'
  const avatarClass = isUser ? 'bg-indigo-600' : 'bg-emerald-600' // Different avatar color per role

  return (
    <div
      className={`rounded-2xl p-4 border shadow-sm bg-zinc-900/60 border-zinc-800 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar circle */}
        <div className={`w-10 h-10 rounded-full ${avatarClass}`} />

        {/* Message content */}
        <div className="flex-1">
          {/* Role label */}
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
            {isUser ? 'You' : 'Assistant'}
          </div>

          {/* Main text */}
          <p className="leading-6 text-zinc-100 whitespace-pre-wrap">
            {text || (streaming ? '' : '…')}
          </p>

          {/* Typing indicator for assistant */}
          {streaming && (
            <div className="mt-2 flex items-center gap-1 text-zinc-400">
              <span className="sr-only">Assistant is typing</span>
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.1s]"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
