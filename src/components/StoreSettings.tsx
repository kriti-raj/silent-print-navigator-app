import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Store, Upload, X, Printer, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  website: string;
  logo?: string;
  paymentQR?: string;
}

interface PrinterSettings {
  defaultPrinter: string;
  paperSize: 'A4' | 'A5';
  printerType: 'normal' | 'thermal';
  silentPrinting: boolean;
  margins: number;
  autoMarkAsPrinted: boolean;
  copies: number;
}

const StoreSettings: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: 'Jai Mata Di Saintary & Hardware Store',
    address: 'Hardware Store Address',
    phone: '+91 12345 67890',
    email: 'store@hardware.com',
    taxId: 'GST123456789',
    website: 'www.hardware.com',
    logo: '',
    paymentQR: ''
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    defaultPrinter: '',
    paperSize: 'A4',
    printerType: 'normal',
    silentPrinting: true,
    margins: 10,
    autoMarkAsPrinted: true,
    copies: 1
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedStoreInfo = localStorage.getItem('storeInfo');
    if (savedStoreInfo) {
      setStoreInfo(JSON.parse(savedStoreInfo));
    }

    const savedPrinterSettings = localStorage.getItem('printerSettings');
    if (savedPrinterSettings) {
      setPrinterSettings(JSON.parse(savedPrinterSettings));
    }

    // Get available printers (Windows specific)
    detectPrinters();
  }, []);

  const detectPrinters = async () => {
    try {
      // For Windows, we can use navigator.mediaDevices or a native API
      if ('getDevices' in navigator.mediaDevices) {
        // This is a placeholder - in a real Windows app, you'd use native APIs
        setAvailablePrinters(['Default Printer', 'Microsoft Print to PDF', 'Thermal Printer']);
      }
    } catch (error) {
      console.error('Failed to detect printers:', error);
      setAvailablePrinters(['Default Printer']);
    }
  };

  const testPrinter = async () => {
    try {
      const testInvoice = {
        id: 'test',
        invoiceNumber: 'TEST-001',
        customerDetails: { name: 'Test Customer', phone: '1234567890', address: 'Test Address' },
        storeInfo,
        date: new Date().toISOString(),
        items: [{
          id: '1',
          productName: 'Test Product',
          colorCode: 'Blue',
          finalName: 'Test Product - Blue',
          quantity: 1,
          rate: 100,
          total: 100
        }],
        subtotal: 100,
        tax: 18,
        total: 118,
        status: 'draft' as const,
        notes: 'Test print',
        watermarkId: '',
        gstEnabled: true
      };

      // Use the silent print function
      const success = await (window as any).invoiceApiService?.silentPrint(testInvoice, printerSettings);
      
      if (success) {
        toast({
          title: "Test Print Successful",
          description: "Test invoice sent to printer successfully."
        });
      } else {
        toast({
          title: "Test Print Failed",
          description: "Unable to send test print. Please check printer settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Print Error",
        description: "An error occurred during test printing.",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    // Handle file uploads
    if (logoFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        const updatedStoreInfo = { ...storeInfo, logo: logoData };
        setStoreInfo(updatedStoreInfo);
        localStorage.setItem('storeInfo', JSON.stringify(updatedStoreInfo));
      };
      reader.readAsDataURL(logoFile);
    }

    if (qrFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const qrData = e.target?.result as string;
        const updatedStoreInfo = { ...storeInfo, paymentQR: qrData };
        setStoreInfo(updatedStoreInfo);
        localStorage.setItem('storeInfo', JSON.stringify(updatedStoreInfo));
      };
      reader.readAsDataURL(qrFile);
    }

    localStorage.setItem('storeInfo', JSON.stringify(storeInfo));
    localStorage.setItem('printerSettings', JSON.stringify(printerSettings));
    
    toast({
      title: "Settings Saved",
      description: "Store information and printer settings have been updated successfully."
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
    }
  };

  const removeLogo = () => {
    setStoreInfo({ ...storeInfo, logo: '' });
    setLogoFile(null);
  };

  const removeQR = () => {
    setStoreInfo({ ...storeInfo, paymentQR: '' });
    setQrFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Store Settings</h2>
          <p className="text-muted-foreground">Manage your store information and printing preferences</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
            <CardDescription>
              Basic information about your store that will appear on invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                placeholder="Enter store name"
              />
            </div>

            <div>
              <Label htmlFor="storeAddress">Address</Label>
              <Textarea
                id="storeAddress"
                value={storeInfo.address}
                onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                placeholder="Enter store address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storePhone">Phone Number</Label>
                <Input
                  id="storePhone"
                  value={storeInfo.phone}
                  onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="storeEmail">Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeInfo.email}
                  onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxId">GST/Tax ID</Label>
                <Input
                  id="taxId"
                  value={storeInfo.taxId}
                  onChange={(e) => setStoreInfo({ ...storeInfo, taxId: e.target.value })}
                  placeholder="Enter GST/Tax ID"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={storeInfo.website}
                  onChange={(e) => setStoreInfo({ ...storeInfo, website: e.target.value })}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printing Settings
            </CardTitle>
            <CardDescription>
              Configure your printing preferences for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultPrinter">Default Printer</Label>
              <Select value={printerSettings.defaultPrinter} onValueChange={(value) => 
                setPrinterSettings({ ...printerSettings, defaultPrinter: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select default printer" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.map((printer) => (
                    <SelectItem key={printer} value={printer}>{printer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select value={printerSettings.paperSize} onValueChange={(value: 'A4' | 'A5') => 
                  setPrinterSettings({ ...printerSettings, paperSize: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="printerType">Printer Type</Label>
                <Select value={printerSettings.printerType} onValueChange={(value: 'normal' | 'thermal') => 
                  setPrinterSettings({ ...printerSettings, printerType: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Printer</SelectItem>
                    <SelectItem value="thermal">Thermal Printer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="margins">Margins (mm)</Label>
                <Input
                  id="margins"
                  type="number"
                  value={printerSettings.margins}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, margins: parseInt(e.target.value) || 10 })}
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="copies">Number of Copies</Label>
                <Input
                  id="copies"
                  type="number"
                  value={printerSettings.copies}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, copies: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="silentPrinting">Silent Printing (Windows)</Label>
                <Switch
                  id="silentPrinting"
                  checked={printerSettings.silentPrinting}
                  onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, silentPrinting: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="autoMarkAsPrinted">Auto mark as printed</Label>
                <Switch
                  id="autoMarkAsPrinted"
                  checked={printerSettings.autoMarkAsPrinted}
                  onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, autoMarkAsPrinted: checked })}
                />
              </div>
            </div>

            <Button onClick={testPrinter} variant="outline" className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Test Print
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & Assets</CardTitle>
            <CardDescription>
              Upload your logo and payment QR code for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Store Logo</Label>
              <div className="mt-2 space-y-3">
                {(storeInfo.logo || logoFile) && (
                  <div className="relative inline-block">
                    <img
                      src={logoFile ? URL.createObjectURL(logoFile) : storeInfo.logo}
                      alt="Store Logo"
                      className="h-20 w-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logoUpload"
                  />
                  <Label htmlFor="logoUpload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Payment QR Code</Label>
              <div className="mt-2 space-y-3">
                {(storeInfo.paymentQR || qrFile) && (
                  <div className="relative inline-block">
                    <img
                      src={qrFile ? URL.createObjectURL(qrFile) : storeInfo.paymentQR}
                      alt="Payment QR Code"
                      className="h-20 w-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeQR}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleQRUpload}
                    className="hidden"
                    id="qrUpload"
                  />
                  <Label htmlFor="qrUpload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload QR Code
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Preview how your store information will appear on invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white max-w-md">
            <div className="text-center space-y-2">
              {storeInfo.logo && (
                <img
                  src={storeInfo.logo}
                  alt="Store Logo"
                  className="h-16 w-16 object-cover mx-auto rounded"
                />
              )}
              <h3 className="text-lg font-bold">{storeInfo.name}</h3>
              <p className="text-sm text-gray-600">{storeInfo.address}</p>
              <p className="text-sm">
                Phone: {storeInfo.phone} | Email: {storeInfo.email}
              </p>
              <p className="text-sm">GST No: {storeInfo.taxId}</p>
              {storeInfo.website && (
                <p className="text-sm text-blue-600">{storeInfo.website}</p>
              )}
              {storeInfo.paymentQR && (
                <div className="pt-4">
                  <p className="text-xs text-gray-500 mb-2">Scan to Pay</p>
                  <img
                    src={storeInfo.paymentQR}
                    alt="Payment QR"
                    className="h-16 w-16 mx-auto rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreSettings;
