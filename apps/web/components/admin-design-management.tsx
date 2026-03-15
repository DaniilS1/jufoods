'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const designSchema = z.object({
  name_uk: z.string().min(1, 'Ukrainischer Name ist erforderlich'),
  name_de: z.string().min(1, 'Deutscher Name ist erforderlich'),
  description_uk: z.string().optional(),
  description_de: z.string().optional(),
  sub_category: z.string().optional().nullable(),
  image_url: z.string().optional(),
  classic: z.boolean(),
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
  classic: boolean
}

interface FlavourSummary {
  id: string
  name_de: string
  name_uk: string
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
  const [flavours, setFlavours] = useState<FlavourSummary[]>([])
  const [flavoursLoading, setFlavoursLoading] = useState(false)
  const [selectedFlavourIds, setSelectedFlavourIds] = useState<string[]>([])

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
      classic: false,
    },
  })

  const subCategoryValue = watch('sub_category') || ''
  const selectValue = subCategoryValue ? subCategoryValue : NO_SUBCATEGORY_VALUE
  const classicValue = watch('classic') ?? false

  useEffect(() => {
    loadDesigns()
    loadFlavours()
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
            image_url,
            classic
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

  async function loadFlavours() {
    try {
      setFlavoursLoading(true)
      const { data, error } = await supabase
        .from('torten_flavours')
        .select('id, name_de, name_uk')
        .order('name_de', { ascending: true })

      if (error) throw error
      setFlavours((data as FlavourSummary[]) || [])
    } catch (err: any) {
      console.error('Error loading flavours:', err)
      setError(`Fehler beim Laden der Geschmäcker: ${err.message}`)
    } finally {
      setFlavoursLoading(false)
    }
  }

  async function loadDesignFlavours(designId: string) {
    try {
      const { data, error } = await supabase
        .from('design_flavour')
        .select('flavour_id')
        .eq('design_id', designId)

      if (error) throw error

      setSelectedFlavourIds((data || []).map((record) => record.flavour_id))
    } catch (err: any) {
      console.error('Error loading design flavours:', err)
      setError(`Fehler beim Laden der Geschmackszuordnungen: ${err.message}`)
    }
  }

  function toggleFlavourSelection(flavourId: string, checked: boolean) {
    setSelectedFlavourIds((prev) => {
      if (checked) {
        if (prev.includes(flavourId)) return prev
        return [...prev, flavourId]
      }
      return prev.filter((id) => id !== flavourId)
    })
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
      classic: false,
    })
    setSelectedFlavourIds([])
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
      classic: design.classic ?? false,
    })
    loadDesignFlavours(design.id)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingDesign(null)
    reset()
    setSelectedFlavourIds([])
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
        classic: data.classic ?? false,
      }

      let designId = editingDesign?.id ?? ''

      if (editingDesign) {
        const { error: updateError } = await supabase
          .from('torten_designs')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingDesign.id)

        if (updateError) throw updateError
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('torten_designs')
          .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select('id')
          .single()

        if (insertError) throw insertError
        designId = insertData?.id || designId
      }

      const finalDesignId = designId || editingDesign?.id

      if (finalDesignId) {
        const { error: deleteError } = await supabase.from('design_flavour').delete().eq('design_id', finalDesignId)
        if (deleteError) throw deleteError

        if (!payload.classic && selectedFlavourIds.length > 0) {
          const insertPayload = selectedFlavourIds.map((flavourId) => ({
            design_id: finalDesignId,
            flavour_id: flavourId,
          }))
          const { error: insertLinksError } = await supabase.from('design_flavour').insert(insertPayload)
          if (insertLinksError) throw insertLinksError
        }
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

      <TooltipProvider>
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{tAdmin('title')}</h2>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{tAdmin('newDesign')}</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{tAdmin('noDesigns')}</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {designs.map((design) => {
                  const subCategoryLabel = design.sub_category
                    ? tTortenSubcategories(design.sub_category)
                    : tAdmin('noSubCategory')

                  return (
                    <div key={design.id} className="flex gap-3 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{design.name_de}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{design.name_uk}</p>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary mt-1">
                          {subCategoryLabel}
                        </span>
                        <div className="flex justify-end gap-1 pt-2 mt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(design)}
                            aria-label={tAdmin('edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(design.id)}
                            disabled={deletingId === design.id}
                            aria-label={tAdmin('delete')}
                          >
                            {deletingId === design.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm bg-white">
                    <thead className="text-muted-foreground sticky top-0 bg-white z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">{tAdmin('image')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{tAdmin('nameDe')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{tAdmin('nameUk')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{tAdmin('subCategory')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{tAdmin('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70 bg-white">
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
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEdit(design)}
                                      aria-label={tAdmin('edit')}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{tAdmin('edit')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(design.id)}
                                      disabled={deletingId === design.id}
                                      aria-label={tAdmin('delete')}
                                    >
                                      {deletingId === design.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{tAdmin('delete')}</TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </TooltipProvider>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90dvh] flex flex-col p-0 mx-4 sm:mx-6">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-base">
              {editingDesign ? tAdmin('editDesign') : tAdmin('createDesign')}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingDesign ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="name_de">{tAdmin('nameDe')}</Label>
                <Input id="name_de" {...register('name_de')} />
                {errors.name_de && <p className="text-xs text-destructive">{errors.name_de.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="name_uk">{tAdmin('nameUk')}</Label>
                <Input id="name_uk" {...register('name_uk')} />
                {errors.name_uk && <p className="text-xs text-destructive">{errors.name_uk.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="description_de">{tAdmin('descriptionDe')}</Label>
                <Textarea id="description_de" rows={2} {...register('description_de')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="description_uk">{tAdmin('descriptionUk')}</Label>
                <Textarea id="description_uk" rows={2} {...register('description_uk')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs" htmlFor="sub_category">{tAdmin('subCategory')}</Label>
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

            <div className="flex flex-col gap-1">
              <Label className="text-xs" htmlFor="image_url">{tAdmin('image')}</Label>
              <div className="flex gap-2">
                <Input id="image_url" {...register('image_url')} placeholder="https://..." />
                <Label
                  htmlFor="design-image-upload"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm cursor-pointer hover:bg-accent active:bg-accent"
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

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="classic" className="text-xs font-medium cursor-pointer shrink-0">
                  {tAdmin('classic')}:
                </Label>
                <Switch
                  id="classic"
                  checked={classicValue}
                  onCheckedChange={(checked) => setValue('classic', checked)}
                />
              </div>
              {classicValue && (
                <p className="text-xs text-muted-foreground">{tAdmin('classicDescription')}</p>
              )}
            </div>

            {!classicValue && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">{tAdmin('flavourAssignmentsTitle')}</Label>
                  <p className="text-xs text-muted-foreground">{tAdmin('flavourAssignmentsDescription')}</p>
                </div>
                <div className="rounded-md border">
                  {flavoursLoading ? (
                    <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {tAdmin('flavourAssignmentsLoading')}
                    </div>
                  ) : flavours.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">{tAdmin('flavourAssignmentsEmpty')}</p>
                  ) : (
                    <>
                      <label className="flex items-center gap-2 p-2 border-b cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          checked={flavours.length > 0 && selectedFlavourIds.length === flavours.length}
                          onCheckedChange={(value) => {
                            if (value === true) {
                              setSelectedFlavourIds(flavours.map((f) => f.id))
                            } else {
                              setSelectedFlavourIds([])
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{tAdmin('flavourAssignmentsSelectAll')}</span>
                      </label>
                      <div className="max-h-48 overflow-y-auto divide-y">
                        {flavours.map((flavour) => {
                        const checked = selectedFlavourIds.includes(flavour.id)
                        return (
                          <label
                            key={flavour.id}
                            className="flex items-start gap-2 p-2 hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggleFlavourSelection(flavour.id, value === true)}
                            />
                            <div>
                              <p className="text-sm font-medium leading-tight">{flavour.name_de}</p>
                              <p className="text-xs text-muted-foreground">{flavour.name_uk}</p>
                            </div>
                          </label>
                        )
                      })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>

            <DialogFooter className="px-4 py-3 border-t bg-background flex gap-2">
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

