'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomDesignUploadProps {
  productId: string
  onUploadComplete: (customDesign: { id: string; image: string; text: string }) => void
  locale: string
}

export function CustomDesignUpload({
  productId,
  onUploadComplete,
  locale,
}: CustomDesignUploadProps) {
  const t = useTranslations('product')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError(t('invalidFileType'))
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(t('fileTooLarge'))
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('pleaseSelectFile'))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('productId', productId)

      const response = await fetch('/api/custom-designs', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { imageUrl } = await response.json()

      // Create custom design object
      const customDesignId = `custom-${Date.now()}`
      const customDesign = {
        id: customDesignId,
        image: imageUrl,
        text: text.trim(),
      }

      // Store in localStorage
      const storageKey = `custom-designs-${productId}`
      const existingDesigns = JSON.parse(localStorage.getItem(storageKey) || '[]')
      existingDesigns.push(customDesign)
      localStorage.setItem(storageKey, JSON.stringify(existingDesigns))

      // Callback to parent
      onUploadComplete(customDesign)

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setText('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || t('uploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('uploadCustomDesignDescription')}</p>

      {/* File Input */}
      <div className="space-y-2">
        <Label htmlFor="custom-design-file">{t('uploadImage')}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="custom-design-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="flex-1"
          />
          {selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {previewUrl && (
          <div className="relative w-32 h-32 rounded-md overflow-hidden border">
            <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="128px" unoptimized />
          </div>
        )}
      </div>

      {/* Text Input */}
      <div className="space-y-2">
        <Label htmlFor="custom-design-text">{t('customDesignText')} (optional)</Label>
        <Textarea
          id="custom-design-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('customDesignTextPlaceholder')}
          maxLength={500}
          disabled={isUploading}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">{text.length}/500</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Upload className="h-4 w-4 mr-2 animate-pulse" />
            {t('uploading')}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {t('uploadDesign')}
          </>
        )}
      </Button>
    </div>
  )
}

