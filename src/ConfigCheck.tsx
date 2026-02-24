export function ConfigCheck({ children }: { children: React.ReactNode }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
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
              Configuration Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The application failed to start due to a configuration issue.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm font-mono text-red-800 dark:text-red-300">
              Missing environment variables
            </p>
          </div>

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

  return <>{children}</>;
}
