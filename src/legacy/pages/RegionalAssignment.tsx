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
import { Search, Filter, MoreHorizontal, MapPin, Users, Plus, Edit, Trash2, Eye, CheckCircle2, AlertTriangle, XCircle, BarChart3, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Region {
  id: string;
  name: string;
  county: string;
  sub_county: string;
  ward: string;
  population: number;
  target_households: number;
  assigned_agents: number;
  coverage_status: 'covered' | 'partial' | 'uncovered' | 'over_assigned';
  completion_rate: number;
  last_updated: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  assigned_regions: string[];
  performance_score: number;
  total_responses: number;
  last_activity: string;
}

interface Assignment {
  id: string;
  agent_id: string;
  agent_name: string;
  region_id: string;
  region_name: string;
  assigned_date: string;
  status: 'active' | 'completed' | 'cancelled';
  target_responses: number;
  completed_responses: number;
  completion_rate: number;
}

const RegionalAssignment = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  // Mock data for Kenyan research platform
  const mockRegions: Region[] = [
    // Nairobi County
    {
      id: '1',
      name: 'Nairobi Central',
      county: 'Nairobi',
      sub_county: 'Nairobi Central',
      ward: 'Central Business District',
      population: 45000,
      target_households: 12000,
      assigned_agents: 8,
      coverage_status: 'covered',
      completion_rate: 85.2,
      last_updated: '2024-01-20T10:30:00Z',
      coordinates: { lat: -1.2921, lng: 36.8219 }
    },
    {
      id: '2',
      name: 'Westlands',
      county: 'Nairobi',
      sub_county: 'Westlands',
      ward: 'Westlands',
      population: 32000,
      target_households: 8500,
      assigned_agents: 6,
      coverage_status: 'covered',
      completion_rate: 78.5,
      last_updated: '2024-01-20T09:15:00Z',
      coordinates: { lat: -1.2656, lng: 36.8024 }
    },
    {
      id: '3',
      name: 'Kibera',
      county: 'Nairobi',
      sub_county: 'Langata',
      ward: 'Kibera',
      population: 180000,
      target_households: 45000,
      assigned_agents: 12,
      coverage_status: 'partial',
      completion_rate: 45.8,
      last_updated: '2024-01-19T16:45:00Z',
      coordinates: { lat: -1.3119, lng: 36.7806 }
    },
    // Kiambu County
    {
      id: '4',
      name: 'Thika Town',
      county: 'Kiambu',
      sub_county: 'Thika',
      ward: 'Thika Town',
      population: 28000,
      target_households: 7500,
      assigned_agents: 5,
      coverage_status: 'covered',
      completion_rate: 92.1,
      last_updated: '2024-01-20T08:30:00Z',
      coordinates: { lat: -1.0435, lng: 37.0682 }
    },
    {
      id: '5',
      name: 'Kiambu Town',
      county: 'Kiambu',
      sub_county: 'Kiambu',
      ward: 'Kiambu Town',
      population: 65000,
      target_households: 18000,
      assigned_agents: 4,
      coverage_status: 'partial',
      completion_rate: 38.2,
      last_updated: '2024-01-19T14:20:00Z',
      coordinates: { lat: -1.1833, lng: 36.8667 }
    },
    {
      id: '6',
      name: 'Ruiru',
      county: 'Kiambu',
      sub_county: 'Ruiru',
      ward: 'Ruiru',
      population: 35000,
      target_households: 9500,
      assigned_agents: 0,
      coverage_status: 'uncovered',
      completion_rate: 0,
      last_updated: '2024-01-18T12:00:00Z',
      coordinates: { lat: -1.1917, lng: 36.9680 }
    },
    // Mombasa County
    {
      id: '7',
      name: 'Mombasa Island',
      county: 'Mombasa',
      sub_county: 'Mvita',
      ward: 'Mombasa Island',
      population: 42000,
      target_households: 11000,
      assigned_agents: 10,
      coverage_status: 'over_assigned',
      completion_rate: 95.8,
      last_updated: '2024-01-20T11:15:00Z',
      coordinates: { lat: -4.0435, lng: 39.6682 }
    },
    {
      id: '8',
      name: 'Likoni',
      county: 'Mombasa',
      sub_county: 'Likoni',
      ward: 'Likoni',
      population: 28000,
      target_households: 7500,
      assigned_agents: 5,
      coverage_status: 'covered',
      completion_rate: 82.1,
      last_updated: '2024-01-20T08:30:00Z',
      coordinates: { lat: -4.0833, lng: 39.6667 }
    },
    // Kisumu County
    {
      id: '9',
      name: 'Kisumu Central',
      county: 'Kisumu',
      sub_county: 'Kisumu Central',
      ward: 'Kisumu Central',
      population: 35000,
      target_households: 9500,
      assigned_agents: 0,
      coverage_status: 'uncovered',
      completion_rate: 0,
      last_updated: '2024-01-18T12:00:00Z',
      coordinates: { lat: -0.0917, lng: 34.7680 }
    }
  ];

  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+254712345678',
      status: 'active',
      assigned_regions: ['1', '2'],
      performance_score: 92.5,
      total_responses: 145,
      last_activity: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+254723456789',
      status: 'active',
      assigned_regions: ['3'],
      performance_score: 88.2,
      total_responses: 98,
      last_activity: '2024-01-20T09:15:00Z'
    },
    {
      id: '3',
      name: 'Peter Kamau',
      email: 'peter.kamau@example.com',
      phone: '+254734567890',
      status: 'active',
      assigned_regions: ['4'],
      performance_score: 95.1,
      total_responses: 167,
      last_activity: '2024-01-20T08:30:00Z'
    },
    {
      id: '4',
      name: 'Mary Wanjiku',
      email: 'mary.wanjiku@example.com',
      phone: '+254745678901',
      status: 'inactive',
      assigned_regions: ['5'],
      performance_score: 76.8,
      total_responses: 45,
      last_activity: '2024-01-18T16:20:00Z'
    },
    {
      id: '5',
      name: 'David Ochieng',
      email: 'david.ochieng@example.com',
      phone: '+254756789012',
      status: 'pending',
      assigned_regions: [],
      performance_score: 0,
      total_responses: 0,
      last_activity: '2024-01-20T07:45:00Z'
    }
  ];

  const mockAssignments: Assignment[] = [
    {
      id: '1',
      agent_id: '1',
      agent_name: 'John Doe',
      region_id: '1',
      region_name: 'Nairobi Central',
      assigned_date: '2024-01-15T10:00:00Z',
      status: 'active',
      target_responses: 300,
      completed_responses: 255,
      completion_rate: 85.0
    },
    {
      id: '2',
      agent_id: '1',
      agent_name: 'John Doe',
      region_id: '2',
      region_name: 'Westlands',
      assigned_date: '2024-01-15T10:00:00Z',
      status: 'active',
      target_responses: 250,
      completed_responses: 196,
      completion_rate: 78.4
    },
    {
      id: '3',
      agent_id: '2',
      agent_name: 'Jane Smith',
      region_id: '3',
      region_name: 'Kibera',
      assigned_date: '2024-01-10T09:00:00Z',
      status: 'active',
      target_responses: 500,
      completed_responses: 229,
      completion_rate: 45.8
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRegions(mockRegions);
      setAgents(mockAgents);
      setAssignments(mockAssignments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredRegions = regions.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         region.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         region.sub_county.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCounty = countyFilter === 'all' || region.county === countyFilter;
    const matchesStatus = statusFilter === 'all' || region.coverage_status === statusFilter;
    
    return matchesSearch && matchesCounty && matchesStatus;
  });

  const getCoverageBadge = (status: string) => {
    const variants = {
      covered: 'default',
      partial: 'secondary',
      uncovered: 'destructive',
      over_assigned: 'outline'
    } as const;
    
    const icons = {
      covered: CheckCircle2,
      partial: AlertTriangle,
      uncovered: XCircle,
      over_assigned: AlertTriangle
    } as const;
    
    const Icon = icons[status as keyof typeof icons] || CheckCircle2;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getAgentStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleAssignAgent = () => {
    if (!selectedRegion || !selectedAgent) {
      toast.error('Please select both region and agent');
      return;
    }
    
    toast.success(`Agent assigned to ${selectedRegion.name}`);
    setIsAssignDialogOpen(false);
    setSelectedRegion(null);
    setSelectedAgent('');
  };

  const handleRegionAction = (action: string, region: Region) => {
    switch (action) {
      case 'assign':
        setSelectedRegion(region);
        setIsAssignDialogOpen(true);
        break;
      case 'view':
        toast.info(`View details for ${region.name}`);
        break;
      case 'edit':
        toast.info(`Edit region ${region.name}`);
        break;
      case 'remove':
        toast.error(`Remove assignments from ${region.name}`);
        break;
    }
  };

  const stats = {
    total_regions: regions.length,
    covered_regions: regions.filter(r => r.coverage_status === 'covered').length,
    partial_regions: regions.filter(r => r.coverage_status === 'partial').length,
    uncovered_regions: regions.filter(r => r.coverage_status === 'uncovered').length,
    total_agents: agents.filter(a => a.status === 'active').length,
    total_assignments: assignments.filter(a => a.status === 'active').length,
    average_completion: regions.reduce((sum, r) => sum + r.completion_rate, 0) / regions.length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regional Assignment</h1>
          <p className="text-muted-foreground mt-1">
            Manage agent assignments and regional coverage.
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading regional data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geographic Coverage Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage field agent assignments across Kenya's counties, sub-counties, and wards. Each agent can collect up to 1000 research responses in their assigned areas.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Region
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_regions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.covered_regions} fully covered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_agents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_assignments} active assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.covered_regions / stats.total_regions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.partial_regions} partially covered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_completion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all regions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regions">Regional Coverage</TabsTrigger>
          <TabsTrigger value="agents">Agent Management</TabsTrigger>
          <TabsTrigger value="assignments">Active Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Coverage</CardTitle>
              <CardDescription>Manage agent assignments by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search regions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={countyFilter} onValueChange={setCountyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    <SelectItem value="Nairobi">Nairobi</SelectItem>
                    <SelectItem value="Mombasa">Mombasa</SelectItem>
                    <SelectItem value="Kisumu">Kisumu</SelectItem>
                    <SelectItem value="Nakuru">Nakuru</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="covered">Covered</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="uncovered">Uncovered</SelectItem>
                    <SelectItem value="over_assigned">Over Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>Target Households</TableHead>
                      <TableHead>Assigned Agents</TableHead>
                      <TableHead>Coverage Status</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegions.map((region) => (
                      <TableRow key={region.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{region.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {region.sub_county} • {region.ward}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{region.county}</TableCell>
                        <TableCell>{region.population.toLocaleString()}</TableCell>
                        <TableCell>{region.target_households.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{region.assigned_agents}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getCoverageBadge(region.coverage_status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{region.completion_rate.toFixed(1)}%</div>
                            <Progress value={region.completion_rate} className="h-2" />
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
                              <DropdownMenuItem onClick={() => handleRegionAction('view', region)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRegionAction('assign', region)}>
                                <Users className="mr-2 h-4 w-4" />
                                Assign Agent
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRegionAction('edit', region)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Region
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRegionAction('remove', region)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Assignments
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

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>Manage agent assignments and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Regions</TableHead>
                      <TableHead>Performance Score</TableHead>
                      <TableHead>Total Responses</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground">{agent.email}</div>
                            <div className="text-sm text-muted-foreground">{agent.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getAgentStatusBadge(agent.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {agent.assigned_regions.length} regions
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {agent.performance_score > 0 ? `${agent.performance_score}%` : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{agent.total_responses}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(agent.last_activity).toLocaleDateString()}
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Agent
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <MapPin className="mr-2 h-4 w-4" />
                                Assign Region
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

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Assignments</CardTitle>
              <CardDescription>Current agent-region assignments and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Target Responses</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.agent_name}</TableCell>
                        <TableCell>{assignment.region_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(assignment.assigned_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.target_responses}</TableCell>
                        <TableCell>{assignment.completed_responses}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{assignment.completion_rate.toFixed(1)}%</div>
                            <Progress value={assignment.completion_rate} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </Badge>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Assignment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Assignment
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
      </Tabs>

      {/* Assign Agent Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Agent to Region</DialogTitle>
            <DialogDescription>
              {selectedRegion && `Assign an agent to ${selectedRegion.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="agent">Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(a => a.status === 'active').map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - {agent.assigned_regions.length} regions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRegion && (
              <div>
                <Label className="text-sm font-medium">Region Details</Label>
                <div className="mt-1 p-3 bg-muted rounded-md space-y-1">
                  <div className="text-sm"><strong>Name:</strong> {selectedRegion.name}</div>
                  <div className="text-sm"><strong>County:</strong> {selectedRegion.county}</div>
                  <div className="text-sm"><strong>Population:</strong> {selectedRegion.population.toLocaleString()}</div>
                  <div className="text-sm"><strong>Target Households:</strong> {selectedRegion.target_households.toLocaleString()}</div>
                  <div className="text-sm"><strong>Current Agents:</strong> {selectedRegion.assigned_agents}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAgent}>
              Assign Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegionalAssignment;
