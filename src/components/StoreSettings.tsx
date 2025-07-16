import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Store, Upload, X } from "lucide-react";
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedStoreInfo = localStorage.getItem('storeInfo');
    if (savedStoreInfo) {
      setStoreInfo(JSON.parse(savedStoreInfo));
    }
  }, []);

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
    
    toast({
      title: "Settings Saved",
      description: "Store information has been updated successfully."
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
          <p className="text-muted-foreground">Manage your store information and branding</p>
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