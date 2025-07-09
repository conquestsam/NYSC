'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Bell
} from 'lucide-react'
import { supabase, Notification } from '@/lib/supabase'

export default function NotificationModal() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchActiveNotifications()
  }, [])

  useEffect(() => {
    if (notifications.length > 0) {
      // Show first notification after 2 seconds
      const timer = setTimeout(() => {
        setCurrentNotification(notifications[0])
        setCurrentIndex(0)
        setIsOpen(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [notifications])

  const fetchActiveNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'warning': return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'error': return <AlertCircle className="h-6 w-6 text-red-600" />
      default: return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const handleNext = () => {
    if (currentIndex < notifications.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentNotification(notifications[nextIndex])
    } else {
      setIsOpen(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!currentNotification) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`${getNotificationColor(currentNotification.type)} border-2 rounded-lg`}
            >
              <DialogHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(currentNotification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                          {currentNotification.title}
                        </DialogTitle>
                        <Badge className={getBadgeColor(currentNotification.type)}>
                          {currentNotification.type.toUpperCase()}
                        </Badge>
                      </div>
                      <DialogDescription className="text-gray-600">
                        {currentNotification.message}
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="px-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Bell className="h-4 w-4" />
                    <span>
                      {new Date(currentNotification.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {notifications.length > 1 && (
                      <span className="text-sm text-gray-500">
                        {currentIndex + 1} of {notifications.length}
                      </span>
                    )}
                    
                    <div className="flex space-x-2">
                      {currentIndex < notifications.length - 1 ? (
                        <Button onClick={handleNext} size="sm">
                          Next
                        </Button>
                      ) : (
                        <Button onClick={handleClose} size="sm">
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {notifications.length > 1 && (
                  <div className="mt-4">
                    <div className="flex space-x-1">
                      {notifications.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex 
                              ? 'bg-gray-600 w-8' 
                              : 'bg-gray-300 w-2'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}