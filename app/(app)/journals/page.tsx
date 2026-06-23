'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, FileText, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { Button, Card, Field, Sheet, TextInput } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'
import { cn, fmtKDate, parseYmd, ymd } from '@/lib/utils'
import type { Journal, JournalPhoto, Site } from '@/lib/types'

type JournalPost = {
  key: string
  site: Site
  siteId: string
  date: string
  journal: Journal
  title: string
  body: string
  photos: JournalPhoto[]
}

function journalBody(journal: Journal) {
  return journal.body ?? journal.memo ?? ''
}

function journalTitle(journal: Journal) {
  const body = journalBody(journal).trim()
  return journal.title?.trim() || body.split('\n')[0] || '제목 없음'
}

function journalPhotos(journal: Journal) {
  return journal.photos ?? []
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function JournalsPage() {
  const { sites, journals, setJournal, flash } = useAppStore()
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draftSiteId, setDraftSiteId] = useState('')
  const [draftDate, setDraftDate] = useState(ymd(new Date()))
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftPhotos, setDraftPhotos] = useState<JournalPhoto[]>([])

  const posts = useMemo<JournalPost[]>(() => (
    Object.entries(journals)
      .map(([key, journal]) => {
        const [siteId, date] = key.split('|')
        const site = sites.find((item) => item.id === siteId)
        if (!site) return null
        return {
          key,
          site,
          siteId,
          date,
          journal,
          title: journalTitle(journal),
          body: journalBody(journal),
          photos: journalPhotos(journal),
        }
      })
      .filter((post): post is JournalPost => Boolean(post))
      .sort((a, b) => b.date.localeCompare(a.date))
  ), [journals, sites])

  const filteredPosts = posts.filter((post) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [post.title, post.body, post.site.name]
      .some((value) => value.toLowerCase().includes(needle))
  })

  function openNewEditor() {
    setEditingKey(null)
    setDraftSiteId(sites[0]?.id ?? '')
    setDraftDate(ymd(new Date()))
    setDraftTitle('')
    setDraftBody('')
    setDraftPhotos([])
    setEditorOpen(true)
  }

  function openEditEditor(post: JournalPost) {
    setEditingKey(post.key)
    setDraftSiteId(post.siteId)
    setDraftDate(post.date)
    setDraftTitle(post.journal.title ?? '')
    setDraftBody(post.body)
    setDraftPhotos(post.photos)
    setEditorOpen(true)
  }

  async function handlePhotoAdd(files: FileList | null) {
    if (!files?.length) return

    const nextPhotos = await Promise.all(Array.from(files).map(async (file) => ({
      id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: await readFileAsDataUrl(file),
    })))

    setDraftPhotos((value) => [...value, ...nextPhotos])
  }

  function removePhoto(id: string) {
    setDraftPhotos((value) => value.filter((photo) => photo.id !== id))
  }

  async function savePost() {
    if (!draftSiteId) return

    if (editingKey && editingKey !== `${draftSiteId}|${draftDate}`) {
      const [oldSiteId, oldDate] = editingKey.split('|')
      await setJournal(oldSiteId, oldDate, { title: '', body: '', memo: '', photos: [] })
    }

    await setJournal(draftSiteId, draftDate, {
      title: draftTitle.trim(),
      body: draftBody,
      memo: draftBody,
      photos: draftPhotos,
    })
    setEditorOpen(false)
    flash(editingKey ? '일지를 수정했어요' : '일지를 작성했어요')
  }

  async function deletePost(post: JournalPost) {
    await setJournal(post.siteId, post.date, { title: '', body: '', memo: '', photos: [] })
    flash('일지를 삭제했어요')
  }

  const canSave = Boolean(draftSiteId && (draftTitle.trim() || draftBody.trim() || draftPhotos.length))

  return (
    <div className="max-w-[980px] mx-auto px-4 pb-8">
      <TopBar title="일지" />

      <div className="pt-6 pb-4 wide:flex wide:items-end wide:justify-between wide:gap-4">
        <div>
          <p className="text-sm text-slate-500">현장 일지 게시판</p>
          <h1 className="text-2xl font-bold text-ink">작업 내용을 글처럼 남기세요</h1>
        </div>
        <Button className="mt-4 wide:mt-0" icon={<Plus size={16} />} onClick={openNewEditor} disabled={sites.length === 0}>
          글쓰기
        </Button>
      </div>

      <Card className="mb-4">
        <TextInput
          icon={<Search size={16} />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 내용, 현장명 검색"
        />
      </Card>

      <div className="flex flex-col gap-3">
        {filteredPosts.map((post) => (
          <Card key={post.key} hover className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => openEditEditor(post)}
              className="w-full text-left p-4 flex items-start gap-4"
            >
              <div className="hidden wide:flex w-14 h-14 rounded-lg bg-blue-50 text-blue-600 items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600">{post.site.name}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{fmtKDate(parseYmd(post.date))}</span>
                  {post.photos.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-bold text-slate-500">
                      사진 {post.photos.length}
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-ink truncate">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{post.body || '사진만 첨부된 일지입니다.'}</p>
                {post.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {post.photos.slice(0, 4).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt={photo.name}
                        className="h-14 w-14 rounded-sm object-cover border border-slate-100"
                      />
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="mt-1 text-slate-300 shrink-0" />
            </button>
            <div className="flex justify-end gap-1 border-t border-slate-100 px-3 py-2">
              <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEditEditor(post)}>
                수정
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => deletePost(post)}>
                삭제
              </Button>
            </div>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <Card className="py-12 text-center">
            <CalendarDays size={28} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-ink">아직 작성된 일지가 없습니다</p>
            <p className="mt-1 text-xs text-slate-400">글쓰기로 현장 작업 내용을 남겨보세요.</p>
          </Card>
        )}
      </div>

      <Sheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingKey ? '일지 수정' : '일지 글쓰기'}
        maxWidth="860px"
      >
        <div className="grid gap-4 wide:grid-cols-2">
          <Field label="현장">
            <select
              value={draftSiteId}
              onChange={(event) => setDraftSiteId(event.target.value)}
              className="w-full h-11 px-3 rounded-sm border border-slate-200 bg-white text-[0.9375rem] text-ink outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </Field>
          <Field label="날짜">
            <TextInput type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} />
          </Field>
          <Field label="제목" className="wide:col-span-2">
            <TextInput value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="제목을 입력하세요" />
          </Field>
          <Field label="본문" className="wide:col-span-2">
            <textarea
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              placeholder="작업 내용, 특이사항, 전달할 내용을 자유롭게 작성하세요."
              className="min-h-[260px] w-full resize-y rounded border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-100"
            />
          </Field>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.8125rem] font-semibold text-slate-700">사진 첨부</p>
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-blue-50 px-3 text-[0.8125rem] font-semibold text-blue-600 hover:bg-blue-100">
              <ImagePlus size={15} />
              사진 추가
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handlePhotoAdd(event.target.files)
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>

          <div className={cn(
            'grid gap-2',
            draftPhotos.length > 0 ? 'grid-cols-2 wide:grid-cols-4' : 'grid-cols-1',
          )}>
            {draftPhotos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={photo.url} alt={photo.name} className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white opacity-100 transition-opacity wide:opacity-0 wide:group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
                <p className="truncate px-2 py-1.5 text-xs text-slate-500">{photo.name}</p>
              </div>
            ))}
            {draftPhotos.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <ImagePlus size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">첨부된 사진이 없습니다</p>
                <p className="mt-1 text-xs text-slate-400">여러 장을 한 번에 선택할 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditorOpen(false)}>
            취소
          </Button>
          <Button onClick={savePost} disabled={!canSave}>
            저장
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
