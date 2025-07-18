
export const saveInvoicePDF = async (invoiceNumber: string, htmlContent: string) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    // Simulate file system structure in localStorage
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoicePDFs') || '{}');
    
    // Create folder structure
    if (!savedInvoices[year]) savedInvoices[year] = {};
    if (!savedInvoices[year][month]) savedInvoices[year][month] = {};
    if (!savedInvoices[year][month][day]) savedInvoices[year][month][day] = {};
    
    // Save invoice content with proper file name
    const fileName = `Invoice_${invoiceNumber}.html`;
    savedInvoices[year][month][day][invoiceNumber] = {
      fileName,
      content: htmlContent,
      timestamp: currentDate.toISOString(),
      folderPath: `Invoices/${year}/${month}/${day}/`,
      fullPath: `Invoices/${year}/${month}/${day}/${fileName}`
    };
    
    localStorage.setItem('savedInvoicePDFs', JSON.stringify(savedInvoices));
    
    console.log(`Invoice ${invoiceNumber} saved to folder: Invoices/${year}/${month}/${day}/`);
    console.log(`File name: ${fileName}`);
    
    // For web environment, create a downloadable file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Simulate saving to Downloads folder
    // link.click(); // Uncomment this line if you want to actually download files
    
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      folderPath: `Invoices/${year}/${month}/${day}/`,
      fileName
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
