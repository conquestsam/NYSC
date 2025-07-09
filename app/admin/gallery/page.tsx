'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  Calendar,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { supabase, PhotoGallery } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function GalleryManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoGallery[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGallery | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    event_tag: '',
    upload_date: new Date().toISOString().split('T')[0],
    is_active: true
  })

  const eventTags = [
    'CDS', 'POP', 'SAED', 'Orientation', 'Community Service', 
    'Health Outreach', 'Education', 'Environment', 'Sports', 
    'Cultural', 'Training', 'Workshop', 'Meeting', 'Ceremony'
  ]

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchPhotos()
    }
  }, [profile])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_gallery')
        .select('*')
        .order('upload_date', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
      toast.error('Failed to fetch photos')
    } finally {
      setLoadingData(false)
    }
  }

  const createPhoto = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_gallery')
        .insert([{
          ...formData,
          uploaded_by: profile?.id
        }])
        .select()

      if (error) throw error
      
      setPhotos([data[0], ...photos])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Photo added successfully')
    } catch (error) {
      console.error('Error creating photo:', error)
      toast.error('Failed to add photo')
    }
  }

  const updatePhoto = async () => {
    if (!selectedPhoto) return

    try {
      const { data, error } = await supabase
        .from('photo_gallery')
        .update(formData)
        .eq('id', selectedPhoto.id)
        .select()

      if (error) throw error
      
      setPhotos(photos.map(photo => 
        photo.id === selectedPhoto.id ? data[0] : photo
      ))
      setIsEditDialogOpen(false)
      setSelectedPhoto(null)
      resetForm()
      toast.success('Photo updated successfully')
    } catch (error) {
      console.error('Error updating photo:', error)
      toast.error('Failed to update photo')
    }
  }

  const deletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photo_gallery')
        .delete()
        .eq('id', photoId)

      if (error) throw error
      
      setPhotos(photos.filter(photo => photo.id !== photoId))
      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  }

  const togglePhotoStatus = async (photoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('photo_gallery')
        .update({ is_active: !isActive })
        .eq('id', photoId)

      if (error) throw error
      
      setPhotos(photos.map(photo => 
        photo.id === photoId ? { ...photo, is_active: !isActive } : photo
      ))
      toast.success(`Photo ${!isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating photo status:', error)
      toast.error('Failed to update photo status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      event_tag: '',
      upload_date: new Date().toISOString().split('T')[0],
      is_active: true
    })
  }

  const openEditDialog = (photo: PhotoGallery) => {
    setSelectedPhoto(photo)
    setFormData({
      title: photo.title,
      description: photo.description || '',
      image_url: photo.image_url,
      event_tag: photo.event_tag,
      upload_date: photo.upload_date,
      is_active: photo.is_active
    })
    setIsEditDialogOpen(true)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Photo Gallery Management</h1>
              <p className="text-gray-600 mt-2">Manage photos and organize them by event tags</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Photo</DialogTitle>
                  <DialogDescription>
                    Add a new photo to the gallery
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter photo title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter photo description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_tag">Event Tag</Label>
                    <select
                      id="event_tag"
                      value={formData.event_tag}
                      onChange={(e) => setFormData({ ...formData, event_tag: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select event tag</option>
                      {eventTags.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload_date">Upload Date</Label>
                    <Input
                      id="upload_date"
                      type="date"
                      value={formData.upload_date}
                      onChange={(e) => setFormData({ ...formData, upload_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPhoto}>Add Photo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>Manage photos organized by event tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Event Tag</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photos.map((photo) => (
                    <TableRow key={photo.id}>
                      <TableCell>
                        <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          <img
                            src={photo.image_url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{photo.title}</p>
                          {photo.description && (
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {photo.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          <Tag className="h-3 w-3 mr-1" />
                          {photo.event_tag}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(photo.upload_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {photo.is_active ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={photo.is_active ? 'text-green-600' : 'text-gray-400'}>
                            {photo.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePhotoStatus(photo.id, photo.is_active)}
                          >
                            {photo.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(photo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePhoto(photo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Photo</DialogTitle>
              <DialogDescription>
                Update the photo information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter photo title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description (Optional)</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter photo description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_image_url">Image URL</Label>
                <Input
                  id="edit_image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_event_tag">Event Tag</Label>
                <select
                  id="edit_event_tag"
                  value={formData.event_tag}
                  onChange={(e) => setFormData({ ...formData, event_tag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select event tag</option>
                  {eventTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_upload_date">Upload Date</Label>
                <Input
                  id="edit_upload_date"
                  type="date"
                  value={formData.upload_date}
                  onChange={(e) => setFormData({ ...formData, upload_date: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updatePhoto}>Update Photo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}