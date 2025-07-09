'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Vote, 
  Users, 
  ArrowLeft,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { supabase, Election, Candidate, Profile } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ElectionManagement() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [elections, setElections] = useState<Election[]>([])
  const [candidates, setCandidates] = useState<(Candidate & { profile: Profile })[]>([])
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  })

  const candidatePosts = [
    { value: 'clo', label: 'CLO (Corps Liaison Officer)' },
    { value: 'cds_president', label: 'CDS President' },
    { value: 'financial_secretary', label: 'Financial Secretary' },
    { value: 'general_secretary', label: 'General Secretary' },
    { value: 'marshall_male', label: 'Marshall (Male)' },
    { value: 'marshall_female', label: 'Marshall (Female)' },
    { value: 'provost', label: 'Provost' }
  ]

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchElections()
      fetchCandidates()
    }
  }, [profile])

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setElections(data || [])
    } catch (error) {
      console.error('Error fetching elections:', error)
      toast.error('Failed to fetch elections')
    } finally {
      setLoadingData(false)
    }
  }

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCandidates(data || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
    }
  }

  const createElection = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .insert([{
          ...formData,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          status: new Date(formData.start_date) > new Date() ? 'upcoming' : 'active'
        }])
        .select()

      if (error) throw error
      
      setElections([data[0], ...elections])
      setIsCreateDialogOpen(false)
      setFormData({ title: '', description: '', start_date: '', end_date: '' })
      toast.success('Election created successfully')
    } catch (error) {
      console.error('Error creating election:', error)
      toast.error('Failed to create election')
    }
  }

  const updateElectionStatus = async (electionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('elections')
        .update({ status })
        .eq('id', electionId)

      if (error) throw error
      
      setElections(elections.map(election => 
        election.id === electionId ? { ...election, status: status as any } : election
      ))
      toast.success('Election status updated successfully')
    } catch (error) {
      console.error('Error updating election status:', error)
      toast.error('Failed to update election status')
    }
  }

  const approveCandidateRegistration = async (candidateId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ is_approved: approved })
        .eq('id', candidateId)

      if (error) throw error
      
      setCandidates(candidates.map(candidate => 
        candidate.id === candidateId ? { ...candidate, is_approved: approved } : candidate
      ))
      toast.success(`Candidate ${approved ? 'approved' : 'rejected'} successfully`)
    } catch (error) {
      console.error('Error updating candidate approval:', error)
      toast.error('Failed to update candidate approval')
    }
  }

  const deleteElection = async (electionId: string) => {
    try {
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', electionId)

      if (error) throw error
      
      setElections(elections.filter(election => election.id !== electionId))
      toast.success('Election deleted successfully')
    } catch (error) {
      console.error('Error deleting election:', error)
      toast.error('Failed to delete election')
    }
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Election Management</h1>
              <p className="text-gray-600 mt-2">Manage elections, candidates, and voting</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Election
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Election</DialogTitle>
                  <DialogDescription>
                    Set up a new election for corps members to vote
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Election Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., 2024 Executive Elections"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Election description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createElection}>Create Election</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="elections" className="space-y-6">
          <TabsList>
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="elections">
            <Card>
              <CardHeader>
                <CardTitle>Elections</CardTitle>
                <CardDescription>Manage election schedules and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Election</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Candidates</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {elections.map((election) => {
                        const electionCandidates = candidates.filter(c => c.election_id === election.id)
                        const totalVotes = electionCandidates.reduce((sum, c) => sum + c.votes_count, 0)
                        
                        return (
                          <TableRow key={election.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{election.title}</p>
                                <p className="text-sm text-gray-500">{election.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{format(new Date(election.start_date), 'MMM dd, yyyy HH:mm')}</p>
                                <p className="text-gray-500">to {format(new Date(election.end_date), 'MMM dd, yyyy HH:mm')}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(election.status)}>
                                {election.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{electionCandidates.length}</TableCell>
                            <TableCell>{totalVotes}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={election.status}
                                  onValueChange={(value) => updateElectionStatus(election.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteElection(election.id)}
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
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Registrations</CardTitle>
                <CardDescription>Approve or reject candidate registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Post</TableHead>
                        <TableHead>Election</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate) => {
                        const election = elections.find(e => e.id === candidate.election_id)
                        const postLabel = candidatePosts.find(p => p.value === candidate.post)?.label
                        
                        return (
                          <TableRow key={candidate.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{candidate.profile?.full_name}</p>
                                <p className="text-sm text-gray-500">{candidate.profile?.state_code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{postLabel}</TableCell>
                            <TableCell>{election?.title}</TableCell>
                            <TableCell>
                              <Badge variant={candidate.is_approved ? "default" : "secondary"}>
                                {candidate.is_approved ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>{candidate.votes_count}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {!candidate.is_approved && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => approveCandidateRegistration(candidate.id, true)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {candidate.is_approved && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => approveCandidateRegistration(candidate.id, false)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
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
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Election Results</CardTitle>
                <CardDescription>View real-time election results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {elections.map((election) => {
                    const electionCandidates = candidates.filter(c => c.election_id === election.id && c.is_approved)
                    const totalVotes = electionCandidates.reduce((sum, c) => sum + c.votes_count, 0)
                    
                    // Group candidates by post
                    const candidatesByPost = candidatePosts.reduce((acc, post) => {
                      acc[post.value] = electionCandidates.filter(c => c.post === post.value)
                      return acc
                    }, {} as Record<string, typeof electionCandidates>)
                    
                    return (
                      <div key={election.id} className="border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">{election.title}</h3>
                          <Badge className={getStatusBadgeColor(election.status)}>
                            {election.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {candidatePosts.map((post) => {
                            const postCandidates = candidatesByPost[post.value] || []
                            const postTotalVotes = postCandidates.reduce((sum, c) => sum + c.votes_count, 0)
                            
                            return (
                              <div key={post.value} className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium mb-3">{post.label}</h4>
                                <div className="space-y-2">
                                  {postCandidates.length === 0 ? (
                                    <p className="text-sm text-gray-500">No candidates</p>
                                  ) : (
                                    postCandidates
                                      .sort((a, b) => b.votes_count - a.votes_count)
                                      .map((candidate) => {
                                        const percentage = postTotalVotes > 0 ? (candidate.votes_count / postTotalVotes) * 100 : 0
                                        
                                        return (
                                          <div key={candidate.id} className="bg-white rounded p-3">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-sm font-medium">{candidate.profile?.full_name}</span>
                                              <span className="text-sm text-gray-600">{candidate.votes_count} votes</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                              <div 
                                                className="bg-green-600 h-2 rounded-full" 
                                                style={{ width: `${percentage}%` }}
                                              ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              {percentage.toFixed(1)}%
                                            </div>
                                          </div>
                                        )
                                      })
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-600">
                          Total votes cast: {totalVotes}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}