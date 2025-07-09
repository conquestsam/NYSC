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
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { supabase, HeroSlide } from '@/lib/supabase'
import { toast } from 'sonner'

export default function HeroSlidesManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSlide, setSelectedSlide] = useState<HeroSlide | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchSlides()
    }
  }, [profile])

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setSlides(data || [])
    } catch (error) {
      console.error('Error fetching hero slides:', error)
      toast.error('Failed to fetch hero slides')
    } finally {
      setLoadingData(false)
    }
  }

  const createSlide = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .insert([formData])
        .select()

      if (error) throw error
      
      setSlides([...slides, data[0]])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Hero slide created successfully')
    } catch (error) {
      console.error('Error creating hero slide:', error)
      toast.error('Failed to create hero slide')
    }
  }

  const updateSlide = async () => {
    if (!selectedSlide) return

    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .update(formData)
        .eq('id', selectedSlide.id)
        .select()

      if (error) throw error
      
      setSlides(slides.map(slide => 
        slide.id === selectedSlide.id ? data[0] : slide
      ))
      setIsEditDialogOpen(false)
      setSelectedSlide(null)
      resetForm()
      toast.success('Hero slide updated successfully')
    } catch (error) {
      console.error('Error updating hero slide:', error)
      toast.error('Failed to update hero slide')
    }
  }

  const deleteSlide = async (slideId: string) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slideId)

      if (error) throw error
      
      setSlides(slides.filter(slide => slide.id !== slideId))
      toast.success('Hero slide deleted successfully')
    } catch (error) {
      console.error('Error deleting hero slide:', error)
      toast.error('Failed to delete hero slide')
    }
  }

  const toggleSlideStatus = async (slideId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !isActive })
        .eq('id', slideId)

      if (error) throw error
      
      setSlides(slides.map(slide => 
        slide.id === slideId ? { ...slide, is_active: !isActive } : slide
      ))
      toast.success(`Hero slide ${!isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating hero slide status:', error)
      toast.error('Failed to update hero slide status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      display_order: slides.length,
      is_active: true
    })
  }

  const openEditDialog = (slide: HeroSlide) => {
    setSelectedSlide(slide)
    setFormData({
      title: slide.title,
      description: slide.description || '',
      image_url: slide.image_url,
      display_order: slide.display_order,
      is_active: slide.is_active
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
              <h1 className="text-3xl font-bold text-gray-900">Hero Slides Management</h1>
              <p className="text-gray-600 mt-2">Manage homepage hero slider images and content</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hero Slide
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Hero Slide</DialogTitle>
                  <DialogDescription>
                    Add a new slide to the homepage hero section
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter slide title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter slide description"
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
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      placeholder="0"
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
                  <Button onClick={createSlide}>Create Slide</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hero Slides</CardTitle>
            <CardDescription>Manage the images and content for the homepage hero section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slides.map((slide) => (
                    <TableRow key={slide.id}>
                      <TableCell>
                        <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden">
                          {slide.image_url ? (
                            <img
                              src={slide.image_url}
                              alt={slide.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{slide.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {slide.description || 'No description'}
                        </p>
                      </TableCell>
                      <TableCell>{slide.display_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {slide.is_active ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={slide.is_active ? 'text-green-600' : 'text-gray-400'}>
                            {slide.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSlideStatus(slide.id, slide.is_active)}
                          >
                            {slide.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(slide)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSlide(slide.id)}
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
              <DialogTitle>Edit Hero Slide</DialogTitle>
              <DialogDescription>
                Update the hero slide information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter slide title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description (Optional)</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter slide description"
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
                <Label htmlFor="edit_display_order">Display Order</Label>
                <Input
                  id="edit_display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  placeholder="0"
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
              <Button onClick={updateSlide}>Update Slide</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}