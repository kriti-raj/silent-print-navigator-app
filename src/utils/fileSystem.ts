
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

    // Check if user has selected a folder
    const folderSelected = localStorage.getItem('folderSelected') === 'true';
    let folderHandle = null;

    // Try to get the stored folder handle
    if (folderSelected) {
      try {
        const storedHandle = localStorage.getItem('selectedFolderHandle');
        if (storedHandle && 'showDirectoryPicker' in window) {
          // We need to ask user to select folder again due to browser security
          folderHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
          });
        }
      } catch (error) {
        console.log('Could not access previously selected folder, will use downloads');
      }
    }

    // If we have a folder handle, save to the selected folder
    if (folderHandle) {
      try {
        // Create nested directories: Invoices/YYYY/MM/DD
        const invoicesDir = await folderHandle.getDirectoryHandle('Invoices', { create: true });
        const yearDir = await invoicesDir.getDirectoryHandle(year.toString(), { create: true });
        const monthDir = await yearDir.getDirectoryHandle(month, { create: true });
        const dayDir = await monthDir.getDirectoryHandle(day, { create: true });

        // Create and write the file
        const fileHandle = await dayDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(htmlContent);
        await writable.close();

        console.log(`Invoice ${invoiceNumber} saved to selected folder: ${folderPath}`);

        // Also save to localStorage for app tracking
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
        
        if (!savedInvoices[year]) savedInvoices[year] = {};
        if (!savedInvoices[year][month]) savedInvoices[year][month] = {};
        if (!savedInvoices[year][month][day]) savedInvoices[year][month][day] = {};
        
        savedInvoices[year][month][day][invoiceNumber] = {
          fileName: fileName,
          timestamp: currentDate.toISOString(),
          folderPath: folderPath,
          fullPath: fullPath,
          savedLocation: 'selected-folder'
        };
        
        localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));

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
    
    // Make the download silent by hiding the link
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up immediately to prevent interference
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

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
      downloadedFileName: organizedFileName,
      savedLocation: 'downloads'
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
