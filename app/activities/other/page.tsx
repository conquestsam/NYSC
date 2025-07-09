'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock,
  GraduationCap,
  Briefcase,
  Users,
  Award
} from 'lucide-react'
import { supabase, Activity } from '@/lib/supabase'
import { format } from 'date-fns'

export default function OtherActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    if (activities.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % activities.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [activities.length])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .neq('category', 'cds')
        .eq('is_active', true)
        .order('activity_date', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching other activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activities.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activities.length) % activities.length)
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pop': return <GraduationCap className="h-6 w-6" />
      case 'saed': return <Briefcase className="h-6 w-6" />
      case 'orientation': return <Users className="h-6 w-6" />
      default: return <Award className="h-6 w-6" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pop': return 'bg-purple-100 text-purple-800'
      case 'saed': return 'bg-blue-100 text-blue-800'
      case 'orientation': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading activities...</p>
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
            Other NYSC Activities
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore POP, SAED, Orientation, and other NYSC program activities
          </p>
        </motion.div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Available</h3>
              <p className="text-gray-600">
                No other NYSC activities are currently available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Slider */}
            <div className="relative mb-12">
              <div className="relative h-[500px] md:h-[600px] overflow-hidden rounded-lg shadow-2xl">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  {activities[currentSlide]?.image_url ? (
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${activities[currentSlide].image_url})`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-green-600 to-green-700" />
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center max-w-4xl mx-auto px-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-4"
                      >
                        <Badge className={getCategoryColor(activities[currentSlide]?.category || '')}>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(activities[currentSlide]?.category || '')}
                            <span className="uppercase font-semibold">
                              {activities[currentSlide]?.category}
                            </span>
                          </div>
                        </Badge>
                      </motion.div>
                      
                      <motion.h1 
                        className="text-4xl md:text-6xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      >
                        {activities[currentSlide]?.title}
                      </motion.h1>
                      
                      {activities[currentSlide]?.description && (
                        <motion.p 
                          className="text-xl md:text-2xl mb-8 text-gray-200"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        >
                          {activities[currentSlide].description}
                        </motion.p>
                      )}
                      
                      {activities[currentSlide]?.activity_date && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.6 }}
                          className="flex items-center justify-center text-lg text-gray-200"
                        >
                          <Calendar className="h-5 w-5 mr-2" />
                          <span>{format(new Date(activities[currentSlide].activity_date), 'MMMM dd, yyyy')}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Navigation arrows */}
              {activities.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Slide indicators */}
              {activities.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {activities.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Activity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card 
                    className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      index === currentSlide ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  >
                    {activity.image_url && (
                      <div className="relative overflow-hidden">
                        <img
                          src={activity.image_url}
                          alt={activity.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className={getCategoryColor(activity.category)}>
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(activity.category)}
                              <span className="uppercase text-xs font-semibold">
                                {activity.category}
                              </span>
                            </div>
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {activity.title}
                        </CardTitle>
                        {!activity.image_url && (
                          <Badge className={getCategoryColor(activity.category)}>
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(activity.category)}
                              <span className="uppercase text-xs font-semibold">
                                {activity.category}
                              </span>
                            </div>
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {activity.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {activity.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {activity.activity_date && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{format(new Date(activity.activity_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Added: {format(new Date(activity.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">
                Participate in NYSC Programs
              </h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                From orientation to POP, from SAED to special programs - be part of the complete NYSC experience 
                that shapes future leaders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-yellow-400 text-blue-600 hover:bg-yellow-500">
                  Learn More
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
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