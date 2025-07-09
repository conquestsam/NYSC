'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  DollarSign, 
  Users, 
  Building,
  Copy,
  CheckCircle,
  CreditCard,
  Banknote,
  Phone,
  Mail,
  Gift
} from 'lucide-react'

export default function Donation() {
  const [selectedAmount, setSelectedAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [copiedAccount, setCopiedAccount] = useState('')

  const predefinedAmounts = ['5000', '10000', '25000', '50000', '100000']

  const bankAccounts = [
    {
      bank: 'First Bank Nigeria',
      accountName: 'NYSC Toru-Orua Community Fund',
      accountNumber: '2034567890',
      sortCode: '011'
    },
    {
      bank: 'Zenith Bank',
      accountName: 'NYSC Toru-Orua Development Fund',
      accountNumber: '1234567890',
      sortCode: '057'
    },
    {
      bank: 'GTBank',
      accountName: 'NYSC Toru-Orua Welfare Fund',
      accountNumber: '0123456789',
      sortCode: '058'
    }
  ]

  const impactAreas = [
    {
      icon: Building,
      title: 'Infrastructure Development',
      description: 'Support the construction and maintenance of community facilities, orientation camp improvements, and essential infrastructure.',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      icon: Users,
      title: 'Corps Member Welfare',
      description: 'Provide assistance for corps members in need, emergency support, and welfare programs.',
      color: 'bg-green-100 text-green-800'
    },
    {
      icon: Heart,
      title: 'Community Projects',
      description: 'Fund CDS activities, health outreach programs, educational initiatives, and community development projects.',
      color: 'bg-red-100 text-red-800'
    },
    {
      icon: Gift,
      title: 'Skills Development',
      description: 'Support SAED programs, entrepreneurship training, and skills acquisition initiatives for corps members.',
      color: 'bg-purple-100 text-purple-800'
    }
  ]

  const copyToClipboard = (text: string, accountType: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAccount(accountType)
    setTimeout(() => setCopiedAccount(''), 2000)
  }

  const handleDonorInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDonorInfo({
      ...donorInfo,
      [e.target.name]: e.target.value,
    })
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
            Support Our Community
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your generous donations help us build a stronger community and support corps members in their service year
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Amount Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Choose Donation Amount
                  </CardTitle>
                  <CardDescription>
                    Select a predefined amount or enter a custom amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {predefinedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? 'default' : 'outline'}
                        className="h-12"
                        onClick={() => {
                          setSelectedAmount(amount)
                          setCustomAmount('')
                        }}
                      >
                        ₦{parseInt(amount).toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customAmount">Custom Amount (₦)</Label>
                    <Input
                      id="customAmount"
                      type="number"
                      placeholder="Enter custom amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value)
                        setSelectedAmount('')
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bank Account Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                    Bank Account Details
                  </CardTitle>
                  <CardDescription>
                    Transfer your donation to any of these accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bankAccounts.map((account, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{account.bank}</h3>
                          <p className="text-sm text-gray-600">{account.accountName}</p>
                        </div>
                        <Badge variant="outline">{account.sortCode}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white rounded p-3 border">
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-mono text-lg font-semibold">{account.accountNumber}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(account.accountNumber, account.bank)}
                        >
                          {copiedAccount === account.bank ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Alert>
                    <Banknote className="h-4 w-4" />
                    <AlertDescription>
                      Please use your full name as the transfer reference and notify us via the contact form below after making your donation.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>

            {/* Donor Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-green-600" />
                    Donor Information (Optional)
                  </CardTitle>
                  <CardDescription>
                    Help us acknowledge your contribution and stay in touch
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter your full name"
                        value={donorInfo.name}
                        onChange={handleDonorInfoChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={donorInfo.email}
                        onChange={handleDonorInfoChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={donorInfo.phone}
                      onChange={handleDonorInfoChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Leave a message or specify how you'd like your donation to be used..."
                      value={donorInfo.message}
                      onChange={handleDonorInfoChange}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Notify Us of Donation
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Impact Areas */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-600" />
                    Your Impact
                  </CardTitle>
                  <CardDescription>
                    See how your donation makes a difference
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {impactAreas.map((area, index) => (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${area.color.split(' ')[0]} flex-shrink-0`}>
                            <area.icon className={`h-5 w-5 ${area.color.split(' ')[1]}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {area.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {area.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Donations */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Donations</CardTitle>
                  <CardDescription>
                    Thank you to our recent supporters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">Anonymous Donor</p>
                        <p className="text-sm text-gray-600">2 days ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">₦50,000</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">John D.</p>
                        <p className="text-sm text-gray-600">1 week ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">₦25,000</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">Alumni Association</p>
                        <p className="text-sm text-gray-600">2 weeks ago</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">₦100,000</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>
                    Contact us for donation assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="text-sm">+234 803 123 4567</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm">donations@toru-orua.com</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Thank You Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
            <CardContent className="p-8">
              <Heart className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">
                Thank You for Your Generosity
              </h2>
              <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                Every donation, no matter the size, makes a meaningful difference in our community. 
                Your support helps us continue our mission of service and development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-yellow-400 text-green-600 hover:bg-yellow-500">
                  Share Our Cause
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  Learn More About Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}