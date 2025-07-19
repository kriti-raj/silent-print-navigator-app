
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Trash2, FileText, Users, Package, Calendar, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sqliteService } from '../services/sqliteService';
import { fileSystemService } from '../services/fileSystemService';

interface ExportData {
  invoices: any[];
  customers: any[];
  products: any[];
  storeSettings: any;
  exportDate: string;
  version: string;
}

const Reports: React.FC = () => {
  const [clearDuration, setClearDuration] = useState<string>('30');
  const [customDays, setCustomDays] = useState<string>('');
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    dbSize: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [invoices, customers, products] = await Promise.all([
        sqliteService.getInvoices(),
        sqliteService.getCustomers(),
        sqliteService.getProducts()
      ]);

      const storageUsage = sqliteService.getStorageUsage();

      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        dbSize: storageUsage.used
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const exportAllData = async () => {
    try {
      toast({
        title: "Exporting Data",
        description: "Preparing data export...",
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });

      const [invoices, customers, products, storeSettings] = await Promise.all([
        sqliteService.getInvoices(),
        sqliteService.getCustomers(),
        sqliteService.getProducts(),
        sqliteService.getAllStoreSettings()
      ]);

      const exportData: ExportData = {
        invoices,
        customers,
        products,
        storeSettings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `business_data_export_${new Date().toISOString().split('T')[0]}.json`;

      // Try to save to selected folder, otherwise download
      const result = await fileSystemService.saveInvoicePDF(fileName.replace('.json', ''), jsonData);
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: `Data exported to ${result.filePath}`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        // Fallback to browser download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Complete",
          description: `Data downloaded as ${fileName}`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "Importing Data",
        description: "Processing import file...",
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });

      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Validate import data structure
      if (!importData.invoices || !importData.customers || !importData.products) {
        throw new Error('Invalid import file format');
      }

      // Import data to SQLite
      let importedCount = 0;

      // Import customers
      for (const customer of importData.customers) {
        await sqliteService.saveCustomer(customer);
        importedCount++;
      }

      // Import products
      for (const product of importData.products) {
        await sqliteService.saveProduct(product);
        importedCount++;
      }

      // Import invoices
      for (const invoice of importData.invoices) {
        await sqliteService.saveInvoice(invoice);
        importedCount++;
      }

      // Import store settings
      if (importData.storeSettings) {
        for (const [key, value] of Object.entries(importData.storeSettings)) {
          await sqliteService.saveStoreSetting(key, value as string);
        }
      }

      await loadStats();

      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedCount} records from ${importData.exportDate}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive"
      });
      event.target.value = '';
    }
  };

  const clearOldInvoices = async () => {
    try {
      const days = clearDuration === 'custom' ? parseInt(customDays) : parseInt(clearDuration);
      
      if (isNaN(days) || days <= 0) {
        toast({
          title: "Invalid Duration",
          description: "Please enter a valid number of days.",
          variant: "destructive"
        });
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const invoices = await sqliteService.getInvoices();
      const invoicesToDelete = invoices.filter(invoice => 
        new Date(invoice.date) < cutoffDate
      );

      if (invoicesToDelete.length === 0) {
        toast({
          title: "No Data to Clear",
          description: `No invoices older than ${days} days found.`,
          className: "bg-blue-50 border-blue-200 text-blue-800"
        });
        return;
      }

      for (const invoice of invoicesToDelete) {
        await sqliteService.deleteInvoice(invoice.id);
      }

      await loadStats();

      toast({
        title: "Data Cleared",
        description: `Successfully deleted ${invoicesToDelete.length} invoices older than ${days} days.`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } catch (error) {
      console.error('Error clearing old invoices:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear old invoices. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">Reports & Data Management</h2>
          <p className="text-muted-foreground">Export, import, and manage your business data (SQLite Database)</p>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.dbSize / 1024).toFixed(1)}KB</div>
          </CardContent>
        </Card>
      </div>

      {/* Export/Import Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export all your business data (invoices, customers, products, settings) to a JSON file for backup or migration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={exportAllData}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
            <p className="text-xs text-muted-foreground">
              This will create a complete backup of your business data that can be imported later.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import business data from a previously exported JSON file. This will add to your existing data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={importData}
                className="border-blue-200 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select a JSON file exported from this application to import data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Cleanup Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Cleanup
          </CardTitle>
          <CardDescription>
            Clear old invoice data to keep your database optimized. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              Warning: This will permanently delete old invoices. Make sure to export your data first for backup.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="clearDuration">Clear invoices older than:</Label>
              <Select value={clearDuration} onValueChange={setClearDuration}>
                <SelectTrigger className="border-red-200 focus:ring-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="15">15 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clearDuration === 'custom' && (
              <div>
                <Label htmlFor="customDays">Custom days:</Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Enter number of days"
                  className="border-red-200 focus:ring-red-500"
                />
              </div>
            )}
          </div>

          <Button 
            onClick={clearOldInvoices}
            variant="destructive"
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Old Invoices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
