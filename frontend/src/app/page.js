import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20">
          <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to ConnectFlow
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A modern social platform built with event-driven architecture. Connect, share, and engage with your community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Sign In
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-indigo-600 text-base font-semibold rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 transition-all duration-200 transform hover:scale-105"
            >
              Create Account
            </Link>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
              <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Event-Driven</h3>
              <p className="text-sm text-gray-600">Built with modern event-driven architecture for scalability</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
              <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time</h3>
              <p className="text-sm text-gray-600">Instant updates and notifications for seamless experience</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl">
              <div className="h-12 w-12 bg-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
              <p className="text-sm text-gray-600">JWT authentication and secure data handling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
