'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, FileText, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { Button, Card, Field, Sheet, TextInput, RichTextEditor } from '@/components/ui'
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

function stripHtml(html: string) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

function extractPhotos(html: string): JournalPhoto[] {
  if (!html) return []
  const imgRegex = /<img[^>]+src="([^">]+)"/g
  const photos: JournalPhoto[] = []
  let match
  let count = 1
  while ((match = imgRegex.exec(html)) !== null) {
    photos.push({
      id: `photo-${count}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: `photo-${count}`,
      url: match[1],
    })
  }
  return photos
}

function journalTitle(journal: Journal) {
  const body = journalBody(journal).trim()
  return journal.title?.trim() || stripHtml(body).split('\n')[0] || '제목 없음'
}

function journalPhotos(journal: Journal) {
  return journal.photos ?? []
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

  const [viewOpen, setViewOpen] = useState(false)
  const [viewingPost, setViewingPost] = useState<JournalPost | null>(null)

  function openViewer(post: JournalPost) {
    setViewingPost(post)
    setViewOpen(true)
  }

  function handleEditFromViewer() {
    if (!viewingPost) return
    setViewOpen(false)
    openEditEditor(viewingPost)
  }

  async function handleDeleteFromViewer() {
    if (!viewingPost) return
    if (confirm('이 일지를 삭제하시겠습니까?')) {
      await deletePost(viewingPost)
      setViewOpen(false)
    }
  }

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
    return [post.title, stripHtml(post.body), post.site.name]
      .some((value) => value.toLowerCase().includes(needle))
  })

  function openNewEditor() {
    setEditingKey(null)
    setDraftSiteId(sites[0]?.id ?? '')
    setDraftDate(ymd(new Date()))
    setDraftTitle('')
    setDraftBody('')
    setEditorOpen(true)
  }

  function openEditEditor(post: JournalPost) {
    setEditingKey(post.key)
    setDraftSiteId(post.siteId)
    setDraftDate(post.date)
    setDraftTitle(post.journal.title ?? '')
    setDraftBody(post.body)
    setEditorOpen(true)
  }

  // handlePhotoAdd, removePhoto removed

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
      photos: extractPhotos(draftBody),
    })
    setEditorOpen(false)
    flash(editingKey ? '일지를 수정했어요' : '일지를 작성했어요')
  }

  async function deletePost(post: JournalPost) {
    await setJournal(post.siteId, post.date, { title: '', body: '', memo: '', photos: [] })
    flash('일지를 삭제했어요')
  }

  const canSave = Boolean(draftSiteId && (draftTitle.trim() || draftBody.trim()))

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
              onClick={() => openViewer(post)}
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
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{stripHtml(post.body) || '사진만 첨부된 일지입니다.'}</p>
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
            <RichTextEditor
              value={draftBody}
              onChange={setDraftBody}
              placeholder="작업 내용, 특이사항, 전달할 내용을 자유롭게 작성하세요."
            />
          </Field>
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

      {/* 일지 상세 보기 시트 */}
      <Sheet
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="일지 상세"
        maxWidth="720px"
      >
        {viewingPost && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                {viewingPost.site.name}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {fmtKDate(parseYmd(viewingPost.date))}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-ink leading-snug">
                {viewingPost.title}
              </h2>
            </div>

            <div className="journal-content prose prose-slate max-w-none text-[0.9375rem] text-slate-600 leading-relaxed break-all">
              {viewingPost.body ? (
                <div dangerouslySetInnerHTML={{ __html: viewingPost.body }} />
              ) : (
                <p className="text-slate-400 italic">내용이 없는 일지입니다.</p>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setViewOpen(false)}>
                닫기
              </Button>
              <Button variant="danger" icon={<Trash2 size={15} />} onClick={handleDeleteFromViewer}>
                삭제
              </Button>
              <Button variant="primary" icon={<Pencil size={15} />} onClick={handleEditFromViewer}>
                수정하기
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
