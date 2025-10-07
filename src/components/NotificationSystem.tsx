import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, BellRing, Settings, Mail, Smartphone, AlertTriangle, CheckCircle2, 
  Info, XCircle, Clock, Users, BarChart3, MapPin, Download, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'survey' | 'response' | 'agent' | 'system' | 'export' | 'quality';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    types: string[];
  };
  push: {
    enabled: boolean;
    types: string[];
  };
  sms: {
    enabled: boolean;
    types: string[];
  };
  webhook: {
    enabled: boolean;
    url: string;
    types: string[];
  };
}

interface NotificationSystemProps {
  userId?: string;
}

const NotificationSystem = ({ userId }: NotificationSystemProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      frequency: 'immediate',
      types: ['survey', 'response', 'agent', 'system', 'export', 'quality']
    },
    push: {
      enabled: true,
      types: ['survey', 'response', 'agent', 'system']
    },
    sms: {
      enabled: false,
      types: ['critical']
    },
    webhook: {
      enabled: false,
      url: '',
      types: ['export', 'quality']
    }
  });
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings' | 'templates'>('notifications');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'survey',
      priority: 'high',
      title: 'Survey Expiring Soon',
      message: 'Household Economic Research 2024 will expire in 3 days. Consider extending the deadline or prompting agents to complete remaining responses.',
      timestamp: '2024-01-20T10:30:00Z',
      read: false,
      actionUrl: '/surveys/1',
      actionLabel: 'Manage Survey',
      metadata: { surveyId: '1', daysRemaining: 3 }
    },
    {
      id: '2',
      type: 'response',
      priority: 'medium',
      title: 'Quality Alert',
      message: '15 responses from Kiambu County have been flagged for quality review. Average quality score dropped to 72%.',
      timestamp: '2024-01-20T09:15:00Z',
      read: false,
      actionUrl: '/surveys/1/responses',
      actionLabel: 'Review Responses',
      metadata: { county: 'Kiambu', flaggedCount: 15, avgQuality: 72 }
    },
    {
      id: '3',
      type: 'agent',
      priority: 'low',
      title: 'Agent Performance Update',
      message: 'John Mwangi has completed 45 responses this week, exceeding the target of 40. Great performance!',
      timestamp: '2024-01-20T08:45:00Z',
      read: true,
      actionUrl: '/agents/1',
      actionLabel: 'View Agent',
      metadata: { agentId: '1', responsesCompleted: 45, target: 40 }
    },
    {
      id: '4',
      type: 'export',
      priority: 'medium',
      title: 'Export Completed',
      message: 'Your export "Household Economic Research - Complete Dataset" has been completed successfully. File size: 2.4 MB.',
      timestamp: '2024-01-20T08:30:00Z',
      read: true,
      actionUrl: '/exports/1',
      actionLabel: 'Download',
      metadata: { exportId: '1', fileSize: '2.4 MB' }
    },
    {
      id: '5',
      type: 'system',
      priority: 'critical',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance will occur on January 22, 2024 from 2:00 AM to 4:00 AM UTC. The system will be unavailable during this time.',
      timestamp: '2024-01-20T07:00:00Z',
      read: false,
      metadata: { maintenanceDate: '2024-01-22', startTime: '02:00', endTime: '04:00' }
    },
    {
      id: '6',
      type: 'quality',
      priority: 'high',
      title: 'Duplicate Detection Alert',
      message: 'AI has detected 8 potential duplicate responses in the Household Economic Research survey. Review recommended.',
      timestamp: '2024-01-19T16:20:00Z',
      read: false,
      actionUrl: '/surveys/1/duplicates',
      actionLabel: 'Review Duplicates',
      metadata: { duplicateCount: 8, surveyId: '1' }
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const icons = {
      survey: BarChart3,
      response: Users,
      agent: Users,
      system: Settings,
      export: Download,
      quality: CheckCircle2
    };
    const Icon = icons[type as keyof typeof icons] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-500 text-white',
      medium: 'bg-amber-500 text-white',
      high: 'bg-red-600 text-white',
      critical: 'bg-red-800 text-white'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      survey: 'bg-blue-500 text-white',
      response: 'bg-green-500 text-white',
      agent: 'bg-purple-500 text-white',
      system: 'bg-gray-500 text-white',
      export: 'bg-orange-500 text-white',
      quality: 'bg-red-500 text-white'
    };
    return colors[type as keyof typeof colors] || colors.system;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      // In a real app, this would navigate to the action URL
      toast.info(`Navigating to ${notification.actionLabel}`);
    }
  };

  const updateSettings = (category: keyof NotificationSettings, updates: Partial<NotificationSettings[keyof NotificationSettings]>) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], ...updates }
    }));
    toast.success('Notification settings updated');
  };

  const notificationTypes = [
    { value: 'survey', label: 'Survey Updates', description: 'Survey status changes, deadlines, and milestones' },
    { value: 'response', label: 'Response Alerts', description: 'Response quality issues, validation alerts' },
    { value: 'agent', label: 'Agent Activity', description: 'Agent performance, assignments, and status updates' },
    { value: 'system', label: 'System Notifications', description: 'Maintenance, updates, and system alerts' },
    { value: 'export', label: 'Export Status', description: 'Export completion, failures, and download links' },
    { value: 'quality', label: 'Quality Alerts', description: 'Data quality issues, duplicates, and validation' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Notification Center</h3>
          <p className="text-sm text-muted-foreground">
            Stay updated with survey progress, alerts, and system notifications
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All Read ({unreadCount})
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {notificationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-red-600' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          {notification.metadata && (
                            <span className="flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              {Object.entries(notification.metadata).map(([key, value]) => (
                                <span key={key}>{key}: {value}</span>
                              )).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.actionUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleNotificationAction(notification)}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.email.enabled}
                    onCheckedChange={(checked) => updateSettings('email', { enabled: checked })}
                  />
                </div>
                
                {settings.email.enabled && (
                  <>
                    <div>
                      <Label>Email Frequency</Label>
                      <Select 
                        value={settings.email.frequency} 
                        onValueChange={(value) => updateSettings('email', { frequency: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Notification Types</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {notificationTypes.map(type => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Switch
                              checked={settings.email.types.includes(type.value)}
                              onCheckedChange={(checked) => {
                                const newTypes = checked 
                                  ? [...settings.email.types, type.value]
                                  : settings.email.types.filter(t => t !== type.value);
                                updateSettings('email', { types: newTypes });
                              }}
                            />
                            <Label className="text-sm">{type.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Browser and mobile push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.push.enabled}
                    onCheckedChange={(checked) => updateSettings('push', { enabled: checked })}
                  />
                </div>
                
                {settings.push.enabled && (
                  <div>
                    <Label>Notification Types</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {notificationTypes.slice(0, 4).map(type => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Switch
                            checked={settings.push.types.includes(type.value)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked 
                                ? [...settings.push.types, type.value]
                                : settings.push.types.filter(t => t !== type.value);
                              updateSettings('push', { types: newTypes });
                            }}
                          />
                          <Label className="text-sm">{type.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SMS Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SMS Notifications
                </CardTitle>
                <CardDescription>
                  Critical alerts via SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.sms.enabled}
                    onCheckedChange={(checked) => updateSettings('sms', { enabled: checked })}
                  />
                </div>
                
                {settings.sms.enabled && (
                  <div>
                    <Label>Phone Number</Label>
                    <Input placeholder="+254712345678" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Only critical alerts will be sent via SMS
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Webhook Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Webhook Integration
                </CardTitle>
                <CardDescription>
                  Send notifications to external systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Webhook Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to external webhook URL
                    </p>
                  </div>
                  <Switch
                    checked={settings.webhook.enabled}
                    onCheckedChange={(checked) => updateSettings('webhook', { enabled: checked })}
                  />
                </div>
                
                {settings.webhook.enabled && (
                  <>
                    <div>
                      <Label>Webhook URL</Label>
                      <Input 
                        placeholder="https://your-system.com/webhook" 
                        value={settings.webhook.url}
                        onChange={(e) => updateSettings('webhook', { url: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label>Notification Types</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {notificationTypes.slice(4).map(type => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Switch
                              checked={settings.webhook.types.includes(type.value)}
                              onCheckedChange={(checked) => {
                                const newTypes = checked 
                                  ? [...settings.webhook.types, type.value]
                                  : settings.webhook.types.filter(t => t !== type.value);
                                updateSettings('webhook', { types: newTypes });
                              }}
                            />
                            <Label className="text-sm">{type.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Customize notification messages and formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationTypes.map(type => (
                  <div key={type.value} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getNotificationIcon(type.type)}
                      <h4 className="font-semibold">{type.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Email Subject Template</Label>
                        <Input placeholder={`[${type.label.toUpperCase()}] Survey Alert - {title}`} />
                      </div>
                      <div>
                        <Label className="text-sm">Message Template</Label>
                        <Textarea 
                          placeholder={`{title}\n\n{message}\n\nTimestamp: {timestamp}\nAction: {actionLabel}`}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSystem;


