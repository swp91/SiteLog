'use client'

import { useState, useEffect } from 'react'
import { ImagePlus } from 'lucide-react'
import { fmtKDate, parseYmd } from '@/lib/utils'
import type { Site, Journals } from '@/lib/types'

interface Props {
  site: Site
  date: string
  journals: Journals
  onSave: (patch: Partial<{ memo: string; photos: number }>) => void
}

export function JournalTab({ site, date, journals, onSave }: Props) {
  const key = `${site.id}|${date}`
  const journal = journals[key]

  const [memo, setMemo] = useState(journal?.memo ?? '')

  // Sync when date changes
  useEffect(() => {
    setMemo(journals[`${site.id}|${date}`]?.memo ?? '')
  }, [site.id, date, journals])

  function handleMemoChange(v: string) {
    setMemo(v)
    onSave({ memo: v })
  }

  return (
    <div className="max-w-[700px] mx-auto px-4 pb-8 pt-4">
      <p className="text-[0.8125rem] text-slate-400 mb-4">{fmtKDate(parseYmd(date))}</p>

      {/* Photo slots */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {Array.from({ length: 3 }, (_, i) => {
          const hasPhoto = i < (journal?.photos ?? 0)
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                ${hasPhoto ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <ImagePlus size={20} className={hasPhoto ? 'text-blue-400' : 'text-slate-300'} />
              {hasPhoto && (
                <span className="text-[0.625rem] text-blue-400 mt-1">사진 {i + 1}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Memo */}
      <div>
        <label className="text-[0.8125rem] font-semibold text-slate-700 block mb-1.5">작업 일지</label>
        <textarea
          className="w-full h-40 px-4 py-3 text-sm rounded border border-slate-200 bg-white resize-none outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100 transition-colors"
          placeholder="오늘의 작업 내용을 기록하세요..."
          value={memo}
          onChange={(e) => handleMemoChange(e.target.value)}
        />
        <p className="text-[0.6875rem] text-slate-400 mt-1">자동 저장됩니다</p>
      </div>
    </div>
  )
}
