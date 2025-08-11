'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Filter,
  FileText,
  BarChart3
} from 'lucide-react'
import { supabase, FinancialTransaction, FinancialCategory } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import jsPDF from 'jspdf'

export default function FinancialStatements() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<(FinancialTransaction & { category: FinancialCategory })[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<(FinancialTransaction & { category: FinancialCategory })[]>([])
  const [periodFilter, setPeriodFilter] = useState('current_month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenditure: 0,
    netBalance: 0,
    transactionCount: 0
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactionsByPeriod()
  }, [transactions, periodFilter, customStartDate, customEndDate])

  const fetchTransactions = async () => {
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

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const filterTransactionsByPeriod = () => {
    let startDate: Date
    let endDate: Date
    const now = new Date()

    switch (periodFilter) {
      case 'current_month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        startDate = startOfMonth(lastMonth)
        endDate = endOfMonth(lastMonth)
        break
      case 'current_year':
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      case 'last_year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1)
        startDate = startOfYear(lastYear)
        endDate = endOfYear(lastYear)
        break
      case 'custom':
        if (!customStartDate || !customEndDate) return
        startDate = new Date(customStartDate)
        endDate = new Date(customEndDate)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transaction_date)
      return transactionDate >= startDate && transactionDate <= endDate
    })

    setFilteredTransactions(filtered)

    // Calculate summary
    const totalRevenue = filtered
      .filter(t => t.category?.type === 'revenue')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenditure = filtered
      .filter(t => t.category?.type === 'expenditure')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    setSummary({
      totalRevenue,
      totalExpenditure,
      netBalance: totalRevenue - totalExpenditure,
      transactionCount: filtered.length
    })
  }

  const downloadStatement = async () => {
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      
      // Header
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('NYSC Toru-Orua Financial Statement', pageWidth / 2, 25, { align: 'center' })
      
      // Period
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const periodText = getPeriodText()
      pdf.text(`Period: ${periodText}`, pageWidth / 2, 40, { align: 'center' })
      pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, 50, { align: 'center' })

      // Summary Box
      pdf.setDrawColor(0, 128, 0)
      pdf.setLineWidth(1)
      pdf.rect(20, 65, pageWidth - 40, 40)
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Financial Summary', 25, 80)
      
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Total Revenue: ₦${summary.totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 25, 90)
      pdf.text(`Total Expenditure: ₦${summary.totalExpenditure.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 25, 98)
      
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(summary.netBalance >= 0 ? 0 : 255, summary.netBalance >= 0 ? 128 : 0, 0)
      pdf.text(`Net Balance: ₦${summary.netBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, pageWidth - 25, 90, { align: 'right' })
      pdf.setTextColor(0, 0, 0)
      
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Total Transactions: ${summary.transactionCount}`, pageWidth - 25, 98, { align: 'right' })

      // Transactions Table
      let yPosition = 125
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Transaction Details', 20, yPosition)
      
      yPosition += 15
      pdf.setFontSize(9)
      
      // Table headers
      pdf.text('Date', 20, yPosition)
      pdf.text('Description', 45, yPosition)
      pdf.text('Category', 110, yPosition)
      pdf.text('Amount', 150, yPosition)
      pdf.text('Reference', 175, yPosition)
      
      yPosition += 5
      pdf.line(20, yPosition, pageWidth - 20, yPosition)
      yPosition += 10

      pdf.setFont('helvetica', 'normal')
      
      filteredTransactions.forEach((transaction) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 30
        }

        const date = format(new Date(transaction.transaction_date), 'MM/dd/yy')
        const title = transaction.title.length > 20 ? transaction.title.substring(0, 20) + '...' : transaction.title
        const category = transaction.category?.name.length > 12 ? transaction.category.name.substring(0, 12) + '...' : transaction.category?.name
        const amount = `₦${Number(transaction.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
        const ref = transaction.reference_number?.substring(0, 8) || ''

        pdf.text(date, 20, yPosition)
        pdf.text(title, 45, yPosition)
        pdf.text(category || '', 110, yPosition)
        
        if (transaction.category?.type === 'revenue') {
          pdf.setTextColor(0, 128, 0)
          pdf.text(`+${amount}`, 150, yPosition)
        } else {
          pdf.setTextColor(255, 0, 0)
          pdf.text(`-${amount}`, 150, yPosition)
        }
        
        pdf.setTextColor(0, 0, 0)
        pdf.text(ref, 175, yPosition)
        
        yPosition += 10
      })

      // Footer
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('This statement is computer-generated and does not require a signature.', pageWidth / 2, 285, { align: 'center' })

      // Download
      const filename = `Financial_Statement_${periodFilter}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(filename)
      
      toast.success('Financial statement downloaded successfully')
    } catch (error) {
      console.error('Error generating statement:', error)
      toast.error('Failed to generate statement')
    }
  }

  const getPeriodText = () => {
    const now = new Date()
    switch (periodFilter) {
      case 'current_month':
        return format(now, 'MMMM yyyy')
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return format(lastMonth, 'MMMM yyyy')
      case 'current_year':
        return `Year ${now.getFullYear()}`
      case 'last_year':
        return `Year ${now.getFullYear() - 1}`
      case 'custom':
        return `${format(new Date(customStartDate), 'MMM dd, yyyy')} - ${format(new Date(customEndDate), 'MMM dd, yyyy')}`
      default:
        return format(now, 'MMMM yyyy')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount)
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
      {/* Period Filter and Download */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {periodFilter === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <Button onClick={downloadStatement} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenditure</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenditure)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netBalance)}
                </p>
              </div>
              <Wallet className={`h-8 w-8 ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statement Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Financial Statement - {getPeriodText()}
          </CardTitle>
          <CardDescription>
            Detailed financial transactions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">No financial transactions found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction, index) => {
                    // Calculate running balance
                    const runningBalance = filteredTransactions
                      .slice(0, index + 1)
                      .reduce((balance, t) => {
                        return t.category?.type === 'revenue' 
                          ? balance + Number(t.amount)
                          : balance - Number(t.amount)
                      }, 0)

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
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
                          <Badge variant="outline">
                            {transaction.category?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            transaction.category?.type === 'revenue' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {transaction.category?.type === 'revenue' ? 'Revenue' : 'Expenditure'}
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
                          <span className="text-sm font-mono">{transaction.reference_number}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(runningBalance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <TrendingUp className="h-5 w-5 mr-2" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(new Set(filteredTransactions
                .filter(t => t.category?.type === 'revenue')
                .map(t => t.category?.name)))
                .map((categoryName) => {
                  const categoryTotal = filteredTransactions
                    .filter(t => t.category?.name === categoryName)
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                  
                  const percentage = summary.totalRevenue > 0 ? (categoryTotal / summary.totalRevenue) * 100 : 0

                  return (
                    <div key={categoryName} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{categoryName}</span>
                        <span className="text-sm text-green-600">{formatCurrency(categoryTotal)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total revenue</div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Expenditure Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <TrendingDown className="h-5 w-5 mr-2" />
              Expenditure Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(new Set(filteredTransactions
                .filter(t => t.category?.type === 'expenditure')
                .map(t => t.category?.name)))
                .map((categoryName) => {
                  const categoryTotal = filteredTransactions
                    .filter(t => t.category?.name === categoryName)
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                  
                  const percentage = summary.totalExpenditure > 0 ? (categoryTotal / summary.totalExpenditure) * 100 : 0

                  return (
                    <div key={categoryName} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{categoryName}</span>
                        <span className="text-sm text-red-600">{formatCurrency(categoryTotal)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total expenditure</div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

//   function formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 2
//     }).format(amount)
//   }

//   function getPeriodText(): string {
//     const now = new Date()
//     switch (periodFilter) {
//       case 'current_month':
//         return format(now, 'MMMM yyyy')
//       case 'last_month':
//         const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
//         return format(lastMonth, 'MMMM yyyy')
//       case 'current_year':
//         return `Year ${now.getFullYear()}`
//       case 'last_year':
//         return `Year ${now.getFullYear() - 1}`
//       case 'custom':
//         return `${format(new Date(customStartDate), 'MMM dd, yyyy')} - ${format(new Date(customEndDate), 'MMM dd, yyyy')}`
//       default:
//         return format(now, 'MMMM yyyy')
//     }
//   }
}