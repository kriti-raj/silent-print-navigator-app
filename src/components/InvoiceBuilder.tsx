
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Printer } from "lucide-react";
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

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
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
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
    // Load customers and products
    const savedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    setCustomers(savedCustomers);
    setProducts(savedProducts);

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
  }, []);

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
      status: 'paid' as const,
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
      total: product.basePrice || 0,
      volume: product.volume || ''
    };
    setItems([...items, newItem]);
  };

  const selectCustomer = (customerId: string) => {
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

  const generateThermalInvoiceHTML = (invoice: any, currentStoreInfo: any, upiQRUrl: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 2mm; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 10px; 
              line-height: 1.2;
              width: 72mm;
              margin: 0;
              padding: 2mm;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 2px 0; }
            .items { width: 100%; }
            .items th, .items td { 
              text-align: left; 
              padding: 1px;
              font-size: 9px;
            }
            .right { text-align: right; }
            .qr { text-align: center; margin: 5px 0; }
            .qr img { width: 40mm; height: 40mm; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="bold" style="font-size: 12px;">${currentStoreInfo.name}</div>
            <div>${currentStoreInfo.address}</div>
            <div>${currentStoreInfo.phone}</div>
            <div>${currentStoreInfo.email}</div>
            ${currentStoreInfo.taxId ? `<div>GST: ${currentStoreInfo.taxId}</div>` : ''}
          </div>
          <div class="line"></div>
          <div>
            <div><span class="bold">Invoice:</span> ${invoice.invoiceNumber}</div>
            <div><span class="bold">Date:</span> ${new Date(invoice.date).toLocaleDateString()}</div>
            <div><span class="bold">Time:</span> ${new Date().toLocaleTimeString()}</div>
          </div>
          <div class="line"></div>
          <div>
            <div class="bold">BILL TO:</div>
            <div>${invoice.customerDetails.name}</div>
            <div>${invoice.customerDetails.phone}</div>
            <div>${invoice.customerDetails.address}</div>
          </div>
          <div class="line"></div>
          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amt</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: InvoiceItem) => `
                <tr>
                  <td style="width: 40%;">
                    ${item.productName}
                    ${item.colorCode ? `<br/><small>${item.colorCode}</small>` : ''}
                    ${item.volume ? `<br/><small>${item.volume}</small>` : ''}
                  </td>
                  <td style="width: 15%;">${item.quantity}</td>
                  <td style="width: 20%;">₹${item.rate.toFixed(2)}</td>
                  <td style="width: 25%;" class="right">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="right">
            <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
            ${invoice.gstEnabled ? `<div>GST (18%): ₹${invoice.tax.toFixed(2)}</div>` : ''}
            <div class="bold" style="font-size: 11px;">Total: ₹${invoice.total.toFixed(2)}</div>
          </div>
          <div class="line"></div>
          ${upiQRUrl ? `
            <div class="qr">
              <div class="bold">Scan to Pay</div>
              <img src="${upiQRUrl}" alt="UPI QR" />
            </div>
          ` : ''}
          ${invoice.notes ? `
            <div class="line"></div>
            <div><span class="bold">Notes:</span> ${invoice.notes}</div>
          ` : ''}
          <div class="line"></div>
          <div class="center">
            <div>Thank you for your business!</div>
            <div style="font-size: 8px;">Generated on ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `;
  };

  const generateA4InvoiceHTML = (invoice: any, currentStoreInfo: any, upiQRUrl: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-details { margin-bottom: 30px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .items th { background-color: #f5f5f5; font-weight: bold; }
            .totals { text-align: right; margin-bottom: 30px; }
            .totals div { margin: 5px 0; }
            .total-final { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
            .qr { text-align: center; margin: 20px 0; }
            .qr img { width: 150px; height: 150px; }
            .notes { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #333; }
            .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentStoreInfo.name}</h1>
            <p>${currentStoreInfo.address}</p>
            <p>${currentStoreInfo.phone} | ${currentStoreInfo.email}</p>
            ${currentStoreInfo.taxId ? `<p>GST Number: ${currentStoreInfo.taxId}</p>` : ''}
          </div>
          
          <div class="invoice-details">
            <div>
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
            <div>
              <h3>Bill To:</h3>
              <p><strong>${invoice.customerDetails.name}</strong></p>
              <p>${invoice.customerDetails.phone}</p>
              <p>${invoice.customerDetails.address}</p>
              ${invoice.customerDetails.email ? `<p>${invoice.customerDetails.email}</p>` : ''}
            </div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Color Code</th>
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
                  <td>${item.colorCode || '-'}</td>
                  <td>${item.volume || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.rate.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
            ${invoice.gstEnabled ? `<div>GST (18%): ₹${invoice.tax.toFixed(2)}</div>` : ''}
            <div class="total-final">Total Amount: ₹${invoice.total.toFixed(2)}</div>
          </div>

          ${upiQRUrl ? `
            <div class="qr">
              <h3>Scan to Pay</h3>
              <img src="${upiQRUrl}" alt="UPI QR Code" />
            </div>
          ` : ''}

          ${invoice.notes ? `
            <div class="notes">
              <h4>Notes:</h4>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
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

      const htmlContent = printFormat === 'thermal' 
        ? generateThermalInvoiceHTML(savedInvoice, currentStoreInfo, upiQRUrl)
        : generateA4InvoiceHTML(savedInvoice, currentStoreInfo, upiQRUrl);

      // Save to local file system
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <Card className="max-w-6xl mx-auto shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveAndClose(); }} className="space-y-6">
            {/* Invoice and Customer Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                <div>
                  <Label htmlFor="printFormat">Print Format</Label>
                  <Select value={printFormat} onValueChange={(value: 'a4' | 'thermal') => setPrintFormat(value)}>
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

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer">Select Customer</Label>
                  <Select onValueChange={selectCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose existing customer or enter manually" />
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
                <div>
                  <Label htmlFor="customerAddress">Customer Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={customerDetails.address}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Invoice Items</Label>
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-4 border rounded-lg">
                  <div className="col-span-3">
                    <Select onValueChange={(productId) => {
                      const product = products.find(p => p.id === productId);
                      if (product) addProductToInvoice(product);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₹{product.basePrice}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Product Name"
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                      className="mt-2"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Color Code"
                      value={item.colorCode}
                      onChange={(e) => updateItem(item.id, 'colorCode', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Volume"
                      value={item.volume}
                      onChange={(e) => updateItem(item.id, 'volume', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <span className="font-semibold">₹{item.total.toFixed(2)}</span>
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gstEnabled}
                      onChange={() => setGstEnabled(!gstEnabled)}
                      className="form-checkbox"
                    />
                    <span>GST (18%)</span>
                  </label>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="submit" variant="outline">
                Save & Close
              </Button>
              <Button type="button" onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white">
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceBuilder;
