import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './trpc'
import { AiPlayground } from './components/AiPlayground'

const queryClient = new QueryClient()

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
    }),
  ],
})

function Hello() {
  const [name] = useState('PipeNoLine')
  const { data, isLoading } = trpc.hello.useQuery({ name })

  if (isLoading) return <p>Loading...</p>
  return <p>{data?.message}</p>
}

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Hello />
        <AiPlayground />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
