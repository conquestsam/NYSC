'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Eye
} from 'lucide-react'
import { supabase, FinancialTransaction, FinancialCategory } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface TransactionManagementProps {
  onDataChange: () => void
}

export default function TransactionManagement({ onDataChange }: TransactionManagementProps) {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<(FinancialTransaction & { category: FinancialCategory })[]>([])
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<(FinancialTransaction & { category: FinancialCategory })[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [transactionForm, setTransactionForm] = useState({
    category_id: '',
    title: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    receipt_url: ''
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'revenue' as 'revenue' | 'expenditure',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, typeFilter, statusFilter, dateFilter])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchTransactions(),
        fetchCategories()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('is_active', true)
        .order('transaction_date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
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

  const filterTransactions = () => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.category?.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.approval_status === statusFilter)
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date)
        return transactionDate.getMonth() === filterDate.getMonth() && 
               transactionDate.getFullYear() === filterDate.getFullYear()
      })
    }

    setFilteredTransactions(filtered)
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

      setTransactions([data[0], ...transactions])
      setIsCreateDialogOpen(false)
      resetTransactionForm()
      onDataChange()
      toast.success('Transaction created successfully')
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Failed to create transaction')
    }
  }

  const createCategory = async () => {
    if (!profile || !categoryForm.name || !categoryForm.type) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert([{
          ...categoryForm,
          created_by: profile.id
        }])
        .select()

      if (error) throw error

      setCategories([...categories, data[0]])
      setIsCategoryDialogOpen(false)
      resetCategoryForm()
      toast.success('Category created successfully')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  }

  const updateTransactionStatus = async (transactionId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!profile) return

    try {
      const updateData: any = {
        approval_status: status,
        approved_by: profile.id,
        approval_date: new Date().toISOString()
      }

      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason
      }

      const { error } = await supabase
        .from('financial_transactions')
        .update(updateData)
        .eq('id', transactionId)

      if (error) throw error

      setTransactions(transactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, ...updateData }
          : transaction
      ))
      if (onDataChange) {
        onDataChange()
      }
      toast.success(`Transaction ${status} successfully`)
    } catch (error) {
      console.error('Error updating transaction status:', error)
      toast.error('Failed to update transaction status')
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ is_active: false })
        .eq('id', transactionId)

      if (error) throw error

      setTransactions(transactions.filter(transaction => transaction.id !== transactionId))
      if (onDataChange) {
        onDataChange()
      }
      toast.success('Transaction deleted successfully')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
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

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      type: 'revenue',
      description: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expenditure">Expenditure</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by month"
            />
            <div className="flex space-x-2">
              {profile?.role === 'super_admin' && (
                <>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetTransactionForm} className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={resetCategoryForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Category
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Transactions</CardTitle>
          <CardDescription>Complete record of all financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  {profile?.role === 'super_admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.title}</p>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        transaction.category?.type === 'revenue' ? 'border-green-200 text-green-800' : 'border-red-200 text-red-800'
                      }>
                        {transaction.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        transaction.category?.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.category?.type === 'revenue' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.approval_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">{transaction.reference_number}</span>
                        {transaction.receipt_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    {profile?.role === 'super_admin' && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {transaction.approval_status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTransactionStatus(transaction.id, 'rejected', 'Rejected by admin')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTransaction(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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

      {/* Create Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new revenue or expenditure category
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_name">Category Name</Label>
                <Input
                  id="category_name"
                  placeholder="Enter category name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_type">Type</Label>
                <Select value={categoryForm.type} onValueChange={(value: 'revenue' | 'expenditure') => setCategoryForm({ ...categoryForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expenditure">Expenditure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_description">Description</Label>
              <Textarea
                id="category_description"
                placeholder="Enter category description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}