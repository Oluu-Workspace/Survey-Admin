import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MapPin, Target, CheckCircle2, AlertTriangle, BarChart3, Download } from 'lucide-react';
import { SurveyResponse, Question } from './SurveyResponseViewer';

interface ResponseAnalyticsProps {
  surveyId: string;
  surveyTitle: string;
  responses: SurveyResponse[];
  questions: Question[];
}

const ResponseAnalytics = ({ surveyId, surveyTitle, responses, questions }: ResponseAnalyticsProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('all');
  const [selectedCounty, setSelectedCounty] = useState<string>('all');

  // Filter responses based on selected filters
  const filteredResponses = useMemo(() => {
    return responses.filter(response => {
      const matchesCounty = selectedCounty === 'all' || response.county === selectedCounty;
      return matchesCounty;
    });
  }, [responses, selectedCounty]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const total = filteredResponses.length;
    const validated = filteredResponses.filter(r => r.status === 'validated').length;
    const flagged = filteredResponses.filter(r => r.status === 'flagged').length;
    const rejected = filteredResponses.filter(r => r.status === 'rejected').length;
    const avgQuality = total > 0 ? filteredResponses.reduce((sum, r) => sum + r.quality_score, 0) / total : 0;
    
    return {
      total,
      validated,
      flagged,
      rejected,
      validationRate: total > 0 ? (validated / total) * 100 : 0,
      avgQuality: Math.round(avgQuality * 10) / 10
    };
  }, [filteredResponses]);

  // Agent performance analysis
  const agentPerformance = useMemo(() => {
    const agentStats: Record<string, {
      name: string;
      totalResponses: number;
      validatedResponses: number;
      avgQuality: number;
      counties: Set<string>;
    }> = {};

    filteredResponses.forEach(response => {
      if (!agentStats[response.agent_id]) {
        agentStats[response.agent_id] = {
          name: response.agent_name,
          totalResponses: 0,
          validatedResponses: 0,
          avgQuality: 0,
          counties: new Set()
        };
      }
      
      agentStats[response.agent_id].totalResponses++;
      agentStats[response.agent_id].counties.add(response.county);
      
      if (response.status === 'validated') {
        agentStats[response.agent_id].validatedResponses++;
      }
      
      agentStats[response.agent_id].avgQuality += response.quality_score;
    });

    // Calculate averages
    Object.values(agentStats).forEach(agent => {
      agent.avgQuality = Math.round((agent.avgQuality / agent.totalResponses) * 10) / 10;
    });

    return Object.values(agentStats).sort((a, b) => b.avgQuality - a.avgQuality);
  }, [filteredResponses]);

  // Geographic distribution
  const geographicData = useMemo(() => {
    const countyStats: Record<string, { name: string; responses: number; avgQuality: number }> = {};
    
    filteredResponses.forEach(response => {
      if (!countyStats[response.county]) {
        countyStats[response.county] = {
          name: response.county,
          responses: 0,
          avgQuality: 0
        };
      }
      
      countyStats[response.county].responses++;
      countyStats[response.county].avgQuality += response.quality_score;
    });

    // Calculate averages
    Object.values(countyStats).forEach(county => {
      county.avgQuality = Math.round((county.avgQuality / county.responses) * 10) / 10;
    });

    return Object.values(countyStats).sort((a, b) => b.responses - a.responses);
  }, [filteredResponses]);

  // Question-specific analysis
  const questionAnalytics = useMemo(() => {
    if (selectedQuestion === 'all') return null;

    const question = questions.find(q => q.id === selectedQuestion);
    if (!question) return null;

    const answers = filteredResponses.map(r => r.answers[selectedQuestion]).filter(Boolean);
    
    if (question.type === 'number') {
      const numericAnswers = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
      if (numericAnswers.length === 0) return null;
      
      const sum = numericAnswers.reduce((a, b) => a + b, 0);
      const avg = sum / numericAnswers.length;
      const min = Math.min(...numericAnswers);
      const max = Math.max(...numericAnswers);
      
      // Create histogram data
      const histogram = createHistogram(numericAnswers, 10);
      
      return {
        type: 'number',
        question: question.question,
        total: numericAnswers.length,
        average: Math.round(avg * 100) / 100,
        min,
        max,
        histogram
      };
    }
    
    if (question.type === 'multiple_choice' || question.type === 'yes_no') {
      const answerCounts: Record<string, number> = {};
      answers.forEach(answer => {
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      });
      
      const pieData = Object.entries(answerCounts).map(([answer, count]) => ({
        name: answer,
        value: count,
        percentage: Math.round((count / answers.length) * 100)
      }));
      
      return {
        type: 'choice',
        question: question.question,
        total: answers.length,
        distribution: pieData
      };
    }
    
    if (question.type === 'rating') {
      const numericAnswers = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
      if (numericAnswers.length === 0) return null;
      
      const avg = numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length;
      const ratingCounts: Record<number, number> = {};
      
      numericAnswers.forEach(rating => {
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      });
      
      const barData = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: Math.round((count / numericAnswers.length) * 100)
      })).sort((a, b) => a.rating - b.rating);
      
      return {
        type: 'rating',
        question: question.question,
        total: numericAnswers.length,
        average: Math.round(avg * 100) / 100,
        distribution: barData
      };
    }
    
    return null;
  }, [selectedQuestion, questions, filteredResponses]);

  // Helper function to create histogram
  const createHistogram = (values: number[], bins: number) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    
    const histogram: Record<string, number> = {};
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const binLabel = `${Math.round(binStart)}-${Math.round(binEnd)}`;
      histogram[binLabel] = 0;
    }
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      const binStart = min + binIndex * binSize;
      const binEnd = min + (binIndex + 1) * binSize;
      const binLabel = `${Math.round(binStart)}-${Math.round(binEnd)}`;
      histogram[binLabel]++;
    });
    
    return Object.entries(histogram).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / values.length) * 100)
    }));
  };

  const COLORS = ['#DC2626', '#2563EB', '#10B981', '#F59E0B', '#6B7280', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Response Analytics</h2>
          <p className="text-muted-foreground">
            Analyze responses collected by field agents for "{surveyTitle}"
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedCounty} onValueChange={setSelectedCounty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {Array.from(new Set(responses.map(r => r.county))).map(county => (
              <SelectItem key={county} value={county}>{county}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Analyze Specific Question" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions Overview</SelectItem>
            {questions.map(question => (
              <SelectItem key={question.id} value={question.id}>
                {question.question}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {agentPerformance.length} agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.validationRate.toFixed(1)}%</div>
            <Progress value={overallStats.validationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgQuality}%</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.flagged} flagged, {overallStats.rejected} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Counties Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geographicData.length}</div>
            <p className="text-xs text-muted-foreground">
              Geographic coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              Field data collectors
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Response Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Response Status Distribution</CardTitle>
                <CardDescription>Breakdown of response validation status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Validated', value: overallStats.validated, color: '#10B981' },
                        { name: 'Flagged', value: overallStats.flagged, color: '#F59E0B' },
                        { name: 'Rejected', value: overallStats.rejected, color: '#DC2626' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Validated', value: overallStats.validated, color: '#10B981' },
                        { name: 'Flagged', value: overallStats.flagged, color: '#F59E0B' },
                        { name: 'Rejected', value: overallStats.rejected, color: '#DC2626' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Responses by County</CardTitle>
                <CardDescription>Geographic distribution of responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographicData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#DC2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {questionAnalytics ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{questionAnalytics.question}</CardTitle>
                  <CardDescription>
                    Analysis of {questionAnalytics.total} responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionAnalytics.type === 'number' && (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalytics.average}</div>
                          <div className="text-sm text-muted-foreground">Average</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalytics.min}</div>
                          <div className="text-sm text-muted-foreground">Minimum</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalytics.max}</div>
                          <div className="text-sm text-muted-foreground">Maximum</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalytics.total}</div>
                          <div className="text-sm text-muted-foreground">Total Responses</div>
                        </div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={questionAnalytics.histogram}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#DC2626" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {questionAnalytics.type === 'choice' && (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={questionAnalytics.distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {questionAnalytics.distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {questionAnalytics.type === 'rating' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{questionAnalytics.average}/10</div>
                        <div className="text-sm text-muted-foreground">Average Rating</div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={questionAnalytics.distribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Select a Question to Analyze</h3>
                  <p className="text-muted-foreground">
                    Choose a specific question from the dropdown above to see detailed analysis of agent responses.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Analysis</CardTitle>
              <CardDescription>Response quality and quantity by field agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <Badge variant="outline">
                          {agent.counties.size} counties
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{agent.totalResponses} responses</span>
                        <span>{agent.validatedResponses} validated</span>
                        <span>{Math.round((agent.validatedResponses / agent.totalResponses) * 100)}% validation rate</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{agent.avgQuality}%</div>
                      <div className="text-sm text-muted-foreground">Quality Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Response Analysis</CardTitle>
              <CardDescription>Response distribution and quality by county</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geographicData.map((county, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{county.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {county.responses} responses collected
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{county.avgQuality}%</div>
                      <div className="text-sm text-muted-foreground">Avg Quality</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResponseAnalytics;