
interface SaveResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  error?: any;
}

class FileSystemService {
  private static instance: FileSystemService;
  private selectedFolderHandle: FileSystemDirectoryHandle | null = null;

  constructor() {
    this.loadSelectedFolder();
  }

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  private async loadSelectedFolder() {
    try {
      // Try to restore the folder handle from IndexedDB
      const folderPath = localStorage.getItem('selectedFolderPath');
      if (folderPath) {
        // In a real implementation, you'd store the handle in IndexedDB
        // For now, we'll just store the path
      }
    } catch (error) {
      console.error('Error loading selected folder:', error);
    }
  }

  async selectFolder(): Promise<{ success: boolean; folderPath?: string; error?: string }> {
    try {
      if (!('showDirectoryPicker' in window)) {
        return { success: false, error: 'File System Access API not supported in this browser' };
      }

      const dirHandle = await (window as any).showDirectoryPicker();
      this.selectedFolderHandle = dirHandle;
      
      // Store the folder path
      localStorage.setItem('selectedFolderPath', dirHandle.name);
      localStorage.setItem('folderSelected', 'true');

      return { success: true, folderPath: dirHandle.name };
    } catch (error) {
      console.error('Error selecting folder:', error);
      return { success: false, error: 'Failed to select folder' };
    }
  }

  async saveInvoicePDF(invoiceNumber: string, htmlContent: string): Promise<SaveResult> {
    try {
      const fileName = `Invoice_${invoiceNumber}.html`;
      
      if (this.selectedFolderHandle && ('showDirectoryPicker' in window)) {
        // Use File System Access API
        const fileHandle = await this.selectedFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(htmlContent);
        await writable.close();
        
        return {
          success: true,
          fileName,
          filePath: `${this.selectedFolderHandle.name}/${fileName}`
        };
      } else {
        // Fallback to download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return {
          success: true,
          fileName,
          filePath: `Downloads/${fileName}`
        };
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      return {
        success: false,
        error
      };
    }
  }

  async getSelectedFolderPath(): Promise<string | null> {
    return localStorage.getItem('selectedFolderPath');
  }

  async resetFolderSelection(): Promise<void> {
    this.selectedFolderHandle = null;
    localStorage.removeItem('selectedFolderPath');
    localStorage.setItem('folderSelected', 'false');
  }

  async isFolderSelected(): Promise<boolean> {
    return localStorage.getItem('folderSelected') === 'true';
  }
}

export const fileSystemService = FileSystemService.getInstance();
