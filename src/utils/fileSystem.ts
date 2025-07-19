
// File system utilities for PC/Desktop application
export const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
  try {
    const fileName = `Invoice_${invoiceNumber}.html`;

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

    // If we have a folder handle, save to the selected folder (no subfolders)
    if (folderHandle) {
      try {
        // Create and write the file directly in the selected folder
        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(htmlContent);
        await writable.close();

        console.log(`Invoice ${invoiceNumber} saved to selected folder`);

        // Also save to localStorage for app tracking
        const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
        
        if (!savedInvoices.files) savedInvoices.files = {};
        
        savedInvoices.files[invoiceNumber] = {
          fileName: fileName,
          timestamp: new Date().toISOString(),
          savedLocation: 'selected-folder'
        };
        
        localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));

        return {
          success: true,
          fileName,
          method: 'filesystem-api'
        };
      } catch (fsError) {
        console.log('File System Access API failed, falling back to download');
        // Fall through to download method
      }
    }

    // Fallback: Auto-download to Downloads folder
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
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
    
    if (!savedInvoices.files) savedInvoices.files = {};
    
    savedInvoices.files[invoiceNumber] = {
      fileName: fileName,
      timestamp: new Date().toISOString(),
      downloadedFileName: fileName,
      savedLocation: 'downloads'
    };
    
    localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));
    
    console.log(`Invoice ${invoiceNumber} downloaded as: ${fileName}`);
    
    return {
      success: true,
      fileName: fileName,
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

export const getInvoicesFromFolder = () => {
  const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
  return savedInvoices.files || {};
};
