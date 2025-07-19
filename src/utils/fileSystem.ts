
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    const fileName = `Invoice_${invoiceNumber}.html`;
    const folderPath = `Invoices/${year}/${month}/${day}`;
    const fullPath = `${folderPath}/${fileName}`;

    if (Capacitor.isNativePlatform()) {
      try {
        // Create directory structure for native platforms
        await Filesystem.mkdir({
          path: folderPath,
          directory: Directory.Documents,
          recursive: true
        });

        // Write file to native filesystem
        await Filesystem.writeFile({
          path: fullPath,
          data: htmlContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        console.log(`Invoice ${invoiceNumber} saved to native folder: ${folderPath}`);
        
        return {
          success: true,
          folderPath: folderPath,
          fileName,
          nativePath: true
        };
      } catch (nativeError) {
        console.error('Native file system error, falling back to localStorage:', nativeError);
        // Fall back to localStorage if native filesystem fails
      }
    }

    // Fallback to localStorage for web or if native fails
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
    
    // Create folder structure
    if (!savedInvoices[year]) savedInvoices[year] = {};
    if (!savedInvoices[year][month]) savedInvoices[year][month] = {};
    if (!savedInvoices[year][month][day]) savedInvoices[year][month][day] = {};
    
    // Save invoice content with proper file name
    savedInvoices[year][month][day][invoiceNumber] = {
      fileName,
      content: htmlContent,
      timestamp: currentDate.toISOString(),
      folderPath: folderPath,
      fullPath: fullPath
    };
    
    localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));
    
    console.log(`Invoice ${invoiceNumber} saved to folder: ${folderPath}`);
    console.log(`File name: ${fileName}`);
    
    // For web environment, create a downloadable file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Auto-download for web users
    link.click();
    
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      folderPath: folderPath,
      fileName,
      nativePath: false
    };
  } catch (error) {
    console.error('Error saving invoice PDF:', error);
    return {
      success: false,
      error: error
    };
  }
};

export const getInvoiceFileStructure = () => {
  const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
  return savedInvoices;
};

export const getInvoicesFromFolder = (year: string, month: string, day: string) => {
  const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
  return savedInvoices[year]?.[month]?.[day] || {};
};
