import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Eye, Printer, Trash2, IndianRupee, Download, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invoiceApiService } from "@/services/invoiceApi";
import { generateQRCodeDataURL } from "../utils/qrCodeGenerator";

interface Invoice {
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
  items: Array<{
    id: string;
    productName: string;
    colorCode: string;
    quantity: number;
    rate: number;
    total: number;
    volume?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes: string;
  watermarkId: string;
  gstEnabled: boolean;
}

interface InvoicesProps {
  onCreateNew: () => void;
  highlightInvoiceId?: string;
}

const Invoices: React.FC<InvoicesProps> = ({ onCreateNew, highlightInvoiceId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  const { toast } = useToast();

  // Fixed function to get current store settings
  const getCurrentStoreSettings = () => {
    console.log('Getting current store settings in Invoices...');
    
    // Try different possible keys where store settings might be stored
    const possibleKeys = ['storeSettings', 'store_settings', 'businessSettings'];
    let storeSettings = {};
    
    for (const key of possibleKeys) {
      const settings = localStorage.getItem(key);
      if (settings) {
        try {
          storeSettings = JSON.parse(settings);
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
    
    console.log('Final store settings in Invoices:', finalSettings);
    return finalSettings;
  };

  useEffect(() => {
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      const parsedInvoices = JSON.parse(savedInvoices);
      // Sort by date (newest first)
      const sortedInvoices = parsedInvoices.sort((a: Invoice, b: Invoice) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setInvoices(sortedInvoices);
    }
  }, []);

  useEffect(() => {
    if (highlightInvoiceId) {
      const invoice = invoices.find(inv => inv.id === highlightInvoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
      }
    }
  }, [highlightInvoiceId, invoices]);

  const handleDelete = (id: string) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== id);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    setInvoices(updatedInvoices);
    toast({
      title: "Invoice Deleted",
      description: "Invoice has been deleted successfully.",
      className: "bg-red-50 border-red-200 text-red-800"
    });
  };

  const updateInvoiceStatus = (id: string, newStatus: Invoice['status']) => {
    const updatedInvoices = invoices.map(inv => 
      inv.id === id ? { ...inv, status: newStatus } : inv
    );
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    setInvoices(updatedInvoices);
  };

  const normalizeInvoice = (invoice: any): Invoice => {
    const currentStoreInfo = getCurrentStoreSettings();
    
    return {
      id: invoice.id || '',
      invoiceNumber: invoice.invoiceNumber || '',
      customerDetails: {
        name: invoice.customerDetails?.name || '',
        phone: invoice.customerDetails?.phone || '',
        address: invoice.customerDetails?.address || '',
        email: invoice.customerDetails?.email || ''
      },
      storeInfo: currentStoreInfo, // Always use current store settings
      date: invoice.date || new Date().toISOString(),
      items: (invoice.items || []).map((item: any) => ({
        id: item.id || '',
        productName: item.productName || '',
        colorCode: item.colorCode || '',
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        total: Number(item.total) || 0,
        volume: item.volume || ''
      })),
      subtotal: Number(invoice.subtotal) || 0,
      tax: Number(invoice.tax) || 0,
      total: Number(invoice.total) || 0,
      status: invoice.status || 'draft',
      notes: invoice.notes || '',
      watermarkId: invoice.watermarkId || '',
      gstEnabled: invoice.gstEnabled !== undefined ? invoice.gstEnabled : true
    };
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

  const generateUPIQR = (amount: number) => {
    console.log('Generating UPI QR in Invoices for amount:', amount);
    
    const currentStoreSettings = getCurrentStoreSettings();
    console.log('Current store settings for QR in Invoices:', currentStoreSettings);
    
    if (currentStoreSettings.paymentQR) {
      console.log('Using store settings QR in Invoices:', currentStoreSettings.paymentQR);
      return currentStoreSettings.paymentQR;
    }
    
    const upiSettings = JSON.parse(localStorage.getItem('upiSettings') || '{}');
    console.log('UPI Settings found in Invoices:', upiSettings);
    
    const defaultUpiString = 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR';
    const upiString = upiSettings.upiString || defaultUpiString;
    const finalUpiString = upiString.replace('${amount}', amount.toString());
    
    console.log('Final UPI string in Invoices:', finalUpiString);
    
    const qrUrl = generateQRCodeDataURL(finalUpiString, 150);
    console.log('Generated QR URL in Invoices:', qrUrl ? 'Generated successfully' : 'Failed to generate');
    
    return qrUrl;
  };

  const generateInvoiceHTML = (invoice: Invoice, currentStoreInfo: any, upiQRUrl: string) => {
    console.log('Generating HTML in Invoices with store info:', currentStoreInfo);
    console.log('UPI QR URL in Invoices:', upiQRUrl ? 'Present' : 'Not present');
    
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

  const handlePrint = async (invoice: Invoice) => {
    try {
      console.log('Printing invoice:', invoice.invoiceNumber);
      
      const normalizedInvoice = normalizeInvoice(invoice);
      const currentStoreInfo = getCurrentStoreSettings(); // Always use current settings
      const upiQRUrl = generateUPIQR(normalizedInvoice.total);

      console.log('Printing with store info in Invoices:', currentStoreInfo);
      console.log('UPI QR URL for printing in Invoices:', upiQRUrl ? 'Generated' : 'Not generated');

      // Generate the exact same HTML for both printing and saving
      const htmlContent = generateInvoiceHTML(normalizedInvoice, currentStoreInfo, upiQRUrl);

      // Save invoice PDF with same content as printed
      await saveInvoicePDF(normalizedInvoice.invoiceNumber, htmlContent);

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
        
        const printerSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
        if (printerSettings.autoMarkAsPrinted && normalizedInvoice.status === 'draft') {
          updateInvoiceStatus(normalizedInvoice.id, 'sent');
        }
        
        toast({
          title: "Invoice Printed & Saved",
          description: `Invoice ${normalizedInvoice.invoiceNumber} has been printed and saved successfully.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
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

  const handleViewInvoice = (invoice: Invoice) => {
    const normalizedInvoice = normalizeInvoice(invoice);
    setSelectedInvoice(normalizedInvoice);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || invoice.status === activeTab;
    
    const matchesDate = !showTodayOnly || 
                       new Date(invoice.date).toDateString() === new Date().toDateString();
    
    return matchesSearch && matchesTab && matchesDate;
  });

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Invoices</h2>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Button onClick={onCreateNew} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm border-purple-200 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showTodayOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTodayOnly(!showTodayOnly)}
            className={showTodayOnly ? "bg-gradient-to-r from-blue-500 to-purple-500" : "border-purple-200 hover:bg-purple-50"}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {showTodayOnly ? "Today's Invoices" : "All Invoices"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-purple-100 to-blue-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white">Draft</TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">Sent</TabsTrigger>
          <TabsTrigger value="paid" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white">Paid</TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No invoices match your search.' : 'Get started by creating your first invoice.'}
                </p>
                {!searchTerm && (
                  <Button onClick={onCreateNew} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className={`shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 ${highlightInvoiceId === invoice.id ? 'ring-2 ring-purple-500 shadow-purple-200' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <CardTitle className="text-lg text-purple-800">Invoice #{invoice.invoiceNumber}</CardTitle>
                          <CardDescription className="text-purple-600">
                            {invoice.customerDetails?.name} • {new Date(invoice.date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(invoice.status)} font-medium`}>
                          {invoice.status}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)} className="border-blue-200 hover:bg-blue-50 text-blue-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePrint(invoice)} className="border-green-200 hover:bg-green-50 text-green-600">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(invoice.id)} className="border-red-200 hover:bg-red-50 text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Customer</p>
                        <p className="font-medium text-blue-800">{invoice.customerDetails?.name}</p>
                        <p className="text-sm text-blue-600">{invoice.customerDetails?.phone}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Items</p>
                        <p className="font-medium text-green-800">{invoice.items?.length || 0} item(s)</p>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Total Amount</p>
                        <p className="font-medium text-lg flex items-center gap-1 text-orange-800">
                          <IndianRupee className="h-4 w-4" />
                          {(invoice.total || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedInvoice && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details - #{selectedInvoice.invoiceNumber}</CardTitle>
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)} className="bg-white text-purple-600 hover:bg-gray-100">
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-800">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-blue-700"><strong>Name:</strong> {selectedInvoice.customerDetails.name}</p>
                    <p className="text-blue-700"><strong>Phone:</strong> {selectedInvoice.customerDetails.phone}</p>
                    <p className="text-blue-700"><strong>Address:</strong> {selectedInvoice.customerDetails.address}</p>
                    {selectedInvoice.customerDetails.email && (
                      <p className="text-blue-700"><strong>Email:</strong> {selectedInvoice.customerDetails.email}</p>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium mb-2 text-green-800">Invoice Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-700"><strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                    <p className="text-green-700"><strong>Status:</strong> <Badge className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status}</Badge></p>
                    <p className="text-green-700"><strong>GST:</strong> {selectedInvoice.gstEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-purple-800">Items</h4>
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
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={item.id || index} className={index % 2 === 0 ? "bg-purple-25" : "bg-white"}>
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

              <div className="flex justify-end">
                <div className="w-64 space-y-2 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex justify-between text-orange-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.gstEnabled && (
                    <div className="flex justify-between text-orange-700">
                      <span>GST (18%):</span>
                      <span className="font-medium">₹{selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl border-t-2 border-orange-300 pt-2 text-orange-800">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-2 text-gray-800">Notes</h4>
                  <p className="text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.storeInfo.paymentQR && (
                <div className="text-center border-t pt-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-3 text-orange-800">Scan to Pay</p>
                  <img 
                    src={selectedInvoice.storeInfo.paymentQR} 
                    alt="Payment QR Code" 
                    className="mx-auto h-24 w-24 border rounded"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Invoices;
