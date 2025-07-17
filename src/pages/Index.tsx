
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Products from "../components/Products";
import Customers from "../components/Customers";
import Invoices from "../components/Invoices";
import InvoiceBuilder from "../components/InvoiceBuilder";
import Reports from "../components/Reports";
import StoreSettings from "../components/StoreSettings";
import { useState } from "react";

const Index = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'invoice'>('dashboard');
  const [newInvoiceId, setNewInvoiceId] = useState<string | undefined>();

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Billing Buddy</h1>
            <p className="text-gray-600">Your complete invoice management solution</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
                <button 
                  onClick={handleCreateInvoice}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Create New Invoice
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
                <p className="text-gray-600">View your recent invoices and transactions</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2">Business Overview</h3>
                <p className="text-gray-600">Monitor your business performance</p>
              </div>
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
            <Reports />
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
