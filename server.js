import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

/**
 * SSE endpoint for /api/improve
 * Streams a fixed sequence of events to simulate a live backend.
 */
app.post('/api/improve', (req, res) => {
  // Tell the browser this is a Server-Sent Events stream
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // disable buffering in some proxies
  res.flushHeaders?.()

  // Kick off the connection with a comment (helps flush initial headers)
  res.write(': connected\n\n')

  // Predefined events sent to the client — spaced out by 100ms
  const events = [
    // These simulate streaming text + card edits being revealed over time
    { status: 'streaming', token: '[]', text: '[]' },
    { status: 'streaming', token: "I'll improve the note card and one", text: "[]I'll improve the note card and one" },
    { status: 'streaming', token: ' action card in the second moment to better match your channel', text: "[]I'll improve the note card and one action card in the second moment to better match your channel" },
    { status: 'streaming', token: "'s style and enhance the dramatic impact.", text: "[]I'll improve the note card and one action card in the second moment to better match your channel's style and enhance the dramatic impact." },
    {
      status: 'streaming',
      token:
`<edit_card>
cardid:30aebfb2-8072-4b73-9c3f-116183ef52e1
old_text:Text overlay: "When The Noob Beats The Dragon First 💀"
new_text:Text overlay appears with dramatic zoom: "POV: The Noob Has A Secret Plan 💀"
</edit_card>`,
      text:
`[]I'll improve the note card and one action card in the second moment to better match your channel's style and enhance the dramatic impact.<edit_card>
cardid:30aebfb2-8072-4b73-9c3f-116183ef52e1
old_text:Text overlay: "When The Noob Beats The Dragon First 💀"
new_text:Text overlay appears with dramatic zoom: "POV: The Noob Has A Secret Plan 💀"
</edit_card>`
    },
    {
      status: 'streaming',
      token:
`<edit_card>
cardid:caca5ac8-effe-4380-8346-71b435ad5404
old_text:Noob suddenly pulls out a bed from inventory
new_text:Noob casually pulls out a bed from inventory with confident swagger, synchronized to music beat
</edit_card>`,
      text:
`[]I'll improve the note card and one action card in the second moment to better match your channel's style and enhance the dramatic impact.<edit_card>
cardid:30aebfb2-8072-4b73-9c3f-116183ef52e1
old_text:Text overlay: "When The Noob Beats The Dragon First 💀"
new_text:Text overlay appears with dramatic zoom: "POV: The Noob Has A Secret Plan 💀"
</edit_card><edit_card>
cardid:caca5ac8-effe-4380-8346-71b435ad5404
old_text:Noob suddenly pulls out a bed from inventory
new_text:Noob casually pulls out a bed from inventory with confident swagger, synchronized to music beat
</edit_card>`
    },
    // Additional streaming chunks (some contain [] markers, some are plain text)
    { status: 'streaming', token: '[]', text:
`[]I'll improve the note card and one action card in the second moment to better match your channel's style and enhance the dramatic impact.<edit_card>
cardid:30aebfb2-8072-4b73-9c3f-116183ef52e1
old_text:Text overlay: "When The Noob Beats The Dragon First 💀"
new_text:Text overlay appears with dramatic zoom: "POV: The Noob Has A Secret Plan 💀"
</edit_card><edit_card>
cardid:caca5ac8-effe-4380-8346-71b435ad5404
old_text:Noob suddenly pulls out a bed from inventory
new_text:Noob casually pulls out a bed from inventory with confident swagger, synchronized to music beat
</edit_card>[]` },
    // (… rest of the chunks unchanged from your original …)
    {
      type: 'final_message',
      message:
`[]I'll improve the note card and one action card in the second moment to better match your channel's style and enhance the dramatic impact.<edit_card>
cardid:30aebfb2-8072-4b73-9c3f-116183ef52e1
old_text:Text overlay: "When The Noob Beats The Dragon First 💀"
new_text:Text overlay appears with dramatic zoom: "POV: The Noob Has A Secret Plan 💀"
</edit_card><edit_card>
cardid:caca5ac8-effe-4380-8346-71b435ad5404
old_text:Noob suddenly pulls out a bed from inventory
new_text:Noob casually pulls out a bed from inventory with confident swagger, synchronized to music beat
</edit_card>[]I've enhanced both cards to better capture your signature style:

1. **Note card**: Changed the text overlay to "POV: The Noob Has A Secret Plan 💀" with dramatic zoom effect - this creates more intrigue and uses the POV format that performs well in your content.

2. **Action card**: Added "confident swagger" and "synchronized to music beat" to the bed reveal moment - this emphasizes the satisfying music sync and character confidence that your audience loves in these twist moments.

These improvements maintain the comedic tension while adding the polished editing touches that make your videos so engaging.`
    },
    {
      assistantMessageId: '6e52fde4-c18d-4e70-8f48-455b6adecbd4',
      conversationId: 'c18f617a-dff4-47a1-b5aa-8de32a736468',
      message:
        "[]I'll improve the note card and one action card ... \\u003cedit_card\\u003e ... \\u003c/edit_card\\u003e (truncated for brevity)",
      status: 'complete',
      text:
        "[]I'll improve the note card and one action card ... \\u003cedit_card\\u003e ... \\u003c/edit_card\\u003e (truncated for brevity)",
      type: 'outline-chat',
      userMessageId: '6c8a87d9-2de2-4b37-917e-400dd964403b'
    }
  ]

  // Helper to send one event at a time, spaced out
  let i = 0
  const send = () => {
    if (i < events.length) {
      res.write(`data: ${JSON.stringify(events[i])}\n\n`)
      i++
      setTimeout(send, 100)
    } else {
      // Signal the end of the stream
      res.write(`data: ${JSON.stringify({ status: 'complete' })}\n\n`)
      res.end()
    }
  }
  send()
})

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
