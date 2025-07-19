import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Search, Filter, Plus, FileText, Calendar, DollarSign, Users, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  };
  date: string;
  items: {
    id: string;
    productName: string;
    colorCode: string;
    quantity: number;
    rate: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'unpaid';
  notes: string;
  watermarkId: string;
  gstEnabled: boolean;
  savedQRCode: string;
}

interface InvoicesProps {
  onCreateInvoice: () => void;
  onEditInvoice?: (invoiceId: string) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ onCreateInvoice, onEditInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  };

  useEffect(() => {
    let filtered = invoices;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerDetails.phone.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const deleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      setInvoices(updatedInvoices);
      
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    }
  };

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

  const generateInvoiceHTML = (invoice: Invoice, storeInfo: any, upiQRUrl: string) => {
    const printFormat = storeInfo.printFormat || 'a4';
    
    if (printFormat === 'thermal') {
      return generateThermalInvoiceHTML(invoice, storeInfo, upiQRUrl);
    }
    
    return generateA4InvoiceHTML(invoice, storeInfo, upiQRUrl);
  };

  const generateA4InvoiceHTML = (invoice: Invoice, storeInfo: any, upiQRUrl: string) => {
    const hasColorCode = invoice.items.some((item) => item.colorCode && item.colorCode.trim() !== '');
    
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
            .no-print { margin-top: 20px; text-align: center; }
            .no-print button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 0 5px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${storeInfo.name}</h1>
            <p>${storeInfo.address}</p>
            <p>${storeInfo.phone} | ${storeInfo.email}</p>
            ${storeInfo.taxId ? `<p>GST Number: ${storeInfo.taxId}</p>` : ''}
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
              ${invoice.items.map((item) => `
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
            
            ${upiQRUrl ? `
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

          <div class="no-print">
            <button onclick="window.print()">Print Invoice</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;
  };

  const generateThermalInvoiceHTML = (invoice: Invoice, storeInfo: any, upiQRUrl: string) => {
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
            .no-print { margin-top: 5px; text-align: center; }
            .no-print button { padding: 5px 10px; font-size: 8px; margin: 2px; }
            @media print { 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="bold" style="font-size: 12px;">${storeInfo.name}</div>
            <div>${storeInfo.address}</div>
            <div>${storeInfo.phone}</div>
            <div>${storeInfo.email}</div>
            ${storeInfo.taxId ? `<div>GST: ${storeInfo.taxId}</div>` : ''}
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
              ${invoice.items.map((item) => `
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
          
          <div class="no-print">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;
  };

  const viewInvoice = (invoice: Invoice) => {
    console.log('View invoice:', invoice);
    
    // Generate and open invoice HTML in new window
    const currentStoreInfo = getCurrentStoreSettings();
    const upiQRUrl = invoice.savedQRCode || '';
    
    const htmlContent = generateInvoiceHTML(invoice, currentStoreInfo, upiQRUrl);
    
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const printInvoice = async (invoice: Invoice) => {
    try {
      console.log('Printing invoice from list...');
      
      const currentStoreInfo = getCurrentStoreSettings();
      const upiQRUrl = invoice.savedQRCode || '';

      let htmlContent;
      if (currentStoreInfo.printFormat === 'thermal') {
        htmlContent = generateThermalInvoiceHTML(invoice, currentStoreInfo, upiQRUrl);
      } else {
        htmlContent = generateA4InvoiceHTML(invoice, currentStoreInfo, upiQRUrl);
      }

      // Save to file system
      await saveInvoicePDF(invoice.invoiceNumber, htmlContent);

      if (currentStoreInfo.silentPrint) {
        // Silent print - just save and show success
        toast({
          title: "Invoice Saved",
          description: `Invoice ${invoice.invoiceNumber} has been saved successfully.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
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
            }, 500);
          };
          
          toast({
            title: "Invoice Printed & Saved",
            description: `Invoice ${invoice.invoiceNumber} has been printed and saved successfully.`,
            className: "bg-green-50 border-green-200 text-green-800"
          });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button onClick={onCreateInvoice} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Create New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('paid')}
                size="sm"
              >
                Paid
              </Button>
              <Button
                variant={statusFilter === 'unpaid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('unpaid')}
                size="sm"
              >
                Unpaid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                {invoices.length === 0 
                  ? "No invoices found. Create your first invoice!" 
                  : "No invoices match your search criteria."
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">#{invoice.invoiceNumber}</h3>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Customer:</strong> {invoice.customerDetails.name}
                      </div>
                      <div>
                        <strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Amount:</strong> <span className="font-semibold text-green-600">₹{invoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <strong>Phone:</strong> {invoice.customerDetails.phone}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
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
                      onClick={() => onEditInvoice?.(invoice.id)}
                      title="Edit Invoice"
                    >
                      <Edit className="h-4 w-4" />
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
