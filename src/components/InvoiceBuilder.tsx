import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeDataURL } from "../utils/qrCodeGenerator";
import { saveInvoicePDF } from "../utils/fileSystem";

interface InvoiceItem {
  id: string;
  productName: string;
  colorCode: string;
  quantity: number;
  rate: number;
  total: number;
  volume?: string;
}

interface Product {
  id: string;
  name: string;
  colorCode?: string;
  basePrice?: number;
  volume?: string;
}

interface InvoiceBuilderProps {
  onClose: (invoiceId?: string) => void;
}

const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose }) => {
  const [invoiceId, setInvoiceId] = useState<string>(Date.now().toString());
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<{ name: string; phone: string; address: string; email?: string }>({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [watermarkId, setWatermarkId] = useState<string>('');
  const [gstEnabled, setGstEnabled] = useState<boolean>(true);
  const { toast } = useToast();

  const getCurrentStoreSettings = (): { name: string; address: string; phone: string; email: string; taxId: string; website: string; logo?: string; paymentQR?: string; } => {
    const storeInfo = localStorage.getItem('storeInfo');
    let storeSettings = {};
    if (storeInfo) {
      try {
        storeSettings = JSON.parse(storeInfo);
      } catch (e) {
        console.error('Error parsing store settings:', e);
      }
    }
    const finalSettings = {
      name: (storeSettings as any).businessName || (storeSettings as any).name || 'Your Business Name',
      address: (storeSettings as any).address || 'Your Business Address',
      phone: (storeSettings as any).phone || '+91 00000 00000',
      email: (storeSettings as any).email || 'your@email.com',
      taxId: (storeSettings as any).gstNumber || (storeSettings as any).taxId || 'GST000000000',
      website: (storeSettings as any).website || 'www.yourbusiness.com',
      logo: (storeSettings as any).logo || '',
      paymentQR: (storeSettings as any).paymentQR || ''
    };
    return finalSettings;
  };

  useEffect(() => {
    // Load existing invoice if editing
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const existingInvoice = savedInvoices.find((inv: any) => inv.id === invoiceId);
    if (existingInvoice) {
      setInvoiceNumber(existingInvoice.invoiceNumber || '');
      setCustomerDetails(existingInvoice.customerDetails || { name: '', phone: '', address: '', email: '' });
      setInvoiceDate(existingInvoice.date ? existingInvoice.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setItems(existingInvoice.items || []);
      setSubtotal(existingInvoice.subtotal || 0);
      setTax(existingInvoice.tax || 0);
      setTotal(existingInvoice.total || 0);
      setNotes(existingInvoice.notes || '');
      setWatermarkId(existingInvoice.watermarkId || '');
      setGstEnabled(existingInvoice.gstEnabled !== undefined ? existingInvoice.gstEnabled : true);
    } else {
      // New invoice defaults
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Date.now()}`);
      setCustomerDetails({ name: '', phone: '', address: '', email: '' });
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setItems([]);
      setSubtotal(0);
      setTax(0);
      setTotal(0);
      setNotes('');
      setWatermarkId('');
      setGstEnabled(true);
    }
  }, [invoiceId]);

  useEffect(() => {
    // Calculate subtotal, tax, and total whenever items or gstEnabled change
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    const newTax = gstEnabled ? +(newSubtotal * 0.18).toFixed(2) : 0;
    setTax(newTax);
    setTotal(+(newSubtotal + newTax).toFixed(2));
  }, [items, gstEnabled]);

  const saveInvoice = () => {
    console.log('Saving invoice...');
    
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const currentStoreInfo = getCurrentStoreSettings();
    
    const invoiceToSave = {
      id: invoiceId,
      invoiceNumber,
      customerDetails,
      storeInfo: currentStoreInfo,
      date: invoiceDate,
      items,
      subtotal,
      tax,
      total,
      status: 'paid' as const, // Default status set to 'paid'
      notes,
      watermarkId,
      gstEnabled
    };

    const existingIndex = savedInvoices.findIndex((inv: any) => inv.id === invoiceId);
    
    if (existingIndex !== -1) {
      savedInvoices[existingIndex] = invoiceToSave;
      console.log('Updated existing invoice');
    } else {
      savedInvoices.push(invoiceToSave);
      console.log('Added new invoice');
    }

    localStorage.setItem('invoices', JSON.stringify(savedInvoices));
    console.log('Invoice saved successfully:', invoiceToSave);
    
    toast({
      title: "Invoice Saved",
      description: `Invoice ${invoiceNumber} has been saved successfully.`,
      className: "bg-green-50 border-green-200 text-green-800"
    });

    return invoiceToSave;
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      colorCode: '',
      quantity: 1,
      rate: 0,
      total: 0,
      volume: ''
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate total when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          const quantity = field === 'quantity' ? Number(value) : Number(item.quantity);
          const rate = field === 'rate' ? Number(value) : Number(item.rate);
          updatedItem.total = quantity * rate;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addProductToInvoice = (product: Product) => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: product.name,
      colorCode: product.colorCode || '',
      quantity: 1,
      rate: product.basePrice || 0,
      total: product.basePrice || 0, // Ensure total is calculated initially
      volume: product.volume || ''
    };
    setItems([...items, newItem]);
  };

  const generateUPIQR = (amount: number) => {
    const currentStoreSettings = getCurrentStoreSettings();
    if (currentStoreSettings.paymentQR) {
      return currentStoreSettings.paymentQR;
    }
    const upiSettings = JSON.parse(localStorage.getItem('upiSettings') || '{}');
    const defaultUpiString = 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR';
    const upiString = upiSettings.upiString || defaultUpiString;
    const finalUpiString = upiString.replace('${amount}', amount.toString());
    const qrUrl = generateQRCodeDataURL(finalUpiString, 150);
    return qrUrl;
  };

  const generateInvoiceHTML = (invoice: any, currentStoreInfo: any, upiQRUrl: string) => {
    // For simplicity, use a basic HTML template
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ccc; padding: 5px; }
            .totals { margin-top: 20px; }
            .qr { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentStoreInfo.name}</h1>
            <p>${currentStoreInfo.address}</p>
            <p>${currentStoreInfo.phone} | ${currentStoreInfo.email}</p>
          </div>
          <div>
            <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br/>
            <strong>Date:</strong> ${invoice.date}<br/>
            <strong>Customer:</strong> ${invoice.customerDetails.name}<br/>
            <strong>Phone:</strong> ${invoice.customerDetails.phone}<br/>
            <strong>Address:</strong> ${invoice.customerDetails.address}<br/>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Color</th>
                <th>Volume</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: InvoiceItem) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.colorCode}</td>
                  <td>${item.volume || ''}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.rate.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <p><strong>Subtotal:</strong> ₹${invoice.subtotal.toFixed(2)}</p>
            ${invoice.gstEnabled ? `<p><strong>GST (18%):</strong> ₹${invoice.tax.toFixed(2)}</p>` : ''}
            <p><strong>Total:</strong> ₹${invoice.total.toFixed(2)}</p>
          </div>
          ${upiQRUrl ? `
            <div class="qr">
              <p>Scan to Pay</p>
              <img src="${upiQRUrl}" alt="UPI QR Code" />
            </div>
          ` : ''}
          <div>
            <p><strong>Notes:</strong> ${invoice.notes}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleSaveAndClose = () => {
    const savedInvoice = saveInvoice();
    onClose(savedInvoice.id);
  };

  const handlePrint = async () => {
    try {
      console.log('Printing invoice...');
      
      const savedInvoice = saveInvoice();
      const currentStoreInfo = getCurrentStoreSettings();
      const upiQRUrl = generateUPIQR(total);

      console.log('Printing with store info:', currentStoreInfo);
      console.log('UPI QR URL for printing:', upiQRUrl ? 'Generated' : 'Not generated');

      const htmlContent = generateInvoiceHTML(savedInvoice, currentStoreInfo, upiQRUrl);

      // Save to local file system simulation
      await saveInvoicePDF(invoiceNumber, htmlContent);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
        
        toast({
          title: "Invoice Printed & Saved",
          description: `Invoice ${invoiceNumber} has been printed and saved successfully.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });

        // Close after successful print
        onClose(savedInvoice.id);
      }
    } catch (error) {
      console.error('Printing error:', error);
      toast({
        title: "Printing Error",
        description: "An error occurred while printing. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-lg">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle>Invoice Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveAndClose(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerAddress">Customer Address</Label>
              <Textarea
                id="customerAddress"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
              />
            </div>

            <div>
              <Label>Invoice Items</Label>
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-6 gap-2 mb-2 items-center">
                  <Input
                    placeholder="Product Name"
                    value={item.productName}
                    onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                    className="col-span-2"
                    required
                  />
                  <Input
                    placeholder="Color Code"
                    value={item.colorCode}
                    onChange={(e) => updateItem(item.id, 'colorCode', e.target.value)}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    required
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                    required
                  />
                  <div className="flex items-center space-x-2">
                    <span>₹{item.total.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addItem} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="gstEnabled" className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="gstEnabled"
                    checked={gstEnabled}
                    onChange={() => setGstEnabled(!gstEnabled)}
                    className="form-checkbox"
                  />
                  <span>Enable GST (18%)</span>
                </Label>
              </div>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save & Close
                </Button>
                <Button type="button" onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white">
                  Print
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceBuilder;
