
import { fileSystemService } from '../services/fileSystemService';
import { sqliteService } from '../services/sqliteService';

// File system utilities for Desktop application
export const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
  try {
    const result = await fileSystemService.saveInvoicePDF(invoiceNumber, htmlContent);
    
    if (result.success) {
      console.log(`Invoice ${invoiceNumber} saved to: ${result.filePath}`);
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
