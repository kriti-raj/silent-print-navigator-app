
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerDetails: any;
  storeInfo: any;
  date: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string;
  watermarkId: string;
  gstEnabled: boolean;
  savedQRCode: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  hasVariableColors: boolean;
  predefinedColors: string[];
  volumes: any[];
  stockQuantity: number;
  unit: string;
}

class SQLiteService {
  private static instance: SQLiteService;
  private dbName = 'invoice_app_db';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  static getInstance(): SQLiteService {
    if (!SQLiteService.instance) {
      SQLiteService.instance = new SQLiteService();
    }
    return SQLiteService.instance;
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('invoices')) {
          db.createObjectStore('invoices', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('store_settings')) {
          db.createObjectStore('store_settings', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB();
    }
    return this.db!;
  }

  // Invoice methods
  async getInvoices(): Promise<any[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['invoices'], 'readonly');
      const store = transaction.objectStore('invoices');
      const request = store.getAll();

      request.onsuccess = () => {
        const invoices = request.result.map((invoice: any) => ({
          ...invoice,
          customerDetails: typeof invoice.customerDetails === 'string' 
            ? JSON.parse(invoice.customerDetails) 
            : invoice.customerDetails,
          storeInfo: typeof invoice.storeInfo === 'string' 
            ? JSON.parse(invoice.storeInfo) 
            : invoice.storeInfo,
          items: typeof invoice.items === 'string' 
            ? JSON.parse(invoice.items) 
            : invoice.items
        }));
        resolve(invoices);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveInvoice(invoice: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['invoices'], 'readwrite');
      const store = transaction.objectStore('invoices');
      
      const invoiceToSave = {
        ...invoice,
        customerDetails: typeof invoice.customerDetails === 'string' 
          ? invoice.customerDetails 
          : JSON.stringify(invoice.customerDetails),
        storeInfo: typeof invoice.storeInfo === 'string' 
          ? invoice.storeInfo 
          : JSON.stringify(invoice.storeInfo),
        items: typeof invoice.items === 'string' 
          ? invoice.items 
          : JSON.stringify(invoice.items)
      };
      
      const request = store.put(invoiceToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['invoices'], 'readwrite');
      const store = transaction.objectStore('invoices');
      const request = store.delete(invoiceId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Customer methods
  async getCustomers(): Promise<any[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomer(customer: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');
      const request = store.put(customer);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');
      const request = store.delete(customerId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Product methods
  async getProducts(): Promise<any[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        const products = request.result.map((product: any) => ({
          ...product,
          predefinedColors: typeof product.predefinedColors === 'string' 
            ? JSON.parse(product.predefinedColors) 
            : product.predefinedColors || [],
          volumes: typeof product.volumes === 'string' 
            ? JSON.parse(product.volumes) 
            : product.volumes || []
        }));
        resolve(products);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveProduct(product: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      
      const productToSave = {
        ...product,
        predefinedColors: typeof product.predefinedColors === 'string' 
          ? product.predefinedColors 
          : JSON.stringify(product.predefinedColors || []),
        volumes: typeof product.volumes === 'string' 
          ? product.volumes 
          : JSON.stringify(product.volumes || [])
      };
      
      const request = store.put(productToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.delete(productId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store settings methods
  async getStoreSetting(key: string): Promise<string | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['store_settings'], 'readonly');
      const store = transaction.objectStore('store_settings');
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveStoreSetting(key: string, value: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['store_settings'], 'readwrite');
      const store = transaction.objectStore('store_settings');
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStoreSettings(): Promise<{ [key: string]: string }> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['store_settings'], 'readonly');
      const store = transaction.objectStore('store_settings');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const settings: { [key: string]: string } = {};
        request.result.forEach((item: any) => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  getStorageUsage(): { used: number; available: number } {
    // Estimate storage usage for IndexedDB
    return {
      used: 100, // Placeholder
      available: 1000000 - 100 // 1GB limit
    };
  }
}

export const sqliteService = SQLiteService.getInstance();
