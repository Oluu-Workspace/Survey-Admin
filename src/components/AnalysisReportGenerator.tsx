import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, MapPin, Target, CheckCircle2, AlertTriangle, BarChart3, Download, FileText, Calendar, Zap, Eye, Filter } from 'lucide-react';
import { SurveyResponse, Question } from './SurveyResponseViewer';

interface AnalysisReportGeneratorProps {
  surveyId: string;
  surveyTitle: string;
  responses: SurveyResponse[];
  questions: Question[];
}

interface AnalysisInsight {
  type: 'trend' | 'correlation' | 'anomaly' | 'pattern';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

const AnalysisReportGenerator = ({ surveyId, surveyTitle, responses, questions }: AnalysisReportGeneratorProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState('all');

  // Filter responses based on selections
  const filteredResponses = useMemo(() => {
    let filtered = responses;
    
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(r => r.county === selectedRegion);
    }
    
    if (selectedQuestion !== 'all') {
      filtered = filtered.filter(r => r.answers[selectedQuestion]);
    }
    
    return filtered;
  }, [responses, selectedRegion, selectedQuestion]);

  // Generate comprehensive insights
  const insights = useMemo((): AnalysisInsight[] => {
    const insights: AnalysisInsight[] = [];
    
    // Response quality trend
    const qualityScores = filteredResponses.map(r => r.quality_score);
    const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    
    if (avgQuality < 80) {
      insights.push({
        type: 'anomaly',
        title: 'Low Data Quality Detected',
        description: `Average quality score is ${avgQuality.toFixed(1)}%, below the 80% threshold. This may indicate issues with data collection or agent training.`,
        impact: 'high',
        recommendation: 'Review agent training materials and implement additional quality checks.'
      });
    }
    
    // Geographic coverage analysis
    const counties = new Set(filteredResponses.map(r => r.county));
    if (counties.size < 5) {
      insights.push({
        type: 'pattern',
        title: 'Limited Geographic Coverage',
        description: `Data collection is concentrated in only ${counties.size} counties, which may limit the representativeness of findings.`,
        impact: 'medium',
        recommendation: 'Consider expanding data collection to additional counties for better coverage.'
      });
    }
    
    // Response rate analysis
    const totalResponses = filteredResponses.length;
    const validatedResponses = filteredResponses.filter(r => r.status === 'validated').length;
    const validationRate = (validatedResponses / totalResponses) * 100;
    
    if (validationRate < 70) {
      insights.push({
        type: 'trend',
        title: 'Low Validation Rate',
        description: `Only ${validationRate.toFixed(1)}% of responses pass validation, indicating potential data quality issues.`,
        impact: 'high',
        recommendation: 'Implement stricter data collection protocols and additional validation checks.'
      });
    }
    
    // Question-specific insights
    if (selectedQuestion !== 'all') {
      const question = questions.find(q => q.id === selectedQuestion);
      if (question) {
        const answers = filteredResponses.map(r => r.answers[selectedQuestion]).filter(Boolean);
        
        if (question.type === 'number') {
          const numericAnswers = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
          if (numericAnswers.length > 0) {
            const avg = numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length;
            const stdDev = Math.sqrt(numericAnswers.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / numericAnswers.length);
            
            if (stdDev > avg * 0.5) {
              insights.push({
                type: 'anomaly',
                title: 'High Variance in Responses',
                description: `Responses to "${question.question}" show high variability (std dev: ${stdDev.toFixed(2)}), which may indicate inconsistent data collection.`,
                impact: 'medium',
                recommendation: 'Review question clarity and provide additional training to agents.'
              });
            }
          }
        }
      }
    }
    
    return insights;
  }, [filteredResponses, selectedQuestion, questions]);

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredResponses.forEach(response => {
      const date = new Date(response.created_at).toISOString().split('T')[0];
      data[date] = (data[date] || 0) + 1;
    });
    
    return Object.entries(data)
      .map(([date, count]) => ({ date, responses: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredResponses]);

  // Generate geographic distribution
  const geographicData = useMemo(() => {
    const countyData: Record<string, { responses: number; avgQuality: number }> = {};
    
    filteredResponses.forEach(response => {
      if (!countyData[response.county]) {
        countyData[response.county] = { responses: 0, avgQuality: 0 };
      }
      countyData[response.county].responses++;
      countyData[response.county].avgQuality += response.quality_score;
    });
    
    return Object.entries(countyData).map(([county, data]) => ({
      county,
      responses: data.responses,
      avgQuality: Math.round((data.avgQuality / data.responses) * 10) / 10
    })).sort((a, b) => b.responses - a.responses);
  }, [filteredResponses]);

  // Generate agent performance data
  const agentPerformance = useMemo(() => {
    const agentData: Record<string, { name: string; responses: number; avgQuality: number; validationRate: number }> = {};
    
    filteredResponses.forEach(response => {
      if (!agentData[response.agent_id]) {
        agentData[response.agent_id] = {
          name: response.agent_name,
          responses: 0,
          avgQuality: 0,
          validationRate: 0
        };
      }
      agentData[response.agent_id].responses++;
      agentData[response.agent_id].avgQuality += response.quality_score;
      if (response.status === 'validated') {
        agentData[response.agent_id].validationRate++;
      }
    });
    
    return Object.values(agentData).map(agent => ({
      ...agent,
      avgQuality: Math.round((agent.avgQuality / agent.responses) * 10) / 10,
      validationRate: Math.round((agent.validationRate / agent.responses) * 100)
    })).sort((a, b) => b.avgQuality - a.avgQuality);
  }, [filteredResponses]);

  // Generate question analysis
  const questionAnalysis = useMemo(() => {
    if (selectedQuestion === 'all') return null;
    
    const question = questions.find(q => q.id === selectedQuestion);
    if (!question) return null;
    
    const answers = filteredResponses.map(r => r.answers[selectedQuestion]).filter(Boolean);
    
    if (question.type === 'number') {
      const numericAnswers = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
      if (numericAnswers.length === 0) return null;
      
      const sorted = numericAnswers.sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const median = sorted[Math.floor(sorted.length * 0.5)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      
      return {
        type: 'number',
        question: question.question,
        total: numericAnswers.length,
        average: numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length,
        median,
        q1,
        q3,
        min: Math.min(...numericAnswers),
        max: Math.max(...numericAnswers),
        histogram: createHistogram(numericAnswers, 10)
      };
    }
    
    if (question.type === 'multiple_choice' || question.type === 'yes_no') {
      const answerCounts: Record<string, number> = {};
      answers.forEach(answer => {
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      });
      
      return {
        type: 'choice',
        question: question.question,
        total: answers.length,
        distribution: Object.entries(answerCounts).map(([answer, count]) => ({
          answer,
          count,
          percentage: Math.round((count / answers.length) * 100)
        })).sort((a, b) => b.count - a.count)
      };
    }
    
    return null;
  }, [selectedQuestion, questions, filteredResponses]);

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

  const getInsightIcon = (type: string) => {
    const icons = {
      trend: TrendingUp,
      correlation: BarChart3,
      anomaly: AlertTriangle,
      pattern: Eye
    } as const;
    
    const Icon = icons[type as keyof typeof icons] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      high: 'text-red-600 bg-red-50', // #DC2626 - Error/High impact
      medium: 'text-amber-600 bg-amber-50', // #F59E0B - Warning/Medium impact
      low: 'text-green-600 bg-green-50' // #10B981 - Success/Low impact
    } as const;
    
    return colors[impact as keyof typeof colors] || colors.medium;
  };

  const COLORS = ['#DC2626', '#2563EB', '#10B981', '#F59E0B', '#6B7280', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analysis Report Generator</h2>
          <p className="text-muted-foreground">
            Generate comprehensive analysis reports with insights and recommendations
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {Array.from(new Set(responses.map(r => r.county))).map(county => (
              <SelectItem key={county} value={county}>{county}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Question Analysis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            {questions.map(question => (
              <SelectItem key={question.id} value={question.id}>
                {question.question}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredResponses.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {responses.length - filteredResponses.length} filtered out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredResponses.length > 0 
                ? Math.round((filteredResponses.filter(r => r.status === 'validated').length / filteredResponses.length) * 100)
                : 0}%
            </div>
            <Progress 
              value={filteredResponses.length > 0 
                ? (filteredResponses.filter(r => r.status === 'validated').length / filteredResponses.length) * 100
                : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredResponses.length > 0
                ? Math.round((filteredResponses.reduce((sum, r) => sum + r.quality_score, 0) / filteredResponses.length) * 10) / 10
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Data quality metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geographic Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geographicData.length}</div>
            <p className="text-xs text-muted-foreground">
              Counties covered
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analysis</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Insights & Recommendations</CardTitle>
              <CardDescription>
                AI-powered analysis of your data with actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${getImpactColor(insight.impact)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                          <p className="text-sm text-blue-800">{insight.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {insights.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Issues Detected</h3>
                    <p className="text-muted-foreground">
                      Your data quality and collection patterns look good!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Collection Trends</CardTitle>
                <CardDescription>Daily response collection over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="responses" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Score Distribution</CardTitle>
                <CardDescription>Distribution of response quality scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { range: '0-20%', count: filteredResponses.filter(r => r.quality_score < 20).length },
                    { range: '20-40%', count: filteredResponses.filter(r => r.quality_score >= 20 && r.quality_score < 40).length },
                    { range: '40-60%', count: filteredResponses.filter(r => r.quality_score >= 40 && r.quality_score < 60).length },
                    { range: '60-80%', count: filteredResponses.filter(r => r.quality_score >= 60 && r.quality_score < 80).length },
                    { range: '80-100%', count: filteredResponses.filter(r => r.quality_score >= 80).length }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Response collection and quality by county</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="county" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="responses" fill="#DC2626" name="Responses" />
                  <Bar yAxisId="right" dataKey="avgQuality" fill="#10B981" name="Avg Quality %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Analysis</CardTitle>
              <CardDescription>Response quality and validation rates by agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{agent.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{agent.responses} responses</span>
                        <span>{agent.validationRate}% validation rate</span>
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

        <TabsContent value="questions" className="space-y-4">
          {questionAnalysis ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{questionAnalysis.question}</CardTitle>
                  <CardDescription>
                    Analysis of {questionAnalysis.total} responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionAnalysis.type === 'number' && (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{Math.round(questionAnalysis.average * 100) / 100}</div>
                          <div className="text-sm text-muted-foreground">Average</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalysis.median}</div>
                          <div className="text-sm text-muted-foreground">Median</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalysis.min}</div>
                          <div className="text-sm text-muted-foreground">Minimum</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalysis.max}</div>
                          <div className="text-sm text-muted-foreground">Maximum</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalysis.q1}</div>
                          <div className="text-sm text-muted-foreground">Q1</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{questionAnalysis.q3}</div>
                          <div className="text-sm text-muted-foreground">Q3</div>
                        </div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={questionAnalysis.histogram}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#DC2626" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {questionAnalysis.type === 'choice' && (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={questionAnalysis.distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ answer, percentage }) => `${answer}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {questionAnalysis.distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
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
                    Choose a specific question from the dropdown above to see detailed analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisReportGenerator;

