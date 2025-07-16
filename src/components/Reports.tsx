
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, TrendingDown, FileText, Users, Package, Calendar, Settings, QrCode } from "lucide-react";

interface Invoice {
  id: string;
  total: number;
  date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  customerDetails: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  createdAt: string;
}

const Reports = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUpiSettings, setShowUpiSettings] = useState(false);
  const [upiSettings, setUpiSettings] = useState({
    upiLink: 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR'
  });

  useEffect(() => {
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }

    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }

    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }

    const savedUpiSettings = localStorage.getItem('upiSettings');
    if (savedUpiSettings) {
      setUpiSettings(JSON.parse(savedUpiSettings));
    }
  }, []);

  const saveUpiSettings = () => {
    localStorage.setItem('upiSettings', JSON.stringify(upiSettings));
    setShowUpiSettings(false);
  };

  const filterInvoicesByDate = (invoices: Invoice[]) => {
    if (!startDate && !endDate) return invoices;
    
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      
      return invoiceDate >= start && invoiceDate <= end;
    });
  };

  const filteredInvoices = filterInvoicesByDate(invoices);

  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');
  const paidRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingRevenue = totalRevenue - paidRevenue;

  const today = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(inv => inv.date === today);
  const todayRevenue = todayInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().split('T')[0];
  const monthlyInvoices = invoices.filter(inv => inv.date >= monthStart && inv.date <= monthEnd);
  const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0];
  const lastMonthInvoices = invoices.filter(inv => inv.date >= lastMonthStart && inv.date <= lastMonthEnd);
  const lastMonthRevenue = lastMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const topCustomers = customers.map(customer => {
    const customerInvoices = filteredInvoices.filter(inv => inv.customerDetails.name === customer.name);
    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    return { ...customer, totalSpent, invoiceCount: customerInvoices.length };
  }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <Button variant="outline" onClick={() => setShowUpiSettings(true)}>
          <Settings className="mr-2 h-4 w-4" />
          UPI Settings
        </Button>
      </div>

      {/* Today's Revenue Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Today's Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₹{todayRevenue.toFixed(2)}</div>
          <p className="text-blue-100">{todayInvoices.length} invoices generated today</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredInvoices.length} total invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{monthlyRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{pendingRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredInvoices.length - paidInvoices.length} unpaid invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active customer base
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{invoice.customerDetails.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{invoice.total.toFixed(2)}</p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.invoiceCount} invoices
                        </p>
                      </div>
                      <p className="font-medium">₹{customer.totalSpent.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter by Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredInvoices.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Average Invoice Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{filteredInvoices.length ? (totalRevenue / filteredInvoices.length).toFixed(2) : '0'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Paid Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{paidRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">
                  {paidInvoices.length} paid invoices
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Customers:</span>
                    <span className="font-bold">{customers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active This Month:</span>
                    <span className="font-bold">
                      {new Set(monthlyInvoices.map(inv => inv.customerDetails.name)).size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Spending Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topCustomers.slice(0, 3).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{index + 1}</span>
                        <span>{customer.name}</span>
                      </div>
                      <span className="font-bold">₹{customer.totalSpent.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Total Products</h3>
                  <p className="text-3xl font-bold">{products.length}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Products Added This Month</h3>
                  <p className="text-3xl font-bold">
                    {products.filter(p => 
                      new Date(p.createdAt) >= new Date(monthStart) && 
                      new Date(p.createdAt) <= new Date(monthEnd)
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* UPI Settings Modal */}
      {showUpiSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                UPI Payment Settings
              </CardTitle>
              <CardDescription>
                Configure your UPI payment link for invoice QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="upiLink">UPI Payment Link</Label>
                <Textarea
                  id="upiLink"
                  value={upiSettings.upiLink}
                  onChange={(e) => setUpiSettings({ ...upiSettings, upiLink: e.target.value })}
                  placeholder="upi://pay?pa=your@upi&pn=Your+Name&tn=Payment&am=${amount}&cu=INR"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use ${amount} placeholder for invoice amount. This will be replaced with actual amount during QR generation.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveUpiSettings} className="flex-1">
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => setShowUpiSettings(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
