import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Printer, ArrowLeft } from "lucide-react";
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
}

interface Product {
  id: string;
  name: string;
  colorCode?: string;
  basePrice?: number;
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
  editInvoiceId?: string;
}

const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose, editInvoiceId }) => {
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
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [includePaymentQR, setIncludePaymentQR] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  const getCurrentStoreSettings = (): { name: string; address: string; phone: string; email: string; taxId: string; website: string; logo?: string; paymentQR?: string; printFormat?: 'a4' | 'thermal'; silentPrint?: boolean; } => {
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
      paymentQR: (storeSettings as any).paymentQR || '',
      printFormat: (storeSettings as any).printFormat || 'a4',
      silentPrint: (storeSettings as any).silentPrint || false
    };
    return finalSettings;
  };

  const generateInvoiceNumber = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const datePrefix = `${dd}${mm}${yy}`;
    
    // Get all invoices to find the highest number for today
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const todayInvoices = savedInvoices.filter((inv: any) => {
      return inv.invoiceNumber && inv.invoiceNumber.startsWith(datePrefix);
    });
    
    // Find the highest sequence number for today
    let maxSequence = 0;
    todayInvoices.forEach((inv: any) => {
      const parts = inv.invoiceNumber.split('-');
      if (parts.length === 2) {
        const sequenceNum = parseInt(parts[1]);
        if (!isNaN(sequenceNum) && sequenceNum > maxSequence) {
          maxSequence = sequenceNum;
        }
      }
    });
    
    const nextSequence = maxSequence + 1;
    const sequenceNumber = String(nextSequence).padStart(3, '0');
    return `${datePrefix}-${sequenceNumber}`;
  };

  useEffect(() => {
    // Load customers and products
    const savedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    setCustomers(savedCustomers);
    setProducts(savedProducts);

    // If editing an existing invoice, load its data
    if (editInvoiceId) {
      const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const existingInvoice = savedInvoices.find((inv: any) => inv.id === editInvoiceId);
      if (existingInvoice) {
        setInvoiceId(existingInvoice.id);
        setInvoiceNumber(existingInvoice.invoiceNumber);
        setCustomerDetails(existingInvoice.customerDetails);
        setInvoiceDate(existingInvoice.date);
        setItems(existingInvoice.items);
        setNotes(existingInvoice.notes || '');
        setGstEnabled(existingInvoice.gstEnabled || false);
        setPaymentStatus(existingInvoice.status || 'paid');
        return;
      }
    }

    // Generate invoice number for new invoice
    setInvoiceNumber(generateInvoiceNumber());
    
    // Start with one empty item
    const initialItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      colorCode: '',
      quantity: 1,
      rate: 0,
      total: 0
    };
    setItems([initialItem]);
  }, [editInvoiceId]);

  useEffect(() => {
    // Calculate subtotal, tax, and total whenever items or gstEnabled change
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    
    const newTax = gstEnabled ? newSubtotal * 0.18 : 0;
    setTax(newTax);
    
    const newTotal = newSubtotal + newTax;
    setTotal(newTotal);
  }, [items, gstEnabled]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      colorCode: '',
      quantity: 1,
      rate: 0,
      total: 0
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
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const selectProductFromDropdown = (productName: string, itemId: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const updatedItem = {
            ...item,
            productName: product.name,
            colorCode: product.colorCode || '',
            rate: product.basePrice || 0,
            total: item.quantity * (product.basePrice || 0)
          };
          return updatedItem;
        }
        return item;
      }));
    }
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

  const saveInvoice = () => {
    console.log('Saving invoice...');
    
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const currentStoreInfo = getCurrentStoreSettings();
    
    // Generate and save QR code with the invoice
    const upiQRUrl = includePaymentQR ? generateUPIQR(total) : '';
    
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
      status: paymentStatus,
      notes,
      watermarkId: '',
      gstEnabled,
      savedQRCode: upiQRUrl
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

    // Update customer's invoice list - but don't add duplicate entries
    if (customerDetails.name && customerDetails.phone) {
      const savedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customerIndex = savedCustomers.findIndex((c: Customer) => 
        c.phone === customerDetails.phone || c.name.toLowerCase() === customerDetails.name.toLowerCase()
      );
      
      if (customerIndex !== -1) {
        if (!savedCustomers[customerIndex].invoices) {
          savedCustomers[customerIndex].invoices = [];
        }
        const invoiceExists = savedCustomers[customerIndex].invoices.some((invId: string) => invId === invoiceId);
        if (!invoiceExists) {
          savedCustomers[customerIndex].invoices.push(invoiceId);
          localStorage.setItem('customers', JSON.stringify(savedCustomers));
        }
      }
    }

    console.log('Invoice saved successfully:', invoiceToSave);
    
    toast({
      title: "Invoice Saved",
      description: `Invoice ${invoiceNumber} has been saved successfully.`,
      className: "bg-green-50 border-green-200 text-green-800"
    });

    return invoiceToSave;
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
    const printFormat = currentStoreInfo.printFormat || 'a4';
    
    if (printFormat === 'thermal') {
      return generateThermalInvoiceHTML(invoice, currentStoreInfo, upiQRUrl);
    }
    
    return generateA4InvoiceHTML(invoice, currentStoreInfo, upiQRUrl);
  };

  const generateA4InvoiceHTML = (invoice: any, currentStoreInfo: any, upiQRUrl: string) => {
    const hasColorCode = invoice.items.some((item: InvoiceItem) => item.colorCode && item.colorCode.trim() !== '');
    
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
            .qr img { width: 120px; height: 120px; }
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
                ${hasColorCode ? '<th>Color Code</th>' : ''}
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: InvoiceItem) => `
                <tr>
                  <td>${item.productName}</td>
                  ${hasColorCode ? `<td>${item.colorCode || '-'}</td>` : ''}
                  <td>${item.quantity}</td>
                  <td>₹${item.rate.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="totals" style="flex: 1;">
              <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
              ${invoice.gstEnabled ? `<div>GST (18%): ₹${invoice.tax.toFixed(2)}</div>` : ''}
              <div class="total-final">Total Amount: ₹${invoice.total.toFixed(2)}</div>
            </div>
            
            ${upiQRUrl && includePaymentQR ? `
              <div class="qr" style="flex: 0 0 140px; margin-left: 20px;">
                <h4 style="margin: 0 0 10px 0;">Scan to Pay</h4>
                <img src="${upiQRUrl}" alt="UPI QR Code" />
              </div>
            ` : ''}
          </div>

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
            .qr img { width: 35mm; height: 35mm; }
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
                    ${item.colorCode && item.colorCode.trim() ? `<br/><small>${item.colorCode}</small>` : ''}
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
          ${upiQRUrl && includePaymentQR ? `
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

  const handlePrint = async () => {
    try {
      console.log('Printing invoice...');
      
      const savedInvoice = saveInvoice();
      const currentStoreInfo = getCurrentStoreSettings();
      const upiQRUrl = savedInvoice.savedQRCode || '';

      let htmlContent;
      if (currentStoreInfo.printFormat === 'thermal') {
        htmlContent = generateThermalInvoiceHTML(savedInvoice, currentStoreInfo, upiQRUrl);
      } else {
        htmlContent = generateInvoiceHTML(savedInvoice, currentStoreInfo, upiQRUrl);
      }

      // Save to local file system
      await saveInvoicePDF(invoiceNumber, htmlContent);

      if (currentStoreInfo.silentPrint) {
        // Silent print - just save and show success
        toast({
          title: "Invoice Saved",
          description: `Invoice ${invoiceNumber} has been saved successfully.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
        onClose(savedInvoice.id);
      } else {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Wait for content to load then print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 500);
          };
          
          toast({
            title: "Invoice Printed & Saved",
            description: `Invoice ${invoiceNumber} has been printed and saved successfully.`,
            className: "bg-green-50 border-green-200 text-green-800"
          });

          onClose(savedInvoice.id);
        }
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

  const handleSaveOnly = () => {
    saveInvoice();
    onClose();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => onClose()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-blue-600">
            {editInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <div></div>
        </div>

        {/* Customer Details Section */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600">
          <CardHeader>
            <CardTitle className="text-white text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="bg-white rounded-b-lg space-y-4">
            <div>
              <Label htmlFor="customer" className="text-blue-600">Select Customer (Optional)</Label>
              <Select onValueChange={selectCustomer}>
                <SelectTrigger className="w-full">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName" className="text-blue-600">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone" className="text-blue-600">Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="Enter phone number"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customerAddress" className="text-blue-600">Address</Label>
              <Textarea
                id="customerAddress"
                placeholder="Enter customer address"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail" className="text-blue-600">Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="Enter customer email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings Section */}
        <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500">
          <CardHeader>
            <CardTitle className="text-white text-lg">Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent className="bg-white rounded-b-lg space-y-4">
            <div>
              <Label className="text-purple-600 font-medium">Enable GST (18%)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gst"
                    checked={gstEnabled}
                    onChange={() => setGstEnabled(true)}
                    className="text-purple-600"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gst"
                    checked={!gstEnabled}
                    onChange={() => setGstEnabled(false)}
                    className="text-purple-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
            
            <div>
              <Label className="text-purple-600 font-medium">Payment Status</Label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentStatus === 'paid'}
                    onChange={() => setPaymentStatus('paid')}
                    className="text-purple-600"
                  />
                  <span>Paid</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentStatus === 'unpaid'}
                    onChange={() => setPaymentStatus('unpaid')}
                    className="text-purple-600"
                  />
                  <span>Unpaid</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includePaymentQR}
                  onChange={() => setIncludePaymentQR(!includePaymentQR)}
                  className="text-purple-600"
                />
                <span className="text-purple-600 font-medium">Include Payment QR Code</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Section */}
        <Card className="mb-6 bg-gradient-to-r from-green-500 to-blue-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg">Invoice Items</CardTitle>
            <Button 
              onClick={addItem} 
              className="bg-white text-blue-600 hover:bg-blue-50"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="bg-white rounded-b-lg space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-green-600">Item {index + 1}</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-green-600">Product</Label>
                    <div className="space-y-2">
                      <Input
                        list={`products-${item.id}`}
                        placeholder="Type or select product name"
                        value={item.productName}
                        onChange={(e) => {
                          updateItem(item.id, 'productName', e.target.value);
                          // Check if the typed value matches a product
                          const matchedProduct = products.find(p => p.name === e.target.value);
                          if (matchedProduct) {
                            selectProductFromDropdown(matchedProduct.name, item.id);
                          }
                        }}
                        required
                      />
                      <datalist id={`products-${item.id}`}>
                        {products.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name} - ₹{product.basePrice}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-green-600">Color Code</Label>
                    <Input
                      placeholder="Color code (optional)"
                      value={item.colorCode}
                      onChange={(e) => updateItem(item.id, 'colorCode', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-600">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-600">Rate</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-600">Total</Label>
                    <div className="p-2 bg-green-100 rounded text-green-800 font-semibold">
                      ₹ {item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Information Section */}
        <Card className="mb-6 bg-gradient-to-r from-orange-500 to-red-500">
          <CardHeader>
            <CardTitle className="text-white text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="bg-white rounded-b-lg space-y-4">
            <div>
              <Label htmlFor="notes" className="text-orange-600">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber" className="text-orange-600">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                  disabled={!editInvoiceId}
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate" className="text-orange-600">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => onClose()}
            className="px-8"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveOnly} 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8"
          >
            Save Invoice
          </Button>
          <Button 
            onClick={handlePrint} 
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8"
          >
            <Printer className="mr-2 h-4 w-4" />
            Save & Print
          </Button>
        </div>
        
        {/* Print Option after saving */}
        {editInvoiceId && (
          <div className="mt-4 text-center">
            <Button 
              onClick={handlePrint} 
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceBuilder;
