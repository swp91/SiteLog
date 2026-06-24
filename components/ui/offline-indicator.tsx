'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 초기 상태 반영
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // 온라인 상태 복구 시 3초 후에 배너를 숨김
      setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registered with scope: ', registration.scope)
          })
          .catch((err) => {
            console.error('ServiceWorker registration failed: ', err)
          })
      })
    }

    // 만약 최초 로드 시 이미 오프라인 상태라면 즉시 표시
    if (!navigator.onLine) {
      setIsVisible(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out transform ${
        isOnline ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="bg-amber-600/95 text-white backdrop-blur-md px-4 py-2 text-center text-xs font-semibold shadow-md flex items-center justify-center gap-2 border-b border-amber-500/30 transition-all">
        <WifiOff size={14} className="animate-pulse text-amber-200" />
        <span>인터넷 연결이 끊겼습니다. 오프라인 모드에서 작성된 기록은 연결 시 자동 저장됩니다.</span>
      </div>
    </div>
  )
}
