// Simulated API service for local network communication
interface ApiInvoice {
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
  status: 'paid' | 'unpaid';
  notes: string;
  watermarkId: string;
  gstEnabled: boolean;
}

class InvoiceApiService {
  private static instance: InvoiceApiService;

  constructor() {
    // Initialize with existing invoices if any
    this.ensureInvoicesExist();
    this.ensureProductsExist();
  }

  static getInstance(): InvoiceApiService {
    if (!InvoiceApiService.instance) {
      InvoiceApiService.instance = new InvoiceApiService();
    }
    return InvoiceApiService.instance;
  }

  private ensureInvoicesExist() {
    const existingInvoices = localStorage.getItem('invoices');
    if (!existingInvoices) {
      localStorage.setItem('invoices', JSON.stringify([]));
    }
  }

  private ensureProductsExist() {
    const existingProducts = localStorage.getItem('products');
    if (!existingProducts) {
      const defaultProducts = [
        {
          name: "Asian Paints",
          colors: ["Red", "Blue", "Green", "White", "Black"],
          volumes: ["1L", "4L", "10L", "20L"]
        },
        {
          name: "Berger Paints",
          colors: ["Yellow", "Orange", "Purple", "Brown"],
          volumes: ["1L", "4L", "10L"]
        },
        {
          name: "Nerolac Paints",
          colors: ["Pink", "Grey", "Cream", "Sky Blue"],
          volumes: ["1L", "4L", "10L", "20L"]
        }
      ];
      localStorage.setItem('products', JSON.stringify(defaultProducts));
    }
  }

  async getInvoices(): Promise<ApiInvoice[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        resolve(invoices);
      }, 100);
    });
  }

  async saveInvoice(invoice: ApiInvoice): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const existingIndex = invoices.findIndex((inv: ApiInvoice) => inv.id === invoice.id);
        
        if (existingIndex >= 0) {
          invoices[existingIndex] = invoice;
        } else {
          invoices.push(invoice);
        }
        
        localStorage.setItem('invoices', JSON.stringify(invoices));
        resolve();
      }, 100);
    });
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const filteredInvoices = invoices.filter((inv: ApiInvoice) => inv.id !== invoiceId);
        localStorage.setItem('invoices', JSON.stringify(filteredInvoices));
        resolve();
      }, 100);
    });
  }
}

export const invoiceApiService = InvoiceApiService.getInstance();