import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Eye, Printer, Trash2, IndianRupee, Download, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar } from "lucide-react";
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
    logo?: string;
    paymentQR?: string;
  };
  date: string;
  items: Array<{
    id: string;
    productName: string;
    colorCode: string;
    volume: string;
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
      description: "Invoice has been deleted successfully."
    });
  };

  const handlePrint = (invoice: Invoice) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${invoice.storeInfo.name}</h1>
            <p>${invoice.storeInfo.address}</p>
            <p>Phone: ${invoice.storeInfo.phone} | Email: ${invoice.storeInfo.email}</p>
            <p>GST No: ${invoice.storeInfo.taxId}</p>
          </div>
          
          <div class="invoice-details">
            <h2>Invoice #${invoice.invoiceNumber}</h2>
            <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
            <p><strong>Customer:</strong> ${invoice.customerDetails.name}</p>
            <p><strong>Phone:</strong> ${invoice.customerDetails.phone}</p>
            <p><strong>Address:</strong> ${invoice.customerDetails.address}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.finalName || `${item.productName} - ${item.colorCode} - ${item.volume}`}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.rate.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${invoice.subtotal.toFixed(2)}</span>
            </div>
            ${invoice.gstEnabled ? `
              <div class="total-row">
                <span>GST (18%):</span>
                <span>₹${invoice.tax.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row final-total">
              <span>Total:</span>
              <span>₹${invoice.total.toFixed(2)}</span>
            </div>
          </div>
          
          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
          
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()">Print Invoice</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Auto print
    printWindow.onload = () => {
      printWindow.print();
    };

    toast({
      title: "Invoice Printed",
      description: `Invoice ${invoice.invoiceNumber} has been sent to printer.`
    });
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
                         invoice.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || invoice.status === activeTab;
    
    const matchesDate = !showTodayOnly || 
                       new Date(invoice.date).toDateString() === new Date().toDateString();
    
    return matchesSearch && matchesTab && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Invoices</h2>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Button onClick={onCreateNew}>
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
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showTodayOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTodayOnly(!showTodayOnly)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {showTodayOnly ? "Today's Invoices" : "All Invoices"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No invoices match your search.' : 'Get started by creating your first invoice.'}
                </p>
                {!searchTerm && (
                  <Button onClick={onCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className={highlightInvoiceId === invoice.id ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <CardTitle className="text-lg">Invoice #{invoice.invoiceNumber}</CardTitle>
                          <CardDescription>
                            {invoice.customerDetails.name} • {new Date(invoice.date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePrint(invoice)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(invoice.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{invoice.customerDetails.name}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customerDetails.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Items</p>
                        <p className="font-medium">{invoice.items.length} item(s)</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-lg flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {invoice.total.toFixed(2)}
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details - #{selectedInvoice.invoiceNumber}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedInvoice.customerDetails.name}</p>
                    <p><strong>Phone:</strong> {selectedInvoice.customerDetails.phone}</p>
                    <p><strong>Address:</strong> {selectedInvoice.customerDetails.address}</p>
                    {selectedInvoice.customerDetails.email && (
                      <p><strong>Email:</strong> {selectedInvoice.customerDetails.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Invoice Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <Badge className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status}</Badge></p>
                    <p><strong>GST:</strong> {selectedInvoice.gstEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Item</th>
                        <th className="text-left p-3">Quantity</th>
                        <th className="text-left p-3">Rate</th>
                        <th className="text-left p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            {item.finalName || `${item.productName} - ${item.colorCode} - ${item.volume}`}
                          </td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">₹{item.rate.toFixed(2)}</td>
                          <td className="p-3">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.gstEnabled && (
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span>₹{selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {selectedInvoice.notes}
                  </p>
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