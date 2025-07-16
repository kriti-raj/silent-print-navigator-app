
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Package, BarChart3, Plus, Smartphone } from "lucide-react";
import InvoiceBuilder from '@/components/InvoiceBuilder';
import Invoices from '@/components/Invoices';
import Customers from '@/components/Customers';
import Products from '@/components/Products';
import Reports from '@/components/Reports';
import StoreSettings from '@/components/StoreSettings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [highlightInvoiceId, setHighlightInvoiceId] = useState<string | undefined>();

  const handleCreateInvoice = () => {
    setShowInvoiceBuilder(true);
  };

  const handleCloseInvoiceBuilder = (newInvoiceId?: string) => {
    setShowInvoiceBuilder(false);
    if (newInvoiceId) {
      setHighlightInvoiceId(newInvoiceId);
      setActiveTab('invoices');
    }
  };

  if (showInvoiceBuilder) {
    return <InvoiceBuilder onClose={handleCloseInvoiceBuilder} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            Jai Mata Di Saintary & Hardware Store
          </h1>
          <p className="text-center text-gray-600">
            Complete Invoice Management System
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('invoices')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{JSON.parse(localStorage.getItem('invoices') || '[]').length}</div>
                  <p className="text-xs text-muted-foreground">Total invoices created</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('customers')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{JSON.parse(localStorage.getItem('customers') || '[]').length}</div>
                  <p className="text-xs text-muted-foreground">Total customers</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('products')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{JSON.parse(localStorage.getItem('products') || '[]').length}</div>
                  <p className="text-xs text-muted-foreground">Products in catalog</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('reports')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reports</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Analytics</div>
                  <p className="text-xs text-muted-foreground">Business insights</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleCreateInvoice} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Invoice
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('customers')} className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Customers
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('products')} className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Manage Products
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mobile App</CardTitle>
                  <CardDescription>Create invoices on the go</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use our mobile-optimized interface to create invoices anywhere, anytime.
                  </p>
                  <Button variant="outline" onClick={() => window.open('/mobile', '_blank')} className="w-full">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Open Mobile Interface
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <Invoices onCreateNew={handleCreateInvoice} highlightInvoiceId={highlightInvoiceId} />
          </TabsContent>

          <TabsContent value="customers">
            <Customers />
          </TabsContent>

          <TabsContent value="products">
            <Products />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          <TabsContent value="settings">
            <StoreSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
