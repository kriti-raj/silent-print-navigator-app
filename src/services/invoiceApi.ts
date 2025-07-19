
import { sqliteService } from './sqliteService';

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

class InvoiceApiService {
  private static instance: InvoiceApiService;

  constructor() {
    // SQLite service handles initialization
  }

  static getInstance(): InvoiceApiService {
    if (!InvoiceApiService.instance) {
      InvoiceApiService.instance = new InvoiceApiService();
    }
    return InvoiceApiService.instance;
  }

  async getInvoices(): Promise<ApiInvoice[]> {
    return await sqliteService.getInvoices();
  }

  async saveInvoice(invoice: ApiInvoice): Promise<void> {
    await sqliteService.saveInvoice(invoice);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await sqliteService.deleteInvoice(invoiceId);
  }

  // Silent printing method for desktop
  async silentPrint(invoice: ApiInvoice, printerSettings: any): Promise<boolean> {
    try {
      // For desktop app, use native printing
      if ('electronAPI' in window) {
        return (window as any).electronAPI.silentPrint(invoice, printerSettings);
      } else {
        // For web version, use window print
        return this.webPrint(invoice, printerSettings);
      }
    } catch (error) {
      console.error('Silent printing failed:', error);
      return false;
    }
  }

  private async webPrint(invoice: ApiInvoice, printerSettings: any): Promise<boolean> {
    try {
      const printContent = this.generatePrintContent(invoice, printerSettings);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 500);
        };
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Web printing failed:', error);
      return false;
    }
  }

  private generatePrintContent(invoice: ApiInvoice, printerSettings: any): string {
    const { paperSize, printerType, margins } = printerSettings;
    
    // Different styles for different paper sizes and printer types
    const styles = this.getPrintStyles(paperSize, printerType, margins);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="invoice-container">
            ${this.generateInvoiceHTML(invoice, printerSettings)}
          </div>
        </body>
      </html>
    `;
  }

  private getPrintStyles(paperSize: string, printerType: string, margins: any): string {
    const baseStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Arial', sans-serif; color: #000; }
      @media print { 
        body { margin: 0; }
        .no-print { display: none !important; }
      }
    `;
    
    if (printerType === 'thermal') {
      return baseStyles + `
        .invoice-container { width: 80mm; margin: 0; padding: 2mm; }
        .header { text-align: center; margin-bottom: 3mm; }
        .invoice-details { margin-bottom: 3mm; font-size: 10px; }
        .items-table { width: 100%; font-size: 9px; }
        .items-table th, .items-table td { padding: 1mm; text-align: left; }
        .totals { margin-top: 3mm; font-size: 10px; }
        .final-total { font-weight: bold; border-top: 1px solid #000; padding-top: 1mm; }
      `;
    } else {
      // Regular printer styles
      const paperStyles = paperSize === 'A5' ? 
        'width: 148mm; height: 210mm;' : 
        'width: 210mm; height: 297mm;';
      
      return baseStyles + `
        .invoice-container { ${paperStyles} margin: ${margins}mm; padding: 10mm; }
        .header { text-align: center; margin-bottom: 15mm; }
        .invoice-details { margin-bottom: 10mm; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 5mm; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .totals { margin-left: auto; width: 60mm; }
        .total-row { display: flex; justify-content: space-between; margin: 2mm 0; }
        .final-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 5mm; }
      `;
    }
  }

  private generateInvoiceHTML(invoice: ApiInvoice, printerSettings: any): string {
    return `
      <div class="header">
        ${invoice.storeInfo.logo ? `<img src="${invoice.storeInfo.logo}" alt="Store Logo" style="height: 20mm; margin-bottom: 5mm;">` : ''}
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
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.finalName || `${item.productName} - ${item.colorCode}`}</td>
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
      
      ${invoice.notes ? `<p style="margin-top: 10mm;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
      
      ${invoice.storeInfo.paymentQR ? `
        <div style="text-align: center; margin-top: 10mm;">
          <p style="font-size: 10px; margin-bottom: 2mm;">Scan to Pay</p>
          <img src="${invoice.storeInfo.paymentQR}" alt="Payment QR" style="height: 20mm;">
        </div>
      ` : ''}
    `;
  }
}

export const invoiceApiService = InvoiceApiService.getInstance();
