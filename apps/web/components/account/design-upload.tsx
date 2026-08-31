'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Upload, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AccountDesign {
  id: string
  imageUrl: string
  notes: string | null
  createdAt: string
}

export function DesignUpload() {
  const t = useTranslations('account')
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<{ designs: AccountDesign[] }>({
    queryKey: ['account-designs'],
    queryFn: async () => {
      const response = await fetch('/api/account/designs', { cache: 'no-store' })
      if (response.status === 401) {
        return { designs: [] }
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to load designs')
      }
      return response.json()
    },
  })

  const designs = data?.designs ?? []

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('File missing')
      }
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (notes.trim().length > 0) {
        formData.append('notes', notes.trim())
      }

      const response = await fetch('/api/account/designs', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to upload')
      }

      return response.json()
    },
    onSuccess: async () => {
      setSelectedFile(null)
      setNotes('')
      setPreviewUrl(null)
      setErrorMessage(null)
      await queryClient.invalidateQueries({ queryKey: ['account-designs'] })
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t('designError'))
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Max 10MB')
      return
    }

    setSelectedFile(file)
    setErrorMessage(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="border border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display">{t('designsHeading')}</CardTitle>
        <CardDescription>{t('designsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="custom-design-file">{t('fileLabel')}</Label>
          <Input
            id="custom-design-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={mutation.isPending}
            onChange={handleFileChange}
          />
          {previewUrl && (
            <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border bg-muted">
              <Image src={previewUrl} alt="preview" fill className="object-cover" sizes="100vw" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="design-notes">{t('notesLabel')}</Label>
          <Textarea
            id="design-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('notesLabel')}
            rows={3}
            maxLength={300}
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">{notes.length}/300</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={!selectedFile || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {mutation.isPending ? t('uploading') : t('submitDesign')}
        </Button>

        <div className="space-y-3">
          {isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/60" />
              ))}
            </div>
          )}
          {isError && (
            <div className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              <p>{t('designError')}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            </div>
          )}
          {!isLoading && !isError && designs.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('designsEmpty')}</p>
          )}
          {!isLoading && !isError && designs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {designs.map((design) => (
                <figure key={design.id} className="overflow-hidden rounded-xl border border-border">
                  <div className="relative h-32 w-full">
                    <Image
                      src={design.imageUrl}
                      alt={design.notes ?? 'Custom design'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  </div>
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                    {design.notes || new Date(design.createdAt).toLocaleDateString()}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

