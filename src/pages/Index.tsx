import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, DollarSign, Users } from "lucide-react";
import Invoices from "@/components/Invoices";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import StoreSettings from "@/components/StoreSettings";
import FolderSettings from "@/components/FolderSettings";
import StorageUsage from "@/components/StorageUsage";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'settings'>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'store' | 'folder' | 'storage'>('store');
  const [isInvoiceBuilderOpen, setIsInvoiceBuilderOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);

  const handleCreateInvoice = () => {
    setIsInvoiceBuilderOpen(true);
    setEditInvoiceId(null);
  };

  const handleEditInvoice = (invoiceId: string) => {
    setIsInvoiceBuilderOpen(true);
    setEditInvoiceId(invoiceId);
  };

  const handleInvoiceBuilderClose = (invoiceId?: string) => {
    setIsInvoiceBuilderOpen(false);
    setEditInvoiceId(null);
    if (invoiceId) {
      setActiveTab('invoices');
    }
  };

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'store':
        return <StoreSettings />;
      case 'folder':
        return <FolderSettings />;
      case 'storage':
        return <StorageUsage />;
      default:
        return <StoreSettings />;
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Invoices"
              value={JSON.parse(localStorage.getItem('invoices') || '[]').length.toString()}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <DashboardCard
              title="Upcoming Appointments"
              value="5"
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            />
            <DashboardCard
              title="Revenue"
              value="₹25,000"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <DashboardCard
              title="Total Customers"
              value={JSON.parse(localStorage.getItem('customers') || '[]').length.toString()}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        );
      case 'invoices':
        return <Invoices onCreateInvoice={handleCreateInvoice} onEditInvoice={handleEditInvoice} />;
      case 'settings':
        return (
          <div>
            <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border">
              <button
                onClick={() => setActiveSettingsTab('store')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeSettingsTab === 'store'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Store Info
              </button>
              <button
                onClick={() => setActiveSettingsTab('folder')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeSettingsTab === 'folder'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                File Storage
              </button>
              <button
                onClick={() => setActiveSettingsTab('storage')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeSettingsTab === 'storage'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Storage Usage
              </button>
            </div>
            {renderSettingsContent()}
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white py-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Invoice App</h1>
            <div className="flex space-x-4">
              <Button
                onClick={() => setActiveTab('dashboard')}
                variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              >
                Dashboard
              </Button>
              <Button
                onClick={() => setActiveTab('invoices')}
                variant={activeTab === 'invoices' ? 'default' : 'outline'}
              >
                Invoices
              </Button>
              <Button
                onClick={() => setActiveTab('settings')}
                variant={activeTab === 'settings' ? 'default' : 'outline'}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Invoices"
              value={JSON.parse(localStorage.getItem('invoices') || '[]').length.toString()}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <DashboardCard
              title="Upcoming Appointments"
              value="5"
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            />
            <DashboardCard
              title="Revenue"
              value="₹25,000"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <DashboardCard
              title="Total Customers"
              value={JSON.parse(localStorage.getItem('customers') || '[]').length.toString()}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border">
              <button
                onClick={() => setActiveSettingsTab('store')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeSettingsTab === 'store'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Store Info
              </button>
              <button
                onClick={() => setActiveSettingsTab('folder')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeSettingsTab === 'folder'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                File Storage
              </button>
              <button
                onClick={() => setActiveSettingsTab('storage')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeSettingsTab === 'storage'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Storage Usage
              </button>
            </div>
            {renderSettingsContent()}
          </div>
        )}

        {activeTab === 'invoices' && (
          <Invoices onCreateInvoice={handleCreateInvoice} onEditInvoice={handleEditInvoice} />
        )}

        {isInvoiceBuilderOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl mx-auto">
              <InvoiceBuilder onClose={handleInvoiceBuilderClose} editInvoiceId={editInvoiceId || undefined} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default Index;
