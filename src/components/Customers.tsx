import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, User, Search, Phone, MapPin, FileText, Eye, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sqliteService } from '../services/sqliteService';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerDetails: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  date: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt'>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading customers and invoices from SQLite...');
      const [loadedCustomers, loadedInvoices] = await Promise.all([
        sqliteService.getCustomers(),
        sqliteService.getInvoices()
      ]);
      console.log('Loaded customers:', loadedCustomers);
      console.log('Loaded invoices:', loadedInvoices);
      setCustomers(loadedCustomers);
      setInvoices(loadedInvoices);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data from database.",
        variant: "destructive"
      });
    }
  };

  const getCustomerInvoices = (customerName: string, customerPhone: string) => {
    return invoices.filter(invoice => 
      invoice.customerDetails.name.toLowerCase() === customerName.toLowerCase() ||
      invoice.customerDetails.phone === customerPhone
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        const updatedCustomer = { ...formData, id: editingCustomer.id, createdAt: editingCustomer.createdAt };
        await sqliteService.saveCustomer(updatedCustomer);
        toast({
          title: "Customer Updated",
          description: `${formData.name} has been updated successfully.`,
          className: "bg-blue-50 border-blue-200 text-blue-800"
        });
      } else {
        const newCustomer: Customer = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        await sqliteService.saveCustomer(newCustomer);
        toast({
          title: "Customer Added",
          description: `${formData.name} has been added successfully.`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer to database.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await sqliteService.deleteCustomer(id);
      await loadData();
      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully.",
        className: "bg-red-50 border-red-200 text-red-800"
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer from database.",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Customers</h2>
          <p className="text-muted-foreground">Manage your customer database (SQLite Database)</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-orange-200 focus:ring-orange-500"
        />
      </div>

      {showForm && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
            <CardDescription className="text-orange-100">
              {editingCustomer ? 'Update customer information' : 'Add a new customer to your database'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about the customer..."
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm} className="border-orange-200 hover:bg-orange-50 text-orange-600">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  <Save className="mr-2 h-4 w-4" />
                  {editingCustomer ? 'Update' : 'Save'} Customer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => {
          const customerInvoices = getCustomerInvoices(customer.name, customer.phone);
          const totalSpent = customerInvoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
          
          return (
            <Card key={customer.id} className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-orange-800">
                    <User className="h-4 w-4" />
                    {customer.name}
                  </span>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)} className="border-blue-200 hover:bg-blue-50 text-blue-600">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(customer)} className="border-orange-200 hover:bg-orange-50 text-orange-600">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(customer.id)} className="border-red-200 hover:bg-red-50 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>📧</span>
                      <span>{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                    <span className="text-xs text-muted-foreground">{customer.address}</span>
                  </div>
                  
                  <div className="border-t pt-2 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-700 font-medium">Invoices: {customerInvoices.length}</span>
                      <span className="text-green-700 font-medium flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {totalSpent.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                      {customer.notes}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Added: {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Customer Invoice Details Modal */}
      {selectedCustomer && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50 mt-6">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedCustomer.name} - Invoice History
              </CardTitle>
              <Button variant="secondary" onClick={() => setSelectedCustomer(null)} className="bg-white text-orange-600 hover:bg-gray-100">
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {(() => {
              const customerInvoices = getCustomerInvoices(selectedCustomer.name, selectedCustomer.phone);
              const totalSpent = customerInvoices
                .filter(inv => inv.status === 'paid')
                .reduce((sum, inv) => sum + inv.total, 0);
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Total Invoices
                      </h4>
                      <p className="text-2xl font-bold text-blue-900">{customerInvoices.length}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Total Spent
                      </h4>
                      <p className="text-2xl font-bold text-green-900">₹{totalSpent.toFixed(0)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-orange-800">Avg Invoice</h4>
                      <p className="text-2xl font-bold text-orange-900">
                        ₹{customerInvoices.length > 0 ? (totalSpent / customerInvoices.length).toFixed(0) : '0'}
                      </p>
                    </div>
                  </div>

                  {customerInvoices.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-orange-800">Invoice History</h4>
                      {customerInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200 shadow">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="font-medium text-orange-800">#{invoice.invoiceNumber}</p>
                              <p className="text-xs text-orange-600">{new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                            <span className="font-bold text-orange-800 flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {invoice.total.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-orange-300 mb-4" />
                      <h3 className="text-lg font-medium text-orange-800 mb-2">No invoices found</h3>
                      <p className="text-orange-600">This customer hasn't made any purchases yet.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {filteredCustomers.length === 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
          <CardContent className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No customers match your search.' : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Customers;
