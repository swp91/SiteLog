'use client'

import { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button, Card, TextInput, Field } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const resetPasswordEmail = useAppStore((s) => s.resetPasswordEmail)
  const flash = useAppStore((s) => s.flash)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('이메일 주소를 입력해 주세요.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await resetPasswordEmail(email.trim())
      setSuccess(true)
      flash('재설정 이메일을 발송했습니다!')
    } catch (err: any) {
      console.error(err)
      let msg = '이메일 발송에 실패했습니다. 다시 시도해 주세요.'
      if (err.code === 'auth/user-not-found') {
        msg = '해당 이메일로 등록된 사용자를 찾을 수 없습니다.'
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
        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium">
            <ArrowLeft size={14} />
            로그인으로 돌아가기
          </Link>
        </div>

        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/Sitelog-logo.svg" alt="SiteLog Logo" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <h1 className="text-[1.375rem] font-bold text-ink">비밀번호 찾기</h1>
            <p className="text-sm text-slate-400 mt-1">이메일 인증 링크를 통해 비밀번호를 변경합니다</p>
          </div>
        </div>

        <Card>
          {success ? (
            <div className="text-center py-4 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">재설정 메일을 발송했습니다</p>
                <p className="text-xs text-slate-500 mt-2 leading-5">
                  <span className="font-semibold text-blue-600">{email}</span> 수신함을 확인하고<br />
                  메일 안의 비밀번호 재설정 링크를 클릭해 주세요.
                </p>
              </div>
              <Link href="/login" className="w-full mt-2">
                <Button full variant="outline">
                  로그인 화면으로 이동
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <p className="text-xs text-slate-500 leading-5">
                가입하신 이메일 주소를 입력해 주시면, 비밀번호를 변경할 수 있는 인증 링크 메일을 보내드립니다.
              </p>

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

              {error && (
                <p className="text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                full
                size="lg"
                icon={<Mail size={16} />}
                disabled={loading}
              >
                {loading ? '메일 발송 중...' : '인증 링크 보내기'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
