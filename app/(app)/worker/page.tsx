'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Printer, Plus, Trash2, Share2 } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Button, Card, Field, Segmented, Sheet, Stepper, TextInput, TradeDot } from '@/components/ui'
import { addDays, cn, endOfMonth, fmtKShort, parseYmd, startOfMonth, wonFmt, wonShort, ymd, shareText } from '@/lib/utils'
import type { PaymentStatus, WorkerRecord, WorkerSite } from '@/lib/types'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

const SITE_COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#EC4899', '#8B5CF6', '#22C55E', '#EF4444', '#0EA5E9', '#A855F7', '#64748B']

type WorkerTab = 'entry' | 'calendar' | 'sites'
type SettlementMode = 'month' | 'year'
type ReportMode = 'full' | 'simple'

export default function WorkerPage() {
  const {
    workerSites,
    workerRecords,
    addWorkerSite,
    updateWorkerSite,
    addWorkerRecord,
    updateWorkerRecord,
    deleteWorkerRecord,
    flash,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<WorkerTab>('sites')
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('month')
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [date, setDate] = useState(ymd(TODAY))
  const [siteId, setSiteId] = useState('')
  const [manDay, setManDay] = useState(1)
  const [rate, setRate] = useState(0)
  const [memo, setMemo] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteRate, setNewSiteRate] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reportMode, setReportMode] = useState<ReportMode>('full')

  useEffect(() => {
    if (!siteId && workerSites[0]) {
      setSiteId(workerSites[0].id)
      setRate(workerSites[0].defaultRate)
    }
  }, [siteId, workerSites])

  const fromStr = ymd(startOfMonth(month))
  const toStr = ymd(endOfMonth(month))
  const monthRecords = useMemo(
    () => workerRecords.filter((record) => record.date >= fromStr && record.date <= toStr),
    [fromStr, toStr, workerRecords],
  )
  const yearStr = String(month.getFullYear())
  const yearRecords = useMemo(
    () => workerRecords.filter((record) => record.date.startsWith(`${yearStr}-`)),
    [yearStr, workerRecords],
  )
  const settlementRecords = settlementMode === 'year' ? yearRecords : monthRecords

  const todayRecords = workerRecords.filter((record) => record.date === ymd(TODAY))

  function summarizeRecords(records: typeof workerRecords) {
    return records.reduce(
      (acc, record) => {
        const amount = record.manDay * record.rate
        acc.manDay += record.manDay
        acc.amount += amount
        if (record.paymentStatus === 'paid') acc.paid += amount
        if (record.paymentStatus === 'unpaid') acc.unpaid += amount
        return acc
      },
      { manDay: 0, amount: 0, paid: 0, unpaid: 0 },
    )
  }

  const monthTotals = useMemo(() => summarizeRecords(monthRecords), [monthRecords])
  const settlementTotals = useMemo(() => summarizeRecords(settlementRecords), [settlementRecords])
  const activeTotals = activeTab === 'calendar' ? settlementTotals : monthTotals
  const totalsScopeLabel = activeTab === 'calendar' && settlementMode === 'year' ? '올해' : '이번 달'

  const siteSummaries = workerSites.map((site) => {
    const records = settlementRecords.filter((record) => record.siteId === site.id)
    const manDayTotal = records.reduce((sum, record) => sum + record.manDay, 0)
    const amount = records.reduce((sum, record) => sum + record.manDay * record.rate, 0)
    const paid = records
      .filter((record) => record.paymentStatus === 'paid')
      .reduce((sum, record) => sum + record.manDay * record.rate, 0)
    const unpaid = records
      .filter((record) => record.paymentStatus === 'unpaid')
      .reduce((sum, record) => sum + record.manDay * record.rate, 0)
    return { site, manDay: manDayTotal, amount, paid, unpaid }
  }).filter((summary) => summary.manDay > 0)

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7))
  const days: Date[] = []
  let cursor = new Date(gridStart)
  while (cursor <= monthEnd || days.length < 35) {
    days.push(new Date(cursor))
    cursor = addDays(cursor, 1)
  }

  function handleSiteChange(nextSiteId: string) {
    const site = workerSites.find((item) => item.id === nextSiteId)
    setSiteId(nextSiteId)
    setRate(site?.defaultRate ?? 0)
  }

  function selectSiteForEntry(nextSiteId: string) {
    handleSiteChange(nextSiteId)
    setActiveTab('entry')
  }

  async function saveRecord() {
    if (!siteId || rate <= 0 || manDay <= 0) return

    await addWorkerRecord({
      date,
      siteId,
      manDay,
      rate,
      memo: memo.trim(),
      paymentStatus,
    })
    setMemo('')
    flash('공수 기록을 추가했어요')
  }

  async function saveSite() {
    const defaultRate = Math.max(0, Number(newSiteRate) || 0)
    if (!newSiteName.trim()) return

    await addWorkerSite({
      name: newSiteName.trim(),
      defaultRate,
      color: SITE_COLORS[workerSites.length % SITE_COLORS.length],
    })
    setNewSiteName('')
    setNewSiteRate('')
    flash('현장을 추가했어요')
  }

  async function togglePaid(id: string) {
    const record = workerRecords.find((item) => item.id === id)
    if (!record) return
    await updateWorkerRecord({
      ...record,
      paymentStatus: record.paymentStatus === 'paid' ? 'unpaid' : 'paid',
    })
  }

  function recordSiteName(siteId: string) {
    return workerSites.find((item) => item.id === siteId)?.name ?? '삭제된 현장'
  }

  function printSettlementReport() {
    setPreviewOpen(false)
    const prevTitle = document.title
    document.title = ' '
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => {
        document.title = prevTitle
      }, 300)
    }, 50)
  }

  function handleShareReport() {
    const siteLines = siteSummaries
      .map(({ site, manDay, amount, paid, unpaid }) => {
        let line = `- ${site.name}: ${manDay}공수 (${wonShort(amount)}원)`
        if (reportMode === 'full') {
          line += ` (지급 ${wonShort(paid)}원 / 미지급 ${wonShort(unpaid)}원)`
        }
        return line
      })
      .join('\n')

    const user = useAppStore.getState().user
    const hasAccount = !!(user.bank && user.account && user.holder)
    const accountLine = hasAccount
      ? `\n입금 계좌: ${user.bank} ${user.account} (${user.holder})`
      : `\n(※ 설정에서 입금 계좌를 등록하시면 청구서 양식이 자동 결합됩니다.)`

    const summaryText = `[SiteLog 공수 정산 청구서]
구분: ${settlementMode === 'year' ? '연간 정산' : '월간 정산'}
기간: ${settlementPeriodLabel}
청구 금액: ${wonFmt(settlementTotals.unpaid)}원 (총 ${wonFmt(settlementTotals.amount)}원)
총 공수: ${settlementTotals.manDay}공수
- 지급 완료: ${wonFmt(settlementTotals.paid)}원
- 미지급 금액: ${wonFmt(settlementTotals.unpaid)}원
${accountLine}

현장별 내역:
${siteLines || '기록 없음'}

상세 내역은 SiteLog에서 확인하세요.`

    shareText({
      title: `${settlementPeriodLabel} 공수 정산 청구서`,
      text: summaryText,
      onSuccess: (type) => {
        if (type === 'share') {
          flash('청구서 공유창을 열었습니다')
        } else {
          flash('청구서 요약이 클립보드에 복사되었습니다')
        }
      },
      onError: () => {
        flash('공유하기에 실패했습니다')
      },
    })
  }

  const settlementPeriodLabel = settlementMode === 'year'
    ? `${month.getFullYear()}년`
    : `${month.getFullYear()}년 ${month.getMonth() + 1}월`
  const settlementReport = (
    <WorkerSettlementReport
      periodLabel={settlementPeriodLabel}
      modeLabel={settlementMode === 'year' ? '연간 정산' : '월간 정산'}
      records={settlementRecords}
      sites={workerSites}
      siteSummaries={siteSummaries}
      totals={settlementTotals}
      recordSiteName={recordSiteName}
      includePaymentStatus={reportMode === 'full'}
    />
  )

  return (
    <div className="max-w-[920px] mx-auto px-4 pb-8">
      <TopBar title="내 공수 장부" />

      <div className="pt-6 pb-4">
        <p className="text-sm text-slate-500">개인 공수 장부</p>
        <h1 className="text-2xl font-bold text-ink">{activeTab === 'sites' ? '현장을 먼저 선택하세요' : '오늘 기록부터 빠르게 입력하세요'}</h1>
      </div>

      <Segmented
        full
        className="mb-4"
        value={activeTab}
        onChange={(value) => setActiveTab(value as WorkerTab)}
        options={[
          { value: 'sites', label: '현장 선택' },
          { value: 'entry', label: '공수 입력' },
          { value: 'calendar', label: '달력·정산' },
        ]}
      />

      {activeTab !== 'sites' && (
        <Card className="mb-4">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <div className="text-center">
              <p className="text-[0.6875rem] text-slate-400 mb-1">{totalsScopeLabel} 공수</p>
              <p className="text-xl font-extrabold text-ink tabular-nums">{activeTotals.manDay}</p>
            </div>
            <div className="text-center">
              <p className="text-[0.6875rem] text-slate-400 mb-1">예상 금액</p>
              <p className="text-xl font-extrabold text-blue-600 tabular-nums">{wonShort(activeTotals.amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-[0.6875rem] text-slate-400 mb-1">미지급</p>
              <p className="text-xl font-extrabold text-amber-600 tabular-nums">{wonShort(activeTotals.unpaid)}</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'entry' && (
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-sm font-bold text-ink mb-4">공수 입력</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="날짜">
                <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </Field>
              <Field label="현장">
                <select
                  value={siteId}
                  onChange={(event) => handleSiteChange(event.target.value)}
                  className="w-full h-11 px-3 rounded-sm border border-slate-200 bg-white text-[0.9375rem] text-ink outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100"
                >
                  {workerSites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="공수" className="col-span-2">
                <div className="flex items-center justify-between rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-bold text-ink">공수</p>
                    <p className="text-xs text-slate-400">0.5 단위로 조절</p>
                  </div>
                  <Stepper value={manDay} onChange={setManDay} min={0.5} max={10} step={0.5} size="lg" />
                </div>
              </Field>
              <Field label="적용 단가">
                <TextInput type="number" value={rate || ''} onChange={(event) => setRate(Number(event.target.value))} />
              </Field>
              <Field label="지급 상태">
                <select
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                  className="w-full h-11 px-3 rounded-sm border border-slate-200 bg-white text-[0.9375rem] text-ink outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100"
                >
                  <option value="unpaid">미지급</option>
                  <option value="paid">지급완료</option>
                </select>
              </Field>
              <Field label="메모" className="col-span-2">
                <TextInput value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="특이사항" />
              </Field>
            </div>
            <Button full className="mt-4" icon={<Plus size={15} />} onClick={saveRecord} disabled={!siteId || rate <= 0}>
              기록 추가
            </Button>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-ink">오늘 기록</p>
              <span className="text-xs text-slate-400">{todayRecords.length}건</span>
            </div>
            <div className="flex flex-col gap-2">
              {todayRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-3 rounded-sm border border-slate-100 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{recordSiteName(record.siteId)}</p>
                    <p className="text-xs text-slate-400">{record.manDay}공수 · {wonFmt(record.rate)}원</p>
                  </div>
                  <button
                    onClick={() => togglePaid(record.id)}
                    className={cn(
                      'h-8 px-2 rounded-sm text-xs font-bold',
                      record.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    {record.paymentStatus === 'paid' ? '지급완료' : '미지급'}
                  </button>
                </div>
              ))}
              {todayRecords.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">오늘 기록이 없습니다.</p>}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 wide:flex-row wide:items-center">
            <Segmented
              full
              className="wide:flex-1"
              value={settlementMode}
              onChange={(value) => setSettlementMode(value as SettlementMode)}
              options={[
                { value: 'month', label: '월간 정산' },
                { value: 'year', label: '연간 정산' },
              ]}
            />
            <Button variant="outline" icon={<Printer size={15} />} onClick={() => setPreviewOpen(true)}>
              PDF 내보내기
            </Button>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMonth((value) => (
                  settlementMode === 'year'
                    ? new Date(value.getFullYear() - 1, value.getMonth(), 1)
                    : new Date(value.getFullYear(), value.getMonth() - 1, 1)
                ))}
                className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-base font-bold text-ink">
                {settlementMode === 'year' ? `${month.getFullYear()}년` : `${month.getFullYear()}년 ${month.getMonth() + 1}월`}
              </p>
              <button
                onClick={() => setMonth((value) => (
                  settlementMode === 'year'
                    ? new Date(value.getFullYear() + 1, value.getMonth(), 1)
                    : new Date(value.getFullYear(), value.getMonth() + 1, 1)
                ))}
                className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {settlementMode === 'month' ? (
              <>
                <div className="grid grid-cols-7 mb-1">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                    <div key={day} className="text-center text-[0.6875rem] font-semibold py-1 text-slate-400">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {days.map((day) => {
                    const str = ymd(day)
                    const records = monthRecords.filter((record) => record.date === str)
                    const daySiteSummaries = workerSites
                      .map((site) => {
                        const siteManDay = records
                          .filter((record) => record.siteId === site.id)
                          .reduce((sum, record) => sum + record.manDay, 0)
                        return { site, manDay: siteManDay }
                      })
                      .filter((summary) => summary.manDay > 0)
                    const visibleSummaries = daySiteSummaries.slice(0, 2)
                    const hiddenSummaryCount = daySiteSummaries.length - visibleSummaries.length
                    const dayAmount = records.reduce((sum, record) => sum + record.manDay * record.rate, 0)
                    return (
                      <button
                        key={str}
                        onClick={() => setDate(str)}
                        className={cn(
                          'min-h-[76px] rounded-sm p-1.5 text-left transition-colors hover:bg-slate-100',
                          day.getMonth() !== month.getMonth() && 'opacity-30',
                          date === str && 'bg-blue-50 ring-1 ring-blue-200',
                        )}
                      >
                        <span className="block text-[0.75rem] font-bold text-ink">{day.getDate()}</span>
                        {visibleSummaries.length > 0 && (
                          <span className="mt-1 flex flex-col gap-0.5">
                            {visibleSummaries.map(({ site, manDay: siteManDay }) => (
                              <span key={site.id} className="flex items-center gap-1 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: site.color }} />
                                <span className="text-[0.625rem] font-bold text-slate-600 tabular-nums truncate">
                                  {siteManDay}공수
                                </span>
                              </span>
                            ))}
                            {hiddenSummaryCount > 0 && (
                              <span className="text-[0.625rem] font-bold text-slate-400">+{hiddenSummaryCount}</span>
                            )}
                          </span>
                        )}
                        {dayAmount > 0 && (
                          <span className="mt-1 block text-[0.625rem] font-extrabold text-blue-600 tabular-nums">
                            {wonShort(dayAmount)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                <div className="text-center">
                  <p className="text-[0.6875rem] text-slate-400 mb-1">연간 공수</p>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{settlementTotals.manDay}</p>
                </div>
                <div className="text-center">
                  <p className="text-[0.6875rem] text-slate-400 mb-1">연간 합계</p>
                  <p className="text-xl font-extrabold text-blue-600 tabular-nums">{wonShort(settlementTotals.amount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[0.6875rem] text-slate-400 mb-1">미지급</p>
                  <p className="text-xl font-extrabold text-amber-600 tabular-nums">{wonShort(settlementTotals.unpaid)}</p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-sm font-bold text-ink mb-3">현장별 정산</p>
            <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-sm bg-slate-50 py-3 mb-3">
              <div className="text-center">
                <p className="text-[0.6875rem] text-slate-400 mb-1">합산 금액</p>
                <p className="text-sm font-extrabold text-blue-600 tabular-nums">{wonShort(settlementTotals.amount)}</p>
              </div>
              <div className="text-center">
                <p className="text-[0.6875rem] text-slate-400 mb-1">지급 합산</p>
                <p className="text-sm font-extrabold text-emerald-600 tabular-nums">{wonShort(settlementTotals.paid)}</p>
              </div>
              <div className="text-center">
                <p className="text-[0.6875rem] text-slate-400 mb-1">미지급 합산</p>
                <p className="text-sm font-extrabold text-amber-600 tabular-nums">{wonShort(settlementTotals.unpaid)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {siteSummaries.map(({ site, manDay: siteManDay, amount, paid, unpaid }) => (
                <div key={site.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <TradeDot color={site.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{site.name}</p>
                    <p className="text-xs text-slate-400">
                      {siteManDay}공수 · 지급 {wonFmt(paid)}원 · 미지급 {wonFmt(unpaid)}원
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-blue-600 tabular-nums">{wonFmt(amount)}원</p>
                </div>
              ))}
              {siteSummaries.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">이번 달 기록이 없습니다.</p>}
            </div>
          </Card>

          {settlementMode === 'month' && (
          <Card>
            <p className="text-sm font-bold text-ink mb-3">이번 달 기록</p>
            <div className="flex flex-col gap-2">
              {[...monthRecords].sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                <div key={record.id} className="flex items-center gap-3 rounded-sm border border-slate-100 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{fmtKShort(parseYmd(record.date))} · {recordSiteName(record.siteId)}</p>
                    <p className="text-xs text-slate-400">{record.manDay}공수 · {wonFmt(record.rate)}원 · {record.memo || '메모 없음'}</p>
                  </div>
                  <button
                    onClick={() => togglePaid(record.id)}
                    className={cn(
                      'h-8 px-2 rounded-sm text-xs font-bold',
                      record.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    {record.paymentStatus === 'paid' ? '지급완료' : '미지급'}
                  </button>
                  <button
                    onClick={() => deleteWorkerRecord(record.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {monthRecords.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">기록이 없습니다.</p>}
            </div>
          </Card>
          )}
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="grid gap-4 wide:grid-cols-[minmax(0,1fr)_320px] wide:items-start">
          <Card>
            <p className="text-sm font-bold text-ink mb-1">현장을 선택하세요</p>
            <p className="text-xs text-slate-400 mb-4">선택한 현장으로 바로 오늘 공수를 입력합니다.</p>
            <div className="flex flex-col gap-2">
              {workerSites.map((site) => {
                const records = monthRecords.filter((record) => record.siteId === site.id)
                const manDayTotal = records.reduce((sum, record) => sum + record.manDay, 0)
                return (
                  <button
                    key={site.id}
                    onClick={() => selectSiteForEntry(site.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all',
                      siteId === site.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm',
                    )}
                  >
                    <TradeDot color={site.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink truncate">{site.name}</p>
                      <p className="text-xs text-slate-400">기본 일당 {wonFmt(site.defaultRate)}원</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                      <span className="tabular-nums">{manDayTotal}공수</span>
                      <ChevronRight size={15} />
                    </div>
                  </button>
                )
              })}
              {workerSites.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">등록된 현장이 없습니다.</p>}
            </div>
          </Card>

          <div className="flex flex-col gap-4 wide:sticky wide:top-6">
            <Card className="border-blue-200 bg-blue-50/40">
              <p className="text-sm font-bold text-ink mb-1">새 현장 추가</p>
              <p className="text-xs text-slate-500 mb-4">현장명만 입력해도 추가할 수 있습니다.</p>
              <div className="flex flex-col gap-2">
                <TextInput value={newSiteName} onChange={(event) => setNewSiteName(event.target.value)} placeholder="현장명" />
                <TextInput type="number" value={newSiteRate} onChange={(event) => setNewSiteRate(event.target.value)} placeholder="일당 (선택)" />
              </div>
              <Button full className="mt-3" icon={<Plus size={15} />} onClick={saveSite} disabled={!newSiteName.trim()}>
                현장 추가
              </Button>
            </Card>

            <Card>
              <p className="text-sm font-bold text-ink mb-4">현장별 기본 일당</p>
              <div className="flex flex-col gap-3">
                {workerSites.map((site) => (
                  <div key={site.id} className="flex items-center gap-2">
                    <TradeDot color={site.color} />
                    <span className="text-sm font-semibold text-ink flex-1 truncate">{site.name}</span>
                    <input
                      type="number"
                      value={site.defaultRate}
                      onChange={(event) => updateWorkerSite({ ...site, defaultRate: Number(event.target.value) || 0 })}
                      className="w-[124px] h-9 px-2 rounded-sm border border-slate-200 bg-white text-right text-sm text-slate-600 tabular-nums outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <Sheet open={previewOpen} onClose={() => setPreviewOpen(false)} title="정산 PDF 미리보기" maxWidth="960px">
        <div className="mb-4">
          <Segmented
            full
            value={reportMode}
            onChange={(value) => setReportMode(value as ReportMode)}
            options={[
              { value: 'full', label: '상세 출력' },
              { value: 'simple', label: '간단 출력' },
            ]}
          />
        </div>
        {settlementReport}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(false)}>
            닫기
          </Button>
          <Button variant="outline" icon={<Share2 size={15} />} onClick={handleShareReport}>
            요약 공유
          </Button>
          <Button icon={<Printer size={15} />} onClick={printSettlementReport}>
            PDF 저장
          </Button>
        </div>
      </Sheet>

      <div className="print-report">{settlementReport}</div>
    </div>
  )
}

interface WorkerSettlementReportProps {
  periodLabel: string
  modeLabel: string
  records: WorkerRecord[]
  sites: WorkerSite[]
  siteSummaries: Array<{
    site: WorkerSite
    manDay: number
    amount: number
    paid: number
    unpaid: number
  }>
  totals: {
    manDay: number
    amount: number
    paid: number
    unpaid: number
  }
  recordSiteName: (siteId: string) => string
  includePaymentStatus: boolean
}

function WorkerSettlementReport({
  periodLabel,
  modeLabel,
  records,
  sites,
  siteSummaries,
  totals,
  recordSiteName,
  includePaymentStatus,
}: WorkerSettlementReportProps) {
  return (
    <div className="mx-auto max-w-[1040px] bg-white p-6 text-ink">
      <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold text-blue-600">SiteLog</p>
          <h2 className="mt-1 text-2xl font-extrabold text-ink">공수 정산서</h2>
          <p className="mt-1 text-sm text-slate-500">{modeLabel} · {periodLabel}</p>
        </div>
        <p className="text-xs text-slate-400">출력일 {ymd(new Date())}</p>
      </div>

      <div className={cn(
        'mb-6 grid divide-x divide-slate-100 rounded-lg border border-slate-200 bg-slate-50 py-4',
        includePaymentStatus ? 'grid-cols-4' : 'grid-cols-2',
      )}>
        <div className="text-center">
          <p className="text-xs text-slate-400">공수</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums">{totals.manDay}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">합산 금액</p>
          <p className="mt-1 text-xl font-extrabold text-blue-600 tabular-nums">{wonFmt(totals.amount)}원</p>
        </div>
        {includePaymentStatus && (
          <>
            <div className="text-center">
              <p className="text-xs text-slate-400">지급 합산</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-600 tabular-nums">{wonFmt(totals.paid)}원</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">미지급 합산</p>
              <p className="mt-1 text-xl font-extrabold text-amber-600 tabular-nums">{wonFmt(totals.unpaid)}원</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-bold text-ink">현장별 정산</h3>
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-2">현장</th>
              <th className="px-3 py-2 text-right">공수</th>
              <th className="px-3 py-2 text-right">합계</th>
              {includePaymentStatus && (
                <>
                  <th className="px-3 py-2 text-right">지급</th>
                  <th className="px-3 py-2 text-right">미지급</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {siteSummaries.map(({ site, manDay, amount, paid, unpaid }) => (
              <tr key={site.id} className="border-b border-slate-100">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: site.color }} />
                    <span className="font-semibold">{site.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{manDay}</td>
                <td className="px-3 py-2 text-right font-bold text-blue-600">{wonFmt(amount)}원</td>
                {includePaymentStatus && (
                  <>
                    <td className="px-3 py-2 text-right text-emerald-600">{wonFmt(paid)}원</td>
                    <td className="px-3 py-2 text-right text-amber-600">{wonFmt(unpaid)}원</td>
                  </>
                )}
              </tr>
            ))}
            {siteSummaries.length === 0 && (
              <tr>
                <td colSpan={includePaymentStatus ? 5 : 3} className="px-3 py-8 text-center text-slate-400">정산할 기록이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">기록 상세</h3>
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-2">날짜</th>
              <th className="px-3 py-2">현장</th>
              <th className="px-3 py-2 text-right">공수</th>
              <th className="px-3 py-2 text-right">일당</th>
              <th className="px-3 py-2 text-right">금액</th>
              {includePaymentStatus && <th className="px-3 py-2 text-center">상태</th>}
            </tr>
          </thead>
          <tbody>
            {[...records].sort((a, b) => a.date.localeCompare(b.date)).map((record) => {
              const site = sites.find((item) => item.id === record.siteId)
              const amount = record.manDay * record.rate
              return (
                <tr key={record.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{record.date}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      {site && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: site.color }} />}
                      <span className="font-semibold">{recordSiteName(record.siteId)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{record.manDay}</td>
                  <td className="px-3 py-2 text-right">{wonFmt(record.rate)}원</td>
                  <td className="px-3 py-2 text-right font-bold">{wonFmt(amount)}원</td>
                  {includePaymentStatus && (
                    <td className="px-3 py-2 text-center">{record.paymentStatus === 'paid' ? '지급완료' : '미지급'}</td>
                  )}
                </tr>
              )
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={includePaymentStatus ? 6 : 5} className="px-3 py-8 text-center text-slate-400">기록이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
