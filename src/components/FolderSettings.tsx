
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Download, Settings, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sqliteService } from '../services/sqliteService';
import { fileSystemService } from '../services/fileSystemService';

const FolderSettings: React.FC = () => {
  const [folderSelected, setFolderSelected] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0 });
  const [folderPath, setFolderPath] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const isFolderSelected = await fileSystemService.isFolderSelected();
      const selectedPath = await fileSystemService.getSelectedFolderPath();
      
      setFolderSelected(isFolderSelected);
      setFolderPath(selectedPath || '');
      
      const usage = sqliteService.getStorageUsage();
      setStorageInfo(usage);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const selectFolder = async () => {
    try {
      const result = await fileSystemService.selectFolder();
      
      if (result.success && result.folderPath) {
        setFolderSelected(true);
        setFolderPath(result.folderPath);
        
        toast({
          title: "Folder Selected",
          description: `All invoices will now be saved to "${result.folderPath}"`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        toast({
          title: "Folder Selection Cancelled",
          description: result.error || "No folder was selected. Invoices will be saved to Documents/Invoices.",
        });
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      toast({
        title: "Error",
        description: "Failed to select folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetFolderSelection = async () => {
    try {
      await fileSystemService.resetFolderSelection();
      setFolderSelected(false);
      setFolderPath('');
      
      toast({
        title: "Folder Reset",
        description: "Invoices will now be saved to Documents/Invoices folder.",
      });
    } catch (error) {
      console.error('Error resetting folder:', error);
      toast({
        title: "Error",
        description: "Failed to reset folder selection.",
        variant: "destructive"
      });
    }
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
              <li>• All invoices are saved directly to your selected folder</li>
              <li>• Each invoice is saved as an HTML file you can open and print</li>
              <li>• Files are saved directly to your PC using SQLite database</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Storage Folder</h4>
              <p className="text-sm text-gray-600">
                {folderSelected 
                  ? `Folder: "${folderPath}" - invoices will be saved here`
                  : 'No folder selected - invoices will be saved to Documents/Invoices'
                }
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
                style={{ width: `${Math.min((storageInfo.used / storageInfo.available) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              SQLite database: {storageInfo.available} KB available
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Desktop Application Features:</h4>
            <p className="text-sm text-green-700">
              This application uses SQLite database for all data storage and saves invoices 
              directly to your selected folder on your PC. No browser dependencies!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FolderSettings;
