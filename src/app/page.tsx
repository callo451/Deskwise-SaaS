import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col gap-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Deskwise ITSM
        </h1>
        <p className="text-lg md:text-xl text-center text-gray-600 dark:text-gray-400">
          AI-Powered IT Service Management Platform
        </p>
        <div className="glass p-8 rounded-lg shadow-xl max-w-2xl w-full">
          <p className="text-center text-lg font-semibold mb-4">
            🚀 Platform Ready!
          </p>
          <p className="text-center mb-6 text-gray-600 dark:text-gray-400">
            Create your account to start managing IT services with AI-powered features
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
            >
              Get Started →
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl w-full">
          <div className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="text-4xl mb-3">🎫</div>
            <h3 className="font-semibold mb-2">Smart Ticketing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered ticket management and routing</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">Live Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Real-time analytics and insights</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Intelligent automation and suggestions</p>
          </div>
        </div>
      </div>
    </main>
  )
}
