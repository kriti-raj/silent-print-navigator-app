
import { fileSystemService } from '../services/fileSystemService';
import { sqliteService } from '../services/sqliteService';

// File system utilities for Desktop application
export const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
  try {
    console.log(`Attempting to save invoice ${invoiceNumber}...`);
    
    const result = await fileSystemService.saveInvoicePDF(invoiceNumber, htmlContent);
    
    if (result.success) {
      console.log(`Invoice ${invoiceNumber} saved to: ${result.filePath}`);
      
      // Store the file path in SQLite for tracking
      await sqliteService.saveStoreSetting(`invoice_${invoiceNumber}_path`, result.filePath || '');
      
      return {
        success: true,
        fileName: result.fileName,
        filePath: result.filePath,
        method: 'filesystem'
      };
    } else {
      console.error('Error saving invoice:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error saving invoice PDF:', error);
    return {
      success: false,
      error: error
    };
  }
};

export const getInvoiceFileStructure = async () => {
  try {
    const settings = await sqliteService.getAllStoreSettings();
    const invoiceFiles: { [key: string]: any } = {};
    
    // Get all invoice file paths from settings
    Object.keys(settings).forEach(key => {
      if (key.startsWith('invoice_') && key.endsWith('_path')) {
        const invoiceNumber = key.replace('invoice_', '').replace('_path', '');
        invoiceFiles[invoiceNumber] = {
          filePath: settings[key],
          timestamp: new Date().toISOString(),
          savedLocation: 'selected-folder'
        };
      }
    });
    
    return { files: invoiceFiles };
  } catch (error) {
    console.error('Error getting invoice file structure:', error);
    return { files: {} };
  }
};

export const getInvoicesFromFolder = async () => {
  const structure = await getInvoiceFileStructure();
  return structure.files || {};
};

export const selectFolder = async () => {
  return await fileSystemService.selectFolder();
};

export const resetFolderSelection = async () => {
  await fileSystemService.resetFolderSelection();
};

export const isFolderSelected = async () => {
  return await fileSystemService.isFolderSelected();
};

export const getSelectedFolderPath = async () => {
  return await fileSystemService.getSelectedFolderPath();
};

// Auto-save invoice when created/updated
export const autoSaveInvoice = async (invoice: any) => {
  try {
    const isSelected = await fileSystemService.isFolderSelected();
    
    if (isSelected) {
      console.log('Auto-saving invoice to selected folder...');
      
      // Generate HTML content for the invoice
      const storeSettings = await sqliteService.getAllStoreSettings();
      const storeInfo = {
        name: storeSettings.businessName || storeSettings.name || 'Your Business Name',
        address: storeSettings.address || 'Your Business Address',
        phone: storeSettings.phone || '+91 00000 00000',
        email: storeSettings.email || 'your@email.com',
        taxId: storeSettings.gstNumber || storeSettings.taxId || 'GST000000000',
        website: storeSettings.website || 'www.yourbusiness.com'
      };
      
      const htmlContent = generateInvoiceHTML(invoice, storeInfo);
      const result = await saveInvoicePDF(invoice.invoiceNumber, htmlContent);
      
      if (result.success) {
        console.log(`Invoice ${invoice.invoiceNumber} auto-saved successfully`);
        return { success: true, filePath: result.filePath };
      }
    }
    
    return { success: false, error: 'No folder selected for auto-save' };
  } catch (error) {
    console.error('Error auto-saving invoice:', error);
    return { success: false, error };
  }
};

const generateInvoiceHTML = (invoice: any, storeInfo: any) => {
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
          .items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .items th { background-color: #f5f5f5; font-weight: bold; }
          .totals { text-align: right; margin-bottom: 30px; }
          .total-final { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          @media print { body { margin: 0; } .no-print { display: none; } }
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
          </div>
          <div>
            <h3>Bill To:</h3>
            <p><strong>${invoice.customerDetails.name}</strong></p>
            <p>${invoice.customerDetails.phone}</p>
            <p>${invoice.customerDetails.address}</p>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${(item.price || 0).toFixed(2)}</td>
                <td>${item.unit || 'pieces'}</td>
                <td>₹${((item.price || 0) * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
          ${invoice.gstEnabled ? `<div>GST (18%): ₹${invoice.tax.toFixed(2)}</div>` : ''}
          <div class="total-final">Total Amount: ₹${invoice.total.toFixed(2)}</div>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9;">
            <h4>Notes:</h4>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #666;">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
};
