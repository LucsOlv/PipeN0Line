export interface AiSessionMeta {
  sessionId: string
  startTime: Date
  modifiedTime: Date
  summary?: string
}

export interface AiQueryInput {
  prompt: string
  sessionId?: string
  model?: string
}

export interface AiQueryOutput {
  sessionId: string
  content: string
}
