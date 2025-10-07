import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, BarChart3, MapPin, Calendar, Download, Filter, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  responseTrends: Array<{
    date: string;
    responses: number;
    target: number;
  }>;
  regionalData: Array<{
    region: string;
    responses: number;
    completion_rate: number;
    agents: number;
  }>;
  surveyPerformance: Array<{
    survey: string;
    responses: number;
    target: number;
    completion_rate: number;
  }>;
  agentActivity: Array<{
    agent: string;
    responses: number;
    quality_score: number;
    status: string;
  }>;
  categoryBreakdown: Array<{
    category: string;
    value: number;
    color: string;
  }>;
  qualityMetrics: {
    average_score: number;
    flagged_responses: number;
    total_responses: number;
    quality_trend: number;
  };
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Mock data for demonstration
  const mockData: AnalyticsData = {
    responseTrends: [
      { date: '2024-01-01', responses: 45, target: 50 },
      { date: '2024-01-02', responses: 52, target: 50 },
      { date: '2024-01-03', responses: 48, target: 50 },
      { date: '2024-01-04', responses: 61, target: 50 },
      { date: '2024-01-05', responses: 55, target: 50 },
      { date: '2024-01-06', responses: 67, target: 50 },
      { date: '2024-01-07', responses: 73, target: 50 },
      { date: '2024-01-08', responses: 58, target: 50 },
      { date: '2024-01-09', responses: 64, target: 50 },
      { date: '2024-01-10', responses: 71, target: 50 },
      { date: '2024-01-11', responses: 69, target: 50 },
      { date: '2024-01-12', responses: 76, target: 50 },
      { date: '2024-01-13', responses: 82, target: 50 },
      { date: '2024-01-14', responses: 79, target: 50 },
      { date: '2024-01-15', responses: 85, target: 50 },
      { date: '2024-01-16', responses: 88, target: 50 },
      { date: '2024-01-17', responses: 91, target: 50 },
      { date: '2024-01-18', responses: 87, target: 50 },
      { date: '2024-01-19', responses: 94, target: 50 },
      { date: '2024-01-20', responses: 96, target: 50 },
      { date: '2024-01-21', responses: 89, target: 50 },
      { date: '2024-01-22', responses: 92, target: 50 },
      { date: '2024-01-23', responses: 98, target: 50 },
      { date: '2024-01-24', responses: 95, target: 50 },
      { date: '2024-01-25', responses: 101, target: 50 },
      { date: '2024-01-26', responses: 103, target: 50 },
      { date: '2024-01-27', responses: 97, target: 50 },
      { date: '2024-01-28', responses: 105, target: 50 },
      { date: '2024-01-29', responses: 108, target: 50 },
      { date: '2024-01-30', responses: 112, target: 50 }
    ],
    regionalData: [
      { region: 'Nairobi', responses: 1250, completion_rate: 85.2, agents: 45 },
      { region: 'Mombasa', responses: 890, completion_rate: 78.5, agents: 32 },
      { region: 'Kisumu', responses: 756, completion_rate: 82.1, agents: 28 },
      { region: 'Nakuru', responses: 634, completion_rate: 75.8, agents: 25 },
      { region: 'Eldoret', responses: 523, completion_rate: 79.3, agents: 22 },
      { region: 'Meru', responses: 445, completion_rate: 73.2, agents: 18 },
      { region: 'Thika', responses: 398, completion_rate: 81.7, agents: 16 },
      { region: 'Malindi', responses: 312, completion_rate: 76.4, agents: 14 }
    ],
    surveyPerformance: [
      { survey: 'Household Income Survey', responses: 756, target: 1000, completion_rate: 75.6 },
      { survey: 'Education Access Assessment', responses: 432, target: 800, completion_rate: 54.0 },
      { survey: 'Healthcare Services Evaluation', responses: 298, target: 600, completion_rate: 49.7 },
      { survey: 'Agricultural Practices Survey', responses: 500, target: 500, completion_rate: 100.0 },
      { survey: 'Water Access and Quality', responses: 0, target: 400, completion_rate: 0.0 }
    ],
    agentActivity: [
      { agent: 'John Doe', responses: 45, quality_score: 92.5, status: 'active' },
      { agent: 'Jane Smith', responses: 38, quality_score: 88.2, status: 'active' },
      { agent: 'Peter Kamau', responses: 42, quality_score: 95.1, status: 'active' },
      { agent: 'Mary Wanjiku', responses: 35, quality_score: 89.7, status: 'active' },
      { agent: 'David Ochieng', responses: 31, quality_score: 87.3, status: 'active' },
      { agent: 'Grace Muthoni', responses: 28, quality_score: 91.8, status: 'active' },
      { agent: 'James Mutua', responses: 33, quality_score: 86.4, status: 'active' },
      { agent: 'Sarah Njeri', responses: 29, quality_score: 93.2, status: 'active' }
    ],
    categoryBreakdown: [
      { category: 'Economic', value: 35, color: '#8884d8' },
      { category: 'Education', value: 25, color: '#82ca9d' },
      { category: 'Health', value: 20, color: '#ffc658' },
      { category: 'Agriculture', value: 15, color: '#ff7300' },
      { category: 'Infrastructure', value: 5, color: '#00ff00' }
    ],
    qualityMetrics: {
      average_score: 89.2,
      flagged_responses: 23,
      total_responses: 1986,
      quality_trend: 2.3
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange, selectedRegion]);

  const handleExport = () => {
    toast.success('Analytics data exported successfully');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and performance metrics.
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Data Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analyze field research data collected by agents across Kenya. Generate insights for evidence-based decision making and policy development.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.qualityMetrics.total_responses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.qualityMetrics.average_score}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{data.qualityMetrics.quality_trend}%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Responses</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.qualityMetrics.flagged_responses}</div>
            <p className="text-xs text-muted-foreground">
              {((data.qualityMetrics.flagged_responses / data.qualityMetrics.total_responses) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.regionalData.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.regionalData.reduce((sum, r) => sum + r.agents, 0)} total agents
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Response Trends</TabsTrigger>
          <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
          <TabsTrigger value="surveys">Survey Performance</TabsTrigger>
          <TabsTrigger value="agents">Agent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Trends</CardTitle>
                <CardDescription>Daily response collection over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.responseTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="responses" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="target" stroke="#ff7300" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Categories</CardTitle>
                <CardDescription>Distribution of responses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, value }) => `${category}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Collection Trends</CardTitle>
              <CardDescription>Daily response collection vs targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.responseTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="responses" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="target" stroke="#ff7300" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance</CardTitle>
              <CardDescription>Response collection and completion rates by region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.regionalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Region</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.regionalData.map((region) => (
                  <div key={region.region} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{region.region}</span>
                      <span>{region.completion_rate}%</span>
                    </div>
                    <Progress value={region.completion_rate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.regionalData.map((region) => (
                  <div key={region.region} className="flex justify-between items-center">
                    <span className="text-sm">{region.region}</span>
                    <Badge variant="outline">{region.agents} agents</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Survey Performance</CardTitle>
              <CardDescription>Response collection progress by survey</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.surveyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="survey" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#8884d8" />
                  <Bar dataKey="target" fill="#ff7300" fillOpacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Survey Completion Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.surveyPerformance.map((survey) => (
                <div key={survey.survey} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{survey.survey}</span>
                    <span>{survey.completion_rate}%</span>
                  </div>
                  <Progress value={survey.completion_rate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {survey.responses} / {survey.target} responses
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Response collection and quality scores by agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.agentActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#8884d8" />
                  <Bar dataKey="quality_score" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Quality Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.agentActivity.map((agent) => (
                <div key={agent.agent} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{agent.agent}</span>
                    <div className="flex gap-2">
                      <span>{agent.quality_score}%</span>
                      <Badge variant={agent.quality_score >= 90 ? 'default' : agent.quality_score >= 80 ? 'secondary' : 'destructive'}>
                        {agent.quality_score >= 90 ? 'Excellent' : agent.quality_score >= 80 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={agent.quality_score} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {agent.responses} responses collected
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
