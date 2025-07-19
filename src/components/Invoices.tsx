import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Search, Filter, Plus, FileText, Calendar, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    volume?: string;
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

  const viewInvoice = (invoice: Invoice) => {
    console.log('View invoice:', invoice);
    
    // Generate and open invoice HTML in new window
    const currentStoreInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
    const upiQRUrl = invoice.savedQRCode || '';
    
    const htmlContent = generateInvoiceHTML(invoice, currentStoreInfo, upiQRUrl);
    
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const generateInvoiceHTML = (invoice: Invoice, storeInfo: any, upiQRUrl: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .customer-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
            .qr { text-align: center; margin: 20px 0; }
            .qr img { width: 150px; height: 150px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${storeInfo.name || 'Store Name'}</h1>
            <p>${storeInfo.address || 'Store Address'}</p>
            <p>${storeInfo.phone || 'Phone'} | ${storeInfo.email || 'Email'}</p>
            ${storeInfo.taxId ? `<p>GST: ${storeInfo.taxId}</p>` : ''}
          </div>
          
          <div class="invoice-details">
            <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
            <div><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</div>
          </div>
          
          <div class="customer-details">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customerDetails.name}</strong></p>
            <p>${invoice.customerDetails.address}</p>
            <p>Phone: ${invoice.customerDetails.phone}</p>
            ${invoice.customerDetails.email ? `<p>Email: ${invoice.customerDetails.email}</p>` : ''}
          </div>
          
          <table>
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
              ${invoice.items.map(item => `
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
            <div style="font-size: 1.2em; font-weight: bold;">Total: ₹${invoice.total.toFixed(2)}</div>
          </div>
          
          ${upiQRUrl ? `
            <div class="qr">
              <h4>Scan to Pay</h4>
              <img src="${upiQRUrl}" alt="UPI QR Code" />
            </div>
          ` : ''}
          
          ${invoice.notes ? `
            <div style="margin-top: 20px;">
              <h4>Notes:</h4>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
          </div>
        </body>
      </html>
    `;
  };

  const getTotalRevenue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const getPaidRevenue = () => {
    return invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const getUnpaidRevenue = () => {
    return invoices.filter(inv => inv.status === 'unpaid').reduce((sum, invoice) => sum + invoice.total, 0);
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
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditInvoice?.(invoice.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-700"
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
