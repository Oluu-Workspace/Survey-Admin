import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, FileSpreadsheet, FileImage, Database, Filter, Calendar, Users, MapPin, BarChart3, CheckCircle2, AlertTriangle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SurveyResponse, Question } from './SurveyResponseViewer';

interface ExportJob {
  id: string;
  name: string;
  type: 'data' | 'analysis' | 'summary' | 'quality';
  format: 'excel' | 'csv' | 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  file_size?: string;
  download_url?: string;
  filters?: ExportFilters;
}

interface ExportFilters {
  dateRange: {
    start: string;
    end: string;
  };
  counties: string[];
  agents: string[];
  questions: string[];
  status: string[];
  qualityScore: {
    min: number;
    max: number;
  };
}

interface ExportManagerProps {
  surveyId: string;
  surveyTitle: string;
  responses: SurveyResponse[];
  questions: Question[];
}

const ExportManager = ({ surveyId, surveyTitle, responses, questions }: ExportManagerProps) => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<'data' | 'analysis' | 'summary' | 'quality'>('data');
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv' | 'pdf' | 'json'>('excel');
  const [exportName, setExportName] = useState('');
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: {
      start: '',
      end: ''
    },
    counties: [],
    agents: [],
    questions: [],
    status: [],
    qualityScore: {
      min: 0,
      max: 100
    }
  });
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  // Mock export jobs for demonstration
  const mockExportJobs: ExportJob[] = [
    {
      id: '1',
      name: 'Household Economic Research - Complete Dataset',
      type: 'data',
      format: 'excel',
      status: 'completed',
      progress: 100,
      created_at: '2024-01-20T10:30:00Z',
      completed_at: '2024-01-20T10:32:15Z',
      file_size: '2.4 MB',
      download_url: '#',
      filters: {
        dateRange: { start: '2024-01-01', end: '2024-01-20' },
        counties: ['Nairobi', 'Kiambu'],
        agents: [],
        questions: [],
        status: ['validated'],
        qualityScore: { min: 80, max: 100 }
      }
    },
    {
      id: '2',
      name: 'Income Analysis Report',
      type: 'analysis',
      format: 'pdf',
      status: 'processing',
      progress: 65,
      created_at: '2024-01-20T11:00:00Z',
      filters: {
        dateRange: { start: '2024-01-01', end: '2024-01-20' },
        counties: [],
        agents: [],
        questions: ['q3'],
        status: ['validated'],
        qualityScore: { min: 0, max: 100 }
      }
    },
    {
      id: '3',
      name: 'Executive Summary - Q1 2024',
      type: 'summary',
      format: 'pdf',
      status: 'completed',
      progress: 100,
      created_at: '2024-01-20T09:00:00Z',
      completed_at: '2024-01-20T09:05:30Z',
      file_size: '1.8 MB',
      download_url: '#'
    },
    {
      id: '4',
      name: 'Data Quality Assessment',
      type: 'quality',
      format: 'excel',
      status: 'failed',
      progress: 0,
      created_at: '2024-01-20T08:30:00Z'
    }
  ];

  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'bg-green-500 text-white'; // Success - Completed
        case 'processing':
          return 'bg-amber-500 text-white'; // Warning - Processing
        case 'pending':
          return 'bg-gray-500 text-white'; // Neutral - Pending
        case 'failed':
          return 'bg-red-600 text-white'; // Error - Failed
        default:
          return 'bg-gray-400 text-white';
      }
    };
    
    const icons = {
      completed: CheckCircle2,
      processing: Clock,
      pending: Clock,
      failed: AlertTriangle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getFormatIcon = (format: string) => {
    const icons = {
      excel: FileSpreadsheet,
      csv: FileText,
      pdf: FileImage,
      json: Database
    } as const;
    
    const Icon = icons[format as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const handleCreateExport = () => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: exportName || `${surveyTitle} - ${selectedExportType} Export`,
      type: selectedExportType,
      format: selectedFormat,
      status: 'processing',
      progress: 0,
      created_at: new Date().toISOString(),
      filters: { ...filters }
    };

    setExportJobs(prev => [newJob, ...prev]);
    setIsExportDialogOpen(false);
    
    // Simulate processing
    simulateExportProcessing(newJob.id);
    
    toast.success(`Export "${newJob.name}" started successfully`);
  };

  const simulateExportProcessing = (jobId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setExportJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status: 'completed', 
                progress: 100, 
                completed_at: new Date().toISOString(),
                file_size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
                download_url: '#'
              }
            : job
        ));
        
        toast.success('Export completed successfully!');
      } else {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress } : job
        ));
      }
    }, 1000);
  };

  const handleDownload = (job: ExportJob) => {
    if (job.status === 'completed' && job.download_url) {
      toast.success(`Downloading ${job.name}`);
      // In a real app, this would trigger the actual download
    }
  };

  const handleRetry = (job: ExportJob) => {
    setExportJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { ...j, status: 'processing', progress: 0 }
        : j
    ));
    simulateExportProcessing(job.id);
    toast.info(`Retrying export: ${job.name}`);
  };

  const exportTypes = [
    {
      value: 'data',
      label: 'Raw Data Export',
      description: 'Complete dataset with all responses and metadata',
      icon: Database
    },
    {
      value: 'analysis',
      label: 'Analysis Report',
      description: 'Statistical analysis with charts and insights',
      icon: BarChart3
    },
    {
      value: 'summary',
      label: 'Executive Summary',
      description: 'High-level overview for stakeholders',
      icon: FileText
    },
    {
      value: 'quality',
      label: 'Quality Assessment',
      description: 'Data validation and quality metrics report',
      icon: CheckCircle2
    }
  ];

  const formats = [
    { value: 'excel', label: 'Excel (.xlsx)', description: 'Best for data analysis and sharing' },
    { value: 'csv', label: 'CSV (.csv)', description: 'Universal format, lightweight' },
    { value: 'pdf', label: 'PDF (.pdf)', description: 'Best for reports and presentations' },
    { value: 'json', label: 'JSON (.json)', description: 'For developers and APIs' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Export Center</h2>
          <p className="text-muted-foreground">
            Export and analyze data from "{surveyTitle}"
          </p>
        </div>
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create New Export</DialogTitle>
              <DialogDescription>
                Export your survey data in various formats with custom filters and analysis options.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={selectedExportType} onValueChange={(value) => setSelectedExportType(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                {exportTypes.map(type => (
                  <TabsTrigger key={type.value} value={type.value} className="flex flex-col items-center gap-1">
                    <type.icon className="h-4 w-4" />
                    <span className="text-xs">{type.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {exportTypes.map(type => (
                <TabsContent key={type.value} value={type.value} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="export-name">Export Name</Label>
                        <Input
                          id="export-name"
                          placeholder={`${type.label} - ${new Date().toLocaleDateString()}`}
                          value={exportName}
                          onChange={(e) => setExportName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Export Format</Label>
                        <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formats.map(format => (
                              <SelectItem key={format.value} value={format.value}>
                                <div className="flex items-center gap-2">
                                  {getFormatIcon(format.value)}
                                  <div>
                                    <div className="font-medium">{format.label}</div>
                                    <div className="text-xs text-muted-foreground">{format.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Advanced Filters */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Advanced Filters
              </h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                    />
                    <Input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Quality Score Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      min="0"
                      max="100"
                      value={filters.qualityScore.min}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        qualityScore: { ...prev.qualityScore, min: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      min="0"
                      max="100"
                      value={filters.qualityScore.max}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        qualityScore: { ...prev.qualityScore, max: parseInt(e.target.value) || 100 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Response Status</Label>
                <div className="flex gap-4 mt-2">
                  {['validated', 'flagged', 'rejected', 'submitted'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters(prev => ({
                              ...prev,
                              status: [...prev.status, status]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              status: prev.status.filter(s => s !== status)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={status} className="text-sm capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateExport}>
                <Zap className="h-4 w-4 mr-2" />
                Create Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Export Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Export Jobs</CardTitle>
          <CardDescription>
            Track and manage your data exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockExportJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getFormatIcon(job.format)}
                    <div>
                      <h4 className="font-semibold">{job.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {job.type}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(job.created_at).toLocaleString()}</span>
                        {job.file_size && (
                          <>
                            <span>•</span>
                            <span>{job.file_size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(job.status)}
                  
                  {job.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="w-24" />
                      <span className="text-sm text-muted-foreground">{job.progress}%</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && job.download_url && (
                      <Button size="sm" onClick={() => handleDownload(job)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    {job.status === 'failed' && (
                      <Button size="sm" variant="outline" onClick={() => handleRetry(job)}>
                        <Zap className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Options */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setSelectedExportType('data');
          setSelectedFormat('excel');
          setIsExportDialogOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Quick Data Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Export all validated responses to Excel
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setSelectedExportType('analysis');
          setSelectedFormat('pdf');
          setIsExportDialogOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Generate comprehensive analysis with charts
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setSelectedExportType('summary');
          setSelectedFormat('pdf');
          setIsExportDialogOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              High-level overview for stakeholders
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setSelectedExportType('quality');
          setSelectedFormat('excel');
          setIsExportDialogOpen(true);
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Quality Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Data validation and quality metrics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportManager;

