import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, ToastProvider } from '@/app/providers'
import { AppRouter } from '@/app/router/AppRouter'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry 401 or 403 errors
        if (error?.status === 401 || error?.status === 403) return false
        return failureCount < 2
      },
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
