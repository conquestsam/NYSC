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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  MapPin,
  Users,
  Award,
  Eye,
  EyeOff,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { supabase, AboutSection } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AboutManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<AboutSection | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState('lgi')
  const [formData, setFormData] = useState({
    section_type: 'lgi',
    title: '',
    description: '',
    image_url: '',
    name: '',
    position: '',
    display_order: 0,
    is_active: true
  })

  const sectionTypes = [
    { 
      value: 'lgi', 
      label: 'Local Government Information', 
      icon: MapPin,
      description: 'Information about the local government area'
    },
    { 
      value: 'current_officials', 
      label: 'Current Officials', 
      icon: Users,
      description: 'Current NYSC officials and leadership'
    },
    { 
      value: 'past_achievements', 
      label: 'Past Achievements', 
      icon: Award,
      description: 'Notable achievements and milestones'
    }
  ]

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchAboutSections()
    }
  }, [profile])

  const fetchAboutSections = async () => {
    try {
      const { data, error } = await supabase
        .from('about_sections')
        .select('*')
        .order('section_type', { ascending: true })
        .order('display_order', { ascending: true })

      if (error) throw error
      setAboutSections(data || [])
    } catch (error) {
      console.error('Error fetching about sections:', error)
      toast.error('Failed to fetch about sections')
    } finally {
      setLoadingData(false)
    }
  }

  const createSection = async () => {
    try {
      const { data, error } = await supabase
        .from('about_sections')
        .insert([formData])
        .select()

      if (error) throw error
      
      setAboutSections([...aboutSections, data[0]])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('About section created successfully')
    } catch (error) {
      console.error('Error creating about section:', error)
      toast.error('Failed to create about section')
    }
  }

  const updateSection = async () => {
    if (!selectedSection) return

    try {
      const { data, error } = await supabase
        .from('about_sections')
        .update(formData)
        .eq('id', selectedSection.id)
        .select()

      if (error) throw error
      
      setAboutSections(aboutSections.map(section => 
        section.id === selectedSection.id ? data[0] : section
      ))
      setIsEditDialogOpen(false)
      setSelectedSection(null)
      resetForm()
      toast.success('About section updated successfully')
    } catch (error) {
      console.error('Error updating about section:', error)
      toast.error('Failed to update about section')
    }
  }

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('about_sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error
      
      setAboutSections(aboutSections.filter(section => section.id !== sectionId))
      toast.success('About section deleted successfully')
    } catch (error) {
      console.error('Error deleting about section:', error)
      toast.error('Failed to delete about section')
    }
  }

  const toggleSectionStatus = async (sectionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('about_sections')
        .update({ is_active: !isActive })
        .eq('id', sectionId)

      if (error) throw error
      
      setAboutSections(aboutSections.map(section => 
        section.id === sectionId ? { ...section, is_active: !isActive } : section
      ))
      toast.success(`About section ${!isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating about section status:', error)
      toast.error('Failed to update about section status')
    }
  }

  const resetForm = () => {
    setFormData({
      section_type: activeTab,
      title: '',
      description: '',
      image_url: '',
      name: '',
      position: '',
      display_order: getSectionsByType(activeTab).length,
      is_active: true
    })
  }

  const openEditDialog = (section: AboutSection) => {
    setSelectedSection(section)
    setFormData({
      section_type: section.section_type,
      title: section.title,
      description: section.description || '',
      image_url: section.image_url || '',
      name: section.name || '',
      position: section.position || '',
      display_order: section.display_order,
      is_active: section.is_active
    })
    setIsEditDialogOpen(true)
  }

  const getSectionsByType = (type: string) => {
    return aboutSections.filter(section => section.section_type === type)
  }

  const getSectionTypeInfo = (type: string) => {
    return sectionTypes.find(t => t.value === type) || sectionTypes[0]
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
              <h1 className="text-3xl font-bold text-gray-900">About Us Management</h1>
              <p className="text-gray-600 mt-2">Manage about us page sections and content</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  resetForm()
                  setFormData({ ...formData, section_type: activeTab })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New About Section</DialogTitle>
                  <DialogDescription>
                    Add a new section to the about us page
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="section_type">Section Type</Label>
                    <Select value={formData.section_type} onValueChange={(value) => setFormData({ ...formData, section_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="h-4 w-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter section title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter section description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL (Optional)</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {formData.section_type === 'current_officials' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter official's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          placeholder="Enter official's position"
                        />
                      </div>
                    </>
                  )}
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
                  <Button onClick={createSection}>Create Section</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {sectionTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center space-x-2">
                <type.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sectionTypes.map((type) => (
            <TabsContent key={type.value} value={type.value}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <type.icon className="h-5 w-5 mr-2" />
                    {type.label}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          {type.value === 'current_officials' && (
                            <>
                              <TableHead>Name</TableHead>
                              <TableHead>Position</TableHead>
                            </>
                          )}
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSectionsByType(type.value).map((section) => (
                          <TableRow key={section.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {section.image_url ? (
                                  <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                    <img
                                      src={section.image_url}
                                      alt={section.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <type.icon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{section.title}</p>
                                  {section.description && (
                                    <p className="text-sm text-gray-600 max-w-xs truncate">
                                      {section.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            {type.value === 'current_officials' && (
                              <>
                                <TableCell>{section.name || 'N/A'}</TableCell>
                                <TableCell>
                                  {section.position && (
                                    <Badge variant="outline">{section.position}</Badge>
                                  )}
                                </TableCell>
                              </>
                            )}
                            <TableCell>{section.display_order}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {section.is_active ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                                <span className={section.is_active ? 'text-green-600' : 'text-gray-400'}>
                                  {section.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleSectionStatus(section.id, section.is_active)}
                                >
                                  {section.is_active ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(section)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteSection(section.id)}
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
            </TabsContent>
          ))}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit About Section</DialogTitle>
              <DialogDescription>
                Update the about section information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_section_type">Section Type</Label>
                <Select value={formData.section_type} onValueChange={(value) => setFormData({ ...formData, section_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <type.icon className="h-4 w-4 mr-2" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter section title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description (Optional)</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter section description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_image_url">Image URL (Optional)</Label>
                <Input
                  id="edit_image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {formData.section_type === 'current_officials' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">Name</Label>
                    <Input
                      id="edit_name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter official's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_position">Position</Label>
                    <Input
                      id="edit_position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Enter official's position"
                    />
                  </div>
                </>
              )}
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
              <Button onClick={updateSection}>Update Section</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}