import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, IndianRupee, Calendar, Download, FileText, Users, Package, Sparkles, QrCode, Settings } from "lucide-react";

interface ReportData {
  totalRevenue: number;
  totalInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  todayRevenue: number;
  todayInvoices: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentInvoices: any[];
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    todayRevenue: 0,
    todayInvoices: 0,
    monthlyRevenue: [],
    topProducts: [],
    recentInvoices: []
  });

  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUpiSettings, setShowUpiSettings] = useState(false);
  const [upiSettings, setUpiSettings] = useState({
    upiLink: 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=100&cu=INR'
  });

  useEffect(() => {
    generateReport();
    
    // Load UPI settings
    const savedUpiSettings = localStorage.getItem('upiSettings');
    if (savedUpiSettings) {
      setUpiSettings(JSON.parse(savedUpiSettings));
    }
  }, [dateRange, startDate, endDate]);

  const generateReport = () => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    // Calculate today's metrics
    const todayInvoices = invoices.filter((inv: any) =>
      new Date(inv.date).toDateString() === new Date().toDateString()
    );
    const todayRevenue = todayInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);

    // Filter invoices based on date range
    let filteredInvoices = invoices;
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filteredInvoices = invoices.filter((invoice: any) => 
        new Date(invoice.date) >= cutoffDate
      );
    }

    if (startDate && endDate) {
      filteredInvoices = invoices.filter((invoice: any) => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
      });
    }

    // Calculate basic metrics
    const totalRevenue = filteredInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
    const totalInvoices = filteredInvoices.length;
    const totalCustomers = customers.length;
    const totalProducts = products.length;

    // Calculate monthly revenue
    const monthlyRevenue = getMonthlyRevenue(filteredInvoices);

    // Calculate top products
    const topProducts = getTopProducts(filteredInvoices);

    // Get recent invoices
    const recentInvoices = filteredInvoices
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    setReportData({
      totalRevenue,
      totalInvoices,
      totalCustomers,
      totalProducts,
      todayRevenue,
      todayInvoices: todayInvoices.length,
      monthlyRevenue,
      topProducts,
      recentInvoices
    });
  };

  const getMonthlyRevenue = (invoices: any[]) => {
    const monthlyData: { [key: string]: number } = {};
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + invoice.total;
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const getTopProducts = (invoices: any[]) => {
    const productData: { [key: string]: { quantity: number; revenue: number } } = {};
    
    invoices.forEach(invoice => {
      invoice.items.forEach((item: any) => {
        const productName = item.productName || 'Unknown Product';
        if (!productData[productName]) {
          productData[productName] = { quantity: 0, revenue: 0 };
        }
        productData[productName].quantity += item.quantity;
        productData[productName].revenue += item.total;
      });
    });

    return Object.entries(productData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products
  };

  const exportReport = () => {
    const reportContent = `
BILLING BUDDY - SALES REPORT
Generated on: ${new Date().toLocaleDateString()}
Date Range: ${dateRange === 'all' ? 'All Time' : `Last ${dateRange} days`}
${startDate && endDate ? `Custom Range: ${startDate} to ${endDate}` : ''}

SUMMARY:
- Total Revenue: ₹${reportData.totalRevenue.toFixed(2)}
- Total Invoices: ${reportData.totalInvoices}
- Today's Revenue: ₹${reportData.todayRevenue.toFixed(2)}
- Today's Invoices: ${reportData.todayInvoices}
- Total Customers: ${reportData.totalCustomers}
- Total Products: ${reportData.totalProducts}

TOP PRODUCTS:
${reportData.topProducts.map(product => 
  `- ${product.name}: ${product.quantity} units, ₹${product.revenue.toFixed(2)} revenue`
).join('\n')}

MONTHLY REVENUE:
${reportData.monthlyRevenue.map(month => 
  `- ${month.month}: ₹${month.revenue.toFixed(2)}`
).join('\n')}

RECENT INVOICES:
${reportData.recentInvoices.map(invoice => 
  `- Invoice #${invoice.invoiceNumber}: ${invoice.customerDetails.name} - ₹${invoice.total.toFixed(2)} (${new Date(invoice.date).toLocaleDateString()})`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-buddy-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveUpiSettings = () => {
    localStorage.setItem('upiSettings', JSON.stringify(upiSettings));
    setShowUpiSettings(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Analyze your business performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUpiSettings(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            UPI Settings
          </Button>
        </div>
      </div>

      {showUpiSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              UPI Payment Settings
            </CardTitle>
            <CardDescription>
              Configure your UPI payment link for QR code generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="upiLink">UPI Payment Link</Label>
              <Textarea
                id="upiLink"
                value={upiSettings.upiLink}
                onChange={(e) => setUpiSettings({ ...upiSettings, upiLink: e.target.value })}
                placeholder="upi://pay?pa=your@upi&pn=Your+Name&tn=Payment&am=100&cu=INR"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The amount in this link will be replaced with the actual invoice amount during QR generation.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveUpiSettings}>Save Settings</Button>
              <Button variant="outline" onClick={() => setShowUpiSettings(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Choose the time period for your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Quick Select</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={exportReport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Today's Revenue</CardTitle>
            <Sparkles className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportData.todayRevenue.toFixed(2)}</div>
            <p className="text-xs opacity-80">
              From {reportData.todayInvoices} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {reportData.totalInvoices} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Invoices generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.monthlyRevenue.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <span className="text-sm font-bold">₹{month.revenue.toFixed(2)}</span>
                </div>
              ))}
              {reportData.monthlyRevenue.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} units sold</p>
                  </div>
                  <span className="text-sm font-bold">₹{product.revenue.toFixed(2)}</span>
                </div>
              ))}
              {reportData.topProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No products data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Invoice #{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.customerDetails.name} • {new Date(invoice.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-bold">₹{invoice.total.toFixed(2)}</span>
              </div>
            ))}
            {reportData.recentInvoices.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent invoices</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
