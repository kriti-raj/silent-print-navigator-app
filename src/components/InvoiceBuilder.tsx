import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ArrowLeft, IndianRupee, Eye, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeDataURL } from "../utils/qrCodeGenerator";

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
  quantity: number;
  rate: number;
  total: number;
  unit: string;
}

interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerDetails: { name: string; phone: string; address: string; email?: string };
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

interface StoreSettings {
  businessName?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  taxId?: string;
  website?: string;
  logo?: string;
  paymentQR?: string;
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
  const [includeQR, setIncludeQR] = useState<boolean>(true);
  const [storeInfo, setStoreInfo] = useState<any>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
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
    quantity: 1,
    rate: 0,
    total: 0,
    unit: 'liters'
  }]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  // Fixed function to get current store settings with proper typing
  const getCurrentStoreSettings = () => {
    console.log('Getting current store settings...');
    
    // Try different possible keys where store settings might be stored
    const possibleKeys = ['storeSettings', 'store_settings', 'businessSettings'];
    let storeSettings: StoreSettings = {};
    
    for (const key of possibleKeys) {
      const settings = localStorage.getItem(key);
      if (settings) {
        try {
          storeSettings = JSON.parse(settings) as StoreSettings;
          console.log(`Found store settings in key: ${key}`, storeSettings);
          break;
        } catch (e) {
          console.error(`Error parsing settings from key ${key}:`, e);
        }
      }
    }
    
    // If no settings found, create default structure
    if (Object.keys(storeSettings).length === 0) {
      console.log('No store settings found, using defaults');
      storeSettings = {
        businessName: 'Your Business Name',
        address: 'Your Business Address',
        phone: '+91 00000 00000',
        email: 'your@email.com',
        gstNumber: 'GST000000000',
        website: 'www.yourbusiness.com',
        logo: '',
        paymentQR: ''
      };
    }
    
    const finalSettings = {
      name: storeSettings.businessName || storeSettings.name || 'Your Business Name',
      address: storeSettings.address || 'Your Business Address',
      phone: storeSettings.phone || '+91 00000 00000',
      email: storeSettings.email || 'your@email.com',
      taxId: storeSettings.gstNumber || storeSettings.taxId || 'GST000000000',
      website: storeSettings.website || 'www.yourbusiness.com',
      logo: storeSettings.logo || '',
      paymentQR: storeSettings.paymentQR || ''
    };
    
    console.log('Final store settings:', finalSettings);
    return finalSettings;
  };

  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }

    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }

    // Always use current store settings
    setStoreInfo(getCurrentStoreSettings());
  }, []);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      colorCode: '',
      volume: '',
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
        
        // Auto-fill base price when product is selected
        if (field === 'productName' && value) {
          const product = products.find(p => p.name === value);
          if (product && product.basePrice && updatedItem.rate === 0) {
            updatedItem.rate = product.basePrice;
          }
        }
        
        if (field === 'quantity' || field === 'rate') {
          const quantity = Number(updatedItem.quantity) || 0;
          const rate = Number(updatedItem.rate) || 0;
          updatedItem.total = Math.round((quantity * rate) * 100) / 100;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const calculateTotals = () => {
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    const tax = gstEnabled ? Math.round((subtotal * 0.18) * 100) / 100 : 0;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total };
  };

  const generateInvoiceNumber = () => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const invoiceCount = invoices.length + 1;
    return `${dd}${mm}${yy}${String(invoiceCount).padStart(3, '0')}`;
  };

  const generateUPIQR = (amount: number) => {
    console.log('Generating UPI QR for amount:', amount, 'includeQR:', includeQR);
    
    if (!includeQR) {
      console.log('QR generation disabled by checkbox');
      return '';
    }
    
    const currentStoreSettings = getCurrentStoreSettings();
    console.log('Current store settings for QR:', currentStoreSettings);
    
    // First try to use store settings QR
    if (currentStoreSettings.paymentQR) {
      console.log('Using store settings QR:', currentStoreSettings.paymentQR);
      return currentStoreSettings.paymentQR;
    }
    
    // Then try UPI string with offline generation
    const upiSettings = JSON.parse(localStorage.getItem('upiSettings') || '{}');
    console.log('UPI Settings found:', upiSettings);
    
    const defaultUpiString = 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR';
    const upiString = upiSettings.upiString || defaultUpiString;
    const finalUpiString = upiString.replace('${amount}', amount.toString());
    
    console.log('Final UPI string:', finalUpiString);
    
    // Generate offline QR code
    const qrUrl = generateQRCodeDataURL(finalUpiString, 150);
    console.log('Generated QR URL:', qrUrl ? 'Generated successfully' : 'Failed to generate');
    
    return qrUrl;
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
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
    const currentStoreInfo = getCurrentStoreSettings(); // Always use current settings
    
    console.log('Saving invoice with store info:', currentStoreInfo);
    
    const invoice: SavedInvoice = {
      id: Date.now().toString(),
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      customerDetails,
      items,
      notes,
      watermarkId: '',
      storeInfo: currentStoreInfo, // Use current store info
      subtotal,
      tax,
      total,
      gstEnabled,
      status: paymentStatus === 'paid' ? 'paid' : 'sent'
    };

    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));

    // Attach invoice to customer if selected
    if (selectedCustomerId) {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customerIndex = customers.findIndex((c: Customer) => c.id === selectedCustomerId);
      if (customerIndex !== -1) {
        if (!customers[customerIndex].invoices) {
          customers[customerIndex].invoices = [];
        }
        customers[customerIndex].invoices.push({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.date,
          total: invoice.total
        });
        localStorage.setItem('customers', JSON.stringify(customers));
      }
    }

    setCreatedInvoice(invoice);
    setViewMode('view');

    toast({
      title: "Invoice Created",
      description: `Invoice ${invoiceNumber} has been created successfully.`,
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  const generateInvoiceHTML = (invoice: SavedInvoice, currentStoreInfo: any, upiQRUrl: string) => {
    console.log('Generating HTML with store info:', currentStoreInfo);
    console.log('UPI QR URL:', upiQRUrl ? 'Present' : 'Not present');
    
    const printerSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
    const paperSize = printerSettings.paperSize || 'A4';
    const margins = printerSettings.margins || 10;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @media print { 
              @page { 
                margin: ${margins}mm; 
                size: ${paperSize};
              }
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 20px;
              font-size: ${paperSize === 'A5' ? '11px' : '13px'};
              line-height: 1.4;
              color: #333;
              background: #f8f9fa;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .header { 
              text-align: center; 
              padding: 25px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .store-logo { 
              height: 60px; 
              margin-bottom: 15px; 
              border-radius: 8px;
            }
            .store-name {
              font-size: 28px;
              font-weight: bold;
              margin: 10px 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .store-details {
              font-size: 14px;
              margin: 5px 0;
              opacity: 0.9;
            }
            .invoice-details { 
              display: flex; 
              justify-content: space-between;
              padding: 25px;
              background: #f8f9fa;
              border-bottom: 2px solid #e9ecef;
            }
            .invoice-info, .customer-info {
              flex: 1;
            }
            .invoice-info {
              text-align: left;
            }
            .customer-info {
              text-align: right;
              padding-left: 20px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 10px;
              border-bottom: 2px solid #667eea;
              padding-bottom: 5px;
            }
            .info-line {
              margin: 8px 0;
              display: flex;
              align-items: center;
            }
            .info-label {
              font-weight: bold;
              margin-right: 8px;
              color: #495057;
            }
            .status-badge {
              background: #e7f3ff;
              color: #0066cc;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .items-section {
              padding: 25px;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .items-table th {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
            }
            .items-table td { 
              padding: 12px; 
              border-bottom: 1px solid #e9ecef;
              vertical-align: top;
            }
            .items-table tr:nth-child(even) { 
              background-color: #f8f9fa; 
            }
            .items-table tr:hover {
              background-color: #e3f2fd;
            }
            .item-name {
              font-weight: 600;
              color: #333;
            }
            .item-total {
              font-weight: bold;
              color: #667eea;
              font-size: 15px;
            }
            .footer-section { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              padding: 25px;
              background: #f8f9fa;
            }
            .qr-section { 
              text-align: center; 
              padding: 20px;
              background: white;
              border: 2px dashed #667eea;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .qr-title {
              font-weight: bold;
              color: #667eea;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .qr-section img { 
              width: 120px; 
              height: 120px; 
              border: 2px solid #667eea;
              border-radius: 8px;
            }
            .qr-amount {
              margin-top: 8px;
              font-size: 12px;
              color: #666;
              font-weight: 500;
            }
            .totals { 
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              min-width: 280px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 10px 0; 
              padding: 8px 0; 
              border-bottom: 1px solid #e9ecef;
              font-size: 14px;
            }
            .total-label {
              color: #495057;
              font-weight: 500;
            }
            .total-value {
              font-weight: bold;
              color: #333;
            }
            .final-total { 
              border-top: 3px solid #667eea !important;
              border-bottom: none !important;
              padding-top: 15px !important;
              margin-top: 10px;
              font-size: 18px;
            }
            .final-total .total-label {
              color: #667eea;
              font-weight: bold;
            }
            .final-total .total-value {
              color: #667eea;
              font-size: 20px;
            }
            .notes-section {
              padding: 25px;
              background: #fff8e1;
              border-left: 4px solid #ffc107;
              margin: 20px 25px;
              border-radius: 0 8px 8px 0;
            }
            .notes-title {
              font-weight: bold;
              color: #f57c00;
              margin-bottom: 8px;
            }
            .notes-content {
              color: #5d4037;
              line-height: 1.5;
            }
            .footer-text {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e9ecef;
            }
            @media print {
              .invoice-container {
                box-shadow: none;
                border-radius: 0;
              }
              body {
                background: white;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              ${currentStoreInfo.logo ? `<img src="${currentStoreInfo.logo}" alt="Store Logo" class="store-logo">` : ''}
              <div class="store-name">${currentStoreInfo.name}</div>
              <div class="store-details">${currentStoreInfo.address}</div>
              <div class="store-details">Phone: ${currentStoreInfo.phone} | Email: ${currentStoreInfo.email}</div>
              <div class="store-details">GST No: ${currentStoreInfo.taxId}</div>
            </div>
            
            <div class="invoice-details">
              <div class="invoice-info">
                <div class="section-title">Invoice Details</div>
                <div class="info-line"><span class="info-label">Invoice #:</span> ${invoice.invoiceNumber}</div>
                <div class="info-line"><span class="info-label">Date:</span> ${new Date(invoice.date).toLocaleDateString()}</div>
                <div class="info-line"><span class="info-label">Status:</span> <span class="status-badge">${invoice.status}</span></div>
              </div>
              <div class="customer-info">
                <div class="section-title">Customer Details</div>
                <div class="info-line"><span class="info-label">Name:</span> ${invoice.customerDetails.name}</div>
                <div class="info-line"><span class="info-label">Phone:</span> ${invoice.customerDetails.phone}</div>
                <div class="info-line"><span class="info-label">Address:</span> ${invoice.customerDetails.address}</div>
                ${invoice.customerDetails.email ? `<div class="info-line"><span class="info-label">Email:</span> ${invoice.customerDetails.email}</div>` : ''}
              </div>
            </div>
            
            <div class="items-section">
              <div class="section-title">Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="width: 80px;">Qty</th>
                    <th style="width: 100px;">Rate</th>
                    <th style="width: 120px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map(item => `
                    <tr>
                      <td class="item-name">
                        ${item.productName}${item.colorCode ? ` - ${item.colorCode}` : ''}${item.volume ? ` - ${item.volume}` : ''}
                      </td>
                      <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                      <td style="text-align: right; font-weight: 600;">₹${item.rate.toFixed(2)}</td>
                      <td class="item-total" style="text-align: right;">₹${item.total.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer-section">
              ${upiQRUrl ? `
                <div class="qr-section">
                  <div class="qr-title">Payment QR Code</div>
                  <img src="${upiQRUrl}" alt="Payment QR" />
                  <div class="qr-amount">Scan to pay ₹${invoice.total.toFixed(2)}</div>
                </div>
              ` : '<div></div>'}
              
              <div class="totals">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-value">₹${invoice.subtotal.toFixed(2)}</span>
                </div>
                ${invoice.gstEnabled ? `
                  <div class="total-row">
                    <span class="total-label">GST (18%):</span>
                    <span class="total-value">₹${invoice.tax.toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="total-row final-total">
                  <span class="total-label">Total:</span>
                  <span class="total-value">₹${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            ${invoice.notes ? `
              <div class="notes-section">
                <div class="notes-title">Notes:</div>
                <div class="notes-content">${invoice.notes}</div>
              </div>
            ` : ''}
            
            <div class="footer-text">
              Thank you for your business!
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
      if (!savedInvoices[year]) savedInvoices[year] = {};
      if (!savedInvoices[year][month]) savedInvoices[year][month] = {};
      if (!savedInvoices[year][month][day]) savedInvoices[year][month][day] = {};
      
      savedInvoices[year][month][day][invoiceNumber] = {
        fileName: `Invoice_${invoiceNumber}.html`,
        content: htmlContent,
        timestamp: currentDate.toISOString(),
        folderPath: `Invoices/${year}/${month}/${day}/`
      };
      
      localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));
      
      console.log(`Invoice ${invoiceNumber} saved to Invoices/${year}/${month}/${day}/`);
    } catch (error) {
      console.error('Error saving invoice PDF:', error);
    }
  };

  const handleSilentPrint = () => {
    if (!createdInvoice) return;

    const { total } = calculateTotals();
    const currentStoreInfo = getCurrentStoreSettings(); // Always use current settings
    const upiQRUrl = generateUPIQR(total);

    console.log('Printing with store info:', currentStoreInfo);
    console.log('UPI QR URL for printing:', upiQRUrl ? 'Generated' : 'Not generated');

    // Generate the exact same HTML for both printing and saving
    const htmlContent = generateInvoiceHTML(createdInvoice, currentStoreInfo, upiQRUrl);

    // Save invoice PDF with same content as printed
    saveInvoicePDF(createdInvoice.invoiceNumber, htmlContent);

    // True silent printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (error) {
          console.error('Silent printing failed:', error);
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }

    toast({
      title: "Invoice Printed & Saved",
      description: `Invoice ${createdInvoice.invoiceNumber} has been printed and saved successfully.`,
      className: "bg-purple-50 border-purple-200 text-purple-800"
    });
  };

  if (viewMode === 'view' && createdInvoice) {
    const { subtotal, tax, total } = calculateTotals();
    const currentStoreInfo = getCurrentStoreSettings(); // Always use current settings
    const upiQRUrl = generateUPIQR(total);
    
    console.log('View mode - Store info:', currentStoreInfo);
    console.log('View mode - QR URL:', upiQRUrl ? 'Generated' : 'Not generated');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => onClose(createdInvoice.id)} className="border-purple-200 hover:bg-purple-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSilentPrint} className="border-green-200 hover:bg-green-50 text-green-700">
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
              <Button onClick={() => setViewMode('edit')} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                Edit Invoice
              </Button>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-3xl">{currentStoreInfo.name}</CardTitle>
              <p className="text-purple-100">{currentStoreInfo.address}</p>
              <p className="text-sm text-purple-200">Phone: {currentStoreInfo.phone} | Email: {currentStoreInfo.email}</p>
              <p className="text-sm text-purple-200">GST No: {currentStoreInfo.taxId}</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium mb-2 text-blue-800">Invoice Details</h3>
                    <p className="text-blue-700"><strong>Invoice #:</strong> {createdInvoice.invoiceNumber}</p>
                    <p className="text-blue-700"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p className="text-blue-700"><strong>Status:</strong> <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">{createdInvoice.status}</span></p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-medium mb-2 text-green-800">Customer Details</h3>
                    <p className="text-green-700"><strong>Name:</strong> {customerDetails.name}</p>
                    <p className="text-green-700"><strong>Phone:</strong> {customerDetails.phone}</p>
                    <p className="text-green-700"><strong>Address:</strong> {customerDetails.address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-purple-800">Items</h3>
                  <div className="border rounded-lg overflow-hidden shadow-md">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        <tr>
                          <th className="text-left p-3">Item</th>
                          <th className="text-left p-3">Quantity</th>
                          <th className="text-left p-3">Rate</th>
                          <th className="text-left p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-purple-25" : "bg-white"}>
                            <td className="p-3">
                              {`${item.productName}${item.colorCode ? ` - ${item.colorCode}` : ''}${item.volume ? ` - ${item.volume}` : ''}`}
                            </td>
                            <td className="p-3 font-medium">{item.quantity}</td>
                            <td className="p-3 font-medium">₹{item.rate.toFixed(2)}</td>
                            <td className="p-3 font-bold text-purple-600">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  {upiQRUrl && (
                    <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-dashed border-orange-300">
                      <h3 className="text-lg font-medium mb-2 text-orange-800">Payment QR</h3>
                      <img src={upiQRUrl} alt="Payment QR Code" className="w-24 h-24 mx-auto border rounded" />
                      <p className="mt-2 text-sm text-orange-700">Scan to pay ₹{total.toFixed(2)}</p>
                    </div>
                  )}
                  
                  <div className="w-64 space-y-2 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between text-green-700">
                      <span>Subtotal:</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {gstEnabled && (
                      <div className="flex justify-between text-green-700">
                        <span>GST (18%):</span>
                        <span className="font-medium">₹{tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl border-t-2 border-green-300 pt-2 text-green-800">
                      <span>Total:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-2 text-gray-800">Notes</h3>
                    <p className="text-gray-700">{notes}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => onClose()} className="border-purple-200 hover:bg-purple-50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Create Invoice</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <Label htmlFor="customerSelect" className="text-blue-700 font-medium">Select Customer (Optional)</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
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
                <Label htmlFor="customerName" className="text-blue-700 font-medium">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone" className="text-blue-700 font-medium">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress" className="text-blue-700 font-medium">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                  placeholder="Enter customer address"
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail" className="text-blue-700 font-medium">Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                  placeholder="Enter customer email"
                  type="email"
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div>
                <Label className="text-purple-700 font-medium">Enable GST (18%)</Label>
                <RadioGroup value={gstEnabled.toString()} onValueChange={(value) => setGstEnabled(value === 'true')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="gst-yes" />
                    <Label htmlFor="gst-yes" className="text-purple-600">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="gst-no" />
                    <Label htmlFor="gst-no" className="text-purple-600">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-purple-700 font-medium">Payment Status</Label>
                <RadioGroup value={paymentStatus} onValueChange={(value: 'paid' | 'unpaid') => setPaymentStatus(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="text-purple-600">Paid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unpaid" id="unpaid" />
                    <Label htmlFor="unpaid" className="text-purple-600">Unpaid</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeQR" 
                  checked={includeQR}
                  onCheckedChange={(checked) => {
                    console.log('QR checkbox changed:', checked);
                    setIncludeQR(checked as boolean);
                  }}
                />
                <Label htmlFor="includeQR" className="text-purple-700 font-medium">Include Payment QR Code</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle>Invoice Items</CardTitle>
            <Button onClick={addItem} variant="secondary" className="bg-white text-green-600 hover:bg-green-50">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {items.map((item, index) => (
              <div key={item.id} className="border-2 border-green-200 rounded-lg p-4 space-y-4 bg-gradient-to-r from-green-25 to-blue-25">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-800">Item {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-green-700 font-medium">Product</Label>
                    <Input
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                      placeholder="Type product name"
                      list={`products-${item.id}`}
                      className="border-green-200 focus:ring-green-500"
                    />
                    <datalist id={`products-${item.id}`}>
                      {getFilteredProducts(item.productName).map((product) => (
                        <option key={product.id} value={product.name} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <Label className="text-green-700 font-medium">Color</Label>
                    <Input
                      value={item.colorCode}
                      onChange={(e) => updateItem(item.id, 'colorCode', e.target.value)}
                      placeholder="Color"
                      className="border-green-200 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-700 font-medium">Volume</Label>
                    <Input
                      value={item.volume}
                      onChange={(e) => updateItem(item.id, 'volume', e.target.value)}
                      placeholder="Volume"
                      className="border-green-200 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-700 font-medium">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="border-green-200 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-700 font-medium">Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="border-green-200 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-green-700 font-medium">Total</Label>
                    <div className="flex items-center gap-1 p-2 bg-gradient-to-r from-green-100 to-blue-100 rounded border-2 border-green-300">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-800">{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div>
              <Label htmlFor="notes" className="text-orange-700 font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or special instructions..."
                className="border-orange-200 focus:ring-orange-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-yellow-50">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-yellow-700">Subtotal:</span>
                <span className="flex items-center gap-1 font-medium text-yellow-800">
                  <IndianRupee className="h-5 w-5" />
                  {subtotal.toFixed(2)}
                </span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between text-lg">
                  <span className="text-yellow-700">GST (18%):</span>
                  <span className="flex items-center gap-1 font-medium text-yellow-800">
                    <IndianRupee className="h-5 w-5" />
                    {tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-2xl border-t-2 border-yellow-300 pt-3">
                <span className="text-yellow-800">Total:</span>
                <span className="flex items-center gap-1 text-yellow-900">
                  <IndianRupee className="h-6 w-6" />
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => onClose()} className="border-gray-300 text-gray-600 hover:bg-gray-50">
                Cancel
              </Button>
              <Button onClick={handleSaveInvoice} className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium">
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
