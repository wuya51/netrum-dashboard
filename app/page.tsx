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
  const { loadNetworkOverview, error, clearError } = useDashboardStore()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [urlSearchParam, setUrlSearchParam] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [cooldownActive, setCooldownActive] = useState(false)
  const [, setSearchCooldown] = useState<Record<string, number>>({})
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [registrationStatus, setRegistrationStatus] = useState<any>(null)
  const [registrationLoading, setRegistrationLoading] = useState(true)
const [apiConnectionStatus, setApiConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking')
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

  const checkApiConnection = async () => {
    try {
      if (!navigator.onLine) {
        setApiConnectionStatus('offline')
        return false
      }
      if (apiConnectionStatus !== 'checking') {
        setApiConnectionStatus('checking')
      }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      try {
        const response = await fetch('https://node.netrumlabs.dev/', {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          setApiConnectionStatus('online')
          return true
        } else {
          setApiConnectionStatus('offline')
          return false
        }
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          setApiConnectionStatus('offline')
        } else {
          setApiConnectionStatus('offline')
        }
        return false
      }
    } catch (error) {
      console.error('API connection check failed:', error)
      return false
    }
  }

  const handleOnline = () => {
    console.log('🌐 Browser is online, checking API connection...')
    setApiConnectionStatus('checking')
    checkApiConnection()
  }

  const handleOffline = () => {
    console.log('📵 Browser is offline')
    setApiConnectionStatus('offline')
  }

  useEffect(() => {
    checkApiConnection()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const apiCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        checkApiConnection()
      }
    }, 30000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(apiCheckInterval)
    }
  }, [])

  useEffect(() => {
    if (apiConnectionStatus === 'online') {
      loadNetworkOverview()
      if (autoRefresh) {
        const interval = setInterval(() => {
          loadNetworkOverview()
        }, 300_000)
        return () => clearInterval(interval)
      }
    }
  }, [loadNetworkOverview, autoRefresh, apiConnectionStatus])

  useEffect(() => {
    const loadRegistrationStatus = async (retryCount = 0) => {
      const maxRetries = 3
      
      try {
        setRegistrationLoading(true)
        const status = await NetrumAPI.getRegistrationStatus()
        setRegistrationStatus(status)
      } catch (error) {
        console.error('Failed to load registration status:', error)
        
        if (error instanceof Error && error.message.includes('timeout') && retryCount < maxRetries) {
          console.log(`Retrying registration status load... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            loadRegistrationStatus(retryCount + 1)
          }, 2000) 
          return
        }
        
        setRegistrationStatus(null)
      } finally {
        if (retryCount >= maxRetries) {
          setRegistrationLoading(false)
        }
      }
    }

    loadRegistrationStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Netrum Logo" className="h-8 w-8" />
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Netrum Node Dashboard</h1>
                <div 
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                    apiConnectionStatus === 'online' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : apiConnectionStatus === 'offline'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                  title={apiConnectionStatus === 'online' 
                ? 'Network and API server connection normal' 
                : apiConnectionStatus === 'offline' 
                ? 'Network connection interrupted, please check network settings' 
                : 'Checking network connection status...'
              }
                >
                  <div className={`w-2 h-2 rounded-full ${
                    apiConnectionStatus === 'online' ? 'bg-green-500' 
                    : apiConnectionStatus === 'offline' ? 'bg-red-500' 
                    : 'bg-yellow-500 animate-pulse'
                  }`}></div>
                  <span>
                    {apiConnectionStatus === 'online' ? 'Online' 
                     : apiConnectionStatus === 'offline' ? 'Offline' 
                     : 'Checking...'}
                  </span>
                </div>
              </div>
            </a>
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
        <div className="space-y-2">
          <NodeSearch initialSearchValue={urlSearchParam} />
          <NetworkOverview />
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