'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
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
import { Tabs, TabsContent, TabsTrigger, AnimatedTabsList } from '@/components/ui/tabs-animated'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog'
import { Plus, Trash2, Upload, Loader2, Edit, X, Eye } from 'lucide-react'
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
  ingredients_uk: z.string().optional(),
  ingredients_de: z.string().optional(),
  allergens_uk: z.string().optional(),
  allergens_de: z.string().optional(),
  image_url: z.string().optional(),
  images_urls: z.array(z.string()).default([]),
})

type ProductFormData = z.infer<typeof productSchema>
const NO_SUBCATEGORY_VALUE = 'none'

interface Product {
  id: string
  slug: string
  name_uk: string
  name_de: string
  description_uk: string | null
  description_de: string | null
  category: string
  sub_category: string | null
  ingredients_uk: string | null
  ingredients_de: string | null
  allergens_uk: string | null
  allergens_de: string | null
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
  const [activeTab, setActiveTab] = useState<'de' | 'uk'>('de')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const tCatalog = useTranslations('catalog')
  const tAdmin = useTranslations('admin.products')
  const tCommon = useTranslations('admin.common')

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
      ingredients_uk: '',
      ingredients_de: '',
      allergens_uk: '',
      allergens_de: '',
      images_urls: [],
    },
  })

  const {
    fields: imagesUrlsFields,
    remove: removeImageUrl,
  } = useFieldArray({
    control: control as any,
    name: 'images_urls' as any,
  })

  const category = watch('category')
  const selectedSubCategory = watch('sub_category')

  useEffect(() => {
    loadProducts()
  }, [])

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
      toast.error(`Fehler beim Laden der Produkte: ${error.message}`)
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
      toast.success('Bild erfolgreich hochgeladen! URL wurde eingefügt.')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(`Fehler beim Hochladen des Bildes: ${error.message}`)
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
      toast.success(`${urls.length} Bild(er) erfolgreich hochgeladen!`)
    } catch (error: any) {
      console.error('Error uploading images:', error)
      toast.error(`Fehler beim Hochladen der Bilder: ${error.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function openCreateModal() {
    setEditingProduct(null)
    setActiveTab('de')
    reset({
      name_uk: '',
      name_de: '',
      description_uk: '',
      description_de: '',
      category: 'desserts',
      sub_category: null,
      ingredients_uk: '',
      ingredients_de: '',
      allergens_uk: '',
      allergens_de: '',
      image_url: '',
      images_urls: [],
    })
    setIsModalOpen(true)
  }

  function startEdit(product: Product) {
    setEditingProduct(product.id)
    setActiveTab('de')

    setValue('name_uk', product.name_uk)
    setValue('name_de', product.name_de)
    setValue('description_uk', product.description_uk || '')
    setValue('description_de', product.description_de || '')
    setValue('category', product.category as ProductFormData['category'])
    setValue('sub_category', product.sub_category || null)
    setValue('image_url', product.image_url || '')
    setValue('ingredients_uk', product.ingredients_uk || '')
    setValue('ingredients_de', product.ingredients_de || '')
    setValue('allergens_uk', product.allergens_uk || '')
    setValue('allergens_de', product.allergens_de || '')
    setValue('images_urls', product.images_urls || [])
    
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingProduct(null)
    setActiveTab('de')
    reset()
  }

  function handleViewProduct(product: Product) {
    router.push(`/products/${product.slug}`)
  }

  async function onSubmit(data: ProductFormData) {
    try {
      const slug = data.name_de
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const productData = {
        slug,
        ...data,
        sub_category: data.sub_category || null,
        ingredients_uk: data.ingredients_uk?.trim() ? data.ingredients_uk.trim() : null,
        ingredients_de: data.ingredients_de?.trim() ? data.ingredients_de.trim() : null,
        allergens_uk: data.allergens_uk?.trim() ? data.allergens_uk.trim() : null,
        allergens_de: data.allergens_de?.trim() ? data.allergens_de.trim() : null,
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

        toast.success(tAdmin('updateSuccess'))
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
        toast.success(tAdmin('createSuccess'))
      }

      reset()
      closeModal()
      loadProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(`Fehler beim Speichern des Produkts: ${error.message || 'Unbekannter Fehler'}`)
    }
  }

  async function handleDelete(productId: string) {
    setDeletingId(productId)

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (deleteError) throw deleteError

      toast.success(tAdmin('deleteSuccess'))
      loadProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(`Fehler beim Löschen des Produkts: ${error.message || 'Unbekannter Fehler'}`)
    } finally {
      setDeletingId(null)
      setDeleteTargetId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Lade Produkte...</div>
  }

  return (
    <div className="w-full space-y-4">
      {/* Products Table */}
      <TooltipProvider>
        <div className="border rounded-lg overflow-hidden bg-card">
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
                          onClick={() => setDeleteTargetId(product.id)}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tAdmin('image')}</TableHead>
                      <TableHead>{tAdmin('nameDe')}</TableHead>
                      <TableHead>{tAdmin('nameUk')}</TableHead>
                      <TableHead>{tAdmin('category')}</TableHead>
                      <TableHead className="text-right">{tAdmin('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{product.name_de}</TableCell>
                        <TableCell>{product.name_uk}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary">
                            {product.category}
                          </span>
                        </TableCell>
                        <TableCell>
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
                                  onClick={() => setDeleteTargetId(product.id)}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </TooltipProvider>

      <DeleteConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={tCommon('confirmDeleteTitle')}
        description={tAdmin('deleteConfirmDescription')}
        confirmLabel={tCommon('confirmDeleteAction')}
        cancelLabel={tAdmin('cancel')}
        isPending={deletingId !== null}
        onConfirm={() => {
          if (deleteTargetId) void handleDelete(deleteTargetId)
        }}
      />

      {/* Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[90dvh] w-[min(48rem,calc(100vw-2rem))] max-w-3xl flex-col gap-0 rounded-lg p-0">
          <DialogHeader className="flex flex-col gap-1.5 border-b px-4 pb-3 pt-4 text-center text-primary sm:text-left">
            <DialogTitle className="text-base text-primary">
              {editingProduct ? tAdmin('editProduct') : tAdmin('createProduct')}
            </DialogTitle>
            <DialogDescription className="text-xs text-primary/90">
              {editingProduct ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 text-primary [&_input]:text-base [&_label]:text-primary [&_input:not([type=file])]:bg-card [&_textarea]:bg-card">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'de' | 'uk')} className="w-full">
                <AnimatedTabsList value={activeTab} className="grid w-full grid-cols-2 touch-manipulation">
                  <TabsTrigger value="de" className="min-h-11 gap-1.5">
                    <span aria-hidden>🇩🇪</span>
                    Deutsch
                  </TabsTrigger>
                  <TabsTrigger value="uk" className="min-h-11 gap-1.5">
                    <span aria-hidden>🇺🇦</span>
                    Ukrainisch
                  </TabsTrigger>
                </AnimatedTabsList>

                <TabsContent value="de" className="mt-3 space-y-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="name_de">{tAdmin('nameDeLabel')}</Label>
                    <Input id="name_de" {...register('name_de')} />
                    {errors.name_de && <p className="text-xs text-destructive">{errors.name_de.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="description_de">{tAdmin('descriptionDe')}</Label>
                    <Textarea id="description_de" rows={4} {...register('description_de')} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="ingredients_de">{tAdmin('ingredientsDe')}</Label>
                    <Textarea
                      id="ingredients_de"
                      rows={4}
                      {...register('ingredients_de')}
                      placeholder={tAdmin('ingredientsPlaceholder')}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="allergens_de">{tAdmin('allergensDe')}</Label>
                    <Textarea
                      id="allergens_de"
                      rows={4}
                      {...register('allergens_de')}
                      placeholder={tAdmin('allergensPlaceholder')}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="uk" className="mt-3 space-y-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="name_uk">{tAdmin('nameUkLabel')}</Label>
                    <Input id="name_uk" {...register('name_uk')} />
                    {errors.name_uk && <p className="text-xs text-destructive">{errors.name_uk.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="description_uk">{tAdmin('descriptionUk')}</Label>
                    <Textarea id="description_uk" rows={4} {...register('description_uk')} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="ingredients_uk">{tAdmin('ingredientsUk')}</Label>
                    <Textarea
                      id="ingredients_uk"
                      rows={4}
                      {...register('ingredients_uk')}
                      placeholder={tAdmin('ingredientsPlaceholder')}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs" htmlFor="allergens_uk">{tAdmin('allergensUk')}</Label>
                    <Textarea
                      id="allergens_uk"
                      rows={4}
                      {...register('allergens_uk')}
                      placeholder={tAdmin('allergensPlaceholder')}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-3 border-t pt-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">{tAdmin('categoryLabel')}</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setValue('category', value as ProductFormData['category'])
                      if (!hasSubcategories(value)) {
                        setValue('sub_category', null)
                      }
                    }}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desserts">Desserts</SelectItem>
                      <SelectItem value="cookies">Cookies</SelectItem>
                      <SelectItem value="macarons">Macarons</SelectItem>
                      <SelectItem value="cheesecakes">Cheesecakes</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                </div>

                {hasSubcategories(category) && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">{tAdmin('subCategoryLabel')}</Label>
                    <Select
                      value={selectedSubCategory || NO_SUBCATEGORY_VALUE}
                      onValueChange={(value) => setValue('sub_category', value === NO_SUBCATEGORY_VALUE ? null : value)}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Unterkategorie auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SUBCATEGORY_VALUE}>{tAdmin('noSubCategory')}</SelectItem>
                        {getSubcategoriesForCategory(category).map((subcategory) => {
                          const translationKey = `subcategories.${category}.${subcategory.translationKey}` as const
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

                <div className="flex flex-col gap-1">
                  <Label className="text-xs" htmlFor="image_url">{tAdmin('mainImage')}</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <Input
                      id="image_url"
                      className="min-h-11 w-full sm:min-h-10 sm:flex-1"
                      {...register('image_url')}
                      placeholder={tAdmin('imageUrlPlaceholder')}
                    />
                    <Label
                      htmlFor="product-image-upload"
                      className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-2 text-sm touch-manipulation hover:bg-accent active:bg-accent sm:min-h-10 sm:shrink-0"
                    >
                      <Upload className="h-4 w-4" />
                      {tAdmin('upload')}
                    </Label>
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <p className="flex items-center gap-2 text-xs text-primary/80">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {tAdmin('uploading')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="text-xs">{tAdmin('additionalImages')}</Label>
                    <label
                      htmlFor="product-additional-images-upload"
                      className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent active:bg-accent sm:min-h-10 sm:w-auto"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {tAdmin('addMoreImages')}
                    </label>
                    <input
                      id="product-additional-images-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAdditionalImageUpload}
                      disabled={uploading}
                    />
                  </div>

                  {imagesUrlsFields.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imagesUrlsFields.map((field, index) => {
                        const url = watch(`images_urls.${index}`)
                        return (
                          <div key={field.id} className="relative group">
                            <div className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-muted">
                              {url && (
                                <Image
                                  src={normalizeSupabaseImageUrl(url)}
                                  alt={`Additional image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImageUrl(index)}
                              className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t px-4 py-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                {tAdmin('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tAdmin('saving')}
                  </>
                ) : (
                  editingProduct ? tAdmin('update') : tAdmin('save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
