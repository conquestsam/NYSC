import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NYSC Toru-Orua Portal',
  description: 'Official portal for NYSC Toru-Orua corps members',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>NYSC Toru-Orua | Community, Activities, and Support for Corps Members</title>
        <meta name="description" content="Official NYSC Toru-Orua portal. Find information on activities, jobs, scholarships, donations, and community projects for corps members in Sagbama, Bayelsa State." />
        <meta name="keywords" content="NYSC, Toru-Orua, Bayelsa, Corps Members, Community, CDS, Jobs, Scholarships, Donation, Nigeria" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://nysc-toruorua.vercel.app/" />
        {/* Open Graph for social sharing */}
        <meta property="og:title" content="NYSC Toru-Orua | Community, Activities, and Support" />
        <meta property="og:description" content="Official NYSC Toru-Orua portal for corps members and community engagement." />
        <meta property="og:url" content="https://nysc-toruorua.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://nysc-toruorua.vercel.app/og-image.jpg" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NYSC Toru-Orua | Community, Activities, and Support" />
        <meta name="twitter:description" content="Official NYSC Toru-Orua portal for corps members and community engagement." />
        <meta name="twitter:image" content="https://nysc-toruorua.vercel.app/og-image.jpg" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        {/* Language */}
        <meta httpEquiv="Content-Language" content="en" />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster />
        <Sonner />
      </body>
    </html>
  )
}