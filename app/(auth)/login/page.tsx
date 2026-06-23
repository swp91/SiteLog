'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { Button, Card, TextInput, Field } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const authed = useAppStore((s) => s.authed)
  const user = useAppStore((s) => s.user)
  const login = useAppStore((s) => s.login)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authed && user.id) {
      router.replace(user.type === 'worker' ? '/worker' : '/dashboard')
    }
  }, [authed, user, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      console.error(err)
      let msg = '로그인에 실패했습니다. 이메일 또는 비밀번호를 확인하세요.'
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (err.code === 'auth/invalid-email') {
        msg = '올바르지 않은 이메일 형식입니다.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/Sitelog-logo.svg" alt="SiteLog Logo" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <h1 className="text-[1.375rem] font-bold text-ink">SiteLog</h1>
            <p className="text-sm text-slate-400 mt-1">현장 출근 기록 로그인</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Field label="이메일 주소">
              <TextInput
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Field>

            <Field label="비밀번호">
              <TextInput
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Field>

            {error && (
              <p className="text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded">
                {error}
              </p>
            )}

            <Button
              type="submit"
              full
              size="lg"
              icon={<LogIn size={16} />}
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/register" className="hover:text-blue-600 font-medium">
              회원가입
            </Link>
            <Link href="/reset-password" className="hover:text-blue-600 font-medium">
              비밀번호 찾기
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
