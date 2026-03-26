import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { trpc } from './trpc'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { CreateRunPage } from './pages/CreateRunPage'
import { SettingsPage } from './pages/SettingsPage'
import { RunDetailPage } from './pages/RunDetailPage'

const queryClient = new QueryClient()

const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: '/trpc' })],
})

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/run/new', element: <CreateRunPage /> },
      { path: '/run/:id', element: <RunDetailPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

