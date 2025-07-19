
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { app, dialog } from 'electron';
import { sqliteService } from './sqliteService';

interface SaveResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  error?: any;
}

class FileSystemService {
  private static instance: FileSystemService;
  private selectedFolderPath: string | null = null;

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
    const folderPath = await sqliteService.getStoreSetting('selectedFolderPath');
    if (folderPath) {
      this.selectedFolderPath = folderPath;
    }
  }

  async selectFolder(): Promise<{ success: boolean; folderPath?: string; error?: string }> {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        defaultPath: app.getPath('documents'),
        title: 'Select Invoice Storage Folder'
      });

      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Folder selection cancelled' };
      }

      this.selectedFolderPath = result.filePaths[0];
      await sqliteService.saveStoreSetting('selectedFolderPath', this.selectedFolderPath);
      await sqliteService.saveStoreSetting('folderSelected', 'true');

      return { success: true, folderPath: this.selectedFolderPath };
    } catch (error) {
      console.error('Error selecting folder:', error);
      return { success: false, error: 'Failed to select folder' };
    }
  }

  async saveInvoicePDF(invoiceNumber: string, htmlContent: string): Promise<SaveResult> {
    try {
      const fileName = `Invoice_${invoiceNumber}.html`;
      let filePath: string;

      if (this.selectedFolderPath) {
        // Save to selected folder
        filePath = join(this.selectedFolderPath, fileName);
      } else {
        // Save to Documents/Invoices folder
        const documentsPath = app.getPath('documents');
        const invoicesFolder = join(documentsPath, 'Invoices');
        
        // Create folder if it doesn't exist
        await mkdir(invoicesFolder, { recursive: true });
        filePath = join(invoicesFolder, fileName);
      }

      // Write file
      await writeFile(filePath, htmlContent, 'utf8');

      // Save to database tracking
      await sqliteService.saveStoreSetting(`invoice_${invoiceNumber}_path`, filePath);

      return {
        success: true,
        fileName,
        filePath
      };
    } catch (error) {
      console.error('Error saving invoice PDF:', error);
      return {
        success: false,
        error
      };
    }
  }

  async getSelectedFolderPath(): Promise<string | null> {
    return this.selectedFolderPath;
  }

  async resetFolderSelection(): Promise<void> {
    this.selectedFolderPath = null;
    await sqliteService.saveStoreSetting('selectedFolderPath', '');
    await sqliteService.saveStoreSetting('folderSelected', 'false');
  }

  async isFolderSelected(): Promise<boolean> {
    const folderSelected = await sqliteService.getStoreSetting('folderSelected');
    return folderSelected === 'true';
  }
}

export const fileSystemService = FileSystemService.getInstance();
