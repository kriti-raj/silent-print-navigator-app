import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, User, Package, FileText, QrCode, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { sqliteService } from '../services/sqliteService';

interface InvoiceBuilderProps {
  onClose: () => void;
  editInvoiceId?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice?: number;
  category: string;
  hasVariableColors: boolean;
  predefinedColors?: string[];
  volumes?: string[];
  stockQuantity?: number;
  unit: 'liters' | 'kg' | 'pieces';
}

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose, editInvoiceId }) => {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  const [storeInfo, setStoreInfo] = useState<any>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue'>('draft');
  const [notes, setNotes] = useState('');
  const [watermarkId, setWatermarkId] = useState('');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [savedQRCode, setSavedQRCode] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    description: '',
    basePrice: 0,
    category: '',
    stockQuantity: 0,
    unit: 'liters' as 'liters' | 'kg' | 'pieces'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadStoreInfo();
    if (editInvoiceId) {
      loadInvoiceForEdit(editInvoiceId);
    }
  }, [editInvoiceId]);

  const loadProducts = async () => {
    try {
      console.log('Loading products from SQLite...');
      const loadedProducts = await sqliteService.getProducts();
      console.log('Loaded products:', loadedProducts);
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products from database.",
        variant: "destructive"
      });
    }
  };

  const loadCustomers = async () => {
    try {
      console.log('Loading customers from SQLite...');
      const loadedCustomers = await sqliteService.getCustomers();
      console.log('Loaded customers:', loadedCustomers);
      setCustomers(loadedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers from database.",
        variant: "destructive"
      });
    }
  };

  const loadStoreInfo = async () => {
    try {
      const settings = await sqliteService.getAllStoreSettings();
      setStoreInfo(settings);
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  const loadInvoiceForEdit = async (invoiceId: string) => {
    try {
      const invoices = await sqliteService.getInvoices();
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        setInvoiceNumber(invoice.invoiceNumber);
        setCustomerDetails(invoice.customerDetails);
        setStoreInfo(invoice.storeInfo);
        setDate(invoice.date);
        setItems(invoice.items);
        setSubtotal(invoice.subtotal);
        setTax(invoice.tax);
        setTotal(invoice.total);
        setStatus(invoice.status);
        setNotes(invoice.notes);
        setWatermarkId(invoice.watermarkId);
        setGstEnabled(invoice.gstEnabled);
        setSavedQRCode(invoice.savedQRCode);
      }
    } catch (error) {
      console.error('Error loading invoice for edit:', error);
    }
  };

  useEffect(() => {
    calculateSubtotal();
  }, [items]);

  useEffect(() => {
    calculateTax();
  }, [subtotal, gstEnabled]);

  useEffect(() => {
    calculateTotal();
  }, [subtotal, tax]);

  const calculateSubtotal = () => {
    const newSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setSubtotal(newSubtotal);
  };

  const calculateTax = () => {
    const newTax = gstEnabled ? subtotal * 0.18 : 0;
    setTax(newTax);
  };

  const calculateTotal = () => {
    setTotal(subtotal + tax);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a product to add.",
        variant: "destructive"
      });
      return;
    }

    const newItem: InvoiceItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      quantity: quantity,
      price: selectedProduct.basePrice || 0,
      unit: selectedProduct.unit
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].price = price;
    setItems(newItems);
  };

  const handleGenerateQRCode = () => {
    const qrCodeData = JSON.stringify({
      invoiceNumber: invoiceNumber,
      customerName: customerDetails.name,
      totalAmount: total
    });
    setSavedQRCode(qrCodeData);
  };

  const addNewProduct = async () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: newProductData.name,
      description: newProductData.description,
      basePrice: newProductData.basePrice,
      category: newProductData.category,
      hasVariableColors: false,
      predefinedColors: [],
      volumes: [],
      stockQuantity: newProductData.stockQuantity,
      unit: newProductData.unit
    };

    try {
      await sqliteService.saveProduct(newProduct);
      
      // Add the new product to the TOP of the list for immediate access
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      
      // Select the new product immediately
      setSelectedProduct(newProduct);
      
      // Reset the form and close modal
      setNewProductData({
        name: '',
        description: '',
        basePrice: 0,
        category: '',
        stockQuantity: 0,
        unit: 'liters'
      });
      setShowNewProductForm(false);

      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added and selected automatically.`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } catch (error) {
      console.error('Error saving new product:', error);
      toast({
        title: "Error",
        description: "Failed to save product to database.",
        variant: "destructive"
      });
    }
  };

  const saveInvoice = async () => {
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all customer details.",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the invoice.",
        variant: "destructive"
      });
      return;
    }

    try {
      const invoice = {
        id: editInvoiceId || Date.now().toString(),
        invoiceNumber: invoiceNumber,
        customerDetails: customerDetails,
        storeInfo: storeInfo,
        date: date,
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: status,
        notes: notes,
        watermarkId: watermarkId,
        gstEnabled: gstEnabled,
        savedQRCode: savedQRCode
      };

      await sqliteService.saveInvoice(invoice);

      // Auto-save invoice to selected folder if available
      try {
        const { autoSaveInvoice } = await import('../utils/fileSystem');
        const autoSaveResult = await autoSaveInvoice(invoice);
        if (autoSaveResult.success) {
          console.log('Invoice auto-saved to folder:', autoSaveResult.filePath);
        }
      } catch (autoSaveError) {
        console.log('Auto-save not available or failed:', autoSaveError);
      }

      // Also save customer if it's new
      const existingCustomer = customers.find(c => 
        c.phone === customerDetails.phone && c.name === customerDetails.name
      );

      if (!existingCustomer) {
        const newCustomer = {
          id: Date.now().toString(),
          name: customerDetails.name,
          phone: customerDetails.phone,
          email: customerDetails.email || '',
          address: customerDetails.address,
          notes: '',
          createdAt: new Date().toISOString()
        };
        await sqliteService.saveCustomer(newCustomer);
        console.log('New customer saved:', newCustomer);
      }

      toast({
        title: "Invoice Saved",
        description: `Invoice #${invoiceNumber} has been saved successfully and auto-saved to your selected folder.`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice to database.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <Card className="shadow-lg border-0 bg-white rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold">{editInvoiceId ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
          <Button variant="secondary" onClick={onClose} className="bg-white text-purple-600 hover:bg-purple-50">
            Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-6">

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="border-purple-200 focus:ring-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-purple-200 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Customer Details */}
          <Card className="shadow-sm border-0 bg-purple-50">
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    id="customerName"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    className="border-purple-200 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                    className="border-purple-200 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  type="email"
                  id="customerEmail"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                  className="border-purple-200 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                  className="border-purple-200 focus:ring-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Selection and Items */}
          <Card className="shadow-sm border-0 bg-purple-50">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowNewProductForm(true)} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Create a new product to add to your inventory. It will appear at the top of the product list.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" value={newProductData.name} onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input id="description" value={newProductData.description} onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="basePrice" className="text-right">
                        Base Price
                      </Label>
                      <Input type="number" id="basePrice" value={newProductData.basePrice} onChange={(e) => setNewProductData({ ...newProductData, basePrice: parseFloat(e.target.value) })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category
                      </Label>
                      <Input id="category" value={newProductData.category} onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stockQuantity" className="text-right">
                        Stock Quantity
                      </Label>
                      <Input type="number" id="stockQuantity" value={newProductData.stockQuantity} onChange={(e) => setNewProductData({ ...newProductData, stockQuantity: parseInt(e.target.value) })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unit" className="text-right">
                        Unit
                      </Label>
                      <Select value={newProductData.unit} onValueChange={(value: 'liters' | 'kg' | 'pieces') => setNewProductData({ ...newProductData, unit: value })}>
                        <SelectTrigger className="col-span-3 border-purple-200 focus:ring-purple-500">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" onClick={addNewProduct}>Add Product</Button>
                </DialogContent>
              </Dialog>
              
              <Select value={selectedProduct?.id} onValueChange={(value) => setSelectedProduct(products.find(p => p.id === value) || null)}>
                <SelectTrigger className="border-purple-200 focus:ring-purple-500">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="border-purple-200 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <Button onClick={handleAddItem} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left">
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2">Quantity</th>
                        <th className="px-4 py-2">Price</th>
                        <th className="px-4 py-2">Unit</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">{item.name}</td>
                          <td className="border px-4 py-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                              className="w-20 border-purple-200 focus:ring-purple-500"
                            />
                          </td>
                          <td className="border px-4 py-2">
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                              className="w-24 border-purple-200 focus:ring-purple-500"
                            />
                          </td>
                          <td className="border px-4 py-2">{item.unit}</td>
                          <td className="border px-4 py-2">{(item.price * item.quantity).toFixed(2)}</td>
                          <td className="border px-4 py-2">
                            <Button variant="outline" size="sm" onClick={() => handleRemoveItem(index)} className="border-red-200 hover:bg-red-50 text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals and Options */}
          <Card className="shadow-sm border-0 bg-purple-50">
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Label>Subtotal</Label>
                  <Input value={subtotal.toFixed(2)} readOnly className="border-purple-200 focus:ring-purple-500" />
                </div>
                <div>
                  <Label>Tax (18% GST)</Label>
                  <Input value={tax.toFixed(2)} readOnly className="border-purple-200 focus:ring-purple-500" />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input value={total.toFixed(2)} readOnly className="border-purple-200 focus:ring-purple-500" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="gstEnabled">GST Enabled</Label>
                <Switch
                  id="gstEnabled"
                  checked={gstEnabled}
                  onCheckedChange={(checked) => setGstEnabled(checked)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-purple-200 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: 'draft' | 'sent' | 'paid' | 'overdue') => setStatus(value)}>
                  <SelectTrigger className="border-purple-200 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Generator */}
          <Card className="shadow-sm border-0 bg-purple-50">
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleGenerateQRCode} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                Generate QR Code
              </Button>
              {savedQRCode && (
                <QRCodeSVG value={savedQRCode} size={256} level="H" />
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={saveInvoice} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            Save Invoice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceBuilder;
