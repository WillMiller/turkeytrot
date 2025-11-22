'use client'

import { useState } from 'react'
import { signout } from '@/app/actions/auth'
import ParticipantsView from './ParticipantsView'
import RacesView from './RacesView'
import UserManagement from './UserManagement'
import RaceResultsDisplay from './RaceResultsDisplay'

type View = 'participants' | 'races' | 'users' | 'results-display'

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('races')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  StartLine
                </h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <button
                  onClick={() => setCurrentView('races')}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    currentView === 'races'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Races
                </button>
                <button
                  onClick={() => setCurrentView('results-display')}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    currentView === 'results-display'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Results Display
                </button>
                <button
                  onClick={() => setCurrentView('participants')}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    currentView === 'participants'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Racers
                </button>
                <button
                  onClick={() => setCurrentView('users')}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    currentView === 'users'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => signout()}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`${currentView === 'results-display' ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}`}>
        {currentView === 'participants' && <ParticipantsView />}
        {currentView === 'races' && <RacesView />}
        {currentView === 'users' && <UserManagement />}
        {currentView === 'results-display' && <RaceResultsDisplay />}
      </main>
    </div>
  )
}
