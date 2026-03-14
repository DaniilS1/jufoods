'use client'

import { useState, useEffect } from 'react'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Upload, Loader2, Edit, X, Check, AlertCircle, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getSubcategoriesForCategory, hasSubcategories } from '@/lib/subcategory-config'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

const productSchema = z.object({
  name_uk: z.string().min(1, 'Ukrainischer Name ist erforderlich'),
  name_de: z.string().min(1, 'Deutscher Name ist erforderlich'),
  description_uk: z.string().optional(),
  description_de: z.string().optional(),
  category: z.enum(['desserts', 'cookies', 'macarons', 'cheesecakes']),
  sub_category: z.string().optional().nullable(),
  ingredients_uk: z.array(z.string()).default([]),
  ingredients_de: z.array(z.string()).default([]),
  allergens_uk: z.array(z.string()).default([]),
  allergens_de: z.array(z.string()).default([]),
  image_url: z.string().optional(),
  images_urls: z.array(z.string()).default([]),
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id: string
  slug: string
  name_uk: string
  name_de: string
  description_uk: string | null
  description_de: string | null
  category: string
  sub_category: string | null
  ingredients_uk: string[] | null
  ingredients_de: string[] | null
  allergens_uk: string[] | null
  allergens_de: string[] | null
  available_designs: any
  image_url: string | null
  images_urls: string[] | null
  created_at: string
}

export function AdminProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const tCatalog = useTranslations('catalog')
  const tAdmin = useTranslations('admin.products')

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: 'desserts',
      sub_category: null,
      ingredients_uk: [],
      ingredients_de: [],
      allergens_uk: [],
      allergens_de: [],
      images_urls: [],
    },
  })

  // Type inference issue with zod schema and useFieldArray - using any as workaround
  const {
    fields: ingredientsUkFields,
    append: appendIngredientUk,
    remove: removeIngredientUk,
  } = useFieldArray({
    control: control as any,
    name: 'ingredients_uk' as any,
  })

  const {
    fields: ingredientsDeFields,
    append: appendIngredientDe,
    remove: removeIngredientDe,
  } = useFieldArray({
    control: control as any,
    name: 'ingredients_de' as any,
  })

  const {
    fields: allergensUkFields,
    append: appendAllergenUk,
    remove: removeAllergenUk,
  } = useFieldArray({
    control: control as any,
    name: 'allergens_uk' as any,
  })

  const {
    fields: allergensDeFields,
    append: appendAllergenDe,
    remove: removeAllergenDe,
  } = useFieldArray({
    control: control as any,
    name: 'allergens_de' as any,
  })

  const {
    fields: imagesUrlsFields,
    append: appendImageUrl,
    remove: removeImageUrl,
  } = useFieldArray({
    control: control as any,
    name: 'images_urls' as any,
  })

  const category = watch('category')

  useEffect(() => {
    loadProducts()
  }, [])

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('category', 'torten')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error loading products:', error)
      setError(`Fehler beim Laden der Produkte: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function uploadImage(file: File, folder: string = 'products'): Promise<string> {
    // Use API route to upload file (bypasses RLS with service role key)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.url
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImage(file, 'products')
      setValue('image_url', url)
      setSuccess('Bild erfolgreich hochgeladen! URL wurde eingefügt.')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      setError(`Fehler beim Hochladen des Bildes: ${error.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleAdditionalImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadImage(file, 'products')
      )
      const urls = await Promise.all(uploadPromises)
      const currentImages = watch('images_urls') || []
      setValue('images_urls', [...currentImages, ...urls])
      setSuccess(`${urls.length} Bild(er) erfolgreich hochgeladen!`)
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setError(`Fehler beim Hochladen der Bilder: ${error.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function openCreateModal() {
    setEditingProduct(null)
    reset()
    setIsModalOpen(true)
  }

  function startEdit(product: Product) {
    setEditingProduct(product.id)
    setError(null)
    setSuccess(null)
    
    setValue('name_uk', product.name_uk)
    setValue('name_de', product.name_de)
    setValue('description_uk', product.description_uk || '')
    setValue('description_de', product.description_de || '')
    setValue('category', product.category as ProductFormData['category'])
    setValue('sub_category', product.sub_category || null)
    setValue('image_url', product.image_url || '')
    setValue('ingredients_uk', product.ingredients_uk || [])
    setValue('ingredients_de', product.ingredients_de || [])
    setValue('allergens_uk', product.allergens_uk || [])
    setValue('allergens_de', product.allergens_de || [])
    setValue('images_urls', product.images_urls || [])
    
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingProduct(null)
    reset()
    setError(null)
    setSuccess(null)
  }

  function handleViewProduct(product: Product) {
    router.push(`/products/${product.slug}`)
  }

  async function onSubmit(data: ProductFormData) {
    setError(null)
    setSuccess(null)
    
    try {
      const slug = data.name_de
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const productData = {
        slug,
        ...data,
        sub_category: data.sub_category || null,
        ingredients_uk: data.ingredients_uk.filter((i) => i.trim() !== ''),
        ingredients_de: data.ingredients_de.filter((i) => i.trim() !== ''),
        allergens_uk: data.allergens_uk.filter((a) => a.trim() !== ''),
        allergens_de: data.allergens_de.filter((a) => a.trim() !== ''),
        images_urls: data.images_urls.filter((url) => url.trim() !== ''),
        available_designs: [], // Empty array since we removed the design field from the form
      }

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct)

        if (updateError) {
          console.error('Update error details:', updateError)
          throw updateError
        }

        setSuccess('Produkt erfolgreich aktualisiert!')
      } else {
        const { error: insertError, data: insertedData } = await supabase
          .from('products')
          .insert(productData)
          .select()

        if (insertError) {
          console.error('Insert error details:', insertError)
          console.error('Product data being inserted:', productData)
          throw insertError
        }

        console.log('Product created successfully:', insertedData)
        setSuccess('Produkt erfolgreich erstellt!')
      }

      reset()
      closeModal()
      loadProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      setError(`Fehler beim Speichern des Produkts: ${error.message || 'Unbekannter Fehler'}`)
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Möchten Sie dieses Produkt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    setDeletingId(productId)
    setError(null)
    setSuccess(null)

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (deleteError) throw deleteError

      setSuccess('Produkt erfolgreich gelöscht!')
      loadProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      setError(`Fehler beim Löschen des Produkts: ${error.message || 'Unbekannter Fehler'}`)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Lade Produkte...</div>
  }

  return (
    <div className="w-full space-y-4">
      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-9 w-9 shrink-0"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          <Check className="h-5 w-5 shrink-0" />
          <p className="text-sm">{success}</p>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-9 w-9 shrink-0"
            onClick={() => setSuccess(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Products Table */}
      <TooltipProvider>
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between p-4 border-b bg-transparent">
          <h2 className="text-lg font-semibold">{tAdmin('title')}</h2>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tAdmin('newProduct')}</span>
          </Button>
        </div>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {tAdmin('noProducts')}
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {products.map((product) => (
                  <div key={product.id} className="flex gap-3 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {product.image_url ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={normalizeSupabaseImageUrl(product.image_url)}
                            alt={product.name_de}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          {tAdmin('noImage')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name_de}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{product.name_uk}</p>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary mt-1">
                        {product.category}
                      </span>
                      <div className="flex justify-end gap-1 pt-2 mt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewProduct(product)}
                          aria-label={tAdmin('view')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(product)}
                          aria-label={tAdmin('edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          aria-label={tAdmin('delete')}
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-transparent">
                      <th className="text-left p-4 font-medium">{tAdmin('image')}</th>
                      <th className="text-left p-4 font-medium">{tAdmin('nameDe')}</th>
                      <th className="text-left p-4 font-medium">{tAdmin('nameUk')}</th>
                      <th className="text-left p-4 font-medium">{tAdmin('category')}</th>
                      <th className="text-right p-4 font-medium">{tAdmin('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          {product.image_url ? (
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                              <Image
                                src={normalizeSupabaseImageUrl(product.image_url)}
                                alt={product.name_de}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              {tAdmin('noImage')}
                            </div>
                          )}
                        </td>
                        <td className="p-4">{product.name_de}</td>
                        <td className="p-4">{product.name_uk}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewProduct(product)}
                                  aria-label={tAdmin('view')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{tAdmin('view')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEdit(product)}
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
                                  onClick={() => handleDelete(product.id)}
                                  disabled={deletingId === product.id}
                                  aria-label={tAdmin('delete')}
                                >
                                  {deletingId === product.id ? (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </TooltipProvider>

      {/* Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">
              {editingProduct ? tAdmin('editProduct') : tAdmin('createProduct')}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingProduct ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="de" className="w-full">
              <TabsList>
                <TabsTrigger value="de">Deutsch</TabsTrigger>
                <TabsTrigger value="uk">Ukrainisch</TabsTrigger>
        </TabsList>

              <TabsContent value="de" className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="name_de">Name (Deutsch) *</Label>
                  <Input id="name_de" {...register('name_de')} />
                  {errors.name_de && (
                    <p className="text-xs text-destructive">{errors.name_de.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="description_de">Beschreibung (Deutsch)</Label>
                  <Textarea id="description_de" {...register('description_de')} rows={2} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Zutaten (Deutsch)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendIngredientDe('')}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Hinzufügen
                    </Button>
                  </div>
                  {ingredientsDeFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input {...register(`ingredients_de.${index}`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredientDe(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Allergene (Deutsch)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendAllergenDe('')}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Hinzufügen
                    </Button>
                  </div>
                  {allergensDeFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input {...register(`allergens_de.${index}`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAllergenDe(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                  </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="uk" className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="name_uk">Name (Ukrainisch) *</Label>
                  <Input id="name_uk" {...register('name_uk')} />
                  {errors.name_uk && (
                    <p className="text-xs text-destructive">{errors.name_uk.message}</p>
                )}
              </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="description_uk">Beschreibung (Ukrainisch)</Label>
                  <Textarea id="description_uk" {...register('description_uk')} rows={2} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Zutaten (Ukrainisch)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendIngredientUk('')}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Hinzufügen
                    </Button>
                  </div>
                  {ingredientsUkFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input {...register(`ingredients_uk.${index}`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredientUk(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Allergene (Ukrainisch)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendAllergenUk('')}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Hinzufügen
                    </Button>
                  </div>
                  {allergensUkFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input {...register(`allergens_uk.${index}`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAllergenUk(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Common Fields */}
            <div className="space-y-3 pt-3 border-t">
                <div className="space-y-1">
                  <Label className="text-xs">Kategorie *</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setValue('category', value as ProductFormData['category'])
                      if (!hasSubcategories(value)) {
                        setValue('sub_category', null)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desserts">Desserts</SelectItem>
                      <SelectItem value="cookies">Cookies</SelectItem>
                      <SelectItem value="macarons">Macarons</SelectItem>
                      <SelectItem value="cheesecakes">Cheesecakes</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                  )}
                </div>

                {hasSubcategories(category) && (
                  <div className="space-y-1">
                    <Label className="text-xs">Unterkategorie</Label>
                    <Select
                      value={watch('sub_category') || undefined}
                      onValueChange={(value) =>
                        setValue('sub_category', value || null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unterkategorie auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubcategoriesForCategory(category).map((subcategory) => {
                          const translationKey = `subcategories.${category}.${subcategory.translationKey}`
                          const displayName = tCatalog(translationKey) || subcategory.id
                          return (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                              {displayName}
                          </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Hauptbild (image_url)</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    <Input
                      type="text"
                      placeholder="oder Bild-URL eingeben"
                      {...register('image_url')}
                      className="flex-1"
                    />
                  </div>
                  {uploading && (
                  <p className="text-xs text-muted-foreground">Bild wird hochgeladen...</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Zusätzliche Bilder (images_urls)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="additional-images-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('additional-images-input')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-1" /> Bilder hochladen
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {imagesUrlsFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          {...register(`images_urls.${index}`)}
                          placeholder="Bild-URL"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImageUrl(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Abbrechen
                    </Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichere...
                    </>
                  ) : (
                    editingProduct ? 'Produkt aktualisieren' : 'Produkt erstellen'
                  )}
                </Button>
            </DialogFooter>
              </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
