'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, GraduationCap, Building, Phone, Mail, Edit, Vote, MessageSquare, Camera } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile.full_name}!</h1>
          <p className="text-gray-600 mt-2">Manage your profile and stay connected with the community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={profile.photo_url} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{profile.full_name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
                <div className="flex justify-center mt-4">
                  <Badge variant={profile.is_verified ? "default" : "secondary"}>
                    {profile.is_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{profile.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{profile.state_code || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <span>{profile.institution || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{profile.ppa || 'Not provided'}</span>
                  </div>
                </div>
                {profile.bio && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-700">{profile.bio}</p>
                  </div>
                )}
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Access key features of the portal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/elections">
                    <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                      <Vote className="h-6 w-6" />
                      <span>Elections</span>
                    </Button>
                  </Link>
                  <Link href="/suggestions">
                    <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                      <MessageSquare className="h-6 w-6" />
                      <span>Suggestions</span>
                    </Button>
                  </Link>
                  <Link href="/gallery">
                    <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2" variant="outline">
                      <Camera className="h-6 w-6" />
                      <span>Gallery</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Stay updated with the latest happenings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Welcome to NYSC Toru-Orua Portal</p>
                      <p className="text-xs text-gray-500">Account created successfully</p>
                    </div>
                  </div>
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activities to show</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Important updates and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900">Profile Verification</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your profile is pending verification. Please ensure all information is accurate.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900">Community Guidelines</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Welcome to our community! Please review our guidelines for a positive experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}