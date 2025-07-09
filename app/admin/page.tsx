'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Image, 
  Briefcase, 
  Calendar, 
  Info, 
  Camera, 
  Vote,
  Settings,
  Upload,
  Edit,
  Trash2,
  Eye,
  Plus,
  Bell,
  Users2Icon
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminPanel() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    activeElections: 0,
    totalVotes: 0,
    galleryImages: 0,
    activities: 0
  })

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'super_admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchStats()
    }
  }, [profile])

  const fetchStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: verifiedUsers },
        { count: activeElections },
        { count: totalVotes },
        { count: galleryImages },
        { count: activities }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('elections').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('photo_gallery').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])

      setStats({
        totalUsers: totalUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        activeElections: activeElections || 0,
        totalVotes: totalVotes || 0,
        galleryImages: galleryImages || 0,
        activities: activities || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'super_admin') {
    return null
  }

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and verification',
      icon: Users2Icon,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Hero Slides',
      description: 'Manage homepage hero slider',
      icon: Image,
      href: '/admin/hero-slides',
      color: 'bg-purple-500'
    },
    {
      title: 'Jobs & Scholarships',
      description: 'Manage job and scholarship listings',
      icon: Briefcase,
      href: '/admin/jobs',
      color: 'bg-green-500'
    },
    {
      title: 'Activities',
      description: 'Manage CDS and other activities',
      icon: Calendar,
      href: '/admin/activities',
      color: 'bg-orange-500'
    },
    {
      title: 'About Us',
      description: 'Manage about us sections',
      icon: Info,
      href: '/admin/about',
      color: 'bg-indigo-500'
    },
    {
      title: 'Photo Gallery',
      description: 'Manage photo gallery',
      icon: Camera,
      href: '/admin/gallery',
      color: 'bg-pink-500'
    },
    {
      title: 'Elections',
      description: 'Manage elections and candidates',
      icon: Vote,
      href: '/admin/elections',
      color: 'bg-red-500'
    },
    {
      title: 'Notifications',
      description: 'Manage notifications and announcements',
      icon: Bell,
      href: '/admin/notifications',
      color: 'bg-indigo-500'
    },
    {
      title: 'Settings',
      description: 'System settings and configuration',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ]

  const statsCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
    { title: 'Verified Users', value: stats.verifiedUsers, icon: Users, color: 'text-green-600' },
    { title: 'Active Elections', value: stats.activeElections, icon: Vote, color: 'text-red-600' },
    { title: 'Total Votes', value: stats.totalVotes, icon: Vote, color: 'text-purple-600' },
    { title: 'Gallery Images', value: stats.galleryImages, icon: Camera, color: 'text-pink-600' },
    { title: 'Activities', value: stats.activities, icon: Calendar, color: 'text-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your NYSC Toru-Orua portal</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage different aspects of your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Admin panel accessed</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <div className="text-center py-8 text-gray-500">
                <p>No recent activities to show</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}