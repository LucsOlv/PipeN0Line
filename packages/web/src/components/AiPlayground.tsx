import { useState } from 'react'
import { trpc } from '../trpc'

export function AiPlayground() {
  const [prompt, setPrompt] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>()

  const queryMutation = trpc.ai.query.useMutation({
    onSuccess: (data) => setSessionId(data.sessionId),
  })

  const { data: sessions, refetch: refetchSessions } =
    trpc.ai.listSessions.useQuery(undefined, { enabled: false })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    queryMutation.mutate({ prompt, sessionId })
  }

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>AI Playground</h2>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt..."
          rows={4}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button type="submit" disabled={queryMutation.isPending}>
          {queryMutation.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>

      {queryMutation.isError && (
        <p style={{ color: 'red' }}>
          Error: {queryMutation.error.message}
        </p>
      )}

      {queryMutation.data && (
        <div style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
          <strong>Response:</strong>
          <p>{queryMutation.data.content}</p>
          <small>Session: {queryMutation.data.sessionId}</small>
        </div>
      )}

      <hr style={{ margin: '1.5rem 0' }} />

      <button onClick={() => refetchSessions()}>List Sessions</button>

      {sessions && sessions.length > 0 && (
        <ul>
          {sessions.map((s) => (
            <li key={s.sessionId}>
              <code>{s.sessionId}</code> — {s.summary ?? 'No summary'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
