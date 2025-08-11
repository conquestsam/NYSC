'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  PieChart,
  BarChart3,
  Download,
  Calendar,
  Filter,
  Eye,
  Plus
} from 'lucide-react'
import { supabase, FinancialTransaction, FinancialCategory, FinancialSummary } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import TransactionManagement from './TransactionManagement'
import FinancialReports from './FinancialReports'
import FinancialStatements from './FinancialStatement'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FinancialStats {
  totalRevenue: number
  totalExpenditure: number
  availableBalance: number
  monthlyRevenue: number
  monthlyExpenditure: number
  transactionCount: number
  pendingTransactions: number
}

export default function FinancialDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenditure: 0,
    availableBalance: 0,
    monthlyRevenue: 0,
    monthlyExpenditure: 0,
    transactionCount: 0,
    pendingTransactions: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<(FinancialTransaction & { category: FinancialCategory })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    category_id: '',
    title: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    receipt_url: ''
  })

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentTransactions(),
        fetchCategories()
      ])
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Get all approved transactions
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)

      if (error) throw error

      const currentMonth = new Date()
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Calculate totals
      const totalRevenue = transactions
        ?.filter(t => t.category?.type === 'revenue')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const totalExpenditure = transactions
        ?.filter(t => t.category?.type === 'expenditure')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const monthlyRevenue = transactions
        ?.filter(t => 
          t.category?.type === 'revenue' && 
          new Date(t.transaction_date) >= monthStart && 
          new Date(t.transaction_date) <= monthEnd
        )
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      const monthlyExpenditure = transactions
        ?.filter(t => 
          t.category?.type === 'expenditure' && 
          new Date(t.transaction_date) >= monthStart && 
          new Date(t.transaction_date) <= monthEnd
        )
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      // Get pending transactions count
      const { count: pendingCount } = await supabase
        .from('financial_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending')
        .eq('is_active', true)

      setStats({
        totalRevenue,
        totalExpenditure,
        availableBalance: totalRevenue - totalExpenditure,
        monthlyRevenue,
        monthlyExpenditure,
        transactionCount: transactions?.length || 0,
        pendingTransactions: pendingCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .order('transaction_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentTransactions(data || [])
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const createTransaction = async () => {
    if (!profile || !transactionForm.category_id || !transactionForm.title || !transactionForm.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...transactionForm,
          amount: parseFloat(transactionForm.amount),
          created_by: profile.id,
          approval_status: 'approved' // Auto-approve for super admin
        }])
        .select(`
          *,
          category:financial_categories(*)
        `)

      if (error) throw error

      setIsCreateDialogOpen(false)
      resetTransactionForm()
      fetchFinancialData() // Refresh all data
      toast.success('Transaction created successfully')
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to create transaction')
    }
  }

  const resetTransactionForm = () => {
    setTransactionForm({
      category_id: '',
      title: '',
      description: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      receipt_url: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      title: 'Total Expenditure',
      value: formatCurrency(stats.totalExpenditure),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '+8.2%',
      changeType: 'negative'
    },
    {
      title: 'Available Balance',
      value: formatCurrency(stats.availableBalance),
      icon: Wallet,
      color: stats.availableBalance >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: stats.availableBalance >= 0 ? 'bg-blue-100' : 'bg-red-100',
      change: stats.availableBalance >= 0 ? 'Positive' : 'Deficit',
      changeType: stats.availableBalance >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'This month',
      changeType: 'neutral'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
              <p className="text-gray-600 mt-2">Comprehensive financial tracking and reporting system</p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              {profile?.role === 'super_admin' && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetTransactionForm} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Transaction</DialogTitle>
                      <DialogDescription>
                        Record a new financial transaction
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select value={transactionForm.category_id} onValueChange={(value) => setTransactionForm({ ...transactionForm, category_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => c.type === 'revenue').length > 0 && (
                                <>
                                  {categories.filter(c => c.type === 'revenue').map((category) => (
                                    <SelectItem key={`revenue-${category.id}`} value={category.id}>
                                      <span className="text-green-600 font-medium">📈</span> {category.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {categories.filter(c => c.type === 'expenditure').length > 0 && (
                                <>
                                  {categories.filter(c => c.type === 'expenditure').map((category) => (
                                    <SelectItem key={`expenditure-${category.id}`} value={category.id}>
                                      <span className="text-red-600 font-medium">📉</span> {category.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (₦)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={transactionForm.amount}
                            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter transaction title"
                          value={transactionForm.title}
                          onChange={(e) => setTransactionForm({ ...transactionForm, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Enter detailed description"
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="transaction_date">Transaction Date</Label>
                          <Input
                            id="transaction_date"
                            type="date"
                            value={transactionForm.transaction_date}
                            onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="receipt_url">Receipt URL (Optional)</Label>
                          <Input
                            id="receipt_url"
                            placeholder="https://example.com/receipt.pdf"
                            value={transactionForm.receipt_url}
                            onChange={(e) => setTransactionForm({ ...transactionForm, receipt_url: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createTransaction}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Create Transaction
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm ${
                          stat.changeType === 'positive' ? 'text-green-600' : 
                          stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>Latest approved financial activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No transactions available</p>
                    ) : (
                      recentTransactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.category?.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.category?.type === 'revenue' ? (
                                <TrendingUp className={`h-5 w-5 text-green-600`} />
                              ) : (
                                <TrendingDown className={`h-5 w-5 text-red-600`} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.title}</p>
                              <p className="text-sm text-gray-600">{transaction.category?.name}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.category?.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.category?.type === 'revenue' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.reference_number}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('transactions')}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary Chart Placeholder */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                    Financial Overview
                  </CardTitle>
                  <CardDescription>Revenue vs Expenditure breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Revenue Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Revenue</span>
                        <span className="text-sm text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${stats.totalRevenue > 0 ? 
                              (stats.totalRevenue / (stats.totalRevenue + stats.totalExpenditure)) * 100 : 0
                            }%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Expenditure Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Expenditure</span>
                        <span className="text-sm text-red-600">{formatCurrency(stats.totalExpenditure)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-red-600 h-3 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${stats.totalExpenditure > 0 ? 
                              (stats.totalExpenditure / (stats.totalRevenue + stats.totalExpenditure)) * 100 : 0
                            }%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Net Balance */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Net Balance</span>
                        <span className={`text-lg font-bold ${
                          stats.availableBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(stats.availableBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
                        <p className="text-sm text-gray-600">Total Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{stats.pendingTransactions}</p>
                        <p className="text-sm text-gray-600">Pending Approval</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManagement onDataChange={fetchFinancialData} />
          </TabsContent>

          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>

          <TabsContent value="statements">
            <FinancialStatements />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}