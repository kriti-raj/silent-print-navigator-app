// File system utilities for PC/Desktop application
export const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    const fileName = `Invoice_${invoiceNumber}.html`;
    const folderPath = `Invoices/${year}/${month}/${day}`;
    const fullPath = `${folderPath}/${fileName}`;

    // Check if user has already selected a folder
    const folderSelected = localStorage.getItem('folderSelected') === 'true';

    // For desktop applications, we'll use the File System Access API if available and folder is selected
    if ('showDirectoryPicker' in window && folderSelected) {
      try {
        // Try to use previously selected folder (note: we need to ask user again due to security)
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });

        // Create nested directories: Invoices/YYYY/MM/DD
        const invoicesDir = await dirHandle.getDirectoryHandle('Invoices', { create: true });
        const yearDir = await invoicesDir.getDirectoryHandle(year.toString(), { create: true });
        const monthDir = await yearDir.getDirectoryHandle(month, { create: true });
        const dayDir = await monthDir.getDirectoryHandle(day, { create: true });

        // Create and write the file
        const fileHandle = await dayDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(htmlContent);
        await writable.close();

        console.log(`Invoice ${invoiceNumber} saved to desktop folder: ${folderPath}`);

        return {
          success: true,
          folderPath: folderPath,
          fileName,
          method: 'filesystem-api'
        };
      } catch (fsError) {
        console.log('File System Access API failed, falling back to download');
        // Fall through to download method
      }
    }

    // Fallback: Auto-download to Downloads folder with organized naming
    const organizedFileName = `${year}-${month}-${day}_Invoice_${invoiceNumber}.html`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = organizedFileName;
    
    // Auto-download the file silently
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);

    // Also save to localStorage for app tracking
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
    
    if (!savedInvoices[year]) savedInvoices[year] = {};
    if (!savedInvoices[year][month]) savedInvoices[year][month] = {};
    if (!savedInvoices[year][month][day]) savedInvoices[year][month][day] = {};
    
    savedInvoices[year][month][day][invoiceNumber] = {
      fileName: organizedFileName,
      timestamp: currentDate.toISOString(),
      folderPath: folderPath,
      fullPath: fullPath,
      downloadedFileName: organizedFileName
    };
    
    localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));
    
    console.log(`Invoice ${invoiceNumber} downloaded as: ${organizedFileName}`);
    
    return {
      success: true,
      folderPath: folderPath,
      fileName: organizedFileName,
      method: 'download'
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
