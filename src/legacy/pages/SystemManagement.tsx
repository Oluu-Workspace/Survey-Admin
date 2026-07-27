import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, MoreHorizontal, Settings, Users, Shield, Database, Server, Bell, Key, Globe, Save, RefreshCw, Eye, Edit, Trash2, Plus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'general' | 'security' | 'performance' | 'notifications' | 'api';
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  is_sensitive: boolean;
  updated_at: string;
  updated_by: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  last_login: string;
  created_at: string;
  permissions: string[];
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
}

const SystemManagement = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Mock data for demonstration
  const mockConfigs: SystemConfig[] = [
    {
      id: '1',
      key: 'system.name',
      value: 'Tafiti Survey Platform',
      description: 'System display name',
      category: 'general',
      type: 'string',
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    },
    {
      id: '2',
      key: 'system.timezone',
      value: 'Africa/Nairobi',
      description: 'System timezone',
      category: 'general',
      type: 'select',
      options: ['Africa/Nairobi', 'UTC', 'America/New_York', 'Europe/London'],
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    },
    {
      id: '3',
      key: 'security.session_timeout',
      value: '3600',
      description: 'Session timeout in seconds',
      category: 'security',
      type: 'number',
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    },
    {
      id: '4',
      key: 'security.require_2fa',
      value: 'true',
      description: 'Require two-factor authentication',
      category: 'security',
      type: 'boolean',
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    },
    {
      id: '5',
      key: 'api.rate_limit',
      value: '1000',
      description: 'API rate limit per hour',
      category: 'api',
      type: 'number',
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    },
    {
      id: '6',
      key: 'notifications.email_enabled',
      value: 'true',
      description: 'Enable email notifications',
      category: 'notifications',
      type: 'boolean',
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    },
    {
      id: '7',
      key: 'database.connection_pool_size',
      value: '20',
      description: 'Database connection pool size',
      category: 'performance',
      type: 'number',
      is_sensitive: false,
      updated_at: '2024-01-20T10:30:00Z',
      updated_by: 'Admin User'
    }
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@tafiti.com',
      role: 'admin',
      status: 'active',
      last_login: '2024-01-20T10:30:00Z',
      created_at: '2024-01-01T00:00:00Z',
      permissions: ['all']
    },
    {
      id: '2',
      name: 'Data Manager',
      email: 'manager@tafiti.com',
      role: 'manager',
      status: 'active',
      last_login: '2024-01-20T09:15:00Z',
      created_at: '2024-01-05T00:00:00Z',
      permissions: ['surveys', 'agents', 'data', 'export']
    },
    {
      id: '3',
      name: 'Analyst',
      email: 'analyst@tafiti.com',
      role: 'analyst',
      status: 'active',
      last_login: '2024-01-19T16:45:00Z',
      created_at: '2024-01-10T00:00:00Z',
      permissions: ['analytics', 'data', 'export']
    },
    {
      id: '4',
      name: 'Viewer',
      email: 'viewer@tafiti.com',
      role: 'viewer',
      status: 'inactive',
      last_login: '2024-01-15T14:20:00Z',
      created_at: '2024-01-12T00:00:00Z',
      permissions: ['dashboard', 'analytics']
    },
    {
      id: '5',
      name: 'New User',
      email: 'newuser@tafiti.com',
      role: 'analyst',
      status: 'pending',
      last_login: '2024-01-20T08:30:00Z',
      created_at: '2024-01-20T08:30:00Z',
      permissions: ['analytics']
    }
  ];

  const mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      user_id: '1',
      user_name: 'Admin User',
      action: 'LOGIN',
      resource: 'system',
      details: 'User logged in successfully',
      ip_address: '192.168.1.100',
      timestamp: '2024-01-20T10:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      user_id: '2',
      user_name: 'Data Manager',
      action: 'UPDATE',
      resource: 'survey',
      details: 'Updated survey "Household Income Survey 2024"',
      ip_address: '192.168.1.101',
      timestamp: '2024-01-20T09:15:00Z',
      status: 'success'
    },
    {
      id: '3',
      user_id: '3',
      user_name: 'Analyst',
      action: 'EXPORT',
      resource: 'data',
      details: 'Exported analytics data',
      ip_address: '192.168.1.102',
      timestamp: '2024-01-19T16:45:00Z',
      status: 'success'
    },
    {
      id: '4',
      user_id: '4',
      user_name: 'Viewer',
      action: 'ACCESS_DENIED',
      resource: 'system',
      details: 'Attempted to access admin panel',
      ip_address: '192.168.1.103',
      timestamp: '2024-01-19T14:20:00Z',
      status: 'failed'
    },
    {
      id: '5',
      user_id: '1',
      user_name: 'Admin User',
      action: 'CONFIG_UPDATE',
      resource: 'system',
      details: 'Updated system configuration',
      ip_address: '192.168.1.100',
      timestamp: '2024-01-19T12:00:00Z',
      status: 'success'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setConfigs(mockConfigs);
      setUsers(mockUsers);
      setAuditLogs(mockAuditLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || config.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      manager: 'default',
      analyst: 'secondary',
      viewer: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      pending: 'outline'
    } as const;
    
    const icons = {
      active: CheckCircle2,
      inactive: XCircle,
      pending: AlertTriangle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle2;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAuditStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      warning: 'secondary'
    } as const;
    
    const icons = {
      success: CheckCircle2,
      failed: XCircle,
      warning: AlertTriangle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle2;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleConfigUpdate = () => {
    toast.success('Configuration updated successfully');
    setIsConfigDialogOpen(false);
    setSelectedConfig(null);
  };

  const handleUserAction = (action: string, user: User) => {
    switch (action) {
      case 'edit':
        setSelectedUser(user);
        setIsUserDialogOpen(true);
        break;
      case 'activate':
        toast.success(`User ${user.name} activated`);
        break;
      case 'deactivate':
        toast.success(`User ${user.name} deactivated`);
        break;
      case 'delete':
        toast.error(`Delete user ${user.name}`);
        break;
    }
  };

  const handleConfigAction = (action: string, config: SystemConfig) => {
    switch (action) {
      case 'edit':
        setSelectedConfig(config);
        setIsConfigDialogOpen(true);
        break;
      case 'reset':
        toast.info(`Reset configuration ${config.key}`);
        break;
    }
  };

  const stats = {
    total_users: users.length,
    active_users: users.filter(u => u.status === 'active').length,
    pending_users: users.filter(u => u.status === 'pending').length,
    total_configs: configs.length,
    recent_logs: auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate > dayAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure system settings and manage users.
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading system data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure system settings and manage users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_users} active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_users}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting activation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Configs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_configs}</div>
            <p className="text-xs text-muted-foreground">
              Configuration items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_logs}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">System Configuration</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Manage system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search configurations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="notifications">Notifications</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{config.key}</div>
                            <div className="text-sm text-muted-foreground">{config.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{config.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {config.is_sensitive ? '••••••••' : config.value}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{config.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(config.updated_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {config.updated_by}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleConfigAction('edit', config)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConfigAction('reset', config)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset to Default
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.permissions.length} permissions
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUserAction('edit', user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleUserAction('deactivate', user)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction('activate', user)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('delete', user)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>System activity and security logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.user_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {log.details}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{log.ip_address}</div>
                        </TableCell>
                        <TableCell>{getAuditStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      {selectedConfig && (
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Configuration</DialogTitle>
              <DialogDescription>{selectedConfig.key}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 text-sm text-muted-foreground">{selectedConfig.description}</div>
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                {selectedConfig.type === 'boolean' ? (
                  <div className="mt-2">
                    <Switch
                      checked={selectedConfig.value === 'true'}
                      onCheckedChange={(checked) => {
                        setSelectedConfig({
                          ...selectedConfig,
                          value: checked.toString()
                        });
                      }}
                    />
                  </div>
                ) : selectedConfig.type === 'select' ? (
                  <Select
                    value={selectedConfig.value}
                    onValueChange={(value) => {
                      setSelectedConfig({
                        ...selectedConfig,
                        value
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedConfig.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="value"
                    type={selectedConfig.type === 'number' ? 'number' : 'text'}
                    value={selectedConfig.is_sensitive ? '••••••••' : selectedConfig.value}
                    onChange={(e) => {
                      setSelectedConfig({
                        ...selectedConfig,
                        value: e.target.value
                      });
                    }}
                    className="mt-1"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfigUpdate}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* User Dialog */}
      {selectedUser && (
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>{selectedUser.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={selectedUser.name} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={selectedUser.email} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedUser.role}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedUser.status}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('User updated successfully');
                setIsUserDialogOpen(false);
                setSelectedUser(null);
              }}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SystemManagement;
