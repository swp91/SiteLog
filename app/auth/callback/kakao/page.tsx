'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { signInWithCustomToken } from 'firebase/auth'
import { useAppStore } from '@/stores/app-store'

function KakaoCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authed = useAppStore((s) => s.authed)
  const authInitialized = useAppStore((s) => s.authInitialized)
  const user = useAppStore((s) => s.user)
  
  const [error, setError] = useState('')
  const [statusText, setStatusText] = useState('카카오 계정 정보를 인증하는 중입니다...')
  const processed = useRef(false)

  // 1. 이미 로그인된 사용자는 역할에 맞춰 대시보드로 이동
  useEffect(() => {
    if (authInitialized && authed && user.id) {
      router.replace(user.type === 'worker' ? '/worker' : '/dashboard')
    }
  }, [authInitialized, authed, user, router])

  // 2. 카카오 인가 코드를 서버에 교환 요청하여 로그인 처리
  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      if (authInitialized && !authed) {
        setError('카카오 인증 코드가 유효하지 않습니다. 로그인 페이지로 돌아갑니다.')
        setTimeout(() => router.replace('/login'), 2000)
      }
      return
    }

    if (processed.current) return
    processed.current = true

    async function processLogin() {
      try {
        setStatusText('카카오 인증을 거쳐 로그인 토큰을 생성하고 있습니다...')
        
        const response = await fetch('/api/auth/kakao', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || '토큰 교환에 실패했습니다.')
        }

        const { token } = await response.json()
        
        setStatusText('보안 세션을 생성하는 중입니다...')
        await signInWithCustomToken(auth, token)
        
        setStatusText('로그인 완료! 화면을 이동합니다...')
      } catch (err: any) {
        console.error('Kakao callback error:', err)
        setError(err.message || '로그인 처리 중 오류가 발생했습니다. 로그인 화면으로 돌아갑니다.')
        setTimeout(() => router.replace('/login'), 3000)
      }
    }

    processLogin()
  }, [searchParams, router, authInitialized, authed])

  return (
    <div className="w-full max-w-[320px] p-6 flex flex-col items-center gap-4">
      {error ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">!</div>
          <p className="text-sm font-semibold text-red-500 break-keep">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-yellow-200 border-t-yellow-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 break-keep">{statusText}</p>
        </div>
      )}
    </div>
  )
}

export default function KakaoCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <Suspense fallback={
        <div className="w-full max-w-[320px] p-6 flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-yellow-200 border-t-yellow-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 break-keep">페이지 로드 중...</p>
        </div>
      }>
        <KakaoCallbackContent />
      </Suspense>
    </div>
  )
}
