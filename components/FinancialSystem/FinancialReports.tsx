'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Download, 
  FileText, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Eye,
  Plus,
  Filter
} from 'lucide-react'
import { supabase, FinancialReport, FinancialTransaction, FinancialCategory } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import jsPDF from 'jspdf'

export default function FinancialReports() {
  const { profile } = useAuth()
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  const [reportForm, setReportForm] = useState({
    report_type: 'statement' as 'statement' | 'summary' | 'detailed' | 'audit',
    title: '',
    description: '',
    period_start: '',
    period_end: '',
    is_public: false
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!profile || !reportForm.period_start || !reportForm.period_end) {
      toast.error('Please fill in all required fields')
      return
    }

    setGenerating(true)
    try {
      // Fetch transactions for the period
      const { data: transactions, error: transError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .gte('transaction_date', reportForm.period_start)
        .lte('transaction_date', reportForm.period_end)
        .order('transaction_date', { ascending: false })

      if (transError) throw transError

      // Generate PDF
      const pdfBlob = await generatePDFReport(transactions || [], reportForm)
      
      // For now, we'll create a report record without file upload
      // In production, you would upload the PDF to Supabase Storage
      const { data, error } = await supabase
        .from('financial_reports')
        .insert([{
          ...reportForm,
          generated_by: profile.id,
          file_size: pdfBlob.size
        }])
        .select()

      if (error) throw error

      setReports([data[0], ...reports])
      setIsGenerateDialogOpen(false)
      resetReportForm()
      
      // Download the generated PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportForm.title.replace(/\s+/g, '_')}_${reportForm.period_start}_to_${reportForm.period_end}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Report generated and downloaded successfully')
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const generatePDFReport = async (
    transactions: (FinancialTransaction & { category: FinancialCategory })[], 
    reportConfig: typeof reportForm
  ): Promise<Blob> => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Header
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('NYSC Toru-Orua Financial Report', pageWidth / 2, 30, { align: 'center' })
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Report Type: ${reportConfig.report_type.toUpperCase()}`, 20, 50)
    pdf.text(`Period: ${format(new Date(reportConfig.period_start), 'MMM dd, yyyy')} - ${format(new Date(reportConfig.period_end), 'MMM dd, yyyy')}`, 20, 60)
    pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 70)
    pdf.text(`Generated by: ${profile?.full_name || 'System'}`, 20, 80)

    // Summary
    const totalRevenue = transactions
      .filter(t => t.category?.type === 'revenue')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const totalExpenditure = transactions
      .filter(t => t.category?.type === 'expenditure')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const netBalance = totalRevenue - totalExpenditure

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Financial Summary', 20, 100)
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Total Revenue: ₦${totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 20, 115)
    pdf.text(`Total Expenditure: ₦${totalExpenditure.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 20, 125)
    pdf.text(`Net Balance: ₦${netBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 20, 135)
    pdf.text(`Total Transactions: ${transactions.length}`, 20, 145)

    // Transactions Table
    let yPosition = 165
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Transaction Details', 20, yPosition)
    
    yPosition += 15
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    
    // Table headers
    pdf.text('Date', 20, yPosition)
    pdf.text('Description', 50, yPosition)
    pdf.text('Category', 120, yPosition)
    pdf.text('Amount', 160, yPosition)
    pdf.text('Ref#', 180, yPosition)
    
    yPosition += 5
    pdf.line(20, yPosition, pageWidth - 20, yPosition) // Header line
    yPosition += 10

    pdf.setFont('helvetica', 'normal')
    
    transactions.forEach((transaction, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 30
      }

      const date = format(new Date(transaction.transaction_date), 'MM/dd/yy')
      const title = transaction.title.length > 25 ? transaction.title.substring(0, 25) + '...' : transaction.title
      const category = transaction.category?.name.length > 15 ? transaction.category.name.substring(0, 15) + '...' : transaction.category?.name
      const amount = `₦${Number(transaction.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
      const ref = transaction.reference_number?.substring(0, 10) || ''

      pdf.text(date, 20, yPosition)
      pdf.text(title, 50, yPosition)
      pdf.text(category || '', 120, yPosition)
      
      // Color code amounts
      if (transaction.category?.type === 'revenue') {
        pdf.setTextColor(0, 128, 0) // Green
        pdf.text(`+${amount}`, 160, yPosition)
      } else {
        pdf.setTextColor(255, 0, 0) // Red
        pdf.text(`-${amount}`, 160, yPosition)
      }
      
      pdf.setTextColor(0, 0, 0) // Reset to black
      pdf.text(ref, 180, yPosition)
      
      yPosition += 12
    })

    // Footer
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text('This is a computer-generated report from NYSC Toru-Orua Financial System', pageWidth / 2, pageHeight - 20, { align: 'center' })
    pdf.text(`Page 1 of 1 | Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    return pdf.output('blob')
  }

  const downloadReport = async (reportId: string) => {
    try {
      // Increment download count
      const { error } = await supabase
        .from('financial_reports')
        .update({ download_count: supabase.sql`download_count + 1` })
        .eq('id', reportId)

      if (error) throw error

      // In a real implementation, you would download the file from Supabase Storage
      toast.success('Report download started')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Failed to download report')
    }
  }

  const resetReportForm = () => {
    setReportForm({
      report_type: 'statement',
      title: '',
      description: '',
      period_start: '',
      period_end: '',
      is_public: false
    })
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'summary': return <BarChart3 className="h-4 w-4" />
      case 'detailed': return <FileText className="h-4 w-4" />
      case 'audit': return <Eye className="h-4 w-4" />
      default: return <PieChart className="h-4 w-4" />
    }
  }

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'summary': return 'bg-blue-100 text-blue-800'
      case 'detailed': return 'bg-purple-100 text-purple-800'
      case 'audit': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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
      {/* Generate Report Section */}
      {profile?.role === 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Generate New Report
            </CardTitle>
            <CardDescription>Create comprehensive financial reports for any period</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetReportForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Generate Financial Report</DialogTitle>
                  <DialogDescription>
                    Create a comprehensive financial report for the selected period
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report_type">Report Type</Label>
                      <Select value={reportForm.report_type} onValueChange={(value: any) => setReportForm({ ...reportForm, report_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="statement">Financial Statement</SelectItem>
                          <SelectItem value="summary">Summary Report</SelectItem>
                          <SelectItem value="detailed">Detailed Report</SelectItem>
                          <SelectItem value="audit">Audit Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Report Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter report title"
                        value={reportForm.title}
                        onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Enter report description"
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period_start">Start Date</Label>
                      <Input
                        id="period_start"
                        type="date"
                        value={reportForm.period_start}
                        onChange={(e) => setReportForm({ ...reportForm, period_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period_end">End Date</Label>
                      <Input
                        id="period_end"
                        type="date"
                        value={reportForm.period_end}
                        onChange={(e) => setReportForm({ ...reportForm, period_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={reportForm.is_public}
                      onChange={(e) => setReportForm({ ...reportForm, is_public: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_public">Make report publicly accessible to all users</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generateReport} disabled={generating}>
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>Download and manage financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.title}</p>
                        {report.description && (
                          <p className="text-sm text-gray-600">{report.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getReportTypeBadge(report.report_type)}>
                        {getReportTypeIcon(report.report_type)}
                        <span className="ml-1 capitalize">{report.report_type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(report.period_start), 'MMM dd, yyyy')}</p>
                        <p className="text-gray-500">to {format(new Date(report.period_end), 'MMM dd, yyyy')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(report.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{report.download_count}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.is_public ? "default" : "secondary"}>
                        {report.is_public ? "Public" : "Admin Only"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          const now = new Date()
          setReportForm({
            ...reportForm,
            report_type: 'statement',
            title: `Monthly Statement - ${format(now, 'MMMM yyyy')}`,
            period_start: format(startOfMonth(now), 'yyyy-MM-dd'),
            period_end: format(endOfMonth(now), 'yyyy-MM-dd')
          })
          setIsGenerateDialogOpen(true)
        }}>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Monthly Report</h3>
            <p className="text-sm text-gray-600">Current month statement</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          const now = new Date()
          setReportForm({
            ...reportForm,
            report_type: 'summary',
            title: `Quarterly Summary - Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`,
            period_start: format(startOfYear(now), 'yyyy-MM-dd'),
            period_end: format(now, 'yyyy-MM-dd')
          })
          setIsGenerateDialogOpen(true)
        }}>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Quarterly Report</h3>
            <p className="text-sm text-gray-600">Quarter summary</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          const now = new Date()
          setReportForm({
            ...reportForm,
            report_type: 'detailed',
            title: `Annual Report - ${now.getFullYear()}`,
            period_start: format(startOfYear(now), 'yyyy-MM-dd'),
            period_end: format(endOfYear(now), 'yyyy-MM-dd')
          })
          setIsGenerateDialogOpen(true)
        }}>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">Annual Report</h3>
            <p className="text-sm text-gray-600">Full year analysis</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
          const now = new Date()
          setReportForm({
            ...reportForm,
            report_type: 'audit',
            title: `Audit Trail - ${format(now, 'MMMM yyyy')}`,
            period_start: format(startOfMonth(now), 'yyyy-MM-dd'),
            period_end: format(endOfMonth(now), 'yyyy-MM-dd')
          })
          setIsGenerateDialogOpen(true)
        }}>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold">Audit Report</h3>
            <p className="text-sm text-gray-600">Compliance audit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}