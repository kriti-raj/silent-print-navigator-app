import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Eye, Printer, Trash2, IndianRupee, Download, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invoiceApiService } from "@/services/invoiceApi";

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
    finalName: string;
    quantity: number;
    rate: number;
    total: number;
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
    const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
    
    const defaultStoreInfo = {
      name: storeSettings.businessName || 'Your Business Name',
      address: storeSettings.address || 'Your Business Address',
      phone: storeSettings.phone || '+91 00000 00000',
      email: storeSettings.email || 'your@email.com',
      taxId: storeSettings.gstNumber || 'GST000000000',
      website: storeSettings.website || 'www.yourbusiness.com',
      logo: storeSettings.logo || '',
      paymentQR: storeSettings.paymentQR || ''
    };
    
    return {
      id: invoice.id || '',
      invoiceNumber: invoice.invoiceNumber || '',
      customerDetails: {
        name: invoice.customerDetails?.name || invoice.customer?.name || '',
        phone: invoice.customerDetails?.phone || invoice.customer?.phone || '',
        address: invoice.customerDetails?.address || invoice.customer?.address || '',
        email: invoice.customerDetails?.email || invoice.customer?.email || ''
      },
      storeInfo: invoice.storeInfo || defaultStoreInfo,
      date: invoice.date || new Date().toISOString(),
      items: (invoice.items || []).map((item: any) => ({
        id: item.id || '',
        productName: item.productName || '',
        colorCode: item.colorCode || '',
        finalName: item.finalName || '',
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        total: Number(item.total) || 0
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

  const generateUPIQR = (amount: number, storeInfo: any) => {
    const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
    
    if (storeSettings.paymentQR) {
      return storeSettings.paymentQR;
    }
    
    const upiSettings = JSON.parse(localStorage.getItem('upiSettings') || '{}');
    const upiString = upiSettings.upiString || 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR';
    const finalUpiString = upiString.replace('${amount}', amount.toString());
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(finalUpiString)}`;
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      console.log('Printing invoice:', invoice.invoiceNumber);
      
      const normalizedInvoice = normalizeInvoice(invoice);
      const upiQRUrl = generateUPIQR(normalizedInvoice.total, normalizedInvoice.storeInfo);
      
      const printerSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
      const paperSize = printerSettings.paperSize || 'A4';
      const margins = printerSettings.margins || 10;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${normalizedInvoice.invoiceNumber}</title>
            <style>
              @media print { @page { margin: ${margins}mm; } }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0;
                font-size: ${paperSize === 'A5' ? '12px' : '14px'};
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
              }
              .header { 
                text-align: center; 
                margin-bottom: 20px; 
                border-bottom: 3px solid #667eea; 
                padding-bottom: 15px;
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .invoice-details { 
                margin-bottom: 20px; 
                display: flex; 
                justify-content: space-between;
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .items-table th, .items-table td { 
                border: 1px solid #e1e5e9; 
                padding: 12px 8px; 
                text-align: left; 
              }
              .items-table th { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: bold; 
              }
              .items-table tr:nth-child(even) { background-color: #f8f9fa; }
              .footer-section { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                margin-top: 20px;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .qr-section { 
                text-align: center; 
                flex: 0 0 150px;
                padding: 10px;
                border: 2px dashed #667eea;
                border-radius: 8px;
              }
              .qr-section img { width: 100px; height: 100px; }
              .totals { 
                flex: 0 0 300px; 
                text-align: right;
                padding: 10px;
              }
              .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 8px 0; 
                padding: 5px 0; 
                border-bottom: 1px solid #eee;
              }
              .final-total { 
                font-weight: bold; 
                font-size: 1.3em; 
                border-top: 3px solid #667eea; 
                padding-top: 10px;
                color: #667eea;
              }
              .store-logo { height: 50px; margin-bottom: 10px; }
              .notes-section {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
                border-left: 4px solid #667eea;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${normalizedInvoice.storeInfo.logo ? `<img src="${normalizedInvoice.storeInfo.logo}" alt="Store Logo" class="store-logo">` : ''}
              <h1 style="color: #667eea; margin: 10px 0;">${normalizedInvoice.storeInfo.name}</h1>
              <p style="margin: 5px 0;">${normalizedInvoice.storeInfo.address}</p>
              <p style="margin: 5px 0;">Phone: ${normalizedInvoice.storeInfo.phone} | Email: ${normalizedInvoice.storeInfo.email}</p>
              <p style="margin: 5px 0; font-weight: bold;">GST No: ${normalizedInvoice.storeInfo.taxId}</p>
            </div>
            
            <div class="invoice-details">
              <div>
                <h2 style="color: #667eea; margin-bottom: 10px;">Invoice #${normalizedInvoice.invoiceNumber}</h2>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(normalizedInvoice.date).toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background: #e7f3ff; padding: 2px 8px; border-radius: 4px; color: #0066cc;">${normalizedInvoice.status}</span></p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 5px 0;"><strong>Customer:</strong> ${normalizedInvoice.customerDetails.name}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${normalizedInvoice.customerDetails.phone}</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${normalizedInvoice.customerDetails.address}</p>
                ${normalizedInvoice.customerDetails.email ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${normalizedInvoice.customerDetails.email}</p>` : ''}
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${normalizedInvoice.items.map(item => `
                  <tr>
                    <td>${item.finalName || `${item.productName}${item.colorCode ? ` - ${item.colorCode}` : ''}`}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.rate.toFixed(2)}</td>
                    <td><strong>₹${item.total.toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer-section">
              ${upiQRUrl ? `
                <div class="qr-section">
                  <p style="margin: 5px 0; font-weight: bold; color: #667eea;">Payment QR</p>
                  <img src="${upiQRUrl}" alt="Payment QR" />
                  <p style="margin: 5px 0; font-size: 10px;">Scan to pay ₹${normalizedInvoice.total.toFixed(2)}</p>
                </div>
              ` : '<div></div>'}
              
              <div class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span><strong>₹${normalizedInvoice.subtotal.toFixed(2)}</strong></span>
                </div>
                ${normalizedInvoice.gstEnabled ? `
                  <div class="total-row">
                    <span>GST (18%):</span>
                    <span><strong>₹${normalizedInvoice.tax.toFixed(2)}</strong></span>
                  </div>
                ` : ''}
                <div class="total-row final-total">
                  <span>Total:</span>
                  <span>₹${normalizedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            ${normalizedInvoice.notes ? `<div class="notes-section"><strong>Notes:</strong> ${normalizedInvoice.notes}</div>` : ''}
          </body>
        </html>
      `;

      await saveInvoicePDF(normalizedInvoice.invoiceNumber, printContent);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
        
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
                            {item.finalName || `${item.productName}${item.colorCode ? ` - ${item.colorCode}` : ''}`}
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
