import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Search, Eye, Download, Filter, MapPin, User, Calendar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface SurveyResponse {
  id: string;
  survey_id: string;
  survey_title: string;
  agent_id: string;
  agent_name: string;
  respondent_id: string;
  county: string;
  sub_county: string;
  ward: string;
  area: string;
  status: 'submitted' | 'validated' | 'flagged' | 'rejected';
  quality_score: number;
  created_at: string;
  updated_at: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  answers: Record<string, any>;
  validation_notes?: string;
  flagged_reasons?: string[];
}

interface SurveyResponseViewerProps {
  surveyId: string;
  surveyTitle: string;
  responses: SurveyResponse[];
  onResponseUpdate?: (responseId: string, status: string, notes?: string) => void;
}

const SurveyResponseViewer = ({ surveyId, surveyTitle, responses, onResponseUpdate }: SurveyResponseViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.respondent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || response.status === statusFilter;
    const matchesCounty = countyFilter === 'all' || response.county === countyFilter;
    const matchesAgent = agentFilter === 'all' || response.agent_id === agentFilter;
    const matchesQuality = qualityFilter === 'all' || 
      (qualityFilter === 'high' && response.quality_score >= 90) ||
      (qualityFilter === 'medium' && response.quality_score >= 70 && response.quality_score < 90) ||
      (qualityFilter === 'low' && response.quality_score < 70);
    
    // Date range filtering
    let matchesDateRange = true;
    if (dateRangeFilter !== 'all') {
      const responseDate = new Date(response.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateRangeFilter) {
        case 'today':
          matchesDateRange = daysDiff === 0;
          break;
        case 'week':
          matchesDateRange = daysDiff <= 7;
          break;
        case 'month':
          matchesDateRange = daysDiff <= 30;
          break;
        case 'quarter':
          matchesDateRange = daysDiff <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCounty && matchesAgent && matchesQuality && matchesDateRange;
  }).sort((a, b) => {
    let aValue: any = a[sortBy as keyof SurveyResponse];
    let bValue: any = b[sortBy as keyof SurveyResponse];
    
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'validated':
          return 'bg-green-500 text-white'; // Success - Validated
        case 'submitted':
          return 'bg-amber-500 text-white'; // Warning - Pending validation
        case 'flagged':
          return 'bg-red-600 text-white'; // Error - Flagged for review
        case 'rejected':
          return 'bg-gray-500 text-white'; // Neutral - Rejected
        default:
          return 'bg-gray-400 text-white';
      }
    };
    
    const icons = {
      validated: CheckCircle2,
      submitted: AlertTriangle,
      flagged: AlertTriangle,
      rejected: XCircle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle2;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'; // #10B981 - Success
    if (score >= 80) return 'text-amber-600'; // #F59E0B - Warning
    if (score >= 70) return 'text-orange-600'; // #EA580C - Medium warning
    return 'text-red-600'; // #DC2626 - Error
  };

  const handleViewResponse = (response: SurveyResponse) => {
    setSelectedResponse(response);
    setIsDetailDialogOpen(true);
  };

  const handleResponseAction = (action: string, response: SurveyResponse) => {
    if (onResponseUpdate) {
      onResponseUpdate(response.id, action);
      toast.success(`Response ${action} successfully`);
    }
  };

  const stats = {
    total: responses.length,
    validated: responses.filter(r => r.status === 'validated').length,
    flagged: responses.filter(r => r.status === 'flagged').length,
    rejected: responses.filter(r => r.status === 'rejected').length,
    average_quality: responses.reduce((sum, r) => sum + r.quality_score, 0) / responses.length || 0
  };

  const counties = [...new Set(responses.map(r => r.county))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Survey Responses</h3>
          <p className="text-sm text-muted-foreground">
            {surveyTitle} - {responses.length} responses collected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Responses
          </Button>
        </div>
      </div>

      {/* Response Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Collected responses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validated}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flagged}</div>
            <p className="text-xs text-muted-foreground">
              Require review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_quality.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average quality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Response Management</CardTitle>
          <CardDescription>Review and validate survey responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search responses by ID, agent, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Filter Row 1 */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={countyFilter} onValueChange={setCountyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {Array.from(new Set(responses.map(r => r.agent_name))).map(agent => (
                    <SelectItem key={agent} value={responses.find(r => r.agent_name === agent)?.agent_id || agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="high">High (90%+)</SelectItem>
                  <SelectItem value="medium">Medium (70-89%)</SelectItem>
                  <SelectItem value="low">Low (&lt;70%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Row 2 */}
            <div className="flex flex-wrap gap-2">
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="quality_score">Quality Score</SelectItem>
                  <SelectItem value="agent_name">Agent Name</SelectItem>
                  <SelectItem value="county">County</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-[40px]"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              
              <div className="text-sm text-muted-foreground flex items-center">
                Showing {filteredResponses.length} of {responses.length} responses
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Response ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">{response.respondent_id}</TableCell>
                    <TableCell>
                      <div className="text-sm">{response.agent_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{response.area}</div>
                        <div className="text-muted-foreground">{response.ward}, {response.county}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(response.status)}</TableCell>
                    <TableCell>
                      <div className={`font-medium ${getQualityScoreColor(response.quality_score)}`}>
                        {response.quality_score}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(response.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewResponse(response)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Response Detail Dialog */}
      {selectedResponse && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Response Details</DialogTitle>
              <DialogDescription>
                {selectedResponse.respondent_id} - {selectedResponse.survey_title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Agent</Label>
                  <div className="mt-1">{selectedResponse.agent_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedResponse.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="mt-1">
                    {selectedResponse.area}, {selectedResponse.ward}, {selectedResponse.county}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quality Score</Label>
                  <div className={`mt-1 font-medium ${getQualityScoreColor(selectedResponse.quality_score)}`}>
                    {selectedResponse.quality_score}%
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <div className="mt-1">{new Date(selectedResponse.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <div className="mt-1">{new Date(selectedResponse.updated_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedResponse.location && (
                <div>
                  <Label className="text-sm font-medium">GPS Coordinates</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <div className="text-sm">
                      <strong>Latitude:</strong> {selectedResponse.location.latitude}
                    </div>
                    <div className="text-sm">
                      <strong>Longitude:</strong> {selectedResponse.location.longitude}
                    </div>
                    <div className="text-sm">
                      <strong>Address:</strong> {selectedResponse.location.address}
                    </div>
                  </div>
                </div>
              )}

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
                <Label className="text-sm font-medium">Survey Answers</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(selectedResponse.answers, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
              {selectedResponse.status === 'submitted' && (
                <>
                  <Button onClick={() => handleResponseAction('validate', selectedResponse)}>
                    Validate
                  </Button>
                  <Button variant="destructive" onClick={() => handleResponseAction('flag', selectedResponse)}>
                    Flag
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SurveyResponseViewer;

