'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger, AnimatedTabsList } from '@/components/ui/tabs-animated'

const LABELS_DE = {
  flavourNumber: 'Nummer',
  image: 'Bild',
}
const LABELS_UK = {
  flavourNumber: 'Номер',
  image: 'Зображення',
}

const flavourSchema = z.object({
  name_uk: z.string().min(1, 'Українська назва обов’язкова'),
  name_de: z.string().min(1, 'Deutscher Name ist erforderlich'),
  description_uk: z.string().optional(),
  description_de: z.string().optional(),
  ingredients_uk: z.array(z.string()).default([]),
  ingredients_de: z.array(z.string()).default([]),
  allergens_uk: z.array(z.string()).default([]),
  allergens_de: z.array(z.string()).default([]),
  nutrition_text_de: z.string().optional(),
  nutrition_text_uk: z.string().optional(),
  image_url: z.string().optional(),
  flavour_number: z.coerce.number().int().min(1, 'Nummer ist erforderlich (ganze Zahl ≥ 1)'),
})

type FlavourFormData = z.infer<typeof flavourSchema>

interface FlavourRecord {
  id: string
  slug: string
  flavour_number: number
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
  const [activeTab, setActiveTab] = useState<'de' | 'uk'>('de')

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
      flavour_number: undefined as number | undefined,
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      ingredients_uk: [],
      ingredients_de: [],
      allergens_uk: [],
      allergens_de: [],
      nutrition_text_de: '',
      nutrition_text_uk: '',
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
        .order('flavour_number', { ascending: true })
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
      flavour_number: undefined as number | undefined,
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      ingredients_uk: [],
      ingredients_de: [],
      allergens_uk: [],
      allergens_de: [],
      nutrition_text_de: '',
      nutrition_text_uk: '',
      image_url: '',
    })
    setIsModalOpen(true)
  }

  function nutritionFromRecord(nutrition: Record<string, unknown> | null): { text_de: string; text_uk: string } {
    if (!nutrition) return { text_de: '', text_uk: '' }
    const text_de =
      typeof nutrition.text_de === 'string'
        ? nutrition.text_de
        : typeof nutrition.text === 'string'
          ? nutrition.text
          : ''
    const text_uk = typeof nutrition.text_uk === 'string' ? nutrition.text_uk : ''
    return { text_de, text_uk }
  }

  function startEdit(flavour: FlavourRecord) {
    setEditingFlavour(flavour)
    const { text_de: nutritionTextDe, text_uk: nutritionTextUk } = nutritionFromRecord(flavour.nutrition)
    reset({
      flavour_number: flavour.flavour_number,
      name_uk: flavour.name_uk,
      name_de: flavour.name_de,
      description_uk: flavour.description_uk || '',
      description_de: flavour.description_de || '',
      ingredients_uk: flavour.ingredients_uk || [],
      ingredients_de: flavour.ingredients_de || [],
      allergens_uk: flavour.allergens_uk || [],
      allergens_de: flavour.allergens_de || [],
      nutrition_text_de: nutritionTextDe,
      nutrition_text_uk: nutritionTextUk,
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
      const text_de = data.nutrition_text_de?.trim() || null
      const text_uk = data.nutrition_text_uk?.trim() || null
      const nutrition = text_de !== null || text_uk !== null ? { text_de, text_uk } : null

      const payload = {
        slug,
        flavour_number: data.flavour_number,
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
        const { data: newFlavour, error: insertError } = await supabase
          .from('torten_flavours')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        if (newFlavour?.id) {
          const { data: designs } = await supabase
            .from('torten_designs')
            .select('id')
            .eq('classic', false)
          if (designs?.length) {
            await supabase.from('design_flavour').insert(
              designs.map((d) => ({ design_id: d.id, flavour_id: newFlavour.id }))
            )
          }
        }
      }

      setSuccess(editingFlavour ? tAdmin('updateSuccess') : tAdmin('createSuccess'))
      closeModal()
      await loadFlavours()
    } catch (err: any) {
      console.error('Error saving flavour:', err)
      const msg =
        err?.code === '23505'
          ? 'Diese Nummer wird bereits verwendet. Bitte eine andere Nummer wählen.'
          : `Fehler beim Speichern: ${err.message || 'Unbekannter Fehler'}`
      setError(msg)
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
                      <p className="text-xs text-muted-foreground font-medium">Nr. {flavour.flavour_number}</p>
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
                    <th className="px-4 py-3 text-left font-semibold">{tAdmin('flavourNumber')}</th>
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
                        <td className="px-4 py-3 font-medium text-foreground">{flavour.flavour_number}</td>
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
        <DialogContent className="flex max-h-[90dvh] w-[min(48rem,calc(100vw-2rem))] max-w-3xl flex-col gap-0 rounded-lg p-0">
          <DialogHeader className="flex flex-col gap-1.5 border-b px-4 pb-3 pt-4 text-center text-[#735959] sm:text-left">
            <DialogTitle className="text-base text-[#735959]">
              {editingFlavour ? tAdmin('editFlavour') : tAdmin('createFlavour')}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#735959]/90">
              {editingFlavour ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 text-[#735959] [&_input]:text-base [&_label]:text-[#735959]">
              <div className="flex flex-col gap-1">
                <Label className="text-xs" htmlFor="flavour_number">
                  {activeTab === 'de' ? LABELS_DE.flavourNumber : LABELS_UK.flavourNumber}
                </Label>
                <Input
                  id="flavour_number"
                  type="number"
                  min={1}
                  {...register('flavour_number')}
                />
                {errors.flavour_number && (
                  <p className="text-xs text-destructive">{errors.flavour_number.message}</p>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'de' | 'uk')} className="w-full">
                <AnimatedTabsList value={activeTab} className="grid w-full grid-cols-2 touch-manipulation">
                  <TabsTrigger value="de" className="min-h-11 gap-1.5">
                    <span aria-hidden>🇩🇪</span>
                    Deutsch
                  </TabsTrigger>
                  <TabsTrigger value="uk" className="min-h-11 gap-1.5">
                    <span aria-hidden>🇺🇦</span>
                    Українська
                  </TabsTrigger>
                </AnimatedTabsList>
                <TabsContent value="de" className="mt-3 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="name_de">Name</Label>
                    <Input id="name_de" {...register('name_de')} />
                    {errors.name_de && <p className="text-xs text-destructive">{errors.name_de.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="description_de">
                      Beschreibung
                    </Label>
                    <RichTextEditor
                      value={watch('description_de') || ''}
                      onChange={(html) => setValue('description_de', html)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label className="text-xs">Zutaten</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendIngredientDe('')}>
                        <Plus className="h-3 w-3 mr-1" /> Hinzufügen
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
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label className="text-xs">Allergene</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendAllergenDe('')}>
                        <Plus className="h-3 w-3 mr-1" /> Hinzufügen
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
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="nutrition_text_de">Nährwertdeklaration</Label>
                    <RichTextEditor
                      value={watch('nutrition_text_de') || ''}
                      onChange={(html) => setValue('nutrition_text_de', html)}
                      placeholder="Nährwertdeklaration pro 100 g – z. B. Listen mit Aufzählungen anlegen"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="uk" className="mt-3 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="name_uk">Назва</Label>
                    <Input id="name_uk" {...register('name_uk')} />
                    {errors.name_uk && <p className="text-xs text-destructive">{errors.name_uk.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="description_uk">Опис</Label>
                    <RichTextEditor
                      value={watch('description_uk') || ''}
                      onChange={(html) => setValue('description_uk', html)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label className="text-xs">Інгредієнти</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendIngredientUk('')}>
                        <Plus className="h-3 w-3 mr-1" /> Додати
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
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label className="text-xs">Алергени</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendAllergenUk('')}>
                        <Plus className="h-3 w-3 mr-1" /> Додати
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
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="nutrition_text_uk">Харчова цінність</Label>
                    <RichTextEditor
                      value={watch('nutrition_text_uk') || ''}
                      onChange={(html) => setValue('nutrition_text_uk', html)}
                      placeholder="Харчова цінність на 100 г – можна додати списки"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col gap-1 border-t pt-2">
                <Label className="text-xs" htmlFor="image_url">
                  {activeTab === 'de' ? LABELS_DE.image : LABELS_UK.image}
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input
                    id="image_url"
                    className="min-h-11 w-full sm:min-h-10 sm:flex-1"
                    {...register('image_url')}
                    placeholder="https://..."
                  />
                  <Label
                    htmlFor="flavour-image-upload"
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm touch-manipulation hover:bg-accent active:bg-accent sm:min-h-10 sm:shrink-0"
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
                  <p className="flex items-center gap-2 text-xs text-[#735959]/80">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {tAdmin('uploading')}
                  </p>
                )}
                {errors.image_url && <p className="text-sm text-destructive">{errors.image_url.message}</p>}
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full touch-manipulation sm:w-auto" onClick={closeModal}>
                <X className="mr-1 h-4 w-4" />
                {tAdmin('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full touch-manipulation sm:w-auto">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                {editingFlavour ? tAdmin('update') : tAdmin('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

