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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Filter, MoreHorizontal, Download, FileText, FileSpreadsheet, File, Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Plus, Eye, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ExportJob {
  id: string;
  name: string;
  description: string;
  type: 'survey' | 'agent' | 'response' | 'analytics' | 'custom';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
  completed_at?: string;
  file_size?: number;
  download_url?: string;
  filters?: Record<string, any>;
  created_by: string;
  error_message?: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  format: string;
  fields: string[];
  filters: Record<string, any>;
  created_at: string;
}

const ExportCenter = () => {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);

  // Mock data for demonstration
  const mockJobs: ExportJob[] = [
    {
      id: '1',
      name: 'Household Income Survey - Complete Data',
      description: 'Export all responses from Household Income Survey 2024',
      type: 'survey',
      format: 'excel',
      status: 'completed',
      progress: 100,
      created_at: '2024-01-20T10:30:00Z',
      completed_at: '2024-01-20T10:35:00Z',
      file_size: 2048576,
      download_url: '/exports/household-income-survey-2024.xlsx',
      filters: {
        survey_id: '1',
        date_range: '2024-01-01 to 2024-01-20',
        status: 'validated'
      },
      created_by: 'Admin User'
    },
    {
      id: '2',
      name: 'Agent Performance Report',
      description: 'Monthly agent performance and activity report',
      type: 'agent',
      format: 'pdf',
      status: 'processing',
      progress: 65,
      created_at: '2024-01-20T09:15:00Z',
      filters: {
        date_range: '2024-01-01 to 2024-01-31',
        include_quality_scores: true
      },
      created_by: 'Admin User'
    },
    {
      id: '3',
      name: 'Regional Analytics Export',
      description: 'Comprehensive regional data analysis',
      type: 'analytics',
      format: 'csv',
      status: 'pending',
      progress: 0,
      created_at: '2024-01-20T08:45:00Z',
      filters: {
        regions: ['Nairobi', 'Mombasa', 'Kisumu'],
        include_charts: false
      },
      created_by: 'Data Analyst'
    },
    {
      id: '4',
      name: 'Flagged Responses Review',
      description: 'Export all flagged responses for quality review',
      type: 'response',
      format: 'json',
      status: 'failed',
      progress: 0,
      created_at: '2024-01-19T16:30:00Z',
      error_message: 'Database connection timeout during export',
      filters: {
        status: 'flagged',
        date_range: '2024-01-01 to 2024-01-19'
      },
      created_by: 'Quality Manager'
    },
    {
      id: '5',
      name: 'Custom Survey Data',
      description: 'Custom export with specific field selection',
      type: 'custom',
      format: 'excel',
      status: 'completed',
      progress: 100,
      created_at: '2024-01-19T14:20:00Z',
      completed_at: '2024-01-19T14:25:00Z',
      file_size: 1536000,
      download_url: '/exports/custom-survey-data.xlsx',
      filters: {
        fields: ['respondent_id', 'household_size', 'monthly_income', 'employment_status'],
        survey_id: '1',
        quality_threshold: 80
      },
      created_by: 'Researcher'
    }
  ];

  const mockTemplates: ExportTemplate[] = [
    {
      id: '1',
      name: 'Standard Survey Export',
      description: 'Complete survey data with all fields',
      type: 'survey',
      format: 'excel',
      fields: ['respondent_id', 'survey_title', 'agent_name', 'created_at', 'all_response_fields'],
      filters: { status: 'validated' },
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Agent Performance Template',
      description: 'Agent activity and performance metrics',
      type: 'agent',
      format: 'pdf',
      fields: ['agent_name', 'responses_count', 'quality_score', 'completion_rate', 'activity_hours'],
      filters: { date_range: 'last_30_days' },
      created_at: '2024-01-10T14:30:00Z'
    },
    {
      id: '3',
      name: 'Quality Review Export',
      description: 'Flagged and rejected responses for review',
      type: 'response',
      format: 'csv',
      fields: ['respondent_id', 'survey_title', 'agent_name', 'flagged_reasons', 'quality_score'],
      filters: { status: ['flagged', 'rejected'] },
      created_at: '2024-01-05T09:15:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobs(mockJobs);
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
      cancelled: 'outline'
    } as const;
    
    const icons = {
      completed: CheckCircle2,
      processing: RefreshCw,
      pending: Clock,
      failed: XCircle,
      cancelled: XCircle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getFormatIcon = (format: string) => {
    const icons = {
      csv: FileText,
      excel: FileSpreadsheet,
      pdf: File,
      json: File
    } as const;
    
    const Icon = icons[format as keyof typeof icons] || File;
    return <Icon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCreateExport = () => {
    toast.success('Export job created successfully');
    setIsCreateDialogOpen(false);
  };

  const handleJobAction = (action: string, job: ExportJob) => {
    switch (action) {
      case 'download':
        if (job.download_url) {
          toast.success(`Downloading ${job.name}`);
          // Simulate download
          window.open(job.download_url, '_blank');
        } else {
          toast.error('Download not available');
        }
        break;
      case 'view':
        setSelectedJob(job);
        break;
      case 'retry':
        toast.info(`Retrying export job: ${job.name}`);
        break;
      case 'cancel':
        toast.info(`Cancelling export job: ${job.name}`);
        break;
      case 'delete':
        toast.error(`Deleting export job: ${job.name}`);
        break;
    }
  };

  const handleUseTemplate = (template: ExportTemplate) => {
    toast.info(`Using template: ${template.name}`);
    setIsCreateDialogOpen(true);
  };

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalSize: jobs.filter(j => j.file_size).reduce((sum, j) => sum + (j.file_size || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage data exports and download reports.
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading export jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage data exports and download reports.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Export</DialogTitle>
              <DialogDescription>
                Configure and schedule a new data export.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" placeholder="Export name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select export type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survey">Survey Data</SelectItem>
                    <SelectItem value="agent">Agent Performance</SelectItem>
                    <SelectItem value="response">Response Data</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="custom">Custom Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="format" className="text-right">Format</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" placeholder="Export description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateExport}>Create Export</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Jobs</CardTitle>
              <CardDescription>Manage and monitor export jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Export Job</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.name}</div>
                            <div className="text-sm text-muted-foreground">{job.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created by {job.created_by}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFormatIcon(job.format)}
                            <span className="uppercase">{job.format}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {job.status === 'processing' ? (
                            <div className="space-y-1">
                              <Progress value={job.progress} className="h-2" />
                              <div className="text-xs text-muted-foreground">{job.progress}%</div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {job.status === 'completed' ? '100%' : 'N/A'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatFileSize(job.file_size)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(job.created_at).toLocaleDateString()}
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
                              <DropdownMenuItem onClick={() => handleJobAction('view', job)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {job.status === 'completed' && job.download_url && (
                                <DropdownMenuItem onClick={() => handleJobAction('download', job)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {job.status === 'failed' && (
                                <DropdownMenuItem onClick={() => handleJobAction('retry', job)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Retry
                                </DropdownMenuItem>
                              )}
                              {job.status === 'processing' && (
                                <DropdownMenuItem onClick={() => handleJobAction('cancel', job)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleJobAction('delete', job)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Templates</CardTitle>
              <CardDescription>Pre-configured export templates for common use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getFormatIcon(template.format)}
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Fields:</span> {template.fields.length} selected
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>Historical record of all export jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.filter(j => j.status === 'completed').map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">{job.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.type} • {job.format.toUpperCase()} • {formatFileSize(job.file_size)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {job.completed_at && new Date(job.completed_at).toLocaleString()}
                        </div>
                        {job.download_url && (
                          <Button size="sm" variant="outline" className="mt-2">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedJob.name}</DialogTitle>
              <DialogDescription>{selectedJob.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedJob.type}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Format</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {getFormatIcon(selectedJob.format)}
                    <span className="uppercase">{selectedJob.format}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Size</Label>
                  <div className="mt-1">{formatFileSize(selectedJob.file_size)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="mt-1">{new Date(selectedJob.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <div className="mt-1">{selectedJob.created_by}</div>
                </div>
              </div>
              {selectedJob.completed_at && (
                <div>
                  <Label className="text-sm font-medium">Completed</Label>
                  <div className="mt-1">{new Date(selectedJob.completed_at).toLocaleString()}</div>
                </div>
              )}
              {selectedJob.error_message && (
                <div>
                  <Label className="text-sm font-medium">Error Message</Label>
                  <Alert className="mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{selectedJob.error_message}</AlertDescription>
                  </Alert>
                </div>
              )}
              {selectedJob.filters && (
                <div>
                  <Label className="text-sm font-medium">Filters Applied</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(selectedJob.filters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              {selectedJob.download_url && (
                <Button onClick={() => handleJobAction('download', selectedJob)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ExportCenter;
