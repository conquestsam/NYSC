'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase, PhotoGallery } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'

export default function CDSProjectsSection() {
  const [projects, setProjects] = useState<PhotoGallery[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isVideo, setIsVideo] = useState<boolean[]>([])

  useEffect(() => {
    fetchCDSProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(projects.length / 3))
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [projects.length])

  const fetchCDSProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_gallery')
        .select('*')
        .or('event_tag.ilike.%CDS%,event_tag.ilike.%cds%')
        .eq('is_active', true)
        .order('upload_date', { ascending: false })
        .limit(12)

      if (error) throw error
      setProjects(data || [])
      
      // Check if items are videos
      const videoChecks = (data || []).map(project => 
        project.image_url.includes('.mp4') || 
        project.image_url.includes('.webm') || 
        project.image_url.includes('.ogg') ||
        project.image_url.includes('video')
      )
      setIsVideo(videoChecks)
    } catch (error) {
      console.error('Error fetching CDS projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(projects.length / 3))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(projects.length / 3)) % Math.ceil(projects.length / 3))
  }

  const getVisibleProjects = () => {
    const itemsPerSlide = 3
    const startIndex = currentSlide * itemsPerSlide
    return projects.slice(startIndex, startIndex + itemsPerSlide)
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Past CDS Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the impactful Community Development Service projects we&apos;ve completed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-300"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Past CDS Projects
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the impactful Community Development Service projects we&apos;ve completed
          </p>
        </motion.div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No CDS projects available at the moment.</p>
            <p className="text-gray-400 mt-2">Check back soon for updates on our community impact initiatives.</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                className="overflow-hidden"
              >
                <motion.div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: Math.ceil(projects.length / 3) }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {projects.slice(slideIndex * 3, (slideIndex + 1) * 3).map((project, index) => (
                          <motion.div
                            key={project.id}
                            variants={itemVariants}
                            whileHover={{ y: -10, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full bg-gradient-to-br from-white to-gray-50">
                              <div className="relative overflow-hidden group">
                                {isVideo[slideIndex * 3 + index] ? (
                                  <video
                                    src={project.image_url}
                                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                                    controls
                                    muted
                                    loop
                                  />
                                ) : (
                                  <img
                                    src={project.image_url}
                                    alt={project.title}
                                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute top-4 left-4">
                                  <Badge className="bg-green-600 text-white shadow-lg">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {project.event_tag}
                                  </Badge>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <p className="text-sm font-medium">{project.title}</p>
                                </div>
                              </div>
                              <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                                  {project.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="flex-1 flex flex-col">
                                {project.description && (
                                  <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                                    {project.description}
                                  </p>
                                )}
                                <div className="flex items-center text-sm text-gray-500 mt-auto">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span>{format(new Date(project.upload_date), 'MMM dd, yyyy')}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Navigation arrows */}
              {projects.length > 3 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg backdrop-blur-sm"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg backdrop-blur-sm"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Slide indicators */}
              {projects.length > 3 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: Math.ceil(projects.length / 3) }).map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-green-600 w-8' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* View More Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link href="/activities/cds">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  View All CDS Activities
                </motion.button>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}