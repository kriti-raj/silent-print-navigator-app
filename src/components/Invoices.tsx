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

  const getCurrentStoreSettings = (): { name: string; address: string; phone: string; email: string; taxId: string; website: string; logo?: string; paymentQR?: string; } => {
    console.log('Getting current store settings in Invoices...');
    
    const storeInfo = localStorage.getItem('storeInfo');
    let storeSettings: StoreSettings = {};
    
    if (storeInfo) {
      try {
        storeSettings = JSON.parse(storeInfo);
        console.log('Found store settings:', storeSettings);
      } catch (e) {
        console.error('Error parsing store settings:', e);
      }
    }
    
    // Return object with required properties and defaults
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
      storeInfo: currentStoreInfo,
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
      status: invoice.status || 'paid',
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
    const margins = printerSettings.margins || 5;
    const template = printerSettings.template || 'normal';

    // Ultra compact thermal template for receipts
    if (template === 'thermal') {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              @media print { 
                @page { margin: 2mm; size: 80mm auto; }
                body { -webkit-print-color-adjust: exact; color-adjust: exact; }
              }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 10px; 
                line-height: 1.1; 
                max-width: 72mm;
                padding: 2mm;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .line { border-bottom: 1px dashed #000; margin: 1mm 0; height: 1px; }
              .row { display: flex; justify-content: space-between; margin: 0.5mm 0; }
              .total-row { font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 1mm; }
              .qr { text-align: center; margin: 2mm 0; }
              .qr img { width: 60px; height: 60px; }
              .item { margin: 0.5mm 0; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 12px;">${currentStoreInfo.name}</div>
            <div class="center" style="font-size: 8px;">${currentStoreInfo.phone}</div>
            <div class="line"></div>
            <div class="row"><span>INV:</span><span>${invoice.invoiceNumber}</span></div>
            <div class="row"><span>Date:</span><span>${new Date(invoice.date).toLocaleDateString('en-IN')}</span></div>
            <div class="row"><span>To:</span><span>${invoice.customerDetails.name}</span></div>
            <div class="line"></div>
            ${invoice.items.map(item => `
              <div class="item">
                <div style="font-size: 9px;">${item.productName}${item.colorCode ? `-${item.colorCode}` : ''}</div>
                <div class="row">
                  <span>${item.quantity} x ${item.rate}</span>
                  <span>${item.total}</span>
                </div>
              </div>
            `).join('')}
            <div class="line"></div>
            <div class="row"><span>Subtotal:</span><span>${invoice.subtotal}</span></div>
            ${invoice.gstEnabled ? `<div class="row"><span>GST:</span><span>${invoice.tax}</span></div>` : ''}
            <div class="row total-row"><span>TOTAL:</span><span>₹${invoice.total}</span></div>
            ${upiQRUrl ? `
              <div class="qr">
                <div style="font-size: 8px;">Scan to Pay</div>
                <img src="${upiQRUrl}" alt="Pay" />
              </div>
            ` : ''}
            <div class="center" style="font-size: 8px; margin-top: 2mm;">Thank you!</div>
          </body>
        </html>
      `;
    }

    // Compact A4 template that fits on one page
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @media print { 
              @page { margin: ${margins}mm; size: ${paperSize}; }
              body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px;
              line-height: 1.2;
              max-width: 100%;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            .header { 
              text-align: center; 
              padding: 8px 0;
              border-bottom: 1px solid #333;
              margin-bottom: 8px;
            }
            .store-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .store-details { font-size: 9px; margin: 1px 0; }
            .invoice-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin-bottom: 8px; 
              font-size: 10px;
            }
            .section-title { font-weight: bold; font-size: 11px; margin-bottom: 3px; }
            .info-line { margin: 1px 0; }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 8px 0;
              font-size: 10px;
              flex-grow: 1;
            }
            .items-table th, .items-table td { 
              padding: 3px 2px; 
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            .items-table th { 
              background: #f0f0f0; 
              font-weight: bold; 
              font-size: 9px;
            }
            .footer-section { 
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: auto;
              padding-top: 8px;
              border-top: 1px solid #ddd;
            }
            .qr-section { 
              text-align: center;
              max-width: 80px;
            }
            .qr-section img { 
              width: 70px; 
              height: 70px; 
            }
            .totals { 
              text-align: right;
              font-size: 11px;
              min-width: 150px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0; 
              padding: 1px 0;
            }
            .final-total { 
              font-weight: bold; 
              font-size: 12px; 
              border-top: 1px solid #333; 
              padding-top: 3px;
              margin-top: 3px;
            }
            .notes { 
              margin: 4px 0; 
              padding: 4px; 
              background: #f9f9f9; 
              font-size: 9px;
              max-height: 30px;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${currentStoreInfo.name}</div>
            <div class="store-details">${currentStoreInfo.address}</div>
            <div class="store-details">${currentStoreInfo.phone} | ${currentStoreInfo.email}</div>
          </div>
          
          <div class="invoice-info">
            <div>
              <div class="section-title">Invoice Details</div>
              <div class="info-line"><strong>#:</strong> ${invoice.invoiceNumber}</div>
              <div class="info-line"><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('en-IN')}</div>
            </div>
            <div>
              <div class="section-title">Customer</div>
              <div class="info-line"><strong>Name:</strong> ${invoice.customerDetails.name}</div>
              <div class="info-line"><strong>Phone:</strong> ${invoice.customerDetails.phone}</div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="width: 40px;">Qty</th>
                <th style="width: 60px;">Rate</th>
                <th style="width: 70px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.productName}${item.colorCode ? `-${item.colorCode}` : ''}${item.volume ? `-${item.volume}` : ''}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${item.rate}</td>
                  <td style="text-align: right; font-weight: bold;">₹${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer-section">
            ${upiQRUrl ? `
              <div class="qr-section">
                <div style="font-size: 8px; margin-bottom: 2px;">Scan to Pay</div>
                <img src="${upiQRUrl}" alt="QR" />
              </div>
            ` : '<div></div>'}
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${invoice.subtotal}</span>
              </div>
              ${invoice.gstEnabled ? `
                <div class="total-row">
                  <span>GST:</span>
                  <span>₹${invoice.tax}</span>
                </div>
              ` : ''}
              <div class="total-row final-total">
                <span>Total:</span>
                <span>₹${invoice.total}</span>
              </div>
            </div>
          </div>
          
          ${invoice.notes ? `
            <div class="notes">
              <strong>Notes:</strong> ${invoice.notes}
            </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      console.log('Printing invoice:', invoice.invoiceNumber);
      
      const normalizedInvoice = normalizeInvoice(invoice);
      const currentStoreInfo = getCurrentStoreSettings();
      const upiQRUrl = generateUPIQR(normalizedInvoice.total);

      console.log('Printing with store info in Invoices:', currentStoreInfo);
      console.log('UPI QR URL for printing in Invoices:', upiQRUrl ? 'Generated' : 'Not generated');

      const htmlContent = generateInvoiceHTML(normalizedInvoice, currentStoreInfo, upiQRUrl);

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

  // Get current store info for dashboard display
  const currentStoreInfo = getCurrentStoreSettings();

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-lg">
      {/* Beautiful store name header */}
      <div className="text-center mb-8">
        <div className="inline-block">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-wide">
            {currentStoreInfo.name}
          </h1>
          <div className="w-full h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 rounded-full mb-4"></div>
          <p className="text-gray-600 font-medium">{currentStoreInfo.address}</p>
          <p className="text-sm text-gray-500">{currentStoreInfo.phone} | {currentStoreInfo.email}</p>
        </div>
      </div>

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
                  <CardHeader className="pb-3">
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
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Customer</p>
                        <p className="font-medium text-blue-800 text-sm">{invoice.customerDetails?.name}</p>
                        <p className="text-xs text-blue-600">{invoice.customerDetails?.phone}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Items</p>
                        <p className="font-medium text-green-800 text-sm">{invoice.items?.length || 0} item(s)</p>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg">
                        <p className="text-xs text-orange-600 font-medium">Total Amount</p>
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
                  <table className="w-full text-sm">
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
