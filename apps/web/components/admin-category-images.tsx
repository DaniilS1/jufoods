'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Upload, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { catalogueSections } from '@/lib/catalogue-sections'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MAIN_CATEGORIES = [
  { id: 'main-torten', labelDe: 'Torten (Startseite)', group: 'Startseite' },
  { id: 'main-desserts', labelDe: 'Desserts (Startseite)', group: 'Startseite' },
]

type ImageMap = Record<string, string>

export function AdminCategoryImages() {
  const t = useTranslations('admin.categories')
  const [imageMap, setImageMap] = useState<ImageMap>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSectionId = useRef<string | null>(null)

  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    const supabase = createClient()
    const { data } = await supabase.from('category_images').select('section_id, image_url')
    if (data) {
      const map: ImageMap = {}
      for (const row of data) map[row.section_id] = row.image_url
      setImageMap(map)
    }
  }

  function triggerUpload(sectionId: string) {
    pendingSectionId.current = sectionId
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const sectionId = pendingSectionId.current
    if (!file || !sectionId) return
    e.target.value = ''

    setUploading(sectionId)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'categories')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload fehlgeschlagen')

      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('category_images')
        .upsert({ section_id: sectionId, image_url: json.url, updated_at: new Date().toISOString() })

      if (dbError) throw new Error(dbError.message)

      setImageMap((prev) => ({ ...prev, [sectionId]: json.url }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(null)
      pendingSectionId.current = null
    }
  }

  const tortenSections = catalogueSections.filter((s) => s.group === 'torten')
  const dessertSections = catalogueSections.filter((s) => s.group === 'desserts')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Startseite — Hauptkategorien */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Startseite
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MAIN_CATEGORIES.map((cat) => (
            <CategoryImageCard
              key={cat.id}
              sectionId={cat.id}
              label={cat.labelDe}
              imageUrl={imageMap[cat.id]}
              uploading={uploading === cat.id}
              onUpload={triggerUpload}
            />
          ))}
        </div>
      </section>

      {/* Torten Unterkategorien */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Torten
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tortenSections.map((s) => (
            <CategoryImageCard
              key={s.id}
              sectionId={s.id}
              label={s.descDe}
              sublabel={s.id}
              accent={s.accent}
              imageUrl={imageMap[s.id]}
              uploading={uploading === s.id}
              onUpload={triggerUpload}
            />
          ))}
        </div>
      </section>

      {/* Desserts Unterkategorien */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Desserts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {dessertSections.map((s) => (
            <CategoryImageCard
              key={s.id}
              sectionId={s.id}
              label={s.descDe}
              sublabel={s.id}
              accent={s.accent}
              imageUrl={imageMap[s.id]}
              uploading={uploading === s.id}
              onUpload={triggerUpload}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

interface CategoryImageCardProps {
  sectionId: string
  label: string
  sublabel?: string
  accent?: string
  imageUrl?: string
  uploading: boolean
  onUpload: (sectionId: string) => void
}

function CategoryImageCard({
  sectionId,
  label,
  sublabel,
  accent,
  imageUrl,
  uploading,
  onUpload,
}: CategoryImageCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Preview */}
      <div
        className="relative h-28 w-full"
        style={imageUrl ? undefined : { background: accent ? `linear-gradient(135deg, ${accent} 0%, ${accent}bb 100%)` : undefined }}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={label} fill className="object-cover" sizes="200px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info + upload */}
      <CardContent className="p-2.5">
        <p className="text-xs font-medium truncate">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground truncate mb-2">{sublabel}</p>
        )}
        <Button
          onClick={() => onUpload(sectionId)}
          disabled={uploading}
          variant="outline"
          size="sm"
          className="mt-1.5 w-full gap-1.5 text-xs"
        >
          <Upload className="h-3 w-3" />
          {uploading ? 'Lädt…' : 'Bild hochladen'}
        </Button>
      </CardContent>
    </Card>
  )
}
