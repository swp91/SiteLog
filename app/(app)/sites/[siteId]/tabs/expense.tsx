'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Printer, Trash2, Settings } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { Sheet, Button, TextInput, Field } from '@/components/ui'
import { wonFmt, ymd } from '@/lib/utils'
import type { Site, ExpenseItem, ExpenseType } from '@/lib/types'

interface ExpenseTabProps {
  site: Site
}

const DEFAULT_CATEGORIES = ['예비비', '점심식사', '현장물품', '현장간식', '월세비', '기타']

export function ExpenseTab({ site }: ExpenseTabProps) {
  const { 
    user,
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    addExpenseCategory,
    deleteExpenseCategory,
    flash 
  } = useAppStore()
  
  // 현재 월 관리 (기본값: 오늘 날짜)
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // 바텀시트 열림 여부 및 수정 대상
  const [isOpenSheet, setIsOpenSheet] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)
  
  // 카테고리 설정 바텀시트 상태
  const [isOpenCategorySheet, setIsOpenCategorySheet] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState('')
  
  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })
  
  // 포탈 렌더링용 마운트 여부
  const [isMounted, setIsMounted] = useState(false)
  
  // 폼 상태
  const [formType, setFormType] = useState<ExpenseType>('expense')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 현재 유저의 커스텀 카테고리 또는 기본 폴백 카테고리
  const userCategories = user.expenseCategories || []
  const currentCategories = userCategories.length > 0 ? userCategories : DEFAULT_CATEGORIES

  // 현재 월의 경비 필터링
  const curYearMonth = format(currentDate, 'yyyy-MM')
  const monthlyExpenses = expenses
    .filter((e) => e.siteId === site.id && e.date.startsWith(curYearMonth))
    .sort((a, b) => {
      // 날짜 역순, 시간 역순 정렬
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.time.localeCompare(a.time)
    })

  // 통계 계산
  const totalIncome = monthlyExpenses
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)
    
  const totalExpense = monthlyExpenses
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)
    
  const balance = totalIncome - totalExpense

  // 카테고리별 지출 요약 계산 (인쇄용)
  const categoryExpenses = monthlyExpenses
    .filter((e) => e.type === 'expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount
      return acc
    }, {} as Record<string, number>)

  // 일별 그룹화
  const groupedExpenses = monthlyExpenses.reduce((groups, item) => {
    const dateStr = item.date
    if (!groups[dateStr]) {
      groups[dateStr] = []
    }
    groups[dateStr].push(item)
    return groups
  }, {} as Record<string, ExpenseItem[]>)

  // 등록 폼 열기
  const handleOpenAdd = () => {
    const now = new Date()
    setEditingExpense(null)
    setFormType('expense')
    setFormDate(ymd(now))
    setFormTime(format(now, 'HH:mm'))
    setFormCategory('')
    setFormDescription('')
    setFormAmount('')
    setIsOpenSheet(true)
  }

  // 수정 폼 열기
  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingExpense(item)
    setFormType(item.type)
    setFormDate(item.date)
    setFormTime(item.time)
    setFormCategory(item.category)
    setFormDescription(item.description)
    setFormAmount(item.amount.toLocaleString())
    setIsOpenSheet(true)
  }

  // 저장 처리
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCategory.trim()) {
      flash('카테고리를 입력해주세요')
      return
    }
    const amountNum = parseInt(formAmount.replace(/[^0-9]/g, ''), 10)
    if (isNaN(amountNum) || amountNum <= 0) {
      flash('올바른 금액을 입력해주세요')
      return
    }

    const payload = {
      siteId: site.id,
      date: formDate,
      time: formTime,
      category: formCategory.trim(),
      description: formDescription.trim(),
      amount: amountNum,
      type: formType,
    }

    try {
      if (editingExpense) {
        await updateExpense({ ...editingExpense, ...payload })
        flash('수정되었습니다')
      } else {
        await addExpense(payload)
        flash('저장되었습니다')
      }
      setIsOpenSheet(false)
    } catch (err) {
      console.error(err)
      flash('저장에 실패했습니다')
    }
  }

  // 삭제 처리
  const handleDelete = async () => {
    if (!editingExpense) return
    setConfirmModal({
      isOpen: true,
      title: '경비 내역 삭제',
      message: '이 경비 내역을 정말 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          await deleteExpense(editingExpense.id)
          flash('삭제되었습니다')
          setIsOpenSheet(false)
        } catch (err) {
          console.error(err)
          flash('삭제에 실패했습니다')
        }
      }
    })
  }

  // PDF 내보내기 (브라우저 인쇄)
  const handleExportPDF = () => {
    window.print()
  }

  return (
    <>
      {/* 스타일 주입 (인쇄 시 모든 레이아웃 숨김 처리) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          /* React 루트 포함 모든 body 직속 노드 숨기기 */
          body > :not(#print-area-root) {
            display: none !important;
          }
          #print-area-root {
            display: block !important;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
        }
      `}} />

      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-24">
        {/* 월별 요약 카드 */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 px-4 py-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50/50 dark:bg-blue-950/20 py-2.5 rounded-lg border border-blue-100/40 dark:border-blue-950/30">
              <p className="text-[0.6875rem] text-blue-600 dark:text-blue-400 font-medium">수입</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mt-0.5">{wonFmt(totalIncome)}원</p>
            </div>
            <div className="bg-rose-50/50 dark:bg-rose-950/20 py-2.5 rounded-lg border border-rose-100/40 dark:border-rose-950/30">
              <p className="text-[0.6875rem] text-rose-600 dark:text-rose-400 font-medium">지출</p>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300 mt-0.5">{wonFmt(totalExpense)}원</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 font-medium">잔액</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{wonFmt(balance)}원</p>
            </div>
          </div>
        </div>

        {/* 연월 조작 및 PDF 출력 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-ink dark:text-white">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </span>
            <button
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 h-9"
          >
            <Printer size={14} />
            PDF 내보내기
          </Button>
        </div>

        {/* 일별 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {Object.keys(groupedExpenses).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-600">
              <p className="text-sm">기록된 경비 내역이 없습니다</p>
            </div>
          ) : (
            Object.entries(groupedExpenses).map(([dateStr, items]) => {
              const parsedDate = parseISO(dateStr)
              const dayIncome = items.filter(x => x.type === 'income').reduce((sum, x) => sum + x.amount, 0)
              const dayExpense = items.filter(x => x.type === 'expense').reduce((sum, x) => sum + x.amount, 0)

              return (
                <div key={dateStr} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
                  {/* 날짜 헤더 */}
                  <div className="bg-slate-50/60 dark:bg-slate-800/30 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {format(parsedDate, 'MM. dd. (eee)', { locale: ko })}
                    </span>
                    <div className="flex items-center gap-2 text-[0.6875rem] font-medium">
                      {dayIncome > 0 && <span className="text-blue-600 dark:text-blue-400">+{wonFmt(dayIncome)}</span>}
                      {dayExpense > 0 && <span className="text-rose-600 dark:text-rose-400">-{wonFmt(dayExpense)}</span>}
                    </div>
                  </div>

                  {/* 세부 항목 목록 */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 active:bg-slate-50 dark:active:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-[0.6875rem] text-slate-400 mt-0.5 shrink-0">
                            {item.time}
                          </span>
                          <div className="min-w-0">
                            <span className="inline-block px-1.5 py-0.5 text-[0.625rem] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-1">
                              {item.category}
                            </span>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
                              {item.description || item.category}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold shrink-0 pl-2 ${
                          item.type === 'income' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}{wonFmt(item.amount)}원
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* FAB 추가 버튼 */}
        <button
          onClick={handleOpenAdd}
          className="fixed bottom-[92px] right-4 w-[58px] h-[58px] rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-10"
          aria-label="경비 추가"
        >
          <Plus size={24} />
        </button>

        {/* CRUD 바텀시트 */}
        <Sheet
          open={isOpenSheet}
          onClose={() => setIsOpenSheet(false)}
          title={editingExpense ? '경비 내역 수정' : '경비 내역 등록'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            {/* 구분 선택 (수입 / 지출) */}
            <Field label="구분">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`h-10 text-xs font-bold rounded-lg border transition-colors ${
                    formType === 'expense'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  지출 (경비)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`h-10 text-xs font-bold rounded-lg border transition-colors ${
                    formType === 'income'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  수입 (예비비 투입)
                </button>
              </div>
            </Field>

            {/* 날짜 & 시간 */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="날짜">
                <TextInput
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </Field>
              <Field label="시간">
                <TextInput
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* 카테고리 입력 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between w-full">
                <span className="text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-300">카테고리</span>
                <button
                  type="button"
                  onClick={() => setIsOpenCategorySheet(true)}
                  className="text-[0.6875rem] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 active:scale-95 transition-all"
                >
                  <Settings size={11} />
                  설정
                </button>
              </div>
              <TextInput
                placeholder="카테고리를 입력하거나 아래에서 선택하세요"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {currentCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`px-2.5 py-1.5 text-xs rounded-full border transition-colors ${
                      formCategory === cat
                        ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                        : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 금액 입력 */}
            <Field label="금액 (원)">
              <TextInput
                type="text"
                inputMode="numeric"
                placeholder="금액을 입력하세요"
                value={formAmount}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '')
                  if (rawValue === '') {
                    setFormAmount('')
                  } else {
                    setFormAmount(Number(rawValue).toLocaleString())
                  }
                }}
                required
              />
            </Field>

            {/* 메모 입력 */}
            <Field label="항목명 / 메모">
              <TextInput
                placeholder="예: 소머리국밥 1, 마포 현장 예비비 등"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </Field>

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {editingExpense && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="w-12 h-11 flex items-center justify-center border-rose-200 text-rose-600 hover:bg-rose-50 shrink-0"
                  aria-label="삭제"
                >
                  <Trash2 size={18} />
                </Button>
              )}
              <Button type="submit" className="flex-1 h-11 font-bold">
                {editingExpense ? '수정 완료' : '저장하기'}
              </Button>
            </div>
          </form>
        </Sheet>

        {/* 카테고리 관리 바텀시트 */}
        <Sheet
          open={isOpenCategorySheet}
          onClose={() => setIsOpenCategorySheet(false)}
          title="카테고리 설정"
        >
          <div className="space-y-5">
            {/* 새 카테고리 추가 */}
            <div className="flex gap-2">
              <TextInput
                placeholder="새 카테고리 이름"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!newCategoryInput.trim()) return
                  await addExpenseCategory(newCategoryInput.trim())
                  setNewCategoryInput('')
                  flash('카테고리가 추가되었습니다')
                }}
                className="px-4 h-11 shrink-0 font-bold"
              >
                추가
              </Button>
            </div>

            {/* 현재 목록 */}
            <div className="space-y-2">
              <p className="text-[0.6875rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                현재 사용 중인 카테고리
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[240px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg">
                {currentCategories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-900/40 text-xs"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: '카테고리 삭제',
                          message: `'${cat}' 카테고리를 정말 삭제하시겠습니까?`,
                          onConfirm: async () => {
                            await deleteExpenseCategory(cat)
                            flash('카테고리가 삭제되었습니다')
                          }
                        })
                      }}
                      className="text-rose-600 hover:text-rose-700 active:scale-95 transition-all p-1 font-bold"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Sheet>
      </div>

      {/* PDF 인쇄용 레이아웃 (Portal을 사용하여 body 바로 아래 렌더링) */}
      {isMounted && createPortal(
        <div id="print-area-root" className="hidden">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black">{site.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(currentDate, 'yyyy년 MM월', { locale: ko })} 예비비/경비 지출 보고서
            </p>
          </div>

          {/* 1. 요약 통계 */}
          <div className="mb-8">
            <h2 className="text-base font-bold border-b border-gray-300 pb-1 mb-3 text-black">1. 월별 통계 요약</h2>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-black font-bold">예비비 총 투입액 (수입)</th>
                  <th className="border border-gray-300 px-3 py-2 text-black font-bold">총 경비 지출액</th>
                  <th className="border border-gray-300 px-3 py-2 text-black font-bold">현재 잔액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-blue-600 font-bold">{wonFmt(totalIncome)}원</td>
                  <td className="border border-gray-300 px-3 py-2 text-rose-600 font-bold">{wonFmt(totalExpense)}원</td>
                  <td className="border border-gray-300 px-3 py-2 text-black font-bold">{wonFmt(balance)}원</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. 카테고리별 지출 요약 */}
          {Object.keys(categoryExpenses).length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold border-b border-gray-300 pb-1 mb-3 text-black">2. 카테고리별 지출 현황</h2>
              <table className="w-4/12 border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">카테고리</th>
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">지출 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoryExpenses).map(([cat, amt]) => (
                    <tr key={cat}>
                      <td className="border border-gray-300 px-3 py-2 text-black">{cat}</td>
                      <td className="border border-gray-300 px-3 py-2 text-rose-600 font-semibold">{wonFmt(amt)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. 일별 세부 내역 */}
          <div>
            <h2 className="text-base font-bold border-b border-gray-300 pb-1 mb-3 text-black">3. 일별 경비 세부 내역</h2>
            {monthlyExpenses.length === 0 ? (
              <p className="text-xs text-gray-500">기록된 내역이 없습니다.</p>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">날짜</th>
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">시간</th>
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">구분</th>
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">카테고리</th>
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">항목명 / 메모</th>
                    <th className="border border-gray-300 px-3 py-2 text-black font-bold">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyExpenses.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-3 py-2 text-black">
                        {item.date}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-600">{item.time}</td>
                      <td className={`border border-gray-300 px-3 py-2 font-bold ${
                        item.type === 'income' ? 'text-blue-600' : 'text-rose-600'
                      }`}>
                        {item.type === 'income' ? '수입' : '지출'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-black">{item.category}</td>
                      <td className="border border-gray-300 px-3 py-2 text-black">{item.description || '-'}</td>
                      <td className={`border border-gray-300 px-3 py-2 font-bold ${
                        item.type === 'income' ? 'text-blue-600' : 'text-rose-600'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}{wonFmt(item.amount)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 커스텀 확인 모달 */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-[fadeIn_.2s_ease]"
            onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          />
          {/* Content */}
          <div className="relative w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-100 dark:border-slate-800/80 animate-[slideUp_.26s_cubic-bezier(.16,1,.3,1)]">
            <h3 className="text-sm font-bold text-ink dark:text-white mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 h-10 text-xs font-semibold"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                취소
              </Button>
              <Button
                className="flex-1 h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white border-none"
                onClick={() => {
                  confirmModal.onConfirm()
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

