import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, CreditCard, Settings as SettingsIcon, HardDrive } from "lucide-react";
import StorageUsage from "./StorageUsage";

interface StoreSettingsProps {
}

const StoreSettings: React.FC<StoreSettingsProps> = () => {
  const [storeInfo, setStoreInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    website: '',
    logo: '',
    paymentQR: '',
    printFormat: 'a4'
  });
  const [upiSettings, setUpiSettings] = useState({
    upiString: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedStoreInfo = localStorage.getItem('storeInfo');
    if (savedStoreInfo) {
      setStoreInfo(JSON.parse(savedStoreInfo));
    }

    const savedUpiSettings = localStorage.getItem('upiSettings');
    if (savedUpiSettings) {
      setUpiSettings(JSON.parse(savedUpiSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('storeInfo', JSON.stringify(storeInfo));
    localStorage.setItem('upiSettings', JSON.stringify(upiSettings));
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Store Info
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeInfo.name}
                  onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="storeAddress">Address</Label>
                <Textarea
                  id="storeAddress"
                  value={storeInfo.address}
                  onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storePhone">Phone</Label>
                  <Input
                    id="storePhone"
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="storeEmail">Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={storeInfo.email}
                    onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeTaxId">Tax ID</Label>
                  <Input
                    id="storeTaxId"
                    value={storeInfo.taxId}
                    onChange={(e) => setStoreInfo({ ...storeInfo, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="storeWebsite">Website</Label>
                  <Input
                    id="storeWebsite"
                    value={storeInfo.website}
                    onChange={(e) => setStoreInfo({ ...storeInfo, website: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
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
                  onChange={(e) => setUpiSettings({ ...upiSettings, upiString: e.target.value })}
                  placeholder="upi://pay?pa=YOUR_UPI_ID&pn=YOUR_NAME&am=${amount}&cu=INR"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Use <code>${'{amount}'}</code> as a placeholder for the invoice amount.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="printFormat">Print Format</Label>
                <Select onValueChange={(value) => setStoreInfo({ ...storeInfo, printFormat: value as 'a4' | 'thermal' })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select print format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="thermal">Thermal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <StorageUsage />
        </TabsContent>
      </Tabs>

      <Button onClick={saveSettings}>Save Settings</Button>
    </div>
  );
};

export default StoreSettings;
