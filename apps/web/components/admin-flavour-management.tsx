'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { useTranslations } from 'next-intl'
import { AlertCircle, Check, Edit, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

const flavourSchema = z.object({
  name_uk: z.string().min(1, 'Українська назва обов’язкова'),
  name_de: z.string().min(1, 'Deutscher Name ist erforderlich'),
  description_uk: z.string().optional(),
  description_de: z.string().optional(),
  ingredients_uk: z.array(z.string()).default([]),
  ingredients_de: z.array(z.string()).default([]),
  allergens_uk: z.array(z.string()).default([]),
  allergens_de: z.array(z.string()).default([]),
  energy: z.string().optional(),
  protein: z.string().optional(),
  fat: z.string().optional(),
  carbs: z.string().optional(),
  image_url: z.string().optional(),
})

type FlavourFormData = z.infer<typeof flavourSchema>

interface FlavourRecord {
  id: string
  slug: string
  name_uk: string
  name_de: string
  description_uk: string | null
  description_de: string | null
  ingredients_uk: string[] | null
  ingredients_de: string[] | null
  allergens_uk: string[] | null
  allergens_de: string[] | null
  nutrition: Record<string, unknown> | null
  image_url: string | null
  created_at: string
  updated_at: string
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function AdminFlavourManagement() {
  const supabase = useMemo(() => createClient(), [])
  const tAdmin = useTranslations('admin.flavours')

  const [flavours, setFlavours] = useState<FlavourRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingFlavour, setEditingFlavour] = useState<FlavourRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FlavourFormData>({
    resolver: zodResolver(flavourSchema),
    defaultValues: {
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      ingredients_uk: [],
      ingredients_de: [],
      allergens_uk: [],
      allergens_de: [],
      energy: '',
      protein: '',
      fat: '',
      carbs: '',
      image_url: '',
    },
  })

  const {
    fields: ingredientsUkFields,
    append: appendIngredientUk,
    remove: removeIngredientUk,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: 'ingredients_uk',
  })

  const {
    fields: ingredientsDeFields,
    append: appendIngredientDe,
    remove: removeIngredientDe,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: 'ingredients_de',
  })

  const {
    fields: allergensUkFields,
    append: appendAllergenUk,
    remove: removeAllergenUk,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: 'allergens_uk',
  })

  const {
    fields: allergensDeFields,
    append: appendAllergenDe,
    remove: removeAllergenDe,
  } = useFieldArray({
    control,
    // @ts-ignore
    name: 'allergens_de',
  })

  const loadFlavours = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('torten_flavours')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setFlavours((data as FlavourRecord[]) || [])
    } catch (err: any) {
      console.error('Error loading flavours:', err)
      setError(`Fehler beim Laden der Geschmacksrichtungen: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadFlavours()
  }, [loadFlavours])

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  async function uploadImage(file: File, folder: string = 'torten-flavours'): Promise<string> {
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
    setEditingFlavour(null)
    reset({
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      ingredients_uk: [],
      ingredients_de: [],
      allergens_uk: [],
      allergens_de: [],
      energy: '',
      protein: '',
      fat: '',
      carbs: '',
      image_url: '',
    })
    setIsModalOpen(true)
  }

  function startEdit(flavour: FlavourRecord) {
    setEditingFlavour(flavour)
    reset({
      name_uk: flavour.name_uk,
      name_de: flavour.name_de,
      description_uk: flavour.description_uk || '',
      description_de: flavour.description_de || '',
      ingredients_uk: flavour.ingredients_uk || [],
      ingredients_de: flavour.ingredients_de || [],
      allergens_uk: flavour.allergens_uk || [],
      allergens_de: flavour.allergens_de || [],
      energy: flavour.nutrition?.energy ? String(flavour.nutrition.energy) : '',
      protein: flavour.nutrition?.protein ? String(flavour.nutrition.protein) : '',
      fat: flavour.nutrition?.fat ? String(flavour.nutrition.fat) : '',
      carbs: flavour.nutrition?.carbs ? String(flavour.nutrition.carbs) : '',
      image_url: flavour.image_url || '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingFlavour(null)
    reset()
  }

  async function onSubmit(data: FlavourFormData) {
    setError(null)
    setSuccess(null)

    try {
      const slug = editingFlavour ? editingFlavour.slug : slugify(data.name_de)
      const nutritionEntries = [
        ['energy', data.energy],
        ['protein', data.protein],
        ['fat', data.fat],
        ['carbs', data.carbs],
      ].filter(([, value]) => value && value.trim() !== '')

      const nutrition =
        nutritionEntries.length > 0
          ? Object.fromEntries(nutritionEntries.map(([key, value]) => [key, value]))
          : null

      const payload = {
        slug,
        name_uk: data.name_uk,
        name_de: data.name_de,
        description_uk: data.description_uk || null,
        description_de: data.description_de || null,
        ingredients_uk: data.ingredients_uk.filter((item) => item.trim() !== ''),
        ingredients_de: data.ingredients_de.filter((item) => item.trim() !== ''),
        allergens_uk: data.allergens_uk.filter((item) => item.trim() !== ''),
        allergens_de: data.allergens_de.filter((item) => item.trim() !== ''),
        nutrition,
        image_url: data.image_url || null,
      }

      if (editingFlavour) {
        const { error: updateError } = await supabase
          .from('torten_flavours')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingFlavour.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('torten_flavours')
          .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })

        if (insertError) throw insertError
      }

      setSuccess(editingFlavour ? tAdmin('updateSuccess') : tAdmin('createSuccess'))
      closeModal()
      await loadFlavours()
    } catch (err: any) {
      console.error('Error saving flavour:', err)
      setError(`Fehler beim Speichern: ${err.message || 'Unbekannter Fehler'}`)
    }
  }

  async function handleDelete(flavourId: string) {
    if (!confirm(tAdmin('confirmDelete'))) {
      return
    }
    setDeletingId(flavourId)
    setError(null)
    setSuccess(null)

    try {
      const { error: deleteError } = await supabase.from('torten_flavours').delete().eq('id', flavourId)
      if (deleteError) throw deleteError
      setSuccess(tAdmin('deleteSuccess'))
      await loadFlavours()
    } catch (err: any) {
      console.error('Error deleting flavour:', err)
      setError(`Fehler beim Löschen: ${err.message || 'Unbekannter Fehler'}`)
    } finally {
      setDeletingId(null)
    }
  }

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
            <span className="hidden sm:inline">{tAdmin('newFlavour')}</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : flavours.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{tAdmin('noFlavours')}</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border">
              {flavours.map((flavour) => {
                const ingredientsPreview = (flavour.ingredients_de || []).join(', ')
                const allergensPreview = (flavour.allergens_de || []).join(', ')

                return (
                  <div key={flavour.id} className="flex gap-3 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {flavour.image_url ? (
                        <Image
                          src={normalizeSupabaseImageUrl(flavour.image_url)}
                          alt={flavour.name_de}
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
                      <p className="font-medium text-sm truncate">{flavour.name_de}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{flavour.name_uk}</p>
                      {ingredientsPreview && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          <span className="font-medium">{tAdmin('ingredientsDe')}: </span>
                          {ingredientsPreview}
                        </p>
                      )}
                      {allergensPreview && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          <span className="font-medium">{tAdmin('allergensDe')}: </span>
                          {allergensPreview}
                        </p>
                      )}
                      <div className="flex justify-end gap-1 pt-2 mt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(flavour)}
                          aria-label={tAdmin('edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(flavour.id)}
                          disabled={deletingId === flavour.id}
                          aria-label={tAdmin('delete')}
                        >
                          {deletingId === flavour.id ? (
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
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm bg-white">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">{tAdmin('image')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{tAdmin('nameDe')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{tAdmin('nameUk')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{tAdmin('ingredientsDe')}</th>
                    <th className="px-4 py-3 text-left font-semibold">{tAdmin('allergensDe')}</th>
                    <th className="px-4 py-3 text-right font-semibold">{tAdmin('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-white">
                  {flavours.map((flavour) => {
                    const ingredientsPreview = (flavour.ingredients_de || []).join(', ')
                    const allergensPreview = (flavour.allergens_de || []).join(', ')

                    return (
                      <tr key={flavour.id} className="align-top">
                        <td className="px-4 py-3">
                          <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                            {flavour.image_url ? (
                              <Image
                                src={normalizeSupabaseImageUrl(flavour.image_url)}
                                alt={flavour.name_de}
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
                        <td className="px-4 py-3 font-medium text-foreground">{flavour.name_de}</td>
                        <td className="px-4 py-3 text-muted-foreground">{flavour.name_uk}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ingredientsPreview ? (
                            <p className="line-clamp-3">{ingredientsPreview}</p>
                          ) : (
                            <span className="text-xs italic text-muted-foreground/70">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {allergensPreview ? (
                            <p className="line-clamp-2">{allergensPreview}</p>
                          ) : (
                            <span className="text-xs italic text-muted-foreground/70">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEdit(flavour)}
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
                                  onClick={() => handleDelete(flavour.id)}
                                  disabled={deletingId === flavour.id}
                                  aria-label={tAdmin('delete')}
                                >
                                  {deletingId === flavour.id ? (
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
          </>
        )}
        </div>
      </TooltipProvider>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90dvh] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-base">
              {editingFlavour ? tAdmin('editFlavour') : tAdmin('createFlavour')}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingFlavour ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
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
              <div className="flex flex-col gap-1">
                <Label className="text-xs" htmlFor="description_de">{tAdmin('descriptionDe')}</Label>
                <RichTextEditor
                  value={watch('description_de') || ''}
                  onChange={(html) => setValue('description_de', html)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs" htmlFor="description_uk">{tAdmin('descriptionUk')}</Label>
                <RichTextEditor
                  value={watch('description_uk') || ''}
                  onChange={(html) => setValue('description_uk', html)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{tAdmin('ingredientsDe')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendIngredientDe('')}>
                    <Plus className="h-3 w-3 mr-1" /> {tAdmin('add')}
                  </Button>
                </div>
                {ingredientsDeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`ingredients_de.${index}`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredientDe(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{tAdmin('ingredientsUk')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendIngredientUk('')}>
                    <Plus className="h-3 w-3 mr-1" /> {tAdmin('add')}
                  </Button>
                </div>
                {ingredientsUkFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`ingredients_uk.${index}`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredientUk(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{tAdmin('allergensDe')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendAllergenDe('')}>
                    <Plus className="h-3 w-3 mr-1" /> {tAdmin('add')}
                  </Button>
                </div>
                {allergensDeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`allergens_de.${index}`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAllergenDe(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{tAdmin('allergensUk')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendAllergenUk('')}>
                    <Plus className="h-3 w-3 mr-1" /> {tAdmin('add')}
                  </Button>
                </div>
                {allergensUkFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`allergens_uk.${index}`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAllergenUk(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="energy">{tAdmin('energy')}</Label>
                <Input id="energy" {...register('energy')} placeholder="371 kcal" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="protein">{tAdmin('protein')}</Label>
                <Input id="protein" {...register('protein')} placeholder="3.6 g" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="fat">{tAdmin('fat')}</Label>
                <Input id="fat" {...register('fat')} placeholder="26.8 g" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="carbs">{tAdmin('carbs')}</Label>
                <Input id="carbs" {...register('carbs')} placeholder="28.9 g" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs" htmlFor="image_url">{tAdmin('image')}</Label>
              <div className="flex gap-2">
                <Input id="image_url" {...register('image_url')} placeholder="https://..." />
                <Label
                  htmlFor="flavour-image-upload"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm cursor-pointer hover:bg-accent active:bg-accent"
                >
                  <Upload className="h-4 w-4" />
                  {tAdmin('upload')}
                </Label>
                <input
                  id="flavour-image-upload"
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
            </div>

            <DialogFooter className="px-4 py-3 border-t bg-background flex gap-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                <X className="h-4 w-4 mr-1" />
                {tAdmin('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                {editingFlavour ? tAdmin('update') : tAdmin('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

