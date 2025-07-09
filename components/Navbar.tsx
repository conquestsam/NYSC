'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Menu, X, User, LogOut, Settings, Vote } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-green-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">NY</span>
            </div>
            <span className="text-xl font-bold text-white">NYSC Toru-Orua</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-white hover:text-green-100 bg-transparent hover:bg-green-700 data-[state=open]:bg-green-700">
                    Activities
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/activities/cds"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">CDS Activities</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Community Development Service activities
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/activities/other"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">Other Activities</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              POP, SAED, and other NYSC activities
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/jobs" legacyBehavior passHref>
                    <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:text-green-100 hover:bg-green-700 focus:bg-green-700 focus:text-green-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                      Jobs/Scholarships
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/about" legacyBehavior passHref>
                    <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:text-green-100 hover:bg-green-700 focus:bg-green-700 focus:text-green-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                      About Us
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                {user && (
                  <NavigationMenuItem>
                    <Link href="/gallery" legacyBehavior passHref>
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:text-green-100 hover:bg-green-700 focus:bg-green-700 focus:text-green-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                        Gallery
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                  <Link href="/contact" legacyBehavior passHref>
                    <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:text-green-100 hover:bg-green-700 focus:bg-green-700 focus:text-green-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                      Contact
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/donation" legacyBehavior passHref>
                    <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:text-green-100 hover:bg-green-700 focus:bg-green-700 focus:text-green-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                      Donation
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-green-700">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.photo_url} alt={profile?.full_name} />
                      <AvatarFallback className="bg-green-500 text-white">{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/elections" className="flex items-center">
                      <Vote className="mr-2 h-4 w-4" />
                      Elections
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'super_admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-yellow-400 text-green-600 hover:bg-yellow-500">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-green-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/activities/cds" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                CDS Activities
              </Link>
              <Link href="/activities/other" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                Other Activities
              </Link>
              <Link href="/jobs" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                Jobs/Scholarships
              </Link>
              <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                About Us
              </Link>
              {user && (
                <Link href="/gallery" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                  Gallery
                </Link>
              )}
              <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                Contact
              </Link>
              <Link href="/donation" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                Donation
              </Link>
              
              {user ? (
                <div className="border-t border-green-700 pt-4">
                  <div className="flex items-center px-3 py-2">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={profile?.photo_url} alt={profile?.full_name} />
                      <AvatarFallback className="bg-green-500 text-white">{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                      <p className="text-xs text-green-200">{profile?.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                    Dashboard
                  </Link>
                  <Link href="/elections" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                    Elections
                  </Link>
                  {profile?.role === 'super_admin' && (
                    <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-green-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-green-700 pt-4 space-y-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-green-700">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="w-full bg-yellow-400 text-green-600 hover:bg-yellow-500">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}