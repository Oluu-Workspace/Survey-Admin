import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin, Loader2, Settings, Moon, Sun } from 'lucide-react';
import { ConnectionTest } from '@/components/ConnectionTest';
import { useTheme } from '@/hooks/use-theme';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showConnectionTest, setShowConnectionTest] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid credentials');
    }
  };

  // Temporary bypass for testing - remove in production
  const handleTestLogin = () => {
    localStorage.setItem('auth_token', 'test-token');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-10 w-10"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Centered Login Card */}
      <div className="w-full max-w-md mx-auto px-4">
        <Card className="shadow-lg border-border">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Tafiti</CardTitle>
            <CardDescription>
              Survey Research Platform for Kenya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@surveypro.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowConnectionTest(!showConnectionTest)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {showConnectionTest ? 'Hide' : 'Test'} Backend Connection
              </Button>
              
              {/* Temporary test login button - remove in production */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleTestLogin}
              >
                Test Login (Bypass)
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {showConnectionTest && (
          <div className="mt-6">
            <ConnectionTest />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
