'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { idbKeys, idbGet, idbDel } from '@/lib/idb'
import { useAppStore } from '@/stores/app-store'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// 오프라인 상태에서 IndexedDB에 쌓였던 임시 이미지들을 백그라운드에서 Storage로 업로드하고 본문을 치환하는 동기화 매니저
async function syncPendingImages() {
  if (typeof window === 'undefined' || !navigator.onLine) return

  try {
    const keys = await idbKeys()
    const pendingKeys = keys.filter((k) => k.startsWith('pending-image-'))
    
    if (pendingKeys.length === 0) return

    const flash = useAppStore.getState().flash
    let successCount = 0

    for (const key of pendingKeys) {
      try {
        const data = await idbGet(key)
        if (!data || !data.blob || !data.userId || !data.fileName) {
          await idbDel(key)
          continue
        }

        // 1. Storage에 실제 이미지 업로드
        const storageRef = ref(storage, `journals/${data.userId}/${data.fileName}`)
        await uploadBytes(storageRef, data.blob)
        const downloadUrl = await getDownloadURL(storageRef)

        // 2. Zustand 스토어 상태를 순회하며 임시 주소(local-pending://{id})가 들어간 일지 업데이트
        const { journals, setJournal } = useAppStore.getState()
        const pendingPlaceholder = `local-pending://${data.id}`

        for (const [docKey, journal] of Object.entries(journals)) {
          const body = journal.body || journal.memo || ''
          if (body.includes(pendingPlaceholder)) {
            const updatedBody = body.replaceAll(pendingPlaceholder, downloadUrl)
            const [siteId, dateStr] = docKey.split('|')
            if (siteId && dateStr) {
              await setJournal(siteId, dateStr, {
                body: updatedBody,
                photos: journal.photos?.map((photo) =>
                  photo.url === pendingPlaceholder ? { ...photo, url: downloadUrl } : photo
                ) ?? []
              })
            }
          }
        }

        // 3. 임시 파일 영구 삭제
        await idbDel(key)
        successCount++
      } catch (err) {
        console.error('Error syncing pending image:', err)
      }
    }

    if (successCount > 0) {
      flash(`오프라인 작성 사진 ${successCount}장이 클라우드에 자동 동기화되었습니다.`)
    }
  } catch (e) {
    console.error('Failed to run background image sync:', e)
  }
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 초기 상태 반영
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // 백그라운드 동기화 구동
      syncPendingImages()
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
    } else {
      // 최초 마운트 시 온라인 상태라면 잔여 대기 이미지 동기화 1회 체크
      syncPendingImages()
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
