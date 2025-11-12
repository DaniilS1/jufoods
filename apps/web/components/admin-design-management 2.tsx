'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Trash2, Upload, Loader2, Edit, X, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { useTranslations } from 'next-intl'

const designSchema = z.object({
  name_uk: z.string().min(1, 'Ukrainischer Name ist erforderlich'),
  name_de: z.string().min(1, 'Deutscher Name ist erforderlich'),
  image_url: z.string().optional(),
})

type DesignFormData = z.infer<typeof designSchema>

interface Design {
  id: string
  name_uk: string
  name_de: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export function AdminDesignManagement() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingDesign, setEditingDesign] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()
  const tAdmin = useTranslations('admin.designs')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DesignFormData>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      name_uk: '',
      name_de: '',
      image_url: '',
    },
  })

  useEffect(() => {
    loadDesigns()
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

  async function loadDesigns() {
    try {
      const { data, error } = await supabase.from('designs').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setDesigns(data || [])
    } catch (error: any) {
      console.error('Error loading designs:', error)
      setError(`Fehler beim Laden der Designs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function uploadImage(file: File, folder: string = 'designs'): Promise<string> {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_')
    const fileName = `${Date.now()}_${sanitizedName}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('bilder').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) throw uploadError

    const {
      data: { publicUrl },
    } = supabase.storage.from('bilder').getPublicUrl(filePath)

    const publicUrlPattern = /\/storage\/v1\/object\/public\//
    if (publicUrlPattern.test(publicUrl)) {
      return publicUrl
    }

    const signedUrlPattern = /\/storage\/v1\/object\/sign\/(.+?)\?/
    const match = publicUrl.match(signedUrlPattern)
    if (match) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      return `${supabaseUrl}/storage/v1/object/public/bilder/${match[1].replace('bilder/', '')}`
    }

    return publicUrl
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImage(file, 'designs')
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

  function openCreateModal() {
    setEditingDesign(null)
    reset()
    setIsModalOpen(true)
  }

  function startEdit(design: Design) {
    setEditingDesign(design.id)
    setError(null)
    setSuccess(null)
    
    setValue('name_uk', design.name_uk)
    setValue('name_de', design.name_de)
    setValue('image_url', design.image_url || '')
    
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingDesign(null)
    reset()
    setError(null)
    setSuccess(null)
  }

  async function onSubmit(data: DesignFormData) {
    setError(null)
    setSuccess(null)
    
    try {
      const designData = {
        name_uk: data.name_uk,
        name_de: data.name_de,
        image_url: data.image_url || null,
      }

      if (editingDesign) {
        const { error: updateError } = await supabase
          .from('designs')
          .update(designData)
          .eq('id', editingDesign)

        if (updateError) throw updateError

        setSuccess('Design erfolgreich aktualisiert!')
      } else {
        const { error: insertError } = await supabase.from('designs').insert(designData)

        if (insertError) throw insertError

        setSuccess('Design erfolgreich erstellt!')
      }

      reset()
      closeModal()
      loadDesigns()
    } catch (error: any) {
      console.error('Error saving design:', error)
      setError(`Fehler beim Speichern des Designs: ${error.message || 'Unbekannter Fehler'}`)
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
      const { error: deleteError } = await supabase
        .from('designs')
        .delete()
        .eq('id', designId)

      if (deleteError) throw deleteError

      setSuccess('Design erfolgreich gelöscht!')
      loadDesigns()
    } catch (error: any) {
      console.error('Error deleting design:', error)
      setError(`Fehler beim Löschen des Designs: ${error.message || 'Unbekannter Fehler'}`)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12">{tAdmin('loadingDesigns')}</div>
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
            className="ml-auto h-6 w-6"
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
            className="ml-auto h-6 w-6"
            onClick={() => setSuccess(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Designs Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-transparent">
          <h2 className="text-lg font-semibold">{tAdmin('title')}</h2>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin('newDesign')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-transparent">
                <th className="text-left p-4 font-medium">{tAdmin('image')}</th>
                <th className="text-left p-4 font-medium">{tAdmin('nameDe')}</th>
                <th className="text-left p-4 font-medium">{tAdmin('nameUk')}</th>
                <th className="text-right p-4 font-medium">{tAdmin('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => (
                <tr key={design.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    {design.image_url ? (
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={normalizeSupabaseImageUrl(design.image_url)}
                          alt={design.name_de}
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
                  <td className="p-4">{design.name_de}</td>
                  <td className="p-4">{design.name_uk}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(design)}
                        title={tAdmin('edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(design.id)}
                        disabled={deletingId === design.id}
                        title={tAdmin('delete')}
                      >
                        {deletingId === design.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {designs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {tAdmin('noDesigns')}
            </div>
          )}
        </div>
      </div>

      {/* Design Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDesign ? tAdmin('editDesign') : tAdmin('createDesign')}
            </DialogTitle>
            <DialogDescription>
              {editingDesign ? tAdmin('formDescriptionEdit') : tAdmin('formDescriptionCreate')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_de">Name (Deutsch) *</Label>
              <Input id="name_de" {...register('name_de')} />
              {errors.name_de && (
                <p className="text-sm text-destructive">{errors.name_de.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_uk">Name (Ukrainisch) *</Label>
              <Input id="name_uk" {...register('name_uk')} />
              {errors.name_uk && (
                <p className="text-sm text-destructive">{errors.name_uk.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Bild</Label>
              <div className="flex items-center gap-4">
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
                <p className="text-sm text-muted-foreground">Bild wird hochgeladen...</p>
              )}
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
                  editingDesign ? 'Design aktualisieren' : 'Design erstellen'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


