
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

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            <Invoices onCreateInvoice={handleCreateInvoice} newInvoiceId={newInvoiceId} />
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
