'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  ExternalLink, 
  Search,
  Filter,
  MapPin,
  Clock
} from 'lucide-react'
import { supabase, JobScholarship } from '@/lib/supabase'
import { format, isAfter, parseISO } from 'date-fns'
import { toast } from 'sonner'

export default function JobsScholarships() {
  const [jobs, setJobs] = useState<JobScholarship[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobScholarship[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, typeFilter, statusFilter])

  const fetchJobs = async () => {
    try {
      console.log('Fetching jobs from Supabase...')
      const { data, error } = await supabase
        .from('job_scholarships')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Jobs fetched successfully:', data?.length || 0, 'items')
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load opportunities. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => {
        const isScholarship = job.title.toLowerCase().includes('scholarship') || 
                             job.description?.toLowerCase().includes('scholarship')
        return typeFilter === 'scholarship' ? isScholarship : !isScholarship
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => {
        if (!job.deadline) return statusFilter === 'no_deadline'
        const isExpired = isAfter(new Date(), parseISO(job.deadline))
        return statusFilter === 'active' ? !isExpired : isExpired
      })
    }

    setFilteredJobs(filtered)
  }

  const isExpired = (deadline: string | null | undefined) => {
    if (!deadline) return false
    return isAfter(new Date(), parseISO(deadline))
  }

  const getJobType = (job: JobScholarship) => {
    const isScholarship = job.title.toLowerCase().includes('scholarship') || 
                         job.description?.toLowerCase().includes('scholarship')
    return isScholarship ? 'scholarship' : 'job'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Jobs & Scholarships
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover career opportunities and educational funding to advance your future
          </p>
        </motion.div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="scholarship">Scholarships</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="no_deadline">No Deadline</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {filteredJobs.length} of {jobs.length} opportunities
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
              <p className="text-gray-600">
                {jobs.length === 0 
                  ? "No job or scholarship opportunities are currently available."
                  : "Try adjusting your search criteria to find more opportunities."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredJobs.map((job, index) => {
              const jobType = getJobType(job)
              const expired = isExpired(job.deadline)
              
              return (
                <motion.div
                  key={job.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`h-full shadow-lg hover:shadow-xl transition-shadow duration-300 ${expired ? 'opacity-75' : ''}`}>
                    {job.image_url && (
                      <div className="relative overflow-hidden">
                        <img
                          src={job.image_url}
                          alt={job.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className={jobType === 'scholarship' ? 'bg-purple-600' : 'bg-blue-600'}>
                            {jobType === 'scholarship' ? (
                              <GraduationCap className="h-3 w-3 mr-1" />
                            ) : (
                              <Briefcase className="h-3 w-3 mr-1" />
                            )}
                            {jobType === 'scholarship' ? 'Scholarship' : 'Job'}
                          </Badge>
                        </div>
                        {expired && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="destructive">Expired</Badge>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {job.title}
                        </CardTitle>
                        {!job.image_url && (
                          <Badge className={jobType === 'scholarship' ? 'bg-purple-600' : 'bg-blue-600'}>
                            {jobType === 'scholarship' ? (
                              <GraduationCap className="h-3 w-3 mr-1" />
                            ) : (
                              <Briefcase className="h-3 w-3 mr-1" />
                            )}
                            {jobType === 'scholarship' ? 'Scholarship' : 'Job'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      {job.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                          {job.description}
                        </p>
                      )}
                      
                      <div className="space-y-3 mt-auto">
                        {job.deadline && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className={expired ? 'text-red-600' : ''}>
                              Deadline: {format(parseISO(job.deadline), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Posted: {format(new Date(job.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        {job.external_link && (
                          <Button 
                            className="w-full" 
                            asChild
                            disabled={expired}
                          >
                            <a 
                              href={job.external_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center"
                            >
                              {expired ? 'Expired' : 'Apply Now'}
                              {!expired && <ExternalLink className="h-4 w-4 ml-2" />}
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">
                Don&apos;t See What You&apos;re Looking For?
              </h2>
              <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                Stay connected with our community and be the first to know about new opportunities. 
                Join our network of ambitious corps members building their futures.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-yellow-400 text-green-600 hover:bg-yellow-500">
                  Join Our Community
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  Contact Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}