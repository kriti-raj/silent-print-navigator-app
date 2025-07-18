
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Products from "../components/Products";
import Customers from "../components/Customers";
import Invoices from "../components/Invoices";
import InvoiceBuilder from "../components/InvoiceBuilder";
import ProtectedReports from "../components/ProtectedReports";
import StoreSettings from "../components/StoreSettings";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, Package, TrendingUp, Plus, Eye, Calendar } from "lucide-react";

const Index = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'invoice'>('dashboard');
  const [newInvoiceId, setNewInvoiceId] = useState<string | undefined>();
  const [storeInfo, setStoreInfo] = useState<any>({});
  const [dashboardStats, setDashboardStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    todayInvoices: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Load store info
    const savedStoreInfo = localStorage.getItem('storeInfo');
    if (savedStoreInfo) {
      setStoreInfo(JSON.parse(savedStoreInfo));
    }

    // Calculate dashboard stats
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter((invoice: any) => 
      new Date(invoice.date).toDateString() === today
    );
    
    const totalRevenue = invoices
      .filter((invoice: any) => invoice.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);

    setDashboardStats({
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      todayInvoices: todayInvoices.length,
      totalRevenue
    });
  }, []);

  const handleCreateInvoice = () => {
    setActiveView('invoice');
  };

  const handleInvoiceClose = (invoiceId?: string) => {
    setActiveView('dashboard');
    if (invoiceId) {
      setNewInvoiceId(invoiceId);
    }
  };

  if (activeView === 'invoice') {
    return <InvoiceBuilder onClose={handleInvoiceClose} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Beautiful Store Name Header */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-wide">
              {storeInfo.businessName || storeInfo.name || 'Your Business Name'}
            </h1>
            <div className="w-full h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 rounded-full mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">{storeInfo.address || 'Your Business Address'}</p>
            <p className="text-gray-500">{storeInfo.phone || '+91 00000 00000'} | {storeInfo.email || 'your@email.com'}</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-purple-100 to-blue-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">Invoices</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white">Products</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">Customers</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                  <FileText className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalInvoices}</div>
                  <p className="text-xs text-blue-100">All time invoices</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-blue-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Invoices</CardTitle>
                  <Calendar className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.todayInvoices}</div>
                  <p className="text-xs text-green-100">Invoices created today</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalCustomers}</div>
                  <p className="text-xs text-orange-100">Registered customers</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{dashboardStats.totalRevenue.toFixed(0)}</div>
                  <p className="text-xs text-purple-100">From paid invoices</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleCreateInvoice}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Invoice
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-blue-200 hover:bg-blue-50 text-blue-600"
                    onClick={() => document.querySelector('[data-state="active"][value="customers"]')?.click()}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-purple-200 hover:bg-purple-50 text-purple-600"
                    onClick={() => document.querySelector('[data-state="active"][value="products"]')?.click()}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-700">Today: {dashboardStats.todayInvoices} invoices created</p>
                    <p className="text-green-700">Total customers: {dashboardStats.totalCustomers}</p>
                    <p className="text-green-700">Products available: {dashboardStats.totalProducts}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <CardTitle className="text-purple-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Business Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-purple-700">Total Revenue: ₹{dashboardStats.totalRevenue.toFixed(0)}</p>
                    <p className="text-purple-700">Avg per Invoice: ₹{dashboardStats.totalInvoices > 0 ? (dashboardStats.totalRevenue / dashboardStats.totalInvoices).toFixed(0) : '0'}</p>
                    <p className="text-purple-700">Performance: Growing 📈</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Invoices onCreateNew={handleCreateInvoice} highlightInvoiceId={newInvoiceId} />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Products />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Customers />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ProtectedReports />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <StoreSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
