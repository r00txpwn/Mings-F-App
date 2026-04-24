import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message ?? '';
      const looksLikeConfig =
        /VITE_SUPABASE_(URL|ANON_KEY)/i.test(msg) ||
        /missing environment variables/i.test(msg) ||
        /configuration issue/i.test(msg);

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {looksLikeConfig ? 'Configuration error' : 'Application error'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {looksLikeConfig
                  ? 'The application failed to start due to a configuration issue.'
                  : 'Something went wrong while rendering this page. The technical message below can help developers find the cause.'}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
                {msg}
              </p>
              {!looksLikeConfig && /Minified React error #310/i.test(msg) ? (
                <p className="mt-3 text-xs text-red-700 dark:text-red-400">
                  React #310 usually means a hook was called in a different order between renders (for example a{' '}
                  <code className="rounded bg-red-100/80 px-1 dark:bg-red-950/50">useMemo</code> placed after an early{' '}
                  <code className="rounded bg-red-100/80 px-1 dark:bg-red-950/50">return</code>). Reproduce with{' '}
                  <code className="rounded bg-red-100/80 px-1 dark:bg-red-950/50">npm run dev</code> for a full stack trace.
                </p>
              ) : null}
            </div>

            {looksLikeConfig ? (
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h2 className="font-semibold mb-2">To fix this issue:</h2>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Go to your hosting platform dashboard (Netlify, Vercel, etc.)</li>
                    <li>Navigate to Environment Variables or Build Settings</li>
                    <li>Add the following variables:
                      <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-xs space-y-1">
                        <div>VITE_SUPABASE_URL=your_supabase_url</div>
                        <div>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
                      </div>
                    </li>
                    <li>Redeploy your application</li>
                  </ol>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    These values can be found in your Supabase project settings under API.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If this persists after refresh, try a development build or check the browser console for the first error
                before this screen.
              </p>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full mt-6 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
