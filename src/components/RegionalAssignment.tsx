import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  assigned_regions: string[];
  surveys_completed: number;
  last_active: string;
}

export interface RegionalAssignment {
  id: string;
  survey_id: string;
  survey_title: string;
  agent_id: string;
  agent_name: string;
  county: string;
  constituency?: string;
  ward?: string;
  village?: string;
  target_responses: number;
  current_responses: number;
  status: 'assigned' | 'in_progress' | 'completed';
  assigned_at: string;
  completed_at?: string;
}

interface RegionalAssignmentProps {
  surveyId?: string;
  surveyTitle?: string;
}

const RegionalAssignment = ({ surveyId, surveyTitle }: RegionalAssignmentProps) => {
  const [assignments, setAssignments] = useState<RegionalAssignment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<RegionalAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');

  // Kiambu County data
  const kiambuData = {
    constituencies: [
      { name: 'Gatundu North', wards: ['Gituamba', 'Githobokoni', 'Chania', 'Mang\'u'] },
      { name: 'Gatundu South', wards: ['Kiamwangi', 'Kiganjo', 'Ndarugo', 'Ngenda'] },
      { name: 'Githunguri', wards: ['Githunguri', 'Githiga', 'Ikinu', 'Ngewa', 'Komothai'] },
      { name: 'Juja', wards: ['Murera', 'Theta', 'Juja', 'Witeithie', 'Kalimoni'] },
      { name: 'Kabete', wards: ['Gitaru', 'Muguga', 'Nyathuna', 'Kabete', 'Uthiru'] },
      { name: 'Kiambaa', wards: ['Cianda', 'Karuri', 'Ndenderu', 'Muchatha', 'Kihara'] },
      { name: 'Kiambu', wards: ['Ting\'ang\'a', 'Ndumberi', 'Riabai', 'Township'] },
      { name: 'Kikuyu', wards: ['Karai', 'Nachu', 'Sigona', 'Kikuyu', 'Kinoo'] },
      { name: 'Lari', wards: ['Kinale', 'Kijabe', 'Nyanduma', 'Kamburu', 'Lari/Kirenga'] },
      { name: 'Limuru', wards: ['Bibirioni', 'Limuru Central', 'Ndeiya', 'Limuru East', 'Ngecha/Tigoni'] },
      { name: 'Ruiru', wards: ['Gitothua', 'Biashara', 'Gatongora', 'Kahawa/Sukari', 'Kahawa Wendani', 'Kiuu', 'Mwiki', 'Mwihoko'] },
      { name: 'Thika Town', wards: ['Township', 'Kamenu', 'Hospital', 'Gatuanyaga', 'Ngoliba'] }
    ]
  };

  // Assignment form state
  const [newAssignment, setNewAssignment] = useState({
    survey_id: surveyId || '',
    agent_id: '',
    county: 'Kiambu',
    constituency: '',
    ward: '',
    village: '',
    target_responses: 100
  });

  // Mock data
  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'John Mwangi',
      email: 'john.mwangi@example.com',
      phone: '+254712345678',
      status: 'active',
      assigned_regions: ['Juja', 'Kabete'],
      surveys_completed: 45,
      last_active: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      name: 'Mary Wanjiku',
      email: 'mary.wanjiku@example.com',
      phone: '+254723456789',
      status: 'active',
      assigned_regions: ['Kiambaa', 'Kiambu'],
      surveys_completed: 38,
      last_active: '2024-01-20T09:15:00Z'
    },
    {
      id: '3',
      name: 'Peter Kamau',
      email: 'peter.kamau@example.com',
      phone: '+254734567890',
      status: 'active',
      assigned_regions: ['Githunguri', 'Gatundu North'],
      surveys_completed: 52,
      last_active: '2024-01-20T11:45:00Z'
    }
  ];

  const mockAssignments: RegionalAssignment[] = [
    {
      id: '1',
      survey_id: '1',
      survey_title: 'Household Economic Research 2024',
      agent_id: '1',
      agent_name: 'John Mwangi',
      county: 'Kiambu',
      constituency: 'Juja',
      ward: 'Murera',
      target_responses: 200,
      current_responses: 45,
      status: 'in_progress',
      assigned_at: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      survey_id: '1',
      survey_title: 'Household Economic Research 2024',
      agent_id: '2',
      agent_name: 'Mary Wanjiku',
      county: 'Kiambu',
      constituency: 'Kiambaa',
      ward: 'Cianda',
      target_responses: 150,
      current_responses: 38,
      status: 'in_progress',
      assigned_at: '2024-01-15T08:00:00Z'
    }
  ];

  useEffect(() => {
    setAgents(mockAgents);
    setAssignments(mockAssignments);
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.survey_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.ward.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesCounty = countyFilter === 'all' || assignment.county === countyFilter;
    const matchesAgent = agentFilter === 'all' || assignment.agent_id === agentFilter;
    
    return matchesSearch && matchesStatus && matchesCounty && matchesAgent;
  });

  const getStatusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'bg-green-500 text-white'; // Success - Completed
        case 'in_progress':
          return 'bg-amber-500 text-white'; // Warning - In progress
        case 'assigned':
          return 'bg-gray-500 text-white'; // Neutral - Assigned
        default:
          return 'bg-gray-400 text-white';
      }
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.agent_id || !newAssignment.constituency) {
      toast.error('Please select an agent and constituency');
      return;
    }

    const agent = agents.find(a => a.id === newAssignment.agent_id);
    const assignment: RegionalAssignment = {
      id: `assignment_${Date.now()}`,
      survey_id: newAssignment.survey_id,
      survey_title: surveyTitle || 'Survey Assignment',
      agent_id: newAssignment.agent_id,
      agent_name: agent?.name || '',
      county: newAssignment.county,
      constituency: newAssignment.constituency,
      ward: newAssignment.ward || undefined,
      village: newAssignment.village || undefined,
      target_responses: newAssignment.target_responses,
      current_responses: 0,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    };

    setAssignments([...assignments, assignment]);
    setNewAssignment({
      survey_id: surveyId || '',
      agent_id: '',
      county: 'Kiambu',
      constituency: '',
      ward: '',
      village: '',
      target_responses: 100
    });
    setIsAssignDialogOpen(false);
    toast.success('Assignment created successfully');
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    toast.success('Assignment deleted');
  };

  const stats = {
    total_assignments: assignments.length,
    active_assignments: assignments.filter(a => a.status === 'in_progress').length,
    completed_assignments: assignments.filter(a => a.status === 'completed').length,
    total_responses: assignments.reduce((sum, a) => sum + a.current_responses, 0),
    total_target: assignments.reduce((sum, a) => sum + a.target_responses, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Regional Assignment Management</h3>
          <p className="text-sm text-muted-foreground">
            Assign field agents to specific geographic areas for data collection
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Regional Assignment</DialogTitle>
              <DialogDescription>
                Assign an agent to collect data in a specific geographic area
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="agent">Select Agent</Label>
                <Select value={newAssignment.agent_id} onValueChange={(value) => setNewAssignment({ ...newAssignment, agent_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(agent => agent.status === 'active').map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} - {agent.surveys_completed} surveys completed
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Select value={newAssignment.county} onValueChange={(value) => setNewAssignment({ ...newAssignment, county: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kiambu">Kiambu County</SelectItem>
                    <SelectItem value="Nairobi">Nairobi County</SelectItem>
                    <SelectItem value="Mombasa">Mombasa County</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAssignment.county === 'Kiambu' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="constituency">Constituency *</Label>
                    <Select value={newAssignment.constituency} onValueChange={(value) => setNewAssignment({ ...newAssignment, constituency: value, ward: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select constituency..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kiambuData.constituencies.map((constituency) => (
                          <SelectItem key={constituency.name} value={constituency.name}>
                            {constituency.name} ({constituency.wards.length} wards)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newAssignment.constituency && (
                    <div className="space-y-2">
                      <Label htmlFor="ward">Ward (Optional)</Label>
                      <Select value={newAssignment.ward} onValueChange={(value) => setNewAssignment({ ...newAssignment, ward: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specific ward..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Wards in {newAssignment.constituency}</SelectItem>
                          {kiambuData.constituencies.find(c => c.name === newAssignment.constituency)?.wards.map((ward) => (
                            <SelectItem key={ward} value={ward}>
                              {ward}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="village">Village (Optional)</Label>
                    <Input
                      id="village"
                      placeholder="Enter specific village..."
                      value={newAssignment.village}
                      onChange={(e) => setNewAssignment({ ...newAssignment, village: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="target">Target Responses</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="100"
                  value={newAssignment.target_responses}
                  onChange={(e) => setNewAssignment({ ...newAssignment, target_responses: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment}>
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignment Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_assignments}</div>
            <p className="text-xs text-muted-foreground">
              Active assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_assignments}</div>
            <p className="text-xs text-muted-foreground">
              Currently collecting
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_assignments}</div>
            <p className="text-xs text-muted-foreground">
              Finished assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses Collected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_responses}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total_target} target
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_target > 0 ? Math.round((stats.total_responses / stats.total_target) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Management</CardTitle>
          <CardDescription>Manage agent assignments to geographic regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countyFilter} onValueChange={setCountyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                <SelectItem value="Kiambu">Kiambu</SelectItem>
                <SelectItem value="Nairobi">Nairobi</SelectItem>
                <SelectItem value="Mombasa">Mombasa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Survey</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{assignment.agent_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{assignment.survey_title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {assignment.ward ? `${assignment.ward}, ` : ''}
                          {assignment.constituency}
                        </div>
                        <div className="text-muted-foreground">{assignment.county}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {assignment.current_responses} / {assignment.target_responses}
                        </div>
                        <div className="w-full bg-gray-200 h-2">
                          <div
                            className="bg-red-600 h-2"
                            style={{ width: `${(assignment.current_responses / assignment.target_responses) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((assignment.current_responses / assignment.target_responses) * 100)}% complete
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            // Handle edit
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalAssignment;


