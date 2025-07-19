
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, HardDrive, FileText, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StorageUsage: React.FC = () => {
  const [storageData, setStorageData] = useState({
    invoices: { count: 0, size: 0 },
    customers: { count: 0, size: 0 },
    products: { count: 0, size: 0 },
    settings: { count: 0, size: 0 },
    total: 0
  });
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    calculateStorageUsage();
  }, []);

  const calculateStorageUsage = () => {
    const invoices = localStorage.getItem('invoices') || '[]';
    const customers = localStorage.getItem('customers') || '[]';
    const products = localStorage.getItem('products') || '[]';
    const storeInfo = localStorage.getItem('storeInfo') || '{}';
    const upiSettings = localStorage.getItem('upiSettings') || '{}';

    const invoicesData = JSON.parse(invoices);
    const customersData = JSON.parse(customers);
    const productsData = JSON.parse(products);

    const invoicesSize = new Blob([invoices]).size;
    const customersSize = new Blob([customers]).size;
    const productsSize = new Blob([products]).size;
    const settingsSize = new Blob([storeInfo + upiSettings]).size;

    const totalSize = invoicesSize + customersSize + productsSize + settingsSize;

    setStorageData({
      invoices: { count: invoicesData.length, size: invoicesSize },
      customers: { count: customersData.length, size: customersSize },
      products: { count: productsData.length, size: productsSize },
      settings: { count: 2, size: settingsSize },
      total: totalSize
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearOldInvoices = () => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = invoices.filter((invoice: any) => 
      new Date(invoice.date) > thirtyDaysAgo
    );

    localStorage.setItem('invoices', JSON.stringify(recentInvoices));
    calculateStorageUsage();
    
    toast({
      title: "Old Invoices Cleared",
      description: `Removed ${invoices.length - recentInvoices.length} invoices older than 30 days.`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  const clearAllData = () => {
    const correctPassword = '8409950052';
    if (password !== correctPassword) {
      toast({
        title: "Incorrect Password",
        description: "Please enter the correct password to clear all data.",
        variant: "destructive"
      });
      return;
    }

    localStorage.clear();
    calculateStorageUsage();
    setPassword('');
    setShowPasswordDialog(false);
    
    toast({
      title: "All Data Cleared",
      description: "All application data has been removed from storage.",
      variant: "destructive"
    });
  };

  const storageLimit = 5 * 1024 * 1024; // 5MB typical localStorage limit
  const usagePercentage = (storageData.total / storageLimit) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Storage Usage</h2>
      </div>

      {/* Overall Storage Usage */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Total Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-b-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">{formatBytes(storageData.total)}</span>
            <span className="text-sm text-gray-500">of ~{formatBytes(storageLimit)} browser storage</span>
          </div>
          <Progress value={usagePercentage} className="w-full" />
          <div className="text-sm text-gray-600">
            {usagePercentage.toFixed(1)}% of browser storage limit used
          </div>
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <strong>Note:</strong> Browser storage is limited to ~5-10MB. For larger storage needs, 
            consider exporting your data regularly or using external storage solutions.
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Count:</span>
                <span className="font-semibold">{storageData.invoices.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-semibold">{formatBytes(storageData.invoices.size)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Count:</span>
                <span className="font-semibold">{storageData.customers.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-semibold">{formatBytes(storageData.customers.size)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Count:</span>
                <span className="font-semibold">{storageData.products.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-semibold">{formatBytes(storageData.products.size)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-orange-600" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Items:</span>
                <span className="font-semibold">{storageData.settings.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-semibold">{formatBytes(storageData.settings.size)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Management Actions */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500">
        <CardHeader>
          <CardTitle className="text-white text-lg">Storage Management</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-b-lg space-y-4">
          <div className="space-y-3">
            <Button
              onClick={clearOldInvoices}
              variant="outline"
              className="w-full border-orange-200 hover:bg-orange-50 text-orange-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Invoices Older Than 30 Days
            </Button>
            
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-red-200 hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data (Password Protected)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">Clear All Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This action will permanently delete all your invoices, customers, products, and settings. 
                    This cannot be undone.
                  </p>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Enter Password:
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to confirm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordDialog(false);
                        setPassword('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={clearAllData}
                      variant="destructive"
                      className="flex-1"
                    >
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1">Storage Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Browser storage is limited to 5-10MB per domain</li>
              <li>Regularly export and backup important data</li>
              <li>Clear old invoices periodically to free up space</li>
              <li>For mobile apps, data can be stored in device folders</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageUsage;
