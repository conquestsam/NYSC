'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Vote, 
  Users, 
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  User,
  Plus,
  FileText,
  Upload,
  Download,
  Shield,
  Award,
  TrendingUp
} from 'lucide-react'
import { supabase, Election, Candidate, Profile, Vote as VoteType, VoterRegistration, CampaignMaterial, ElectionResult } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

export default function Elections() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [elections, setElections] = useState<Election[]>([])
  const [candidates, setCandidates] = useState<(Candidate & { profile: Profile })[]>([])
  const [userVotes, setUserVotes] = useState<VoteType[]>([])
  const [voterRegistration, setVoterRegistration] = useState<VoterRegistration | null>(null)
  const [campaignMaterials, setCampaignMaterials] = useState<CampaignMaterial[]>([])
  const [electionResults, setElectionResults] = useState<ElectionResult[]>([])
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [voting, setVoting] = useState(false)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [showVoterRegistration, setShowVoterRegistration] = useState(false)
  const [candidateFormData, setCandidateFormData] = useState({
    post: '',
    manifesto: '',
    campaign_slogan: '',
    qualifications: '',
    experience: ''
  })
  const [voterRegData, setVoterRegData] = useState({
    identity_document_type: '',
    address: '',
    identity_document_url: ''
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

  const identityDocTypes = [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport', label: 'International Passport' },
    { value: 'drivers_license', label: 'Driver\'s License' }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile) {
      fetchElections()
      fetchCandidates()
      fetchUserVotes()
      fetchVoterRegistration()
      fetchCampaignMaterials()
      fetchElectionResults()
    }
  }, [user, profile])

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setElections(data || [])
      
      const activeElection = data?.find(e => e.status === 'active')
      if (activeElection) {
        setSelectedElection(activeElection)
      } else if (data && data.length > 0) {
        setSelectedElection(data[0])
      }
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
        .eq('is_approved', true)
        .order('post', { ascending: true })

      if (error) throw error
      setCandidates(data || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
    }
  }

  const fetchUserVotes = async () => {
    if (!profile) return
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', profile.id)

      if (error) throw error
      setUserVotes(data || [])
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const fetchVoterRegistration = async () => {
    if (!profile) return
    
    try {
      const { data, error } = await supabase
        .from('voter_registrations')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setVoterRegistration(data)
    } catch (error) {
      console.error('Error fetching voter registration:', error)
    }
  }

  const fetchCampaignMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_materials')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)

      if (error) throw error
      setCampaignMaterials(data || [])
    } catch (error) {
      console.error('Error fetching campaign materials:', error)
    }
  }

  const fetchElectionResults = async () => {
    try {
      const { data, error } = await supabase
        .from('election_results')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setElectionResults(data || [])
    } catch (error) {
      console.error('Error fetching election results:', error)
    }
  }

  const registerVoter = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('voter_registrations')
        .insert([{
          user_id: profile.id,
          ...voterRegData
        }])
        .select()

      if (error) throw error

      setVoterRegistration(data[0])
      setShowVoterRegistration(false)
      toast.success('Voter registration submitted successfully!')
    } catch (error) {
      console.error('Error registering voter:', error)
      toast.error('Failed to register as voter')
    }
  }

  const castVote = async (candidateId: string, post: string) => {
    if (!selectedElection || !profile) return

    // Check if user is registered and verified
    if (!voterRegistration || voterRegistration.verification_status !== 'approved') {
      toast.error('You must be a verified voter to cast votes')
      return
    }

    setVoting(true)
    try {
      const existingVote = userVotes.find(
        v => v.election_id === selectedElection.id && v.post === post
      )

      if (existingVote) {
        toast.error('You have already voted for this position')
        return
      }

      const { data, error } = await supabase
        .from('votes')
        .insert([{
          election_id: selectedElection.id,
          voter_id: profile.id,
          candidate_id: candidateId,
          post: post
        }])
        .select()

      if (error) throw error

      setUserVotes([...userVotes, data[0]])
      
      setCandidates(candidates.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, votes_count: candidate.votes_count + 1 }
          : candidate
      ))

      toast.success('Vote cast successfully!')
    } catch (error) {
      console.error('Error casting vote:', error)
      toast.error('Failed to cast vote')
    } finally {
      setVoting(false)
    }
  }

const registerAsCandidate = async () => {
  if (!selectedElection || !profile || !candidateFormData.post) {
    toast.error('Please select a post and provide all required information');
    return;
  }

  // Check if user has candidate role
  if (profile.role !== 'candidate') {
    toast.error('You must have candidate privileges to register for a position');
    return;
  }

  try {
    const existingCandidate = candidates.find(
      c => c.election_id === selectedElection.id && 
          c.user_id === profile.id && 
          c.post === candidateFormData.post
    );

    if (existingCandidate) {
      toast.error('You have already registered for this position');
      return;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert([{
        election_id: selectedElection.id,
        user_id: profile.id,  // This now correctly references profiles.id
        post: candidateFormData.post,
        manifesto: candidateFormData.manifesto,
        campaign_slogan: candidateFormData.campaign_slogan,
        qualifications: candidateFormData.qualifications,
        experience: candidateFormData.experience,
        is_approved: false
      }])
      .select(`
        *,
        profile:profiles(*)
      `);

    if (error) throw error;

    setCandidates([...candidates, data[0]]);
    setShowCandidateForm(false);
    setCandidateFormData({ 
      post: '', 
      manifesto: '', 
      campaign_slogan: '', 
      qualifications: '', 
      experience: '' 
    });
    toast.success('Candidate registration submitted for approval!');
  } catch (error) {
    console.error('Error registering candidate:', error);
    toast.error('Failed to register as candidate');
  }
}

  const downloadResults = async (electionId: string) => {
    try {
      // This would generate a PDF report
      toast.success('Results download will be implemented with PDF generation')
    } catch (error) {
      console.error('Error downloading results:', error)
      toast.error('Failed to download results')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const hasVotedForPost = (post: string) => {
    return userVotes.some(
      v => v.election_id === selectedElection?.id && v.post === post
    )
  }

  const getVotedCandidate = (post: string) => {
    const vote = userVotes.find(
      v => v.election_id === selectedElection?.id && v.post === post
    )
    return vote ? candidates.find(c => c.id === vote.candidate_id) : null
  }

  const electionCandidates = selectedElection 
    ? candidates.filter(c => c.election_id === selectedElection.id)
    : []

  const candidatesByPost = candidatePosts.reduce((acc, post) => {
    acc[post.value] = electionCandidates.filter(c => c.post === post.value)
    return acc
  }, {} as Record<string, typeof electionCandidates>)

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Elections</h1>
          <p className="text-gray-600 mt-2">Participate in democratic elections</p>
        </div>

        {/* Voter Registration Status */}
        {!voterRegistration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Voter Registration Required</h3>
                      <p className="text-orange-700">You must register as a voter to participate in elections</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowVoterRegistration(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Register to Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {voterRegistration && voterRegistration.verification_status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Registration Under Review</h3>
                    <p className="text-blue-700">Your voter registration is being verified by the electoral committee</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {voterRegistration && voterRegistration.verification_status === 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Verified Voter</h3>
                    <p className="text-green-700">You are registered and verified to vote in elections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {elections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Elections Available</h3>
              <p className="text-gray-600">There are currently no active elections.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Election Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Election</CardTitle>
                <CardDescription>Choose an election to view candidates and cast your vote</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elections.map((election) => (
                    <motion.div
                      key={election.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          selectedElection?.id === election.id 
                            ? 'ring-2 ring-green-500 bg-green-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedElection(election)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{election.title}</h3>
                            <Badge className={getStatusBadgeColor(election.status)}>
                              {election.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{election.description}</p>
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center mb-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(election.start_date), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Ends: {format(new Date(election.end_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedElection && (
              <Tabs defaultValue="vote" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="vote">Cast Vote</TabsTrigger>
                  {profile?.role === 'candidate' && (
                    <TabsTrigger value="register">Register as Candidate</TabsTrigger>
                  )}
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {profile?.role === 'candidate' && (
                  <TabsContent value="register">
                    <Card>
                      <CardHeader>
                        <CardTitle>Register as Candidate</CardTitle>
                        <CardDescription>
                          Register for a position in {selectedElection.title}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="post">Select Position</Label>
                            <Select 
                              value={candidateFormData.post} 
                              onValueChange={(value) => setCandidateFormData({ ...candidateFormData, post: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a position" />
                              </SelectTrigger>
                              <SelectContent>
                                {candidatePosts.map((post) => (
                                  <SelectItem key={post.value} value={post.value}>
                                    {post.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="campaign_slogan">Campaign Slogan</Label>
                            <Input
                              id="campaign_slogan"
                              placeholder="Your campaign slogan..."
                              value={candidateFormData.campaign_slogan}
                              onChange={(e) => setCandidateFormData({ ...candidateFormData, campaign_slogan: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="qualifications">Qualifications</Label>
                          <Textarea
                            id="qualifications"
                            placeholder="List your relevant qualifications..."
                            value={candidateFormData.qualifications}
                            onChange={(e) => setCandidateFormData({ ...candidateFormData, qualifications: e.target.value })}
                            className="min-h-[100px]"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="experience">Experience</Label>
                          <Textarea
                            id="experience"
                            placeholder="Describe your relevant experience..."
                            value={candidateFormData.experience}
                            onChange={(e) => setCandidateFormData({ ...candidateFormData, experience: e.target.value })}
                            className="min-h-[100px]"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="manifesto">Manifesto</Label>
                          <Textarea
                            id="manifesto"
                            placeholder="Share your vision and plans for this position..."
                            value={candidateFormData.manifesto}
                            onChange={(e) => setCandidateFormData({ ...candidateFormData, manifesto: e.target.value })}
                            className="min-h-[150px]"
                          />
                        </div>
                        
                        <Button 
                          onClick={registerAsCandidate}
                          disabled={!candidateFormData.post || !candidateFormData.manifesto.trim()}
                          className="w-full"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Submit Registration
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                <TabsContent value="vote">
                  <div className="space-y-6">
                    {candidatePosts.map((post) => {
                      const postCandidates = candidatesByPost[post.value] || []
                      const hasVoted = hasVotedForPost(post.value)
                      const votedCandidate = getVotedCandidate(post.value)
                      
                      return (
                        <Card key={post.value}>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">{post.label}</CardTitle>
                              {hasVoted && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Voted
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              {hasVoted 
                                ? `You voted for ${votedCandidate?.profile?.full_name}`
                                : 'Select your preferred candidate'
                              }
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {postCandidates.length === 0 ? (
                              <p className="text-gray-500 text-center py-8">No candidates for this position</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {postCandidates.map((candidate) => (
                                  <motion.div
                                    key={candidate.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Card 
                                      className={`cursor-pointer transition-all ${
                                        votedCandidate?.id === candidate.id
                                          ? 'ring-2 ring-green-500 bg-green-50'
                                          : hasVoted
                                          ? 'opacity-50 cursor-not-allowed'
                                          : 'hover:shadow-md'
                                      }`}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-center space-x-3 mb-3">
                                          <Avatar className="h-12 w-12">
                                            <AvatarImage src={candidate.profile?.photo_url} alt={candidate.profile?.full_name} />
                                            <AvatarFallback>{candidate.profile?.full_name?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className="font-semibold">{candidate.profile?.full_name}</h4>
                                            <p className="text-sm text-gray-600">{candidate.profile?.state_code}</p>
                                            {candidate.campaign_slogan && (
                                              <p className="text-xs text-blue-600 italic">"{candidate.campaign_slogan}"</p>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {candidate.manifesto && (
                                          <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                                            {candidate.manifesto}
                                          </p>
                                        )}
                                        
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-gray-500">
                                            {candidate.votes_count} votes
                                          </span>
                                          
                                          {selectedElection.status === 'active' && voterRegistration?.verification_status === 'approved' && (
                                            <Button
                                              size="sm"
                                              disabled={hasVoted || voting}
                                              onClick={() => castVote(candidate.id, post.value)}
                                              className={
                                                votedCandidate?.id === candidate.id
                                                  ? 'bg-green-600 hover:bg-green-700'
                                                  : ''
                                              }
                                            >
                                              {voting ? 'Voting...' : hasVoted ? 'Voted' : 'Vote'}
                                            </Button>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="results">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Election Results</CardTitle>
                          <CardDescription>Real-time voting results for {selectedElection.title}</CardDescription>
                        </div>
                        <Button onClick={() => downloadResults(selectedElection.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {candidatePosts.map((post) => {
                          const postCandidates = candidatesByPost[post.value] || []
                          const postTotalVotes = postCandidates.reduce((sum, c) => sum + c.votes_count, 0)
                          
                          return (
                            <div key={post.value} className="border rounded-lg p-4">
                              <h3 className="font-semibold mb-4">{post.label}</h3>
                              
                              {postCandidates.length === 0 ? (
                                <p className="text-gray-500">No candidates for this position</p>
                              ) : (
                                <div className="space-y-3">
                                  {postCandidates
                                    .sort((a, b) => b.votes_count - a.votes_count)
                                    .map((candidate, index) => {
                                      const percentage = postTotalVotes > 0 ? (candidate.votes_count / postTotalVotes) * 100 : 0
                                      
                                      return (
                                        <div key={candidate.id} className="bg-gray-50 rounded-lg p-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                              <Avatar className="h-8 w-8">
                                                <AvatarImage src={candidate.profile?.photo_url} alt={candidate.profile?.full_name} />
                                                <AvatarFallback>{candidate.profile?.full_name?.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="font-medium">{candidate.profile?.full_name}</p>
                                                <p className="text-sm text-gray-600">{candidate.profile?.state_code}</p>
                                              </div>
                                              {index === 0 && postTotalVotes > 0 && (
                                                <Badge className="bg-yellow-100 text-yellow-800">
                                                  <Award className="h-3 w-3 mr-1" />
                                                  Leading
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <p className="font-semibold">{candidate.votes_count} votes</p>
                                              <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                                            </div>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <motion.div 
                                              className="bg-green-600 h-2 rounded-full"
                                              initial={{ width: 0 }}
                                              animate={{ width: `${percentage}%` }}
                                              transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                          </div>
                                        </div>
                                      )
                                    })}
                                </div>
                              )}
                              
                              <div className="mt-3 text-sm text-gray-600">
                                Total votes: {postTotalVotes}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-gray-900">
                          {electionCandidates.reduce((sum, c) => sum + c.votes_count, 0)}
                        </h3>
                        <p className="text-gray-600">Total Votes Cast</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-gray-900">{electionCandidates.length}</h3>
                        <p className="text-gray-600">Total Candidates</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="text-2xl font-bold text-gray-900">
                          {candidatePosts.filter(post => candidatesByPost[post.value]?.length > 0).length}
                        </h3>
                        <p className="text-gray-600">Contested Positions</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {/* Voter Registration Modal */}
        <Dialog open={showVoterRegistration} onOpenChange={setShowVoterRegistration}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Voter Registration</DialogTitle>
              <DialogDescription>
                Register to participate in elections
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="identity_document_type">Identity Document Type</Label>
                <Select 
                  value={voterRegData.identity_document_type} 
                  onValueChange={(value) => setVoterRegData({ ...voterRegData, identity_document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {identityDocTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={voterRegData.address}
                  onChange={(e) => setVoterRegData({ ...voterRegData, address: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identity_document_url">Identity Document (Upload URL)</Label>
                <Input
                  id="identity_document_url"
                  placeholder="https://example.com/document.jpg"
                  value={voterRegData.identity_document_url}
                  onChange={(e) => setVoterRegData({ ...voterRegData, identity_document_url: e.target.value })}
                />
                <p className="text-xs text-gray-500">Upload your document to a cloud service and paste the URL here</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVoterRegistration(false)}>
                Cancel
              </Button>
              <Button 
                onClick={registerVoter}
                disabled={!voterRegData.identity_document_type || !voterRegData.address}
              >
                <Upload className="h-4 w-4 mr-2" />
                Register
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}