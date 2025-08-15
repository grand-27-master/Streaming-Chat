export type StreamStatus = 'streaming' | 'complete' | 'done'

export type StreamEvent =
  | { status: 'streaming'; token?: string; text?: string }
  | { status: 'complete' | 'done'; text?: string }
  | { type: 'final_message'; message: string }
  | {
      assistantMessageId: string
      conversationId: string
      message: string
      status: 'complete' | string
      text: string
      type: string
      userMessageId: string
    }

export interface EditCard {
  cardid: string
  old_text: string
  new_text: string
}
