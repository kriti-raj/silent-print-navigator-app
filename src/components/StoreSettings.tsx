
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeDataURL } from "../utils/qrCodeGenerator";

const StoreSettings = () => {
  const [storeInfo, setStoreInfo] = useState({
    businessName: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    taxId: '',
    website: '',
    logo: '',
    paymentQR: '',
    printFormat: 'a4' as 'a4' | 'thermal'
  });

  const [upiSettings, setUpiSettings] = useState({
    upiString: 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR',
    qrCodeUrl: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    // Load existing store info
    const savedStoreInfo = localStorage.getItem('storeInfo');
    if (savedStoreInfo) {
      try {
        const parsed = JSON.parse(savedStoreInfo);
        setStoreInfo({
          ...parsed,
          printFormat: parsed.printFormat || 'a4'
        });
      } catch (e) {
        console.error('Error parsing store info:', e);
      }
    }

    // Load existing UPI settings
    const savedUpiSettings = localStorage.getItem('upiSettings');
    if (savedUpiSettings) {
      try {
        const parsed = JSON.parse(savedUpiSettings);
        setUpiSettings(parsed);
        if (parsed.upiString) {
          const qrUrl = generateQRCodeDataURL(parsed.upiString.replace('${amount}', '100'), 200);
          setUpiSettings(prev => ({ ...prev, qrCodeUrl: qrUrl }));
        }
      } catch (e) {
        console.error('Error parsing UPI settings:', e);
      }
    }
  }, []);

  const handleStoreInfoChange = (field: string, value: string) => {
    setStoreInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpiChange = (field: string, value: string) => {
    setUpiSettings(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'upiString') {
      // Generate QR code preview
      try {
        const qrUrl = generateQRCodeDataURL(value.replace('${amount}', '100'), 200);
        setUpiSettings(prev => ({ ...prev, qrCodeUrl: qrUrl }));
      } catch (e) {
        console.error('Error generating QR code:', e);
      }
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('storeInfo', JSON.stringify(storeInfo));
      localStorage.setItem('upiSettings', JSON.stringify(upiSettings));
      
      toast({
        title: "Settings Saved",
        description: "Store settings have been saved successfully.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'paymentQR') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'logo') {
          setStoreInfo(prev => ({ ...prev, logo: result }));
        } else if (type === 'paymentQR') {
          setStoreInfo(prev => ({ ...prev, paymentQR: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Store Settings</h2>

      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={storeInfo.businessName || storeInfo.name}
                onChange={(e) => handleStoreInfoChange('businessName', e.target.value)}
                placeholder="Your Business Name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={storeInfo.phone}
                onChange={(e) => handleStoreInfoChange('phone', e.target.value)}
                placeholder="+91 00000 00000"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={storeInfo.email}
                onChange={(e) => handleStoreInfoChange('email', e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={storeInfo.gstNumber || storeInfo.taxId}
                onChange={(e) => handleStoreInfoChange('gstNumber', e.target.value)}
                placeholder="GST000000000"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={storeInfo.website}
                onChange={(e) => handleStoreInfoChange('website', e.target.value)}
                placeholder="www.yourbusiness.com"
              />
            </div>
            <div>
              <Label htmlFor="printFormat">Default Print Format</Label>
              <Select 
                value={storeInfo.printFormat} 
                onValueChange={(value: 'a4' | 'thermal') => handleStoreInfoChange('printFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 Format</SelectItem>
                  <SelectItem value="thermal">Thermal Printer (80mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={storeInfo.address}
              onChange={(e) => handleStoreInfoChange('address', e.target.value)}
              placeholder="Your Business Address"
              rows={3}
            />
          </div>

          {/* Logo Upload */}
          <div>
            <Label htmlFor="logo">Business Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'logo')}
              className="cursor-pointer"
            />
            {storeInfo.logo && (
              <div className="mt-2">
                <img src={storeInfo.logo} alt="Logo Preview" className="h-20 w-auto" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="upiString">UPI Payment String</Label>
            <Input
              id="upiString"
              value={upiSettings.upiString}
              onChange={(e) => handleUpiChange('upiString', e.target.value)}
              placeholder="upi://pay?pa=your@upi&pn=Your+Name&tn=Payment&am=${amount}&cu=INR"
            />
            <p className="text-sm text-gray-500 mt-1">
              Use ${amount} as placeholder for the invoice amount
            </p>
          </div>

          {/* Payment QR Upload */}
          <div>
            <Label htmlFor="paymentQR">Payment QR Code (Optional)</Label>
            <Input
              id="paymentQR"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'paymentQR')}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a static QR code image. If provided, this will be used instead of generating QR from UPI string.
            </p>
          </div>

          {/* QR Code Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upiSettings.qrCodeUrl && (
              <div>
                <Label>Generated QR Preview (₹100)</Label>
                <div className="mt-2 p-4 border rounded-lg text-center">
                  <img src={upiSettings.qrCodeUrl} alt="QR Code Preview" className="mx-auto h-32 w-32" />
                  <p className="text-sm text-gray-500 mt-2">Preview with ₹100</p>
                </div>
              </div>
            )}
            
            {storeInfo.paymentQR && (
              <div>
                <Label>Uploaded QR Code</Label>
                <div className="mt-2 p-4 border rounded-lg text-center">
                  <img src={storeInfo.paymentQR} alt="Payment QR" className="mx-auto h-32 w-32" />
                  <p className="text-sm text-gray-500 mt-2">Static QR Code</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} className="w-full">
        Save Settings
      </Button>
    </div>
  );
};

export default StoreSettings;
