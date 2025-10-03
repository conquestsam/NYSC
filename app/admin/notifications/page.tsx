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
  Bell,
  Eye,
  EyeOff,
  Calendar,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { supabase, Notification } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function NotificationManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    expires_at: '',
    is_active: true
  })

  const notificationTypes = [
    { value: 'info', label: 'Information', icon: Info, color: 'bg-blue-100 text-blue-800' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    if (!loading && (!user || !['admin', 'super_admin'].includes(profile?.role || ''))) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (['admin', 'super_admin'].includes(profile?.role || '')) {
      fetchNotifications()
    }
  }, [profile])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to fetch notifications')
    } finally {
      setLoadingData(false)
    }
  }

  const createNotification = async () => {
    try {
      const notificationData = {
        ...formData,
        expires_at: formData.expires_at || null
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()

      if (error) throw error
      
      setNotifications([data[0], ...notifications])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Notification created successfully')
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error('Failed to create notification')
    }
  }

  const updateNotification = async () => {
    if (!selectedNotification) return

    try {
      const notificationData = {
        ...formData,
        expires_at: formData.expires_at || null
      }

      const { data, error } = await supabase
        .from('notifications')
        .update(notificationData)
        .eq('id', selectedNotification.id)
        .select()

      if (error) throw error
      
      setNotifications(notifications.map(notification => 
        notification.id === selectedNotification.id ? data[0] : notification
      ))
      setIsEditDialogOpen(false)
      setSelectedNotification(null)
      resetForm()
      toast.success('Notification updated successfully')
    } catch (error) {
      console.error('Error updating notification:', error)
      toast.error('Failed to update notification')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      
      setNotifications(notifications.filter(notification => notification.id !== notificationId))
      toast.success('Notification deleted successfully')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const toggleNotificationStatus = async (notificationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_active: !isActive })
        .eq('id', notificationId)

      if (error) throw error
      
      setNotifications(notifications.map(notification => 
        notification.id === notificationId ? { ...notification, is_active: !isActive } : notification
      ))
      toast.success(`Notification ${!isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating notification status:', error)
      toast.error('Failed to update notification status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      expires_at: '',
      is_active: true
    })
  }

  const openEditDialog = (notification: Notification) => {
    setSelectedNotification(notification)
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      expires_at: notification.expires_at ? notification.expires_at.split('T')[0] : '',
      is_active: notification.is_active
    })
    setIsEditDialogOpen(true)
  }

  const getTypeInfo = (type: string) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[0]
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user || !['admin', 'super_admin'].includes(profile?.role || '')) {
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
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="text-gray-600 mt-2">Create and manage notifications for corps members</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Notification</DialogTitle>
                  <DialogDescription>
                    Create a notification that will be shown to all corps members
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter notification title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Enter notification message"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
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
                    <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
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
                  <Button onClick={createNotification}>Create Notification</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notifications for corps members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => {
                    const typeInfo = getTypeInfo(notification.type)
                    const expired = isExpired(notification.expires_at)
                    
                    return (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {notification.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeInfo.color}>
                            <typeInfo.icon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {notification.is_active && !expired ? (
                              <>
                                <Eye className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Active</span>
                              </>
                            ) : expired ? (
                              <>
                                <Calendar className="h-4 w-4 text-red-600" />
                                <span className="text-red-600">Expired</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-400">Inactive</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {notification.expires_at ? (
                            <span className={expired ? 'text-red-600' : 'text-gray-600'}>
                              {format(new Date(notification.expires_at), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {format(new Date(notification.created_at), 'MMM dd, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleNotificationStatus(notification.id, notification.is_active)}
                              disabled={expired}
                            >
                              {notification.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(notification)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
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
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Notification</DialogTitle>
              <DialogDescription>
                Update the notification information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notification title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_message">Message</Label>
                <Textarea
                  id="edit_message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter notification message"
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
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
                <Label htmlFor="edit_expires_at">Expiry Date (Optional)</Label>
                <Input
                  id="edit_expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
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
              <Button onClick={updateNotification}>Update Notification</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}