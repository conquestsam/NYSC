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
  Calendar,
  Eye,
  EyeOff,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { supabase, Activity } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ActivitiesManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    image_urls: [] as string[],
    location: '',
    duration: '',
    organizer: '',
    contact_info: '',
    requirements: '',
    max_participants: '',
    registration_deadline: '',
    tags: [] as string[],
    activity_date: '',
    category: 'cds',
    status: 'upcoming',
    is_active: true
  })

  const categories = [
    { value: 'cds', label: 'CDS Activities' },
    { value: 'pop', label: 'POP' },
    { value: 'saed', label: 'SAED' },
    { value: 'orientation', label: 'Orientation' },
    { value: 'training', label: 'Training' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'ceremony', label: 'Ceremony' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' }
  ]

  const statuses = [
    { value: 'upcoming', label: 'Upcoming', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'ongoing', label: 'Ongoing', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { value: 'past', label: 'Past', icon: CheckCircle, color: 'bg-green-100 text-green-800' }
  ]

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchActivities()
    }
  }, [profile])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('activity_date', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Failed to fetch activities')
    } finally {
      setLoadingData(false)
    }
  }

  const createActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([formData])
        .select()

      if (error) throw error
      
      setActivities([data[0], ...activities])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Activity created successfully')
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error('Failed to create activity')
    }
  }

  const updateActivity = async () => {
    if (!selectedActivity) return

    try {
      const { data, error } = await supabase
        .from('activities')
        .update(formData)
        .eq('id', selectedActivity.id)
        .select()

      if (error) throw error
      
      setActivities(activities.map(activity => 
        activity.id === selectedActivity.id ? data[0] : activity
      ))
      setIsEditDialogOpen(false)
      setSelectedActivity(null)
      resetForm()
      toast.success('Activity updated successfully')
    } catch (error) {
      console.error('Error updating activity:', error)
      toast.error('Failed to update activity')
    }
  }

  const deleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (error) throw error
      
      setActivities(activities.filter(activity => activity.id !== activityId))
      toast.success('Activity deleted successfully')
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('Failed to delete activity')
    }
  }

  const toggleActivityStatus = async (activityId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ is_active: !isActive })
        .eq('id', activityId)

      if (error) throw error
      
      setActivities(activities.map(activity => 
        activity.id === activityId ? { ...activity, is_active: !isActive } : activity
      ))
      toast.success('Activity status updated')
    } catch (error) {
      console.error('Error toggling activity status:', error)
      toast.error('Failed to update activity status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      image_urls: [],
      location: '',
      duration: '',
      organizer: '',
      contact_info: '',
      requirements: '',
      max_participants: '',
      registration_deadline: '',
      tags: [],
      activity_date: '',
      category: 'cds',
      status: 'upcoming',
      is_active: true
    })
  }

  const openEditDialog = (activity: Activity) => {
    setSelectedActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      image_url: activity.image_url || '',
      image_urls: activity.image_urls || [],
      location: activity.location || '',
      duration: activity.duration || '',
      organizer: activity.organizer || '',
      contact_info: activity.contact_info || '',
      requirements: activity.requirements || '',
      max_participants: activity.max_participants !== undefined && activity.max_participants !== null ? String(activity.max_participants) : '',
      registration_deadline: activity.registration_deadline || '',
      tags: activity.tags || [],
      activity_date: activity.activity_date || '',
      category: activity.category,
      status: activity.status,
      is_active: activity.is_active
    })
    setIsEditDialogOpen(true)
  }
  // Additional Images state and handlers
  const [newImageUrl, setNewImageUrl] = useState('')
  const addImageUrl = () => {
    if (newImageUrl.trim() !== '') {
      setFormData({ ...formData, image_urls: [...formData.image_urls, newImageUrl.trim()] })
      setNewImageUrl('')
    }
  }
  const removeImageUrl = (index: number) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls.filter((_, i) => i !== index)
    })
  }

  // Tags state and handlers
  const [newTag, setNewTag] = useState('')
  const addTag = () => {
    if (newTag.trim() !== '' && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] })
      setNewTag('')
    }
  }
  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    })
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

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0]
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category
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
              <h1 className="text-3xl font-bold text-gray-900">Activities Management</h1>
              <p className="text-gray-600 mt-2">Manage CDS activities, POP, SAED, and other NYSC programs</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-2xl px-2 sm:px-6 py-6 overflow-y-auto max-h-[90vh]">
                {/* Responsive dialog content */}
                <DialogHeader>
                  <DialogTitle>Create New Activity</DialogTitle>
                  <DialogDescription>
                    Add a new activity or event
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter activity title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter activity description"
                    />
                  </div>
                  
                  {/* Main Image */}
                  <div className="space-y-2">
                    <Label htmlFor="edit_image_url">Main Image URL (Optional)</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {/* Multiple Images */}
                  <div className="space-y-2">
                    <Label>Additional Images</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addImageUrl} size="sm">
                        Add
                      </Button>
                    </div>
                    {formData.image_urls.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {formData.image_urls.map((url, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm truncate flex-1">{url}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeImageUrl(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_location">Location (Optional)</Label>
                      <Input
                        id="edit_location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Event location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_duration">Duration (Optional)</Label>
                      <Input
                        id="edit_duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 2 hours, Full day"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_organizer">Organizer (Optional)</Label>
                      <Input
                        id="edit_organizer"
                        value={formData.organizer}
                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                        placeholder="Event organizer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_contact_info">Contact Info (Optional)</Label>
                      <Input
                        id="edit_contact_info"
                        value={formData.contact_info}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        placeholder="Contact information"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_requirements">Requirements (Optional)</Label>
                    <Textarea
                      id="edit_requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Any requirements or prerequisites for participation"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_max_participants">Max Participants (Optional)</Label>
                      <Input
                        id="edit_max_participants"
                        type="number"
                        min="1"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        placeholder="Maximum number of participants"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_registration_deadline">Registration Deadline (Optional)</Label>
                      <Input
                        id="edit_registration_deadline"
                        type="date"
                        value={formData.registration_deadline}
                        onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        Add Tag
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{tag}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeTag(index)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity_date">Activity Date (Optional)</Label>
                    <Input
                      id="activity_date"
                      type="date"
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
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
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={createActivity} className="w-full sm:w-auto">Create Activity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activities</CardTitle>
            <CardDescription>Manage all NYSC activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => {
                    const statusInfo = getStatusInfo(activity.status)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {activity.image_url ? (
                              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={activity.image_url}
                                  alt={activity.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{activity.title}</p>
                              {activity.description && (
                                <p className="text-sm text-gray-600 max-w-xs truncate">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryLabel(activity.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activity.activity_date ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(activity.activity_date), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-gray-400">No date set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {activity.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={activity.is_active ? 'text-green-600' : 'text-gray-400'}>
                              {activity.is_active ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActivityStatus(activity.id, activity.is_active)}
                            >
                              {activity.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(activity)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteActivity(activity.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-2xl px-2 sm:px-6 py-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
              <DialogDescription>
                Update the activity information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter activity title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description (Optional)</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter activity description"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_activity_date">Activity Date (Optional)</Label>
                <Input
                  id="edit_activity_date"
                  type="date"
                  value={formData.activity_date}
                  onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
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
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={updateActivity} className="w-full sm:w-auto">Update Activity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}