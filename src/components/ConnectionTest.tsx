import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { healthAPI } from '@/services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ConnectionTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');

  const testConnection = async () => {
    setStatus('testing');
    setMessage('Testing connection...');
    
    try {
      const response = await healthAPI.check();
      setStatus('success');
      setMessage(`Connected successfully! Backend is running.`);
      setApiUrl(import.meta.env.VITE_API_BASE_URL || 'https://survey-backend-dkid.onrender.com/api/v1');
    } catch (error: any) {
      setStatus('error');
      setMessage(`Connection failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      setApiUrl(import.meta.env.VITE_API_BASE_URL || 'https://survey-backend-dkid.onrender.com/api/v1');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Backend Connection Test
        </CardTitle>
        <CardDescription>
          Test the connection to the remote backend API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">API URL:</span>
          <Badge variant="outline" className="text-xs">
            {apiUrl || 'Not tested yet'}
          </Badge>
        </div>
        
        <Button 
          onClick={testConnection} 
          disabled={status === 'testing'}
          className="w-full"
        >
          {status === 'testing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
        
        {status !== 'idle' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : status === 'error' ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : null}
            <span className="text-sm">{message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
