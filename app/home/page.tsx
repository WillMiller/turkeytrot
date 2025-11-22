import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">
                Sausalito FREE Turkey Trot
              </h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Register Now
              </Link>
              <Link
                href="/participant/login"
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Sausalito FREE Turkey Trot
            </h2>
            <p className="mt-6 text-xl text-orange-100">
              Join us for Sausalito&apos;s favorite Thanksgiving tradition!
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              Thanksgiving Day • 8:00 AM
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/register"
                className="rounded-md bg-white px-8 py-3 text-lg font-semibold text-orange-600 shadow-lg hover:bg-orange-50 transition-colors"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md border-t-4 border-orange-500">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">When</h3>
              <p className="text-gray-600">
                Thanksgiving Day<br />
                Thursday, November 28, 2024<br />
                8:00 AM Start
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md border-t-4 border-orange-500">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Where</h3>
              <p className="text-gray-600">
                Sausalito Waterfront<br />
                Gate 6 Road<br />
                Sausalito, CA 94965
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md border-t-4 border-orange-500">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration</h3>
              <p className="text-gray-600">
                FREE Event<br />
                Online Registration Available<br />
                Race Day Check-In: 7:00 AM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">About the Turkey Trot</h2>
          </div>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p className="text-lg">
              The Sausalito Turkey Trot is a cherished Thanksgiving Day tradition that brings our community together for a fun, festive 5K run/walk along the beautiful Sausalito waterfront.
            </p>
            <p className="mt-4">
              Whether you&apos;re a competitive runner looking to burn off some calories before the big meal, or a family looking for a fun holiday activity, the Turkey Trot welcomes everyone! Join your neighbors for this FREE community event.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Race Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Scenic waterfront course</li>
                  <li>✓ All ages and abilities welcome</li>
                  <li>✓ Timed results</li>
                  <li>✓ Age group awards</li>
                  <li>✓ Family-friendly atmosphere</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Race Day Info</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>📍 Check-in: 7:00 AM</li>
                  <li>🏃 Race Start: 8:00 AM</li>
                  <li>🎫 Bib pickup at check-in</li>
                  <li>🅿️ Street parking available</li>
                  <li>☕ Refreshments provided</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-orange-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Us?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Register now to secure your spot in this year&apos;s Turkey Trot!
          </p>
          <Link
            href="/register"
            className="inline-block rounded-md bg-white px-8 py-3 text-lg font-semibold text-orange-600 shadow-lg hover:bg-orange-50 transition-colors"
          >
            Register for Free
          </Link>
          <p className="mt-4 text-orange-100">
            Already registered?{' '}
            <Link href="/participant/login" className="underline hover:text-white">
              Sign in to view your details
            </Link>
          </p>
          <p className="mt-2 text-orange-100 text-sm">
            Registered via email?{' '}
            <Link href="/claim-account" className="underline hover:text-white">
              Claim your account here
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p className="text-lg font-semibold text-white mb-2">Sausalito FREE Turkey Trot</p>
            <p>Gate 6 Road, Sausalito, CA 94965</p>
            <p className="mt-4 text-sm">
              © {new Date().getFullYear()} Sausalito FREE Turkey Trot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
