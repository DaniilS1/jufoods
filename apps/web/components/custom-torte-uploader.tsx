'use client'

import { useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const NOTE_MAX = 500

interface CustomTorteUploaderProps {
  locale: string
  /** Uploaded image URLs (Supabase Storage public URLs) */
  value: string[]
  /** Design description note */
  note: string
  onChange: (urls: string[]) => void
  onNoteChange: (note: string) => void
  max?: number
}

export function CustomTorteUploader({
  value,
  note,
  onChange,
  onNoteChange,
  max = 5,
}: CustomTorteUploaderProps) {
  const t = useTranslations('customTorte')
  const tProduct = useTranslations('product')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const remainingSlots = max - value.length - pendingCount
  const isFull = remainingSlots <= 0

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(tProduct('invalidFileType'))
        return null
      }
      if (file.size > MAX_SIZE) {
        setError(tProduct('fileTooLarge'))
        return null
      }
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', 'custom')
      const res = await fetch('/api/custom-designs', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || tProduct('uploadError'))
        return null
      }
      const { imageUrl } = await res.json()
      return imageUrl as string
    },
    [tProduct]
  )

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      setError(null)
      const files = Array.from(fileList)
      const allowed = files.slice(0, Math.max(0, remainingSlots))
      if (files.length > allowed.length) {
        setError(t('maxImagesReached', { max }))
      }
      if (allowed.length === 0) return

      setPendingCount((c) => c + allowed.length)
      const uploaded: string[] = []
      for (const file of allowed) {
        const url = await uploadFile(file)
        if (url) uploaded.push(url)
        setPendingCount((c) => c - 1)
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded])
      }
    },
    [remainingSlots, uploadFile, onChange, value, t, max]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (isFull) return
      void handleFiles(e.dataTransfer.files)
    },
    [handleFiles, isFull]
  )

  const removeImage = useCallback(
    (url: string) => {
      onChange(value.filter((u) => u !== url))
    },
    [onChange, value]
  )

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isFull ? -1 : 0}
        aria-disabled={isFull}
        aria-label={t('uploadAriaLabel')}
        onClick={() => !isFull && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (isFull) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!isFull) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors duration-200 sm:aspect-[3/4]',
          isFull
            ? 'cursor-not-allowed border-border bg-muted/40 opacity-60'
            : 'cursor-pointer border-border bg-muted/20 hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragging && !isFull && 'border-primary bg-primary/10'
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImagePlus className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{t('dropHeadline')}</p>
          <p className="text-xs text-muted-foreground">{t('dropHint')}</p>
          <p className="text-xs text-muted-foreground">{t('maxImages', { max })}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Preview grid */}
      {(value.length > 0 || pendingCount > 0) && (
        <div className="grid grid-cols-3 gap-2.5">
          {value.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
              <Image src={url} alt={t('previewAlt')} fill className="object-cover" sizes="33vw" unoptimized />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label={t('removeImage')}
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          {Array.from({ length: pendingCount }).map((_, i) => (
            <div
              key={`pending-${i}`}
              className="flex aspect-square items-center justify-center rounded-xl border border-border bg-muted/60"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ))}
        </div>
      )}

      {/* Design description */}
      <div className="space-y-2">
        <Label htmlFor="custom-design-note" className="text-sm font-medium">
          {t('noteLabel')}
        </Label>
        <Textarea
          id="custom-design-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value.slice(0, NOTE_MAX))}
          placeholder={t('notePlaceholder')}
          maxLength={NOTE_MAX}
          rows={4}
        />
        <p className="text-right text-xs text-muted-foreground">
          {note.length}/{NOTE_MAX}
        </p>
      </div>
    </div>
  )
}
