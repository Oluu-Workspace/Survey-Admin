import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardAPI, agentsAPI, responsesAPI } from '@/services/api';
import { Users, FileText, BarChart3, TrendingUp, MapPin, CheckCircle2, Activity, Clock, Wifi, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardStats } from '@/types';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, agentsData, responsesData] = await Promise.all([
          dashboardAPI.getStats(),
          agentsAPI.getAll(),
          responsesAPI.getAll()
        ]);
        
        setStats(statsData);
        setAgents(agentsData.agents || agentsData || []);
        setResponses(responsesData.responses || responsesData || []);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        // Mock data for demo
        setStats({
          total_agents: 156,
          active_agents: 142,
          total_surveys: 23,
          active_surveys: 8,
          total_responses: 4521,
          today_responses: 87,
        });
        
        // Mock agents data
        setAgents([
          { id: '1', first_name: 'John', last_name: 'Doe', status: 'active', county: 'Nairobi', is_online: true },
          { id: '2', first_name: 'Jane', last_name: 'Smith', status: 'pending', county: 'Kiambu', is_online: false },
          { id: '3', first_name: 'Peter', last_name: 'Kamau', status: 'active', county: 'Mombasa', is_online: true },
        ]);
        
        // Mock responses data
        setResponses([
          { id: '1', agent_name: 'John Doe', county: 'Nairobi', status: 'valid', created_at: '2024-01-15' },
          { id: '2', agent_name: 'Jane Smith', county: 'Kiambu', status: 'flagged', created_at: '2024-01-14' },
          { id: '3', agent_name: 'Peter Kamau', county: 'Mombasa', status: 'valid', created_at: '2024-01-13' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const recentSubmissions = responses.slice(0, 5);
  const pendingAgents = agents.filter((a) => a.status === 'pending');
  const onlineAgents = agents.filter((a) => a.is_online);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Research Data Collection Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor field data collection from agents across Kenya's counties, sub-counties, and wards. Analyze research responses for evidence-based decision making.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{stats?.total_agents || agents.length}</p>
                <p className="text-xs text-green-600">
                  {stats?.active_agents || agents.filter(a => a.status === 'active').length} active
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
      </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Surveys</p>
                <p className="text-2xl font-bold">{stats?.active_surveys || 0}</p>
                <p className="text-xs text-blue-600">{stats?.total_surveys || 0} total</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats?.total_responses || responses.length}</p>
                <p className="text-xs text-yellow-600">
                  {responses.filter(s => s.status === 'flagged').length} flagged
                  </p>
                </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Data Quality</p>
                <p className="text-2xl font-bold">94.2%</p>
                <p className="text-xs text-green-600">+2.1% this week</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAgents.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Agent Approvals</p>
                  <p className="text-xs text-muted-foreground">{pendingAgents.length} agents waiting</p>
                </div>
                <Link to="/dashboard/agents">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            {responses.filter(s => s.status === 'flagged').length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Flagged Data</p>
                  <p className="text-xs text-muted-foreground">
                    {responses.filter(s => s.status === 'flagged').length} submissions need review
                  </p>
                </div>
                <Link to="/dashboard/data">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="font-medium text-sm">System Backup</p>
                <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
              </div>
              <Button size="sm" variant="outline">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Online Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-600" />
              Online Agents ({onlineAgents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onlineAgents.slice(0, 4).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {agent.first_name} {agent.last_name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{agent.county}</span>
                </div>
              ))}
              {onlineAgents.length > 4 && (
                <Link to="/dashboard/agents">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View all {onlineAgents.length} online agents
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{submission.agent_name || 'Unknown Agent'}</p>
                    <p className="text-xs text-muted-foreground">{submission.county || 'Unknown County'}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        submission.status === 'valid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : submission.status === 'flagged'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }
                    >
                      {submission.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              <Link to="/dashboard/data">
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View all submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(
              responses.reduce((acc, submission) => {
                const county = submission.county || 'Unknown';
                acc[county] = (acc[county] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([county, count]) => (
              <div key={county} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{county}</p>
                    <p className="text-sm text-muted-foreground">
                      {agents.filter((a) => a.county === county).length} agents
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">submissions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
