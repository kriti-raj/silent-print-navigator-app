import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Server, Database, Smartphone, Monitor, RefreshCw, Settings, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectionStatus {
  isOnline: boolean;
  dbStatus: 'connected' | 'disconnected' | 'error';
  serverStatus: 'running' | 'stopped' | 'error';
  lastSync: string;
  connectedDevices: string[];
}

const ConnectionInfo: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    dbStatus: 'connected',
    serverStatus: 'running',
    lastSync: new Date().toISOString(),
    connectedDevices: ['Desktop PC', 'Mobile Device']
  });

  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "Connection Restored",
        description: "You are now online."
      });
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "Connection Lost",
        description: "You are now offline. Data will be saved locally.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate database and server status checks
    const statusInterval = setInterval(() => {
      checkSystemStatus();
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, []);

  const checkSystemStatus = () => {
    // Simulate status checks
    const dbStatus = Math.random() > 0.1 ? 'connected' : 'error';
    const serverStatus = Math.random() > 0.05 ? 'running' : 'error';
    
    setConnectionStatus(prev => ({
      ...prev,
      dbStatus: dbStatus as any,
      serverStatus: serverStatus as any,
      lastSync: new Date().toISOString()
    }));
  };

  const handleReconnect = async () => {
    setIsConnecting(true);
    
    // Simulate reconnection attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setConnectionStatus(prev => ({
      ...prev,
      dbStatus: 'connected',
      serverStatus: 'running',
      lastSync: new Date().toISOString()
    }));
    
    setIsConnecting(false);
    
    toast({
      title: "Reconnection Successful",
      description: "All systems are now connected."
    });
  };

  const handleSync = async () => {
    setIsConnecting(true);
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnectionStatus(prev => ({
      ...prev,
      lastSync: new Date().toISOString()
    }));
    
    setIsConnecting(false);
    
    toast({
      title: "Sync Complete",
      description: "All data has been synchronized."
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'disconnected':
      case 'stopped':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Connection & Sync</h2>
          <p className="text-muted-foreground">Monitor system connections and synchronization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isConnecting}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button onClick={handleReconnect} disabled={isConnecting}>
            <Wifi className="mr-2 h-4 w-4" />
            Reconnect
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internet</CardTitle>
            {connectionStatus.isOnline ? 
              <Wifi className="h-4 w-4 text-green-500" /> : 
              <WifiOff className="h-4 w-4 text-red-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.isOnline ? 'connected' : 'error')}
              <Badge className={getStatusColor(connectionStatus.isOnline ? 'connected' : 'error')}>
                {connectionStatus.isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.dbStatus)}
              <Badge className={getStatusColor(connectionStatus.dbStatus)}>
                {connectionStatus.dbStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Server</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.serverStatus)}
              <Badge className={getStatusColor(connectionStatus.serverStatus)}>
                {connectionStatus.serverStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {new Date(connectionStatus.lastSync).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connection Settings
            </CardTitle>
            <CardDescription>
              Configure connection parameters for your local network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serverUrl">Local Server URL</Label>
              <Input
                id="serverUrl"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:3001"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Network Information</Label>
              <div className="text-sm space-y-1">
                <p><strong>IP Address:</strong> 192.168.1.100</p>
                <p><strong>Port:</strong> 3001</p>
                <p><strong>Protocol:</strong> HTTP</p>
                <p><strong>Network:</strong> Local WiFi</p>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Globe className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Connected Devices
            </CardTitle>
            <CardDescription>
              Devices currently connected to your billing system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionStatus.connectedDevices.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {device.includes('Mobile') ? 
                      <Smartphone className="h-4 w-4 text-blue-500" /> : 
                      <Monitor className="h-4 w-4 text-green-500" />
                    }
                    <span className="font-medium">{device}</span>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Connected
                  </Badge>
                </div>
              ))}
              
              <div className="flex items-center justify-between p-3 border rounded-lg border-dashed">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">Add new device</span>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Real-time status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Storage</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span>2.3 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span>97.7 MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '2.3%' }}></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Performance</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>CPU Usage:</span>
                  <span>12%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span>45 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>Good</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>• Data synchronized - 2 min ago</p>
                <p>• Invoice created - 5 min ago</p>
                <p>• Database backup - 1 hour ago</p>
                <p>• System startup - 3 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionInfo;