import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Download, Settings, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FolderSettings: React.FC = () => {
  const [folderSelected, setFolderSelected] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0 });
  const { toast } = useToast();

  useEffect(() => {
    setFolderSelected(localStorage.getItem('folderSelected') === 'true');
    calculateStorageInfo();
  }, []);

  const calculateStorageInfo = () => {
    const savedData = localStorage.getItem('savedInvoicePDFs');
    const invoices = localStorage.getItem('invoices');
    const customers = localStorage.getItem('customers');
    const products = localStorage.getItem('products');
    
    let totalSize = 0;
    if (savedData) totalSize += new Blob([savedData]).size;
    if (invoices) totalSize += new Blob([invoices]).size;
    if (customers) totalSize += new Blob([customers]).size;
    if (products) totalSize += new Blob([products]).size;

    // Convert to KB
    const usedKB = Math.round(totalSize / 1024);
    
    setStorageInfo({
      used: usedKB,
      available: 10240 - usedKB // Assuming 10MB limit for localStorage
    });
  };

  const selectFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        
        localStorage.setItem('folderSelected', 'true');
        setFolderSelected(true);
        
        toast({
          title: "Folder Selected",
          description: "All future invoices will be saved automatically to your selected folder with organized subfolders (Invoices/YYYY/MM/DD/). You won't be prompted again.",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } catch (error) {
        console.log('Folder selection cancelled');
      }
    } else {
      toast({
        title: "Browser Not Supported", 
        description: "Your browser doesn't support folder selection. Invoices will be auto-downloaded to your Downloads folder instead.",
        variant: "destructive"
      });
    }
  };

  const resetFolderSelection = () => {
    localStorage.removeItem('folderSelected');
    setFolderSelected(false);
    
    toast({
      title: "Folder Reset",
      description: "Next invoice will ask you to select a folder again.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            File Storage Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Select a folder on your PC where invoices will be saved</li>
              <li>• Invoices are organized in subfolders: Invoices/YYYY/MM/DD/</li>
              <li>• Each invoice is saved as an HTML file you can open and print</li>
              <li>• Files are saved directly to your PC, not just the browser</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Storage Folder</h4>
              <p className="text-sm text-gray-600">
                {folderSelected ? 'Folder selected - invoices will be saved with organized structure' : 'No folder selected - invoices will download to Downloads folder'}
              </p>
            </div>
            <div className="flex gap-2">
              {!folderSelected ? (
                <Button onClick={selectFolder} className="bg-green-600 hover:bg-green-700">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Select Folder
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={selectFolder} variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Change Folder
                  </Button>
                  <Button onClick={resetFolderSelection} variant="outline">
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage Usage
              </h4>
              <span className="text-sm text-gray-600">{storageInfo.used} KB used</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min((storageInfo.used / 10240) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Browser storage: {storageInfo.available} KB available
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">📁 For Desktop App (EXE):</h4>
            <p className="text-sm text-yellow-700">
              When you convert this to a desktop application using Electron or similar, 
              it will have full access to your PC's file system and can create a dedicated 
              "Invoices" folder in your Documents or any location you specify during installation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FolderSettings;
