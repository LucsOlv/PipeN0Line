import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AiPlayground } from '../AiPlayground'
import { trpc } from '../../trpc'

vi.mock('../../trpc', () => ({
  trpc: {
    ai: {
      query: {
        useMutation: vi.fn(),
      },
      listSessions: {
        useQuery: vi.fn(),
      },
    },
  },
}))

const mockMutate = vi.fn()
const mockRefetch = vi.fn()

function setupMocks(overrides?: {
  isPending?: boolean
  isError?: boolean
  data?: { sessionId: string; content: string }
  error?: { message: string }
  sessions?: { sessionId: string; summary?: string }[]
}) {
  vi.mocked(trpc.ai.query.useMutation).mockReturnValue({
    mutate: mockMutate,
    isPending: overrides?.isPending ?? false,
    isError: overrides?.isError ?? false,
    data: overrides?.data,
    error: overrides?.error,
  } as never)

  vi.mocked(trpc.ai.listSessions.useQuery).mockReturnValue({
    data: overrides?.sessions,
    refetch: mockRefetch,
  } as never)
}

describe('AiPlayground', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('renders textarea and send button', () => {
    setupMocks()
    render(<AiPlayground />)
    expect(screen.getByPlaceholderText(/enter a prompt/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('calls mutate with prompt on submit', async () => {
    setupMocks()
    render(<AiPlayground />)
    fireEvent.change(screen.getByPlaceholderText(/enter a prompt/i), {
      target: { value: 'Hello AI' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Hello AI' })
      )
    })
  })

  it('does not submit when prompt is empty', () => {
    setupMocks()
    render(<AiPlayground />)
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows loading state while pending', () => {
    setupMocks({ isPending: true })
    render(<AiPlayground />)
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })

  it('displays error message on failure', () => {
    setupMocks({ isError: true, error: { message: 'Network error' } })
    render(<AiPlayground />)
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('displays AI response content', () => {
    setupMocks({ data: { sessionId: 's1', content: 'The answer is 42' } })
    render(<AiPlayground />)
    expect(screen.getByText('The answer is 42')).toBeInTheDocument()
    expect(screen.getByText(/s1/)).toBeInTheDocument()
  })

  it('shows session list on button click', async () => {
    setupMocks({
      sessions: [{ sessionId: 'sess-1', summary: 'Pipeline analysis' }],
    })
    render(<AiPlayground />)
    fireEvent.click(screen.getByRole('button', { name: /list sessions/i }))
    expect(mockRefetch).toHaveBeenCalled()
    expect(screen.getByText('sess-1')).toBeInTheDocument()
  })
})
