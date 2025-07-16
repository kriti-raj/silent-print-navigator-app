import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Send, Save, Wifi, WifiOff, Trash2, IndianRupee } from "lucide-react";

interface InvoiceItem {
  id: string;
  productName: string;
  colorCode: string;
  volume: string;
  finalName: string;
  quantity: number;
  rate: number;
  total: number;
}

interface MobileInvoice {
  id: string;
  invoiceNumber: string;
  customerDetails: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  storeInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    website: string;
    logo?: string;
    paymentQR?: string;
  };
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'unpaid';
  notes: string;
  watermarkId: string;
  gstEnabled: boolean;
  submitStatus: 'draft' | 'sending' | 'sent' | 'printed' | 'failed';
}

const Mobile = () => {
  const [invoice, setInvoice] = useState<MobileInvoice>({
    id: '',
    invoiceNumber: '',
    customerDetails: {
      name: '',
      phone: '',
      address: '',
      email: ''
    },
    storeInfo: {
      name: 'Jai Mata Di Saintary & Hardware Store',
      address: 'Hardware Store Address',
      phone: '+91 12345 67890',
      email: 'store@hardware.com',
      taxId: 'GST123456789',
      website: 'www.hardware.com'
    },
    date: new Date().toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'unpaid',
    notes: '',
    watermarkId: '',
    gstEnabled: true,
    submitStatus: 'draft'
  });

  const [isOnline, setIsOnline] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load products from localStorage
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }

    // Generate invoice number
    const invoiceCount = JSON.parse(localStorage.getItem('invoices') || '[]').length;
    setInvoice(prev => ({
      ...prev,
      invoiceNumber: `INV-${String(invoiceCount + 1).padStart(4, '0')}`
    }));
  }, []);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      colorCode: '',
      volume: '',
      finalName: '',
      quantity: 1,
      rate: 0,
      total: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.total = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const tax = invoice.gstEnabled ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.gstEnabled]);

  const handleSave = () => {
    toast({
      title: "Invoice Saved",
      description: "Invoice saved locally"
    });
  };

  const handleSubmit = () => {
    // Save to localStorage
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const updatedInvoice = {
      ...invoice,
      id: Date.now().toString(),
      submitStatus: 'sent'
    };
    invoices.push(updatedInvoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));

    toast({
      title: "Invoice Submitted",
      description: `Invoice ${invoice.invoiceNumber} has been submitted successfully`
    });

    // Reset form
    setInvoice(prev => ({
      ...prev,
      customerDetails: { name: '', phone: '', address: '', email: '' },
      items: [],
      notes: '',
      submitStatus: 'draft'
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Mobile Invoice Creator</CardTitle>
            <div className="flex items-center justify-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
              <span className="text-sm text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={invoice.customerDetails.name}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  customerDetails: { ...prev.customerDetails, name: e.target.value }
                }))}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={invoice.customerDetails.phone}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  customerDetails: { ...prev.customerDetails, phone: e.target.value }
                }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="customerAddress">Address</Label>
              <Textarea
                id="customerAddress"
                value={invoice.customerDetails.address}
                onChange={(e) => setInvoice(prev => ({
                  ...prev,
                  customerDetails: { ...prev.customerDetails, address: e.target.value }
                }))}
                placeholder="Enter customer address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {invoice.items.indexOf(item) + 1}</h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Product</Label>
                    <Select
                      value={item.productName}
                      onValueChange={(value) => updateItem(item.id, 'productName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product, index) => (
                          <SelectItem key={index} value={product.name}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Color</Label>
                    <Input
                      value={item.colorCode}
                      onChange={(e) => updateItem(item.id, 'colorCode', e.target.value)}
                      placeholder="Color"
                    />
                  </div>
                  
                  <div>
                    <Label>Volume</Label>
                    <Input
                      value={item.volume}
                      onChange={(e) => updateItem(item.id, 'volume', e.target.value)}
                      placeholder="Volume"
                    />
                  </div>
                  
                  <div>
                    <Label>Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="text-center"
                        type="number"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Rate</Label>
                    <Input
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="Rate"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label>Total</Label>
                    <div className="flex items-center gap-1 p-2 bg-muted rounded">
                      <IndianRupee className="h-4 w-4" />
                      <span className="font-medium">{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gstToggle">Enable GST (18%)</Label>
              <Switch
                id="gstToggle"
                checked={invoice.gstEnabled}
                onCheckedChange={(checked) => setInvoice(prev => ({ ...prev, gstEnabled: checked }))}
              />
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {invoice.subtotal.toFixed(2)}
                </span>
              </div>
              {invoice.gstEnabled && (
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {invoice.tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={invoice.notes}
              onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4 pb-6">
          <Button variant="outline" onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            <Send className="h-4 w-4 mr-2" />
            Submit Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Mobile;