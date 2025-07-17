import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, ArrowLeft, IndianRupee, Eye, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  basePrice?: number;
  hasVariableColors: boolean;
  predefinedColors?: string[];
  volumes?: string[];
  unit: 'liters' | 'kg' | 'pieces';
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
}

interface InvoiceItem {
  id: string;
  productName: string;
  colorCode: string;
  volume: string;
  finalName: string;
  quantity: number;
  rate: number;
  total: number;
  unit: string;
}

interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerDetails: { name: string; phone: string; address: string };
  items: InvoiceItem[];
  notes: string;
  watermarkId: string;
  storeInfo: any;
  subtotal: number;
  tax: number;
  total: number;
  gstEnabled: boolean;
  status: string;
}

interface InvoiceBuilderProps {
  onClose: (newInvoiceId?: string) => void;
}

const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
  const [createdInvoice, setCreatedInvoice] = useState<SavedInvoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([{
    id: '1',
    productName: '',
    colorCode: '',
    volume: '',
    finalName: '',
    quantity: 1,
    rate: 0,
    total: 0,
    unit: 'liters'
  }]);

  const [storeInfo] = useState({
    name: 'Jai Mata Di Saintary & Hardware Store',
    address: 'Hardware Store Address',
    phone: '+91 12345 67890',
    email: 'store@hardware.com',
    taxId: 'GST123456789',
    website: 'www.hardware.com'
  });

  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }

    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
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
      total: 0,
      unit: 'liters'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.total = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = gstEnabled ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const generateInvoiceNumber = () => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const today = new Date();
    const ddmmyy = today.toLocaleDateString('en-GB').split('/').map(part => part.padStart(2, '0')).join('').slice(0, 6);
    const invoiceCount = invoices.length + 1;
    return `${ddmmyy}${String(invoiceCount).padStart(3, '0')}`;
  };

  const generateUPIQR = (amount: number) => {
    const storeInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
    
    // Check if we should use uploaded QR or generate UPI QR
    if (storeInfo.useUploadedQR && storeInfo.paymentQR) {
      return storeInfo.paymentQR;
    }
    
    // Generate UPI QR
    const upiSettings = JSON.parse(localStorage.getItem('upiSettings') || '{}');
    const upiString = upiSettings.upiString || 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR';
    const finalUpiString = upiString.replace('${amount}', amount.toString());
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalUpiString)}`;
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCustomerDetails({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email || ''
      });
    }
  };

  const handleSaveInvoice = () => {
    const { subtotal, tax, total } = calculateTotals();
    const invoiceNumber = generateInvoiceNumber();
    
    const invoice: SavedInvoice = {
      id: Date.now().toString(),
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerDetails,
      items,
      notes,
      watermarkId: '',
      storeInfo,
      subtotal,
      tax,
      total,
      gstEnabled,
      status: paymentStatus === 'paid' ? 'paid' : 'sent'
    };

    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));

    setCreatedInvoice(invoice);
    setViewMode('view');

    toast({
      title: "Invoice Created",
      description: `Invoice ${invoiceNumber} has been created successfully.`
    });
  };

  const handlePrint = () => {
    if (!createdInvoice) return;

    const { total } = calculateTotals();
    const upiQRUrl = generateUPIQR(total);

    // Enhanced printing with better formatting
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Blocked",
        description: "Please allow popups to enable printing.",
        variant: "destructive"
      });
      return;
    }

    const printerSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
    const paperSize = printerSettings.paperSize || 'A4';
    const margins = printerSettings.margins || 10;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${createdInvoice.invoiceNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: ${margins}mm; 
              padding: 0;
              font-size: ${paperSize === 'A5' ? '12px' : '14px'};
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .invoice-details { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; font-weight: bold; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; padding: 3px 0; }
            .final-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
            .qr-section { text-align: center; margin-top: 20px; page-break-inside: avoid; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${createdInvoice.storeInfo.logo ? `<img src="${createdInvoice.storeInfo.logo}" alt="Store Logo" style="height: 40px; margin-bottom: 10px;">` : ''}
            <h1>${createdInvoice.storeInfo.name}</h1>
            <p>${createdInvoice.storeInfo.address}</p>
            <p>Phone: ${createdInvoice.storeInfo.phone} | Email: ${createdInvoice.storeInfo.email}</p>
            <p>GST No: ${createdInvoice.storeInfo.taxId}</p>
          </div>
          
          <div class="invoice-details">
            <div style="display: flex; justify-content: space-between;">
              <div>
                <h2>Invoice #${createdInvoice.invoiceNumber}</h2>
                <p><strong>Date:</strong> ${new Date(createdInvoice.date).toLocaleDateString()}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>Customer:</strong> ${createdInvoice.customerDetails.name}</p>
                <p><strong>Phone:</strong> ${createdInvoice.customerDetails.phone}</p>
                <p><strong>Address:</strong> ${createdInvoice.customerDetails.address}</p>
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="width: 15%;">Qty</th>
                <th style="width: 20%;">Rate</th>
                <th style="width: 15%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${createdInvoice.items.map(item => `
                <tr>
                  <td>${item.finalName || `${item.productName}${item.colorCode ? ` - ${item.colorCode}` : ''}${item.volume ? ` - ${item.volume}` : ''}`}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.rate.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${createdInvoice.subtotal.toFixed(2)}</span>
            </div>
            ${createdInvoice.gstEnabled ? `
              <div class="total-row">
                <span>GST (18%):</span>
                <span>₹${createdInvoice.tax.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row final-total">
              <span>Total:</span>
              <span>₹${createdInvoice.total.toFixed(2)}</span>
            </div>
          </div>
          
          ${createdInvoice.notes ? `<div style="margin-top: 20px;"><strong>Notes:</strong> ${createdInvoice.notes}</div>` : ''}
          
          <div class="qr-section">
            <h3>Payment QR Code</h3>
            <img src="${upiQRUrl}" alt="Payment QR Code" style="width: 150px; height: 150px;" />
            <p style="font-size: 12px; margin-top: 10px;">Scan to pay ₹${createdInvoice.total.toFixed(2)}</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 1000);
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    toast({
      title: "Invoice Sent to Printer",
      description: `Invoice ${createdInvoice.invoiceNumber} has been sent to printer.`
    });
  };

  if (viewMode === 'view' && createdInvoice) {
    const { subtotal, tax, total } = calculateTotals();
    const upiQRUrl = generateUPIQR(total);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => onClose(createdInvoice.id)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
              <Button onClick={() => setViewMode('edit')}>
                Edit Invoice
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">{storeInfo.name}</CardTitle>
              <p className="text-muted-foreground">{storeInfo.address}</p>
              <p className="text-sm">Phone: {storeInfo.phone} | Email: {storeInfo.email}</p>
              <p className="text-sm">GST No: {storeInfo.taxId}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Invoice Details</h3>
                    <p><strong>Invoice #:</strong> {createdInvoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {createdInvoice.status}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Customer Details</h3>
                    <p><strong>Name:</strong> {customerDetails.name}</p>
                    <p><strong>Phone:</strong> {customerDetails.phone}</p>
                    <p><strong>Address:</strong> {customerDetails.address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Item</th>
                          <th className="text-left p-3">Quantity</th>
                          <th className="text-left p-3">Rate</th>
                          <th className="text-left p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-3">
                              {item.finalName || `${item.productName} - ${item.colorCode} - ${item.volume}`}
                            </td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">₹{item.rate.toFixed(2)}</td>
                            <td className="p-3">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {gstEnabled && (
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span>₹{tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-medium mb-4">Pay via UPI</h3>
                  <img src={upiQRUrl} alt="UPI QR Code" className="mx-auto w-48 h-48" />
                  <p className="mt-2 text-sm text-muted-foreground">Scan to pay ₹{total.toFixed(2)}</p>
                </div>

                {notes && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Notes</h3>
                    <p className="text-muted-foreground p-3 bg-muted rounded">{notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => onClose()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerSelect">Select Customer (Optional)</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing customer or add new" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                  placeholder="Enter customer address"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Enable GST (18%)</Label>
                <RadioGroup value={gstEnabled.toString()} onValueChange={(value) => setGstEnabled(value === 'true')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="gst-yes" />
                    <Label htmlFor="gst-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="gst-no" />
                    <Label htmlFor="gst-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Payment Status</Label>
                <RadioGroup value={paymentStatus} onValueChange={(value: 'paid' | 'unpaid') => setPaymentStatus(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid">Paid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unpaid" id="unpaid" />
                    <Label htmlFor="unpaid">Unpaid</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Items</CardTitle>
            <Button onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Product</Label>
                    <div className="relative">
                      <Input
                        list={`products-${item.id}`}
                        value={item.productName}
                        onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                        placeholder="Type or select product"
                        className="w-full"
                      />
                      <datalist id={`products-${item.id}`}>
                        {products.map((product) => (
                          <option key={product.id} value={product.name} />
                        ))}
                      </datalist>
                    </div>
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
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <div>
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
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
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or special instructions..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {subtotal.toFixed(2)}
                </span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button onClick={handleSaveInvoice} className="flex-1">
                Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
