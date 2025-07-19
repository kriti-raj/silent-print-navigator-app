
import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerDetails: string; // JSON string
  storeInfo: string; // JSON string
  date: string;
  items: string; // JSON string
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
  predefinedColors: string; // JSON string
  volumes: string; // JSON string
  stockQuantity: number;
  unit: string;
}

interface StoreSettings {
  id: string;
  key: string;
  value: string;
}

class SQLiteService {
  private db: Database.Database;
  private static instance: SQLiteService;

  constructor() {
    // Initialize SQLite database
    const dbPath = join(app ? app.getPath('userData') : './data', 'invoice_app.db');
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  static getInstance(): SQLiteService {
    if (!SQLiteService.instance) {
      SQLiteService.instance = new SQLiteService();
    }
    return SQLiteService.instance;
  }

  private initializeTables() {
    // Create invoices table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoiceNumber TEXT UNIQUE,
        customerDetails TEXT,
        storeInfo TEXT,
        date TEXT,
        items TEXT,
        subtotal REAL,
        tax REAL,
        total REAL,
        status TEXT,
        notes TEXT,
        watermarkId TEXT,
        gstEnabled INTEGER,
        savedQRCode TEXT
      )
    `);

    // Create customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        createdAt TEXT
      )
    `);

    // Create products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        basePrice REAL,
        category TEXT,
        hasVariableColors INTEGER,
        predefinedColors TEXT,
        volumes TEXT,
        stockQuantity INTEGER,
        unit TEXT
      )
    `);

    // Create store settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT
      )
    `);
  }

  // Invoice methods
  async getInvoices(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM invoices ORDER BY date DESC');
    const rows = stmt.all() as Invoice[];
    return rows.map(row => ({
      ...row,
      customerDetails: JSON.parse(row.customerDetails),
      storeInfo: JSON.parse(row.storeInfo),
      items: JSON.parse(row.items),
      gstEnabled: Boolean(row.gstEnabled)
    }));
  }

  async saveInvoice(invoice: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO invoices (
        id, invoiceNumber, customerDetails, storeInfo, date, items,
        subtotal, tax, total, status, notes, watermarkId, gstEnabled, savedQRCode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      invoice.id,
      invoice.invoiceNumber,
      JSON.stringify(invoice.customerDetails),
      JSON.stringify(invoice.storeInfo),
      invoice.date,
      JSON.stringify(invoice.items),
      invoice.subtotal,
      invoice.tax,
      invoice.total,
      invoice.status,
      invoice.notes,
      invoice.watermarkId,
      invoice.gstEnabled ? 1 : 0,
      invoice.savedQRCode
    );
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM invoices WHERE id = ?');
    stmt.run(invoiceId);
  }

  // Customer methods
  async getCustomers(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM customers ORDER BY name');
    return stmt.all();
  }

  async saveCustomer(customer: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO customers (id, name, phone, email, address, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(customer.id, customer.name, customer.phone, customer.email, customer.address, customer.createdAt);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run(customerId);
  }

  // Product methods
  async getProducts(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM products ORDER BY name');
    const rows = stmt.all() as Product[];
    return rows.map(row => ({
      ...row,
      hasVariableColors: Boolean(row.hasVariableColors),
      predefinedColors: JSON.parse(row.predefinedColors || '[]'),
      volumes: JSON.parse(row.volumes || '[]')
    }));
  }

  async saveProduct(product: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, description, basePrice, category, hasVariableColors,
        predefinedColors, volumes, stockQuantity, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      product.id,
      product.name,
      product.description,
      product.basePrice,
      product.category,
      product.hasVariableColors ? 1 : 0,
      JSON.stringify(product.predefinedColors || []),
      JSON.stringify(product.volumes || []),
      product.stockQuantity,
      product.unit
    );
  }

  async deleteProduct(productId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(productId);
  }

  // Store settings methods
  async getStoreSetting(key: string): Promise<string | null> {
    const stmt = this.db.prepare('SELECT value FROM store_settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  async saveStoreSetting(key: string, value: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO store_settings (id, key, value)
      VALUES (?, ?, ?)
    `);
    stmt.run(`${key}_${Date.now()}`, key, value);
  }

  async getAllStoreSettings(): Promise<{ [key: string]: string }> {
    const stmt = this.db.prepare('SELECT key, value FROM store_settings');
    const rows = stmt.all() as { key: string; value: string }[];
    const settings: { [key: string]: string } = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  // Get storage usage
  getStorageUsage(): { used: number; available: number } {
    const stmt = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM invoices) as invoices,
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM store_settings) as settings
    `);
    const result = stmt.get() as any;
    
    // Estimate storage usage (in KB)
    const estimatedUsage = (result.invoices * 5) + (result.customers * 2) + (result.products * 3) + (result.settings * 1);
    
    return {
      used: estimatedUsage,
      available: 1000000 - estimatedUsage // 1GB limit
    };
  }
}

export const sqliteService = SQLiteService.getInstance();
