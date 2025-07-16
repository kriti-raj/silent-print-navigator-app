import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Package, FileText, Settings, Smartphone, Plus, TrendingUp, IndianRupee } from "lucide-react";
import Products from '../components/Products';
import Customers from '../components/Customers';
import Invoices from '../components/Invoices';
import InvoiceBuilder from '../components/InvoiceBuilder';
import ProtectedReports from '../components/ProtectedReports';
import StoreSettings from '../components/StoreSettings';
import Mobile from './Mobile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <Mobile />;
  }

  const getDashboardStats = () => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
    const todayInvoices = invoices.filter((inv: any) =>
      new Date(inv.date).toDateString() === new Date().toDateString()
    );
    const todayRevenue = todayInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);

    return {
      totalRevenue,
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      todayRevenue,
      todayInvoices: todayInvoices.length
    };
  };

  const stats = getDashboardStats();

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'invoices':
        return <Invoices onCreateNew={() => setActiveTab('create-invoice')} />;
      case 'create-invoice':
        return <InvoiceBuilder onClose={(newInvoiceId) => {
          setActiveTab('invoices');
          if (newInvoiceId) {
            // Optionally handle the new invoice ID
          }
        }} />;
      case 'reports':
        return <ProtectedReports />;
      case 'settings':
        return <StoreSettings />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                  Welcome to your billing management system
                </p>
              </div>
              <Button onClick={() => setActiveTab('create-invoice')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    From {stats.totalInvoices} invoices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInvoices}</div>
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
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
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
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Products in inventory
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {JSON.parse(localStorage.getItem('invoices') || '[]')
                      .slice(-5)
                      .reverse()
                      .map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center">
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Invoice #{invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.customerDetails.name}
                            </p>
                          </div>
                          <div className="ml-auto font-medium">
                            ₹{invoice.total.toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Frequently used actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Button onClick={() => setActiveTab('create-invoice')} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                  <Button onClick={() => setActiveTab('customers')} variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                  <Button onClick={() => setActiveTab('products')} variant="outline" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                  <Button onClick={() => setActiveTab('reports')} variant="outline" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Billing Buddy</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'dashboard'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('invoices')}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'invoices' || activeTab === 'create-invoice'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                Invoices
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'customers'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Customers
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'products'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Package className="mr-3 h-5 w-5" />
                Products
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'reports'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                Reports
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'settings'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
