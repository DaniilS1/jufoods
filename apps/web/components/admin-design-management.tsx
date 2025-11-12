'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { useTranslations } from 'next-intl'
import { AlertCircle, Check, Edit, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'

const designSchema = z.object({
  name_uk: z.string().min(1, 'Ukrainischer Name ist erforderlich'),
  name_de: z.string().min(1, 'Deutscher Name ist erforderlich'),
  description_uk: z.string().optional(),
  description_de: z.string().optional(),
  sub_category: z.string().optional().nullable(),
  image_url: z.string().optional(),
})

type DesignFormData = z.infer<typeof designSchema>

interface DesignRecord {
  id: string
  slug: string
  name_uk: string
  name_de: string
  description_uk: string | null
  description_de: string | null
  sub_category: string | null
  image_url: string | null
}

const TORTEN_SUBCATEGORIES = ['hochzeit', 'zum-tee', 'feier'] as const
const NO_SUBCATEGORY_VALUE = 'none'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function AdminDesignManagement() {
  const supabase = createClient()
  const tAdmin = useTranslations('admin.designs')
  const tTortenSubcategories = useTranslations('catalog.subcategories.torten')

  const [designs, setDesigns] = useState<DesignRecord[]>([])
  const [loadingDesigns, setLoadingDesigns] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingDesign, setEditingDesign] = useState<DesignRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DesignFormData>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      sub_category: '',
      image_url: '',
    },
  })

  const subCategoryValue = watch('sub_category') || ''
  const selectValue = subCategoryValue ? subCategoryValue : NO_SUBCATEGORY_VALUE

  useEffect(() => {
    loadDesigns()
  }, [])

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  async function loadDesigns() {
    try {
      setLoadingDesigns(true)
      const { data, error } = await supabase
        .from('torten_designs')
        .select(
          `
            id,
            slug,
            name_uk,
            name_de,
            description_uk,
            description_de,
            sub_category,
            image_url
          `
        )
        .order('created_at', { ascending: false })

      if (error) throw error
      setDesigns((data as DesignRecord[]) || [])
    } catch (err: any) {
      console.error('Error loading designs:', err)
      setError(`Fehler beim Laden der Designs: ${err.message}`)
    } finally {
      setLoadingDesigns(false)
    }
  }
  async function uploadImage(file: File, folder: string = 'torten-designs'): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const json = await response.json()
      throw new Error(json.error || 'Upload fehlgeschlagen')
    }

    const data = await response.json()
    return data.url
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImage(file)
      setValue('image_url', url)
      setSuccess('Bild erfolgreich hochgeladen! URL wurde eingefügt.')
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(`Fehler beim Hochladen des Bildes: ${err.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function openCreateModal() {
    setEditingDesign(null)
    reset({
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      sub_category: '',
      image_url: '',
    })
    setIsModalOpen(true)
  }

  function startEdit(design: DesignRecord) {
    setEditingDesign(design)

    reset({
      name_uk: design.name_uk,
      name_de: design.name_de,
      description_uk: design.description_uk || '',
      description_de: design.description_de || '',
      sub_category: design.sub_category || '',
      image_url: design.image_url || '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingDesign(null)
    reset()
  }

  async function onSubmit(data: DesignFormData) {
    setError(null)
    setSuccess(null)

    try {
      const slug = editingDesign ? editingDesign.slug : slugify(data.name_de)
      const payload = {
        slug,
        name_uk: data.name_uk,
        name_de: data.name_de,
        description_uk: data.description_uk || null,
        description_de: data.description_de || null,
        sub_category: data.sub_category ? data.sub_category : null,
        image_url: data.image_url || null,
        category: 'torten',
      }

      if (editingDesign) {
        const { error: updateError } = await supabase
          .from('torten_designs')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingDesign.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('torten_designs')
          .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })

        if (insertError) throw insertError
      }

      setSuccess(editingDesign ? tAdmin('updateSuccess') : tAdmin('createSuccess'))
      closeModal()
      await loadDesigns()
    } catch (err: any) {
      console.error('Error saving design:', err)
      setError(`Fehler beim Speichern des Designs: ${err.message || 'Unbekannter Fehler'}`)
    }
  }

  async function handleDelete(designId: string) {
    if (!confirm('Möchten Sie dieses Design wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }
    setDeletingId(designId)
    setError(null)
    setSuccess(null)

    try {
      const { error: deleteError } = await supabase.from('torten_designs').delete().eq('id', designId)
      if (deleteError) throw deleteError
      setSuccess(tAdmin('deleteSuccess'))
      await loadDesigns()
    } catch (err: any) {
      console.error('Error deleting design:', err)
      setError(`Fehler beim Löschen des Designs: ${err.message || 'Unbekannter Fehler'}`)
    } finally {
      setDeletingId(null)
    }
  }

  const isLoading = loadingDesigns

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{tAdmin('title')}</h2>
          <p className="text-muted-foreground">{tAdmin('description')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          {tAdmin('newDesign')}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-100 p-3 text-emerald-700">
          <Check className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : designs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{tAdmin('noDesigns')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{tAdmin('image')}</th>
                <th className="px-4 py-3 text-left font-semibold">{tAdmin('nameDe')}</th>
                <th className="px-4 py-3 text-left font-semibold">{tAdmin('nameUk')}</th>
                <th className="px-4 py-3 text-left font-semibold">{tAdmin('subCategory')}</th>
                <th className="px-4 py-3 text-left font-semibold w-1/3">{tAdmin('descriptionDe')}</th>
                <th className="px-4 py-3 text-left font-semibold">{tAdmin('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 bg-background">
              {designs.map((design) => {
                const subCategoryLabel = design.sub_category
                  ? tTortenSubcategories(design.sub_category)
                  : tAdmin('noSubCategory')

                return (
                  <tr key={design.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                        {design.image_url ? (
                          <Image
                            src={normalizeSupabaseImageUrl(design.image_url)}
                            alt={design.name_de}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            {tAdmin('noImage')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{design.name_de}</td>
                    <td className="px-4 py-3 text-muted-foreground">{design.name_uk}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                        {subCategoryLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {design.description_de ? (
                        <p className="line-clamp-3 leading-relaxed">{design.description_de}</p>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/70">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(design)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {tAdmin('edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(design.id)}
                          disabled={deletingId === design.id}
                        >
                          {deletingId === design.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          {tAdmin('delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                {editingDesign ? tAdmin('editDesign') : tAdmin('createDesign')}
              </DialogTitle>
              <DialogDescription>
                {editingDesign ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_de">{tAdmin('nameDe')}</Label>
                <Input id="name_de" {...register('name_de')} />
                {errors.name_de && <p className="text-sm text-destructive">{errors.name_de.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_uk">{tAdmin('nameUk')}</Label>
                <Input id="name_uk" {...register('name_uk')} />
                {errors.name_uk && <p className="text-sm text-destructive">{errors.name_uk.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description_de">{tAdmin('descriptionDe')}</Label>
                <Textarea id="description_de" rows={4} {...register('description_de')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_uk">{tAdmin('descriptionUk')}</Label>
                <Textarea id="description_uk" rows={4} {...register('description_uk')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_category">{tAdmin('subCategory')}</Label>
              <Select
                value={selectValue}
                onValueChange={(value) =>
                  setValue('sub_category', value === NO_SUBCATEGORY_VALUE ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin('selectSubCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUBCATEGORY_VALUE}>{tAdmin('noSubCategory')}</SelectItem>
                  {TORTEN_SUBCATEGORIES.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {tTortenSubcategories(subcategory)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">{tAdmin('image')}</Label>
              <div className="flex gap-2">
                <Input id="image_url" {...register('image_url')} placeholder="https://..." />
                <Label
                  htmlFor="design-image-upload"
                  className="inline-flex items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <Upload className="h-4 w-4" />
                  {tAdmin('upload')}
                </Label>
                <input
                  id="design-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {tAdmin('uploading')}
                </p>
              )}
              {errors.image_url && <p className="text-sm text-destructive">{errors.image_url.message}</p>}
            </div>

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                <X className="h-4 w-4 mr-1" />
                {tAdmin('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {editingDesign ? tAdmin('update') : tAdmin('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

