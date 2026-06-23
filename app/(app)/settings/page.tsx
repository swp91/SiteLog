'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Bell, ChevronRight, RefreshCcw } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Card, Avatar, Badge, Button, Sheet, TextInput, Field } from '@/components/ui'

export default function SettingsPage() {
  const router = useRouter()
  const { user, sites, records, logout, updateProfile, switchUserType, flash } = useAppStore()

  const [alerts, setAlerts] = useState({
    missing: true,
    weekly: false,
    trade: true,
  })

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const totalEntries = Object.keys(records).length
  const activeSiteCount = sites.filter((s) => s.status !== '완료').length
  const nextType = user.type === 'worker' ? 'manager' : 'worker'
  const nextLabel = user.type === 'worker' ? '관리자 모드로 전환' : '노동자 모드로 전환'

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  function handleSwitchType() {
    switchUserType(nextType)
    flash(nextLabel)
    router.push(nextType === 'worker' ? '/worker' : '/dashboard')
  }

  function handleOpenEdit() {
    setEditName(user.name)
    setEditPhone(user.phone || '')
    setIsEditOpen(true)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) {
      alert('이름을 입력하세요.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      })
      flash('프로필이 수정되었습니다.')
      setIsEditOpen(false)
    } catch (err: any) {
      alert(err.message || '프로필 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 pb-8">
      <TopBar title="내 정보 · 설정" />

      {/* Profile card */}
      <Card className="mt-6 mb-5">
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={user.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-ink">{user.name}</p>
              <Badge tone={user.type === 'worker' ? 'amber' : 'blue'}>{user.type === 'worker' ? '노동자' : '관리자'}</Badge>
            </div>
            <p className="text-[0.8125rem] text-slate-500">{user.role}</p>
            {user.company && <p className="text-xs text-slate-400">{user.company}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={handleOpenEdit}>편집</Button>
        </div>
        <div className="flex gap-4 pt-3 border-t border-slate-100">
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-blue-600 tabular-nums">{activeSiteCount}</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">담당현장</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-ink tabular-nums">{totalEntries}</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">누적입력</p>
          </div>
          {user.joined && (
            <div className="text-center flex-1">
              <p className="text-sm font-bold text-slate-500">{user.joined}</p>
              <p className="text-[0.6875rem] text-slate-400 mt-0.5">가입</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <RefreshCcw size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.9375rem] font-bold text-ink">모드 전환</p>
            <p className="text-xs text-slate-400 mt-0.5">관리자 화면과 노동자 장부를 전환하여 확인합니다.</p>
          </div>
        </div>
        <Button full variant="secondary" className="mt-4" icon={<RefreshCcw size={15} />} onClick={handleSwitchType}>
          {nextLabel}
        </Button>
      </Card>

      {/* Account */}
      <p className="text-xs font-semibold text-slate-400 px-1 mb-2">계정</p>
      <Card className="mb-5 divide-y divide-slate-100 !p-0">
        {[
          { label: '이메일', value: user.email },
          { label: '휴대폰', value: user.phone ?? '미등록' },
          { label: '비밀번호 변경', value: '' },
          { label: '카카오 연결', value: '미연결' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-ink">{label}</span>
            <div className="flex items-center gap-1">
              {value && <span className="text-[0.8125rem] text-slate-400">{value}</span>}
              <ChevronRight size={15} className="text-slate-300" />
            </div>
          </div>
        ))}
      </Card>

      {/* Notifications */}
      <p className="text-xs font-semibold text-slate-400 px-1 mb-2">알림</p>
      <Card className="mb-5 divide-y divide-slate-100 !p-0">
        {[
          { key: 'missing' as const, label: '미입력 현장 알림', desc: '출근 기록이 없는 현장 알림' },
          { key: 'weekly' as const, label: '주간 요약 리포트', desc: '매주 월요일 지난주 통계 리포트' },
          { key: 'trade' as const, label: '업체 투입 변동 알림', desc: '공종별 인원 변동 시 알림' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3.5">
            <Bell size={16} className="text-slate-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <button
              onClick={() => setAlerts((a) => ({ ...a, [key]: !a[key] }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${alerts[key] ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${alerts[key] ? 'left-5.5' : 'left-0.5'}`}
                style={{ left: alerts[key] ? '22px' : '2px' }}
              />
            </button>
          </div>
        ))}
      </Card>

      {/* Logout */}
      <Button
        full
        variant="outline"
        size="lg"
        icon={<LogOut size={16} />}
        onClick={handleLogout}
        className="text-red-500 border-red-200 hover:bg-red-50"
      >
        로그아웃
      </Button>

      {/* Profile Edit Sheet */}
      <Sheet open={isEditOpen} onClose={() => setIsEditOpen(false)} title="프로필 편집">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <Field label="이름">
            <TextInput
              placeholder="이름을 입력하세요"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </Field>
          <Field label="휴대폰 번호">
            <TextInput
              placeholder="휴대폰 번호 (예: 010-1234-5678)"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </Field>
          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              full
              onClick={() => setIsEditOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button type="submit" full disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  )
}
