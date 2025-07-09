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
  Briefcase,
  GraduationCap,
  Eye,
  EyeOff,
  Calendar,
  ExternalLink,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { supabase, JobScholarship } from '@/lib/supabase'
import { toast } from 'sonner'
import { format, isAfter, parseISO } from 'date-fns'

export default function JobsScholarshipsManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobScholarship[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobScholarship | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    external_link: '',
    deadline: '',
    is_active: true
  })

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchJobs()
    }
  }, [profile])

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_scholarships')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs/scholarships:', error)
      toast.error('Failed to fetch jobs/scholarships')
    } finally {
      setLoadingData(false)
    }
  }

  const createJob = async () => {
    try {
      const { data, error } = await supabase
        .from('job_scholarships')
        .insert([formData])
        .select()

      if (error) throw error
      
      setJobs([data[0], ...jobs])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Job/Scholarship created successfully')
    } catch (error) {
      console.error('Error creating job/scholarship:', error)
      toast.error('Failed to create job/scholarship')
    }
  }

  const updateJob = async () => {
    if (!selectedJob) return

    try {
      const { data, error } = await supabase
        .from('job_scholarships')
        .update(formData)
        .eq('id', selectedJob.id)
        .select()

      if (error) throw error
      
      setJobs(jobs.map(job => 
        job.id === selectedJob.id ? data[0] : job
      ))
      setIsEditDialogOpen(false)
      setSelectedJob(null)
      resetForm()
      toast.success('Job/Scholarship updated successfully')
    } catch (error) {
      console.error('Error updating job/scholarship:', error)
      toast.error('Failed to update job/scholarship')
    }
  }

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_scholarships')
        .delete()
        .eq('id', jobId)

      if (error) throw error
      
      setJobs(jobs.filter(job => job.id !== jobId))
      toast.success('Job/Scholarship deleted successfully')
    } catch (error) {
      console.error('Error deleting job/scholarship:', error)
      toast.error('Failed to delete job/scholarship')
    }
  }

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('job_scholarships')
        .update({ is_active: !isActive })
        .eq('id', jobId)

      if (error) throw error
      
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, is_active: !isActive } : job
      ))
      toast.success(`Job/Scholarship ${!isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating job/scholarship status:', error)
      toast.error('Failed to update job/scholarship status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      external_link: '',
      deadline: '',
      is_active: true
    })
  }

  const openEditDialog = (job: JobScholarship) => {
    setSelectedJob(job)
    setFormData({
      title: job.title,
      description: job.description || '',
      image_url: job.image_url || '',
      external_link: job.external_link || '',
      deadline: job.deadline || '',
      is_active: job.is_active
    })
    setIsEditDialogOpen(true)
  }

  const getJobType = (job: JobScholarship) => {
    const isScholarship = job.title.toLowerCase().includes('scholarship') || 
                         job.description?.toLowerCase().includes('scholarship')
    return isScholarship ? 'scholarship' : 'job'
  }

  const isExpired = (deadline: string | null) => {
    if (!deadline) return false
    return isAfter(new Date(), parseISO(deadline))
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
              <h1 className="text-3xl font-bold text-gray-900">Jobs & Scholarships Management</h1>
              <p className="text-gray-600 mt-2">Manage job opportunities and scholarship listings</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Opportunity</DialogTitle>
                  <DialogDescription>
                    Add a new job or scholarship opportunity
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter opportunity title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter opportunity description"
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
                  <div className="space-y-2">
                    <Label htmlFor="external_link">Application Link (Optional)</Label>
                    <Input
                      id="external_link"
                      value={formData.external_link}
                      onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                      placeholder="https://example.com/apply"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                  <Button onClick={createJob}>Create Opportunity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Jobs & Scholarships</CardTitle>
            <CardDescription>Manage job opportunities and scholarship listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const jobType = getJobType(job)
                    const expired = isExpired(job.deadline)
                    
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {job.image_url ? (
                              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={job.image_url}
                                  alt={job.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                {jobType === 'scholarship' ? (
                                  <GraduationCap className="h-6 w-6 text-gray-400" />
                                ) : (
                                  <Briefcase className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{job.title}</p>
                              {job.description && (
                                <p className="text-sm text-gray-600 max-w-xs truncate">
                                  {job.description}
                                </p>
                              )}
                              {job.external_link && (
                                <div className="flex items-center text-xs text-blue-600 mt-1">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  <span>Has application link</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={jobType === 'scholarship' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                            {jobType === 'scholarship' ? (
                              <GraduationCap className="h-3 w-3 mr-1" />
                            ) : (
                              <Briefcase className="h-3 w-3 mr-1" />
                            )}
                            {jobType === 'scholarship' ? 'Scholarship' : 'Job'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.deadline ? (
                            <div className={`flex items-center text-sm ${expired ? 'text-red-600' : 'text-gray-600'}`}>
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(parseISO(job.deadline), 'MMM dd, yyyy')}
                              {expired && (
                                <Badge variant="destructive" className="ml-2">Expired</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No deadline</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(new Date(job.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {job.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={job.is_active ? 'text-green-600' : 'text-gray-400'}>
                              {job.is_active ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleJobStatus(job.id, job.is_active)}
                            >
                              {job.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(job)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteJob(job.id)}
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
              <DialogTitle>Edit Opportunity</DialogTitle>
              <DialogDescription>
                Update the opportunity information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter opportunity title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description (Optional)</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter opportunity description"
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
              <div className="space-y-2">
                <Label htmlFor="edit_external_link">Application Link (Optional)</Label>
                <Input
                  id="edit_external_link"
                  value={formData.external_link}
                  onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                  placeholder="https://example.com/apply"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_deadline">Deadline (Optional)</Label>
                <Input
                  id="edit_deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
              <Button onClick={updateJob}>Update Opportunity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}