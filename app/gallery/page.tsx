'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Search, 
  Filter, 
  X,
  Calendar,
  User,
  Tag,
  Download,
  Heart,
  Share2
} from 'lucide-react'
import { supabase, PhotoGallery } from '@/lib/supabase'
import { format } from 'date-fns'

export default function Gallery() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoGallery[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoGallery[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGallery | null>(null)
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchPhotos()
    }
  }, [user])

  useEffect(() => {
    filterPhotos()
  }, [photos, searchTerm, selectedTag])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_gallery')
        .select('*')
        .eq('is_active', true)
        .order('upload_date', { ascending: false })

      if (error) throw error
      
      setPhotos(data || [])
      
      // Extract unique tags
      const uniqueTags = [...new Set(data?.map(photo => photo.event_tag) || [])]
      setTags(uniqueTags)
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const filterPhotos = () => {
    let filtered = photos

    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.event_tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(photo => photo.event_tag === selectedTag)
    }

    setFilteredPhotos(filtered)
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
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  if (loading || loadingPhotos) {
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Photo Gallery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Capturing memories and moments from our NYSC journey
          </p>
        </motion.div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag('all')}
                >
                  All
                </Button>
                {tags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm text-gray-600">
                  {filteredPhotos.length} of {photos.length} photos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Found</h3>
              <p className="text-gray-600">
                {photos.length === 0 
                  ? "No photos are currently available in the gallery."
                  : "Try adjusting your search criteria to find more photos."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative aspect-square">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-600 text-white">
                        {photo.event_tag}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                      {photo.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{format(new Date(photo.upload_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Photo Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="relative">
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.title}
                    className="w-full max-h-[70vh] object-contain"
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedPhoto.title}
                      </h2>
                      <Badge className="bg-green-600 text-white mb-2">
                        <Tag className="h-3 w-3 mr-1" />
                        {selectedPhoto.event_tag}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Like
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  {selectedPhoto.description && (
                    <p className="text-gray-600 mb-4">
                      {selectedPhoto.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{format(new Date(selectedPhoto.upload_date), 'MMMM dd, yyyy')}</span>
                      </div>
                      {selectedPhoto.uploaded_by && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>Uploaded by Admin</span>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}