import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { agentsAPI } from '@/services/api';
import {
  Search,
  Plus,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Pause,
  Users,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended' | 'deactivated';
  county: string;
  subcounty?: string;
  ward?: string;
  village?: string;
  is_online: boolean;
  surveys_completed?: number;
  last_active?: string;
  created_at?: string;
}

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await agentsAPI.getAll();
        setAgents(data.agents || data || []);
      } catch (error) {
        toast.error('Failed to load agents');
        // Mock data for demo
        setAgents([
          {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+254712345678',
            status: 'active',
            county: 'Nairobi',
            subcounty: 'Westlands',
            ward: 'Parklands',
            village: 'Highridge',
            is_online: true,
            surveys_completed: 45,
            last_active: '2024-01-15T10:30:00Z',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+254712345679',
            status: 'pending',
            county: 'Kiambu',
            subcounty: 'Thika',
            ward: 'Township',
            village: 'Central',
            is_online: false,
            surveys_completed: 0,
            last_active: '2024-01-14T15:20:00Z',
            created_at: '2024-01-10T00:00:00Z'
          },
          {
            id: '3',
            first_name: 'Peter',
            last_name: 'Kamau',
            email: 'peter.kamau@example.com',
            phone: '+254712345680',
            status: 'active',
            county: 'Mombasa',
            subcounty: 'Mvita',
            ward: 'Old Town',
            village: 'Kibokoni',
            is_online: true,
            surveys_completed: 32,
            last_active: '2024-01-15T14:45:00Z',
            created_at: '2024-01-05T00:00:00Z'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.county.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (agentId: string, newStatus: Agent['status']) => {
    try {
      if (newStatus === 'active') {
        await agentsAPI.activate(agentId);
      } else if (newStatus === 'suspended') {
        await agentsAPI.deactivate(agentId);
      }
      
      setAgents((prev) => prev.map((agent) => 
        agent.id === agentId ? { ...agent, status: newStatus } : agent
      ));
      toast.success(`Agent status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
      suspended: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400',
      deactivated: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return variants[status];
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Eye className="h-4 w-4" />;
      case 'suspended':
        return <Pause className="h-4 w-4" />;
      case 'deactivated':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    pending: agents.filter((a) => a.status === 'pending').length,
    online: agents.filter((a) => a.is_online).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agent Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage field agents and their assignments across Kenya.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <UserX className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold text-blue-600">{stats.online}</p>
              </div>
              <Wifi className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="agent@example.com" />
              </div>
              <div>
                <Label htmlFor="county">County Assignment</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nairobi">Nairobi</SelectItem>
                    <SelectItem value="kiambu">Kiambu</SelectItem>
                    <SelectItem value="mombasa">Mombasa</SelectItem>
                    <SelectItem value="kisumu">Kisumu</SelectItem>
                    <SelectItem value="nakuru">Nakuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea id="message" placeholder="Welcome to our research team..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowInviteDialog(false)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Field Agents ({filteredAgents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Performance</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {agent.first_name[0]}{agent.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{agent.first_name} {agent.last_name}</div>
                          <div className="text-sm text-muted-foreground">ID: {agent.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{agent.email}</div>
                        <div className="text-muted-foreground">{agent.phone}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{agent.county}</div>
                        <div className="text-muted-foreground">
                          {agent.subcounty}, {agent.ward}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusBadge(agent.status)} flex items-center gap-1`}>
                          {getStatusIcon(agent.status)}
                          {agent.status}
                        </Badge>
                        {agent.is_online ? (
                          <Wifi className="h-4 w-4 text-green-500" title="Online" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-muted-foreground" title="Offline" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="font-medium">{agent.surveys_completed || 0} surveys</div>
                        <div className="text-muted-foreground">
                          Last active: {agent.last_active ? new Date(agent.last_active).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {agent.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(agent.id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        )}
                        {agent.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(agent.id, 'suspended')}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Suspend
                          </Button>
                        )}
                        {agent.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(agent.id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Reactivate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedAgent(agent)}>
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Agent Details Dialog */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agent Details: {selectedAgent.first_name} {selectedAgent.last_name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Information</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Email: {selectedAgent.email}</div>
                  <div>Phone: {selectedAgent.phone || 'Not provided'}</div>
                </div>
              </div>
              <div>
                <Label>Assignment</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>County: {selectedAgent.county}</div>
                  <div>Sub-county: {selectedAgent.subcounty || 'Not specified'}</div>
                  <div>Ward: {selectedAgent.ward || 'Not specified'}</div>
                  <div>Village: {selectedAgent.village || 'Not specified'}</div>
                </div>
              </div>
              <div>
                <Label>Status & Activity</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    Status: <Badge className={getStatusBadge(selectedAgent.status)}>{selectedAgent.status}</Badge>
                  </div>
                  <div>Online: {selectedAgent.is_online ? 'Yes' : 'No'}</div>
                  <div>Registered: {selectedAgent.created_at ? new Date(selectedAgent.created_at).toLocaleDateString() : 'Unknown'}</div>
                  <div>Last Active: {selectedAgent.last_active ? new Date(selectedAgent.last_active).toLocaleDateString() : 'Never'}</div>
                </div>
              </div>
              <div>
                <Label>Performance</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Surveys Completed: {selectedAgent.surveys_completed || 0}</div>
                  <div>Success Rate: 94%</div>
                  <div>Data Quality Score: 8.7/10</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Agents;
