'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Image,
  Trash2,
  Type
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'


interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// 브라우저 Canvas API를 사용한 WebP 변환 및 이미지 압축 헬퍼 (Blob 반환)
function compressAndConvertToWebpBlob(file: File, maxWidth = 1200, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context is not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas toBlob conversion failed'))
            }
          },
          'image/webp',
          quality
        )
      }
      img.onerror = (err) => reject(err)
      img.src = event.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}


export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [toolbarCoords, setToolbarCoords] = useState<{ top: number; left: number } | null>(null)
  const [uploading, setUploading] = useState(false)

  // 외부 변경 동기화 (에디터 내 포커스가 없고 값이 다를 때만 갱신)
  useEffect(() => {
    if (editorRef.current) {
      const editorHTML = editorRef.current.innerHTML
      const normalizedValue = value === '' ? '' : value
      const normalizedEditor = editorHTML === '<p><br></p>' || editorHTML === '<br>' ? '' : editorHTML
      
      if (normalizedEditor !== normalizedValue) {
        editorRef.current.innerHTML = value || '<p><br></p>'
      }
    }
  }, [value])

  const executeCommand = (command: string, argument: string = '') => {
    if (typeof document === 'undefined') return
    document.execCommand(command, false, argument)
    handleInput()
    updateActiveFormats()
    editorRef.current?.focus()
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const flash = useAppStore.getState().flash
    const user = useAppStore.getState().user
    const userId = user.id || 'anonymous'

    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // GIF 제외 처리
        if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
          flash('GIF 이미지는 업로드할 수 없습니다.')
          continue
        }

        try {
          // WebP 변환 및 리사이징 압축 (Blob 반환)
          const webpBlob = await compressAndConvertToWebpBlob(file)

          // Firebase Storage 업로드
          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`
          const storageRef = ref(storage, `journals/${userId}/${fileName}`)
          await uploadBytes(storageRef, webpBlob)
          const downloadUrl = await getDownloadURL(storageRef)

          if (typeof document !== 'undefined') {
            editorRef.current?.focus()
            document.execCommand('insertImage', false, downloadUrl)
          }
        } catch (err) {
          console.error('Image upload/compression error:', err)
          flash('이미지 업로드에 실패했습니다.')
        }
      }
    } finally {
      setUploading(false)
      e.target.value = ''
      handleInput()
    }
  }

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement
      setSelectedImage(img)

      const rect = img.getBoundingClientRect()
      const parentRect = editorRef.current?.getBoundingClientRect()
      if (parentRect) {
        setToolbarCoords({
          top: rect.top - parentRect.top + (rect.height / 2) - 16 + (editorRef.current?.scrollTop || 0),
          left: rect.left - parentRect.left + (rect.width / 2) - 100
        })
      }
    } else {
      setSelectedImage(null)
      setToolbarCoords(null)
    }
  }

  const resizeImage = (widthPercent: string) => {
    if (selectedImage) {
      selectedImage.style.width = widthPercent
      selectedImage.style.height = 'auto'
      handleInput()

      setTimeout(() => {
        if (!selectedImage || !editorRef.current) return
        const rect = selectedImage.getBoundingClientRect()
        const parentRect = editorRef.current.getBoundingClientRect()
        setToolbarCoords({
          top: rect.top - parentRect.top + (rect.height / 2) - 16 + (editorRef.current.scrollTop || 0),
          left: rect.left - parentRect.left + (rect.width / 2) - 100
        })
      }, 50)
    }
  }


  const removeSelectedImage = () => {
    if (selectedImage) {
      selectedImage.remove()
      setSelectedImage(null)
      setToolbarCoords(null)
      handleInput()
    }
  }

  const handleEditorScroll = () => {
    if (selectedImage) {
      setSelectedImage(null)
      setToolbarCoords(null)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML
      // 완전히 비어 있는 경우 처리
      if (html === '<p><br></p>' || html === '<br>' || html.trim() === '') {
        html = ''
      }
      onChange(html)
    }
  }

  const updateActiveFormats = () => {
    if (typeof document === 'undefined') return
    const formats: string[] = []
    if (document.queryCommandState('bold')) formats.push('bold')
    if (document.queryCommandState('italic')) formats.push('italic')
    if (document.queryCommandState('underline')) formats.push('underline')
    if (document.queryCommandState('strikeThrough')) formats.push('strike')
    
    // 블록 형식 검사
    const blockType = document.queryCommandValue('formatBlock')
    if (blockType === 'h2') formats.push('h2')
    if (blockType === 'h3') formats.push('h3')
    if (blockType === 'blockquote') formats.push('blockquote')
    if (blockType === 'p' || blockType === '') formats.push('p')

    setActiveFormats(formats)
  }

  const handleKeyUp = () => {
    handleInput()
    updateActiveFormats()
  }

  const handleMouseUp = () => {
    updateActiveFormats()
  }

  return (
    <div className="relative flex flex-col rounded border border-slate-200 bg-white overflow-hidden focus-within:border-blue-600 focus-within:ring-[3px] focus-within:ring-blue-100 transition-colors">
      {/* 이미지 업로드 로딩 오버레이 */}
      {uploading && (
        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-50 select-none">
          <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-blue-600 animate-pulse">이미지를 안전하게 업로드하는 중입니다...</p>
        </div>
      )}
      {/* 툴바 */}
      <div className="flex items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50 overflow-x-auto shrink-0 select-none scrollbar-none">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('formatBlock', '<p>')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('p') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="본문"
        >
          <Type size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('formatBlock', '<h2>')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('h2') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="제목 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('formatBlock', '<h3>')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('h3') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="제목 3"
        >
          <Heading3 size={16} />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('bold')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('bold') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="굵게"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('italic')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('italic') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="기울임"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('underline')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('underline') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="밑줄"
        >
          <Underline size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('strikeThrough')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('strike') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="취소선"
        >
          <Strikethrough size={16} />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          title="글머리 기호"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          title="번호 매기기"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('formatBlock', '<blockquote>')}
          className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${
            activeFormats.includes('blockquote') ? 'bg-slate-200 text-blue-600 font-bold' : 'text-slate-600'
          }`}
          title="인용구"
        >
          <Quote size={16} />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleImageClick}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          title="사진 추가"
        >
          <Image size={16} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageChange}
      />

      {/* 에디터 콘텐츠 영역 */}
      <div
        ref={editorRef}
        contentEditable
        onClick={handleEditorClick}
        onScroll={handleEditorScroll}
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
        data-placeholder={placeholder}
        className="editor-content min-h-[260px] w-full px-4 py-3 text-sm leading-6 text-ink outline-none overflow-y-auto"
      />

      {/* 이미지 퀵 리사이즈 툴바 */}
      {selectedImage && toolbarCoords && (
        <div
          style={{
            top: `${toolbarCoords.top}px`,
            left: `${toolbarCoords.left}px`,
          }}
          className="absolute z-30 flex items-center gap-1 p-1 bg-slate-900/90 text-white rounded shadow-lg text-xs font-semibold select-none border border-slate-700/50"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => resizeImage('25%')}
            className={`px-2 py-1 rounded hover:bg-slate-700/80 transition-colors ${
              selectedImage.style.width === '25%' ? 'text-blue-400 font-bold' : ''
            }`}
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => resizeImage('50%')}
            className={`px-2 py-1 rounded hover:bg-slate-700/80 transition-colors ${
              selectedImage.style.width === '50%' ? 'text-blue-400 font-bold' : ''
            }`}
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => resizeImage('75%')}
            className={`px-2 py-1 rounded hover:bg-slate-700/80 transition-colors ${
              selectedImage.style.width === '75%' ? 'text-blue-400 font-bold' : ''
            }`}
          >
            75%
          </button>
          <button
            type="button"
            onClick={() => resizeImage('100%')}
            className={`px-2 py-1 rounded hover:bg-slate-700/80 transition-colors ${
              selectedImage.style.width === '100%' || !selectedImage.style.width ? 'text-blue-400 font-bold' : ''
            }`}
          >
            100%
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={removeSelectedImage}
            className="px-2 py-1 rounded text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
            title="사진 삭제"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
