'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  MapPin, 
  Users, 
  Award, 
  Heart,
  Building,
  Calendar,
  Star,
  Phone,
  Mail,
  ExternalLink,
  User,
  Briefcase
} from 'lucide-react'
import { supabase, AboutSection } from '@/lib/supabase'

export default function About() {
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutSections()
  }, [])

  const fetchAboutSections = async () => {
    try {
      const { data, error } = await supabase
        .from('about_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setAboutSections(data || [])
    } catch (error) {
      console.error('Error fetching about sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSectionsByType = (type: string) => {
    return aboutSections.filter(section => section.section_type === type)
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
            <p className="mt-4 text-gray-600">Loading about information...</p>
          </div>
        </div>
      </div>
    )
  }

  const lgiSections = getSectionsByType('lgi')
  const currentOfficials = getSectionsByType('current_officials')
  const pastAchievements = getSectionsByType('past_achievements')

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
            About NYSC Toru-Orua
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn about our community, leadership, and the impact we&apos;re making in Sagbama Local Government Area
          </p>
        </motion.div>

        {/* Local Government Information */}
        {lgiSections.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="mb-16"
          >
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-8 text-center"
            >
              Local Government Information
            </motion.h2>
            <div className="flex justify-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
                {lgiSections.map((section, index) => (
                  <motion.div key={section.id} variants={itemVariants}>
                    <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                      {section.image_url && (
                        <div className="relative overflow-hidden rounded-full w-32 h-32 mx-auto mt-6 mb-4">
                          <img
                            src={section.image_url}
                            alt={section.title}
                            className="w-full h-full object-cover rounded-full border-4 border-green-100 group-hover:border-green-300 transition-colors duration-300"
                          />
                          <div className="absolute inset-0 bg-green-600 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-300" />
                        </div>
                      )}
                      
                      {!section.image_url && (
                        <div className="w-32 h-32 mx-auto mt-6 mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <Building className="h-16 w-16 text-white" />
                        </div>
                      )}
                      
                      <CardContent className="text-center p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h3>
                        {section.description && (
                          <p className="text-gray-600 line-clamp-3 mb-4">{section.description}</p>
                        )}
                        
                        {/* Hover overlay with full information */}
                        <div className="absolute inset-0 bg-white bg-opacity-95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
                          <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                            {section.description && (
                              <p className="text-gray-700 mb-4 leading-relaxed">{section.description}</p>
                            )}
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center justify-center">
                                <MapPin className="h-4 w-4 mr-2 text-green-600" />
                                <span>Sagbama Local Government Area</span>
                              </div>
                              <div className="flex items-center justify-center">
                                <Building className="h-4 w-4 mr-2 text-green-600" />
                                <span>Bayelsa State, Nigeria</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Current Officials */}
        {currentOfficials.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="mb-16"
          >
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-8 text-center"
            >
              Current Officials
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentOfficials.map((official, index) => (
                <motion.div key={official.id} variants={itemVariants}>
                  <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      {official.image_url ? (
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                          <AvatarImage src={official.image_url} alt={official.name} />
                          <AvatarFallback className="text-2xl">
                            {official.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-12 w-12 text-green-600" />
                        </div>
                      )}
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {official.name || official.title}
                      </h3>
                      
                      {official.position && (
                        <Badge className="mb-3 bg-green-100 text-green-800">
                          {official.position}
                        </Badge>
                      )}
                      
                      {official.description && (
                        <p className="text-sm text-gray-600">{official.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Past Achievements */}
        {pastAchievements.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="mb-16"
          >
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-8 text-center"
            >
              Past Achievements
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastAchievements.map((achievement, index) => (
                <motion.div key={achievement.id} variants={itemVariants}>
                  <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Award className="h-6 w-6 text-yellow-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {achievement.title}
                          </h3>
                          {achievement.description && (
                            <p className="text-gray-600">{achievement.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Default Content if no sections */}
        {aboutSections.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Default LGI Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="h-full shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-6 w-6 mr-2 text-green-600" />
                    Local Government Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Toru-Orua is located in Sagbama Local Government Area of Bayelsa State, Nigeria. 
                    Our NYSC orientation camp serves corps members deployed to this region, fostering 
                    community development and national integration.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      <span>Sagbama Local Government Area</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Bayelsa State, Nigeria</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mission & Vision */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="h-full shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-6 w-6 mr-2 text-red-600" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    To foster unity, promote national integration, and contribute meaningfully to 
                    community development through dedicated service and collaborative efforts.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-1" />
                      <span className="text-sm text-gray-600">Community Development Service</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-1" />
                      <span className="text-sm text-gray-600">Skills Acquisition & Entrepreneurship</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 mt-1" />
                      <span className="text-sm text-gray-600">National Integration</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Statistics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center mb-8">Our Impact</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">150+</div>
                  <div className="text-green-100">Active Corps Members</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">25+</div>
                  <div className="text-green-100">CDS Projects Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">1000+</div>
                  <div className="text-green-100">Community Members Impacted</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">5+</div>
                  <div className="text-green-100">Years of Service</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Join Our Community
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Be part of a vibrant community of corps members dedicated to serving the nation 
                and building a better future for all. Together, we can make a lasting impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/auth/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Get Started
                </motion.a>
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Contact Us
                </motion.a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}