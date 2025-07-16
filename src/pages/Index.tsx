
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, FileText, BarChart3, Store, Plus, Wrench, TrendingUp, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Products from "@/components/Products";
import Customers from "@/components/Customers";
import Invoices from "@/components/Invoices";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import ProtectedReports from "@/components/ProtectedReports";
import StoreSettings from "@/components/StoreSettings";
import ConnectionInfo from "@/components/ConnectionInfo";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [highlightInvoiceId, setHighlightInvoiceId] = useState<string | undefined>();

  const handleCreateInvoice = () => {
    setShowInvoiceBuilder(true);
  };

  const handleCloseInvoiceBuilder = (newInvoiceId?: string) => {
    setShowInvoiceBuilder(false);
    if (newInvoiceId) {
      setHighlightInvoiceId(newInvoiceId);
      setActiveTab("invoices");
    }
  };

  // Quick stats for dashboard (removed today's revenue)
  const getQuickStats = () => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const todayInvoices = invoices.filter((inv: any) =>
      new Date(inv.date).toDateString() === new Date().toDateString()
    );

    return {
      totalProducts: products.length,
      totalCustomers: customers.length,
      todayInvoices: todayInvoices.length,
      totalInvoices: invoices.length
    };
  };

  if (showInvoiceBuilder) {
    return <InvoiceBuilder onClose={handleCloseInvoiceBuilder} />;
  }

  const stats = getQuickStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Billing Buddy</h1>
            <p className="text-lg text-muted-foreground">Complete Billing & Inventory Management System</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateInvoice}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/mobile', '_blank')}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile View
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Connection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Products</CardTitle>
                  <Package className="h-4 w-4 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs opacity-80">
                    Active inventory items
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Customers</CardTitle>
                  <Users className="h-4 w-4 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <p className="text-xs opacity-80">
                    Registered customers
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Today's Invoices</CardTitle>
                  <FileText className="h-4 w-4 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayInvoices}</div>
                  <p className="text-xs opacity-80">
                    Invoices created today
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Invoices</CardTitle>
                  <FileText className="h-4 w-4 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                  <p className="text-xs opacity-80">
                    All time invoices
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Frequently used actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleCreateInvoice}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Invoice
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("products")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Manage Products
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("customers")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Customers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest transactions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last invoice created</span>
                      <span>Just now</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Products updated</span>
                      <span>2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Customer added</span>
                      <span>Yesterday</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Products />
          </TabsContent>

          <TabsContent value="customers">
            <Customers />
          </TabsContent>

          <TabsContent value="invoices">
            <Invoices 
              onCreateNew={handleCreateInvoice}
              highlightInvoiceId={highlightInvoiceId}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ProtectedReports />
          </TabsContent>

          <TabsContent value="settings">
            <StoreSettings />
          </TabsContent>

          <TabsContent value="connection">
            <ConnectionInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
