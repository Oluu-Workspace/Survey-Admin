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
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, AlertTriangle, Download, Eye, Edit, Trash2, RefreshCw, Shield, Database, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Response {
  id: string;
  survey_id: string;
  survey_title: string;
  agent_id: string;
  agent_name: string;
  respondent_id: string;
  status: 'pending' | 'validated' | 'flagged' | 'rejected';
  quality_score: number;
  created_at: string;
  updated_at: string;
  flagged_reasons?: string[];
  validation_notes?: string;
  data: Record<string, any>;
}

interface QualityMetrics {
  total_responses: number;
  validated_responses: number;
  flagged_responses: number;
  rejected_responses: number;
  average_quality_score: number;
  validation_rate: number;
  quality_trend: number;
}

const DataManagement = () => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [surveyFilter, setSurveyFilter] = useState<string>('all');
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');
  const [validationAction, setValidationAction] = useState<'validate' | 'flag' | 'reject'>('validate');

  // Mock data for demonstration
  const mockResponses: Response[] = [
    {
      id: '1',
      survey_id: '1',
      survey_title: 'Household Income Survey 2024',
      agent_id: '1',
      agent_name: 'John Doe',
      respondent_id: 'R001',
      status: 'validated',
      quality_score: 95.2,
      created_at: '2024-01-20T10:30:00Z',
      updated_at: '2024-01-20T11:15:00Z',
      validation_notes: 'Complete and accurate response',
      data: {
        household_size: 4,
        monthly_income: 45000,
        employment_status: 'employed',
        education_level: 'secondary'
      }
    },
    {
      id: '2',
      survey_id: '1',
      survey_title: 'Household Income Survey 2024',
      agent_id: '2',
      agent_name: 'Jane Smith',
      respondent_id: 'R002',
      status: 'flagged',
      quality_score: 72.8,
      created_at: '2024-01-20T09:15:00Z',
      updated_at: '2024-01-20T10:45:00Z',
      flagged_reasons: ['Inconsistent income data', 'Missing employment details'],
      validation_notes: 'Income seems inconsistent with reported employment',
      data: {
        household_size: 3,
        monthly_income: 120000,
        employment_status: 'unemployed',
        education_level: 'primary'
      }
    },
    {
      id: '3',
      survey_id: '2',
      survey_title: 'Education Access Assessment',
      agent_id: '3',
      agent_name: 'Peter Kamau',
      respondent_id: 'R003',
      status: 'pending',
      quality_score: 0,
      created_at: '2024-01-20T14:20:00Z',
      updated_at: '2024-01-20T14:20:00Z',
      data: {
        school_distance: 2.5,
        school_quality: 'good',
        transport_cost: 500,
        attendance_rate: 85
      }
    },
    {
      id: '4',
      survey_id: '2',
      survey_title: 'Education Access Assessment',
      agent_id: '1',
      agent_name: 'John Doe',
      respondent_id: 'R004',
      status: 'rejected',
      quality_score: 45.6,
      created_at: '2024-01-19T16:45:00Z',
      updated_at: '2024-01-19T17:30:00Z',
      flagged_reasons: ['Incomplete responses', 'Suspicious data patterns'],
      validation_notes: 'Multiple incomplete fields and inconsistent responses',
      data: {
        school_distance: null,
        school_quality: '',
        transport_cost: 0,
        attendance_rate: 0
      }
    },
    {
      id: '5',
      survey_id: '3',
      survey_title: 'Healthcare Services Evaluation',
      agent_id: '4',
      agent_name: 'Mary Wanjiku',
      respondent_id: 'R005',
      status: 'validated',
      quality_score: 88.9,
      created_at: '2024-01-20T08:30:00Z',
      updated_at: '2024-01-20T09:15:00Z',
      validation_notes: 'Good quality response with minor inconsistencies',
      data: {
        hospital_distance: 5.2,
        service_quality: 'excellent',
        waiting_time: 30,
        cost_affordability: 'moderate'
      }
    }
  ];

  const mockQualityMetrics: QualityMetrics = {
    total_responses: 1986,
    validated_responses: 1456,
    flagged_responses: 387,
    rejected_responses: 143,
    average_quality_score: 89.2,
    validation_rate: 73.3,
    quality_trend: 2.3
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setResponses(mockResponses);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.respondent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.survey_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || response.status === statusFilter;
    const matchesSurvey = surveyFilter === 'all' || response.survey_id === surveyFilter;
    
    return matchesSearch && matchesStatus && matchesSurvey;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      validated: 'default',
      pending: 'secondary',
      flagged: 'destructive',
      rejected: 'outline'
    } as const;
    
    const icons = {
      validated: CheckCircle2,
      pending: RefreshCw,
      flagged: AlertTriangle,
      rejected: XCircle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle2;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleSelectResponse = (responseId: string, checked: boolean) => {
    if (checked) {
      setSelectedResponses([...selectedResponses, responseId]);
    } else {
      setSelectedResponses(selectedResponses.filter(id => id !== responseId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResponses(filteredResponses.map(r => r.id));
    } else {
      setSelectedResponses([]);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedResponses.length === 0) {
      toast.error('Please select responses to perform bulk action');
      return;
    }
    
    toast.success(`${action} applied to ${selectedResponses.length} responses`);
    setSelectedResponses([]);
  };

  const handleValidateResponse = () => {
    if (!selectedResponse) return;
    
    toast.success(`Response ${validationAction}ed successfully`);
    setIsValidationDialogOpen(false);
    setSelectedResponse(null);
    setValidationNotes('');
  };

  const handleResponseAction = (action: string, response: Response) => {
    switch (action) {
      case 'view':
        setSelectedResponse(response);
        break;
      case 'validate':
        setSelectedResponse(response);
        setValidationAction('validate');
        setIsValidationDialogOpen(true);
        break;
      case 'flag':
        setSelectedResponse(response);
        setValidationAction('flag');
        setIsValidationDialogOpen(true);
        break;
      case 'reject':
        setSelectedResponse(response);
        setValidationAction('reject');
        setIsValidationDialogOpen(true);
        break;
      case 'export':
        toast.info(`Export response ${response.id}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Validate and manage survey response data quality.
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading responses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Data Validation</h1>
          <p className="text-muted-foreground mt-1">
            Validate and manage research data quality from field agents. Review responses, flag inconsistencies, and ensure data integrity for analysis.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleBulkAction('validate')}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Validate Selected
          </Button>
          <Button variant="outline" onClick={() => handleBulkAction('export')}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockQualityMetrics.total_responses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All collected responses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockQualityMetrics.validated_responses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {mockQualityMetrics.validation_rate}% validation rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockQualityMetrics.flagged_responses}</div>
            <p className="text-xs text-muted-foreground">
              Require review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockQualityMetrics.average_quality_score}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockQualityMetrics.quality_trend}%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="responses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="responses">Response Validation</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Validation</CardTitle>
              <CardDescription>Review and validate survey responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search responses..."
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
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={surveyFilter} onValueChange={setSurveyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by survey" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Surveys</SelectItem>
                    <SelectItem value="1">Household Income Survey</SelectItem>
                    <SelectItem value="2">Education Access Assessment</SelectItem>
                    <SelectItem value="3">Healthcare Services Evaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedResponses.length === filteredResponses.length && filteredResponses.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Response ID</TableHead>
                      <TableHead>Survey</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedResponses.includes(response.id)}
                            onCheckedChange={(checked) => handleSelectResponse(response.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{response.respondent_id}</TableCell>
                        <TableCell>
                          <div className="text-sm">{response.survey_title}</div>
                        </TableCell>
                        <TableCell>{response.agent_name}</TableCell>
                        <TableCell>{getStatusBadge(response.status)}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${getQualityScoreColor(response.quality_score)}`}>
                            {response.quality_score > 0 ? `${response.quality_score}%` : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(response.created_at).toLocaleDateString()}
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
                              <DropdownMenuItem onClick={() => handleResponseAction('view', response)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleResponseAction('validate', response)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Validate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResponseAction('flag', response)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Flag for Review
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResponseAction('reject', response)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleResponseAction('export', response)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
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

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Validation Progress</CardTitle>
                <CardDescription>Overall data validation status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Validated</span>
                    <span>{mockQualityMetrics.validated_responses}</span>
                  </div>
                  <Progress value={mockQualityMetrics.validation_rate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Flagged</span>
                    <span>{mockQualityMetrics.flagged_responses}</span>
                  </div>
                  <Progress value={(mockQualityMetrics.flagged_responses / mockQualityMetrics.total_responses) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rejected</span>
                    <span>{mockQualityMetrics.rejected_responses}</span>
                  </div>
                  <Progress value={(mockQualityMetrics.rejected_responses / mockQualityMetrics.total_responses) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
                <CardDescription>Average quality score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">{mockQualityMetrics.average_quality_score}%</div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-green-600">+{mockQualityMetrics.quality_trend}%</span> from last month
                  </div>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Quality score is above the 85% threshold. Data quality is good.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Responses</CardTitle>
              <CardDescription>Responses requiring review and validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.filter(r => r.status === 'flagged').map((response) => (
                  <div key={response.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{response.respondent_id}</div>
                        <div className="text-sm text-muted-foreground">{response.survey_title}</div>
                        <div className="text-sm text-muted-foreground">Agent: {response.agent_name}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getQualityScoreColor(response.quality_score)}`}>
                          {response.quality_score}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(response.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {response.flagged_reasons && (
                      <div>
                        <div className="text-sm font-medium mb-2">Flagged Reasons:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {response.flagged_reasons.map((reason, index) => (
                            <li key={index}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {response.validation_notes && (
                      <div>
                        <div className="text-sm font-medium mb-2">Validation Notes:</div>
                        <div className="text-sm text-muted-foreground">{response.validation_notes}</div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleResponseAction('validate', response)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Validate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleResponseAction('reject', response)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleResponseAction('view', response)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Details Dialog */}
      {selectedResponse && (
        <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Response Details</DialogTitle>
              <DialogDescription>{selectedResponse.respondent_id} - {selectedResponse.survey_title}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedResponse.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quality Score</Label>
                  <div className={`mt-1 font-medium ${getQualityScoreColor(selectedResponse.quality_score)}`}>
                    {selectedResponse.quality_score > 0 ? `${selectedResponse.quality_score}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Agent</Label>
                  <div className="mt-1">{selectedResponse.agent_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="mt-1">{new Date(selectedResponse.created_at).toLocaleString()}</div>
                </div>
              </div>
              {selectedResponse.flagged_reasons && (
                <div>
                  <Label className="text-sm font-medium">Flagged Reasons</Label>
                  <ul className="mt-1 text-sm text-muted-foreground space-y-1">
                    {selectedResponse.flagged_reasons.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedResponse.validation_notes && (
                <div>
                  <Label className="text-sm font-medium">Validation Notes</Label>
                  <div className="mt-1 text-sm text-muted-foreground">{selectedResponse.validation_notes}</div>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Response Data</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(selectedResponse.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedResponse(null)}>
                Close
              </Button>
              <Button onClick={() => handleResponseAction('validate', selectedResponse)}>
                Validate Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Validation Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{validationAction.charAt(0).toUpperCase() + validationAction.slice(1)} Response</DialogTitle>
            <DialogDescription>
              {selectedResponse && `Response ${selectedResponse.respondent_id} from ${selectedResponse.survey_title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="notes">Validation Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this validation decision..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleValidateResponse}>
              {validationAction.charAt(0).toUpperCase() + validationAction.slice(1)} Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManagement;
