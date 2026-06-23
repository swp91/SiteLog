'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { Button, Card, TextInput, Field } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const registerUser = useAppStore((s) => s.registerUser)
  const flash = useAppStore((s) => s.flash)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email.trim() || !name.trim() || !password || !confirmPassword) {
      setError('모든 필드를 입력해 주세요.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await registerUser(email.trim(), password, name.trim())
      flash('회원가입이 완료되었습니다!')
      router.push('/login')
    } catch (err: any) {
      console.error(err)
      let msg = '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      const errStr = (err.code || err.message || '').toLowerCase()

      if (errStr.includes('configuration-not-found')) {
        msg = '파이어베이스 설정 오류입니다. Firebase Console -> Authentication -> Sign-in method 메뉴에서 [이메일/비밀번호] 로그인이 활성화되어 있는지 확인해 주세요.'
      } else if (errStr.includes('email-already-in-use')) {
        msg = '이미 가입된 이메일 주소입니다. 다른 이메일을 사용하시거나 비밀번호 찾기를 진행해 주세요.'
      } else if (errStr.includes('invalid-email')) {
        msg = '올바르지 않은 이메일 형식입니다. 이메일 주소를 다시 확인해 주세요.'
      } else if (errStr.includes('weak-password')) {
        msg = '비밀번호가 보안에 취약합니다. 영문, 숫자를 조합하여 최소 6자 이상으로 입력해 주세요.'
      } else if (errStr.includes('operation-not-allowed')) {
        msg = '이메일/비밀번호 회원가입이 비활성화되어 있습니다. 파이어베이스 관리자 설정을 확인해 주세요.'
      } else if (errStr.includes('permission-denied') || errStr.includes('missing or insufficient permissions')) {
        msg = '데이터베이스(Firestore) 권한 오류입니다. Firebase Console에서 데이터베이스 보안 규칙(Rules)이 쓰기를 허용하도록 설정되어 있는지 확인해 주세요.'
      } else if (errStr.includes('network-request-failed')) {
        msg = '네트워크 연결 상태가 불안정합니다. 인터넷 연결을 확인하고 다시 시도해 주세요.'
      } else {
        msg = `회원가입 실패: ${err.message || '알 수 없는 오류가 발생했습니다.'}`
      }
      setError(msg)
    } finally {
      setLoading(false)
    }


  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium">
            <ArrowLeft size={14} />
            로그인으로 돌아가기
          </Link>
        </div>

        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/Sitelog-logo.svg" alt="SiteLog Logo" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <h1 className="text-[1.375rem] font-bold text-ink">회원가입</h1>
            <p className="text-sm text-slate-400 mt-1">간편 회원가입으로 Sitelog를 시작하세요</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Field label="이름">
              <TextInput
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </Field>

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
                placeholder="최소 6자 이상 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Field>

            <Field label="비밀번호 확인">
              <TextInput
                type="password"
                placeholder="비밀번호를 한번 더 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              icon={<UserPlus size={16} />}
              disabled={loading}
            >
              {loading ? '가입 진행 중...' : '가입하기'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
