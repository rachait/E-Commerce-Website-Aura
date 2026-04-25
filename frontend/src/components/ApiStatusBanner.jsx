import React, { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Wifi } from 'lucide-react'
import { getApiConnectionState, onApiStatusChange } from '../utils/api'
import { useToast } from '../context/ToastContext'

export default function ApiStatusBanner() {
  const [apiStatus, setApiStatus] = useState(getApiConnectionState())
  const { showToast } = useToast()

  useEffect(() => {
    let previousOnline = getApiConnectionState().isOnline

    const unsubscribe = onApiStatusChange((nextStatus) => {
      setApiStatus(nextStatus)

      if (!nextStatus.isOnline && previousOnline) {
        showToast('Backend is unreachable. Some actions may fail until connection returns.', 'error', 3500)
      }

      if (nextStatus.isOnline && !previousOnline) {
        showToast('Connection restored. Syncing latest data.', 'success', 2200)
      }

      previousOnline = nextStatus.isOnline
    })

    return unsubscribe
  }, [showToast])

  if (apiStatus.isOnline && !apiStatus.isReconnecting) {
    return null
  }

  const isReconnecting = apiStatus.isReconnecting

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4">
      <div className={`mx-auto max-w-7xl rounded-b-lg border px-4 py-2 text-sm shadow-lg backdrop-blur-md ${isReconnecting ? 'border-amber-300/60 bg-amber-50/90 text-amber-900' : 'border-red-300/60 bg-red-50/90 text-red-900'}`}>
        <div className="flex items-center justify-center gap-2 text-center">
          {isReconnecting ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
          <span className="font-medium">
            {isReconnecting ? 'Reconnecting to backend...' : 'Backend is offline. Product data and account actions may be unavailable.'}
          </span>
          {!isReconnecting && <Wifi size={14} className="opacity-70" />}
        </div>
      </div>
    </div>
  )
}
