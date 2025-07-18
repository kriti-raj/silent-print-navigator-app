import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeDataURL } from "../utils/qrCodeGenerator";
import { saveInvoicePDF } from "../utils/fileSystem";

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
    printFormat?: 'a4' | 'thermal';
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
  status: 'paid' | 'unpaid' | 'overdue';
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
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'today' | 'paid' | 'unpaid' | 'overdue'>('today');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus]);

  const loadInvoices = () => {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    // Sort invoices by date (newest first)
    const sortedInvoices = savedInvoices.sort((a: Invoice, b: Invoice) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setInvoices(sortedInvoices);
  };

  const filterInvoices = () => {
    let filtered = invoices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerDetails.phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'today') {
        const today = new Date();
        filtered = filtered.filter(invoice => {
          const invDate = new Date(invoice.date);
          return invDate.getDate() === today.getDate() && 
                 invDate.getMonth() === today.getMonth() && 
                 invDate.getFullYear() === today.getFullYear();
        });
      } else {
        filtered = filtered.filter(invoice => invoice.status === filterStatus);
      }
    }

    setFilteredInvoices(filtered);
  };

  const deleteInvoice = (id: string) => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    
    toast({
      title: "Invoice Deleted",
      description: "Invoice has been deleted successfully.",
      className: "bg-red-50 border-red-200 text-red-800"
    });
  };

  const generateUPIQR = (amount: number, storeInfo: any) => {
    if (storeInfo.paymentQR) {
      return storeInfo.paymentQR;
    }
    const upiSettings = JSON.parse(localStorage.getItem('upiSettings') || '{}');
    const defaultUpiString = 'upi://pay?pa=paytmqr5fhvnj@ptys&pn=Mirtunjay+Kumar&tn=Invoice+Payment&am=${amount}&cu=INR';
    const upiString = upiSettings.upiString || defaultUpiString;
    const finalUpiString = upiString.replace('${amount}', amount.toString());
    const qrUrl = generateQRCodeDataURL(finalUpiString, 150);
    return qrUrl;
  };

  const generateInvoiceHTML = (invoice: Invoice, upiQRUrl: string) => {
    const printFormat = invoice.storeInfo.printFormat || 'a4';
    
    if (printFormat === 'thermal') {
      return generateThermalInvoiceHTML(invoice, upiQRUrl);
    }
    
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
            <h1>${invoice.storeInfo.name}</h1>
            <p>${invoice.storeInfo.address}</p>
            <p>${invoice.storeInfo.phone} | ${invoice.storeInfo.email}</p>
            ${invoice.storeInfo.taxId ? `<p>GST Number: ${invoice.storeInfo.taxId}</p>` : ''}
          </div>
          
          <div class="invoice-details">
            <div>
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
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
              ${invoice.items.map((item) => `
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

  const generateThermalInvoiceHTML = (invoice: Invoice, upiQRUrl: string) => {
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
            <div class="bold" style="font-size: 12px;">${invoice.storeInfo.name}</div>
            <div>${invoice.storeInfo.address}</div>
            <div>${invoice.storeInfo.phone}</div>
            <div>${invoice.storeInfo.email}</div>
            ${invoice.storeInfo.taxId ? `<div>GST: ${invoice.storeInfo.taxId}</div>` : ''}
          </div>
          <div class="line"></div>
          <div>
            <div><span class="bold">Invoice:</span> ${invoice.invoiceNumber}</div>
            <div><span class="bold">Date:</span> ${new Date(invoice.date).toLocaleDateString()}</div>
            <div><span class="bold">Status:</span> ${invoice.status.toUpperCase()}</div>
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
              ${invoice.items.map((item) => `
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

  const viewInvoice = (invoice: Invoice) => {
    const upiQRUrl = (invoice as any).savedQRCode || generateUPIQR(invoice.total, invoice.storeInfo);
    const htmlContent = generateInvoiceHTML(invoice, upiQRUrl);

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const printInvoice = async (invoice: Invoice) => {
    try {
      const upiQRUrl = (invoice as any).savedQRCode || generateUPIQR(invoice.total, invoice.storeInfo);
      const htmlContent = generateInvoiceHTML(invoice, upiQRUrl);

      // Save to file system
      await saveInvoicePDF(invoice.invoiceNumber, htmlContent);

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
          title: "Invoice Printed",
          description: `Invoice ${invoice.invoiceNumber} has been printed successfully.`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayInvoicesCount = invoices.filter(invoice => {
    const today = new Date();
    const invDate = new Date(invoice.date);
    return invDate.getDate() === today.getDate() && 
           invDate.getMonth() === today.getMonth() && 
           invDate.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button onClick={onCreateNew} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Create New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Today's Invoices</p>
                <p className="text-2xl font-bold">{todayInvoicesCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Paid Invoices</p>
                <p className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'paid').length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-100">Unpaid Invoices</p>
                <p className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'unpaid').length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices by number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'today' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('today')}
            size="sm"
            className={filterStatus === 'today' ? 'bg-primary text-primary-foreground' : ''}
          >
            Today
          </Button>
          <Button
            variant={filterStatus === 'paid' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('paid')}
            size="sm"
          >
            Paid
          </Button>
          <Button
            variant={filterStatus === 'unpaid' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('unpaid')}
            size="sm"
          >
            Unpaid
          </Button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {filterStatus === 'today' ? 'No invoices created today' : 'No invoices found'}
              </h3>
              <p className="mt-1 text-gray-500">
                {filterStatus === 'today' 
                  ? 'Create your first invoice for today to get started.' 
                  : searchTerm 
                    ? 'Try adjusting your search criteria.' 
                    : 'Get started by creating your first invoice.'
                }
              </p>
              <Button onClick={onCreateNew} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create New Invoice
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className={`hover:shadow-lg transition-shadow ${
                highlightInvoiceId === invoice.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{invoice.invoiceNumber}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{invoice.customerDetails.name}</p>
                    <p className="text-sm text-gray-500">{invoice.customerDetails.phone}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                    <p className="text-lg font-semibold text-green-600">₹{invoice.total.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewInvoice(invoice)}
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(invoice)}
                      title="Print Invoice"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoices;
