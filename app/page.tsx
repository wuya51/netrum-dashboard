'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDashboardStore } from '../src/store/useDashboardStore'
import { NetrumAPI } from '../src/api/netrumApi'
import CountdownTimer from '../src/components/CountdownTimer'
import NodeSearch from '../src/components/NodeSearch'
import NetworkOverview from '../src/components/NetworkOverview'
import ActiveNodesSection from '../src/components/ActiveNodesSection'
import ThemeToggle from '../src/components/ThemeToggle'

export default function HomePage() {
  const { networkStats, loadNetworkOverview, error, clearError } = useDashboardStore()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [urlSearchParam, setUrlSearchParam] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [cooldownActive, setCooldownActive] = useState(false)
  const [searchCooldown, setSearchCooldown] = useState<Record<string, number>>({})
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [registrationStatus, setRegistrationStatus] = useState<any>(null)
  const [registrationLoading, setRegistrationLoading] = useState(true)
  const handleNodeClick = (address: string) => {
    console.log('Node clicked with address:', address)
    const params = new URLSearchParams(searchParams.toString())
    params.set('search', address)
    router.push(`${pathname}?${params.toString()}`)
    setUrlSearchParam(address)
    const now = Date.now()
    setSearchCooldown(prev => ({
      ...prev,
      [address.toLowerCase()]: now
    }))
    setCooldownActive(true)
    setCooldownRemaining(30)
    setTimeout(() => {
      const searchSection = document.getElementById('search-section')
      if (searchSection) {
        searchSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
  }
  useEffect(() => {
    if (cooldownActive && cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => {
          const newRemaining = prev - 1
          if (newRemaining <= 0) {
            setCooldownActive(false)
            setSearchCooldown({})
          }
          return newRemaining
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [cooldownActive, cooldownRemaining])

  useEffect(() => {
    const searchValue = searchParams.get('search')
    if (searchValue) {
      setUrlSearchParam(decodeURIComponent(searchValue))
    }
  }, [searchParams])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  useEffect(() => {
    loadNetworkOverview()
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadNetworkOverview()
      }, 300_000)
      return () => clearInterval(interval)
    }
  }, [loadNetworkOverview, autoRefresh])

  useEffect(() => {
    const loadRegistrationStatus = async () => {
      try {
        setRegistrationLoading(true)
        const status = await NetrumAPI.getRegistrationStatus()
        setRegistrationStatus(status)
      } catch (error) {
        console.error('Failed to load registration status:', error)
        setRegistrationStatus(null)
      } finally {
        setRegistrationLoading(false)
      }
    }

    loadRegistrationStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Netrum Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Netrum Node Dashboard</h1>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap justify-end items-center gap-2 md:gap-4">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto Refresh (<CountdownTimer intervalMs={300000} />)
            </label>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-0.5 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-700 hover:text-red-900 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-2">
          <NodeSearch initialSearchValue={urlSearchParam} />
          <NetworkOverview stats={networkStats} />
          <ActiveNodesSection onNodeClick={handleNodeClick} cooldownActive={cooldownActive} />
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">Netrum Labs - Node Management Dashboard</p>
          {registrationLoading ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
              Loading network information...
            </p>
          ) : registrationStatus && registrationStatus.success ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
              Netrum on {registrationStatus.network} • $NPT Contract: {registrationStatus.contractAddress}
            </p>
          ) : (
            <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
              Network information not available
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}