import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Users, FileText, BarChart3, Calendar, Target, TrendingUp, Eye } from 'lucide-react';

interface AgentResponseData {
  agent_id: string;
  agent_name: string;
  county: string;
  sub_county: string;
  ward: string;
  total_responses: number;
  validated_responses: number;
  flagged_responses: number;
  quality_score: number;
  daily_responses: Array<{
    date: string;
    responses: number;
  }>;
  survey_breakdown: Array<{
    survey_name: string;
    responses: number;
    completion_rate: number;
  }>;
  location_data: Array<{
    area: string;
    responses: number;
    coordinates: { lat: number; lng: number; };
  }>;
}

interface CountyResponseData {
  county: string;
  total_responses: number;
  total_agents: number;
  completion_rate: number;
  sub_counties: Array<{
    name: string;
    responses: number;
    agents: number;
    completion_rate: number;
  }>;
  agent_performance: Array<{
    agent_name: string;
    responses: number;
    quality_score: number;
  }>;
}

const AgentResponseTracker = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'agent' | 'county'>('agent');

  // Mock data for demonstration
  const mockAgentData: AgentResponseData[] = [
    {
      agent_id: '1',
      agent_name: 'John Doe',
      county: 'Nairobi',
      sub_county: 'Westlands',
      ward: 'Parklands',
      total_responses: 145,
      validated_responses: 138,
      flagged_responses: 7,
      quality_score: 92.5,
      daily_responses: [
        { date: '2024-01-20', responses: 8 },
        { date: '2024-01-19', responses: 12 },
        { date: '2024-01-18', responses: 6 },
        { date: '2024-01-17', responses: 10 },
        { date: '2024-01-16', responses: 9 },
      ],
      survey_breakdown: [
        { survey_name: 'Household Income Survey', responses: 45, completion_rate: 90 },
        { survey_name: 'Education Access Assessment', responses: 38, completion_rate: 85 },
        { survey_name: 'Healthcare Services Evaluation', responses: 32, completion_rate: 88 },
        { survey_name: 'Agricultural Practices Survey', responses: 30, completion_rate: 92 },
      ],
      location_data: [
        { area: 'Parklands Estate', responses: 25, coordinates: { lat: -1.2921, lng: 36.8219 } },
        { area: 'Westlands Business District', responses: 30, coordinates: { lat: -1.2656, lng: 36.8024 } },
        { area: 'Kileleshwa', responses: 20, coordinates: { lat: -1.3119, lng: 36.7806 } },
        { area: 'Lavington', responses: 35, coordinates: { lat: -1.3031, lng: 36.0800 } },
        { area: 'Kilimani', responses: 35, coordinates: { lat: -1.3031, lng: 36.0800 } },
      ]
    },
    {
      agent_id: '2',
      agent_name: 'Jane Smith',
      county: 'Nairobi',
      sub_county: 'Central',
      ward: 'CBD',
      total_responses: 98,
      validated_responses: 92,
      flagged_responses: 6,
      quality_score: 88.2,
      daily_responses: [
        { date: '2024-01-20', responses: 5 },
        { date: '2024-01-19', responses: 8 },
        { date: '2024-01-18', responses: 7 },
        { date: '2024-01-17', responses: 6 },
        { date: '2024-01-16', responses: 9 },
      ],
      survey_breakdown: [
        { survey_name: 'Household Income Survey', responses: 32, completion_rate: 85 },
        { survey_name: 'Education Access Assessment', responses: 28, completion_rate: 82 },
        { survey_name: 'Healthcare Services Evaluation', responses: 25, completion_rate: 88 },
        { survey_name: 'Agricultural Practices Survey', responses: 13, completion_rate: 90 },
      ],
      location_data: [
        { area: 'Central Business District', responses: 40, coordinates: { lat: -1.2921, lng: 36.8219 } },
        { area: 'Upper Hill', responses: 25, coordinates: { lat: -1.2656, lng: 36.8024 } },
        { area: 'Westlands', responses: 33, coordinates: { lat: -1.3119, lng: 36.7806 } },
      ]
    }
  ];

  const mockCountyData: CountyResponseData[] = [
    {
      county: 'Nairobi',
      total_responses: 1250,
      total_agents: 45,
      completion_rate: 85.2,
      sub_counties: [
        { name: 'Westlands', responses: 450, agents: 15, completion_rate: 88.5 },
        { name: 'Central', responses: 380, agents: 12, completion_rate: 82.3 },
        { name: 'Langata', responses: 320, agents: 10, completion_rate: 85.7 },
        { name: 'Dagoretti', responses: 100, agents: 8, completion_rate: 75.2 },
      ],
      agent_performance: [
        { agent_name: 'John Doe', responses: 145, quality_score: 92.5 },
        { agent_name: 'Jane Smith', responses: 98, quality_score: 88.2 },
        { agent_name: 'Peter Kamau', responses: 87, quality_score: 91.3 },
        { agent_name: 'Mary Wanjiku', responses: 76, quality_score: 89.7 },
      ]
    },
    {
      county: 'Mombasa',
      total_responses: 890,
      total_agents: 32,
      completion_rate: 78.5,
      sub_counties: [
        { name: 'Mvita', responses: 320, agents: 12, completion_rate: 82.1 },
        { name: 'Likoni', responses: 280, agents: 10, completion_rate: 75.8 },
        { name: 'Kisauni', responses: 290, agents: 10, completion_rate: 77.3 },
      ],
      agent_performance: [
        { agent_name: 'David Ochieng', responses: 67, quality_score: 87.3 },
        { agent_name: 'Grace Muthoni', responses: 58, quality_score: 91.8 },
        { agent_name: 'James Mutua', responses: 52, quality_score: 86.4 },
      ]
    }
  ];

  const selectedAgentData = mockAgentData.find(agent => agent.agent_id === selectedAgent);
  const selectedCountyData = mockCountyData.find(county => county.county === selectedCounty);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Response Tracking & Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Track responses by agent, county, or geographic area with detailed analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: 'agent' | 'county') => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agent">Agent View</SelectItem>
              <SelectItem value="county">County View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={viewMode} className="space-y-4">
        <TabsList>
          <TabsTrigger value="agent">Agent-Level Tracking</TabsTrigger>
          <TabsTrigger value="county">County-Level Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Response Tracking</CardTitle>
              <CardDescription>Detailed analytics for individual agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {mockAgentData.map((agent) => (
                      <SelectItem key={agent.agent_id} value={agent.agent_id}>
                        {agent.agent_name} - {agent.county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAgentData && (
                <div className="space-y-6">
                  {/* Agent Overview */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAgentData.total_responses}</div>
                        <p className="text-xs text-muted-foreground">
                          {selectedAgentData.validated_responses} validated
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAgentData.quality_score}%</div>
                        <p className="text-xs text-muted-foreground">
                          {selectedAgentData.flagged_responses} flagged
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAgentData.location_data.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {selectedAgentData.county}, {selectedAgentData.sub_county}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAgentData.survey_breakdown.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Survey assignments
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Response Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Response Collection</CardTitle>
                      <CardDescription>Response collection trend over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedAgentData.daily_responses}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="responses" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Survey Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Survey Performance</CardTitle>
                        <CardDescription>Responses by survey type</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={selectedAgentData.survey_breakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ survey_name, responses }) => `${survey_name}: ${responses}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="responses"
                            >
                              {selectedAgentData.survey_breakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Geographic Coverage</CardTitle>
                        <CardDescription>Responses by area/location</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedAgentData.location_data.map((location, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{location.area}</span>
                                <span>{location.responses} responses</span>
                              </div>
                              <Progress value={(location.responses / Math.max(...selectedAgentData.location_data.map(l => l.responses))) * 100} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="county" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>County Response Tracking</CardTitle>
              <CardDescription>Analytics and performance by county</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {mockCountyData.map((county) => (
                      <SelectItem key={county.county} value={county.county}>
                        {county.county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCountyData && (
                <div className="space-y-6">
                  {/* County Overview */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedCountyData.total_responses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Across all sub-counties
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedCountyData.total_agents}</div>
                        <p className="text-xs text-muted-foreground">
                          Deployed agents
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedCountyData.completion_rate}%</div>
                        <p className="text-xs text-muted-foreground">
                          Overall progress
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sub-Counties</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedCountyData.sub_counties.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Coverage areas
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sub-County Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sub-County Performance</CardTitle>
                      <CardDescription>Response collection by sub-county</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={selectedCountyData.sub_counties}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="responses" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Agent Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Agents</CardTitle>
                      <CardDescription>Agent performance within the county</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Agent</TableHead>
                              <TableHead>Responses</TableHead>
                              <TableHead>Quality Score</TableHead>
                              <TableHead>Performance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCountyData.agent_performance.map((agent, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{agent.agent_name}</TableCell>
                                <TableCell>{agent.responses}</TableCell>
                                <TableCell>{agent.quality_score}%</TableCell>
                                <TableCell>
                                  <Progress value={agent.quality_score} className="h-2" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentResponseTracker;

