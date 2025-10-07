import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, MapPin, Users, BarChart3, PieChart as PieChartIcon,
  AlertTriangle, CheckCircle2, Target, Calendar, Filter
} from 'lucide-react';

export interface SurveyResponse {
  id: string;
  survey_id: string;
  agent_id: string;
  agent_name: string;
  respondent_id: string;
  county: string;
  sub_county: string;
  ward: string;
  area: string;
  answers: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  created_at: string;
  quality_score: number;
  status: 'submitted' | 'validated' | 'flagged' | 'rejected';
}

export interface Question {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'location' | 'date' | 'number' | 'yes_no' | 'dropdown' | 'checkbox' | 'email' | 'phone';
  question: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[];
  min_value?: number;
  max_value?: number;
  placeholder?: string;
}

interface ComparativeInsightsProps {
  surveyId: string;
  surveyTitle: string;
  responses: SurveyResponse[];
  questions: Question[];
}

const ComparativeInsights = ({ surveyId, surveyTitle, responses, questions }: ComparativeInsightsProps) => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['all']);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(['all']);
  const [comparisonType, setComparisonType] = useState<'county' | 'constituency' | 'ward'>('county');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month');

  // Color palette for charts
  const COLORS = ['#DC2626', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

  // Process data for regional comparisons
  const regionalData = useMemo(() => {
    const regions = new Map<string, {
      name: string;
      responses: SurveyResponse[];
      totalResponses: number;
      avgQuality: number;
      completionRate: number;
      demographics: Record<string, any>;
      questionStats: Record<string, any>;
    }>();

    responses.forEach(response => {
      const regionKey = comparisonType === 'county' ? response.county :
                       comparisonType === 'constituency' ? response.sub_county :
                       response.ward;

      if (!regions.has(regionKey)) {
        regions.set(regionKey, {
          name: regionKey,
          responses: [],
          totalResponses: 0,
          avgQuality: 0,
          completionRate: 0,
          demographics: {},
          questionStats: {}
        });
      }

      const region = regions.get(regionKey)!;
      region.responses.push(response);
      region.totalResponses++;
    });

    // Calculate statistics for each region
    regions.forEach(region => {
      if (region.responses.length > 0) {
        region.avgQuality = region.responses.reduce((sum, r) => sum + r.quality_score, 0) / region.responses.length;
        region.completionRate = (region.responses.filter(r => r.status === 'validated').length / region.responses.length) * 100;

        // Analyze demographics
        region.demographics = analyzeDemographics(region.responses);
        
        // Analyze question responses
        region.questionStats = analyzeQuestionResponses(region.responses, questions);
      }
    });

    return Array.from(regions.values()).sort((a, b) => b.totalResponses - a.totalResponses);
  }, [responses, comparisonType, questions]);

  // Analyze demographic data
  const analyzeDemographics = (regionResponses: SurveyResponse[]) => {
    const demographics = {
      ageGroups: { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 },
      gender: { 'Male': 0, 'Female': 0, 'Other': 0 },
      education: { 'Primary': 0, 'Secondary': 0, 'Tertiary': 0, 'University': 0 },
      employment: { 'Employed': 0, 'Unemployed': 0, 'Self-employed': 0, 'Student': 0 }
    };

    regionResponses.forEach(response => {
      // Age analysis (assuming age is in answers)
      const age = parseInt(response.answers.age || response.answers.q_age || '0');
      if (age >= 18 && age <= 25) demographics.ageGroups['18-25']++;
      else if (age >= 26 && age <= 35) demographics.ageGroups['26-35']++;
      else if (age >= 36 && age <= 45) demographics.ageGroups['36-45']++;
      else if (age >= 46 && age <= 55) demographics.ageGroups['46-55']++;
      else if (age > 55) demographics.ageGroups['56+']++;

      // Gender analysis
      const gender = response.answers.gender || response.answers.q_gender || '';
      if (gender.toLowerCase().includes('male')) demographics.gender['Male']++;
      else if (gender.toLowerCase().includes('female')) demographics.gender['Female']++;
      else if (gender) demographics.gender['Other']++;

      // Education analysis
      const education = response.answers.education || response.answers.q_education || '';
      if (education.toLowerCase().includes('primary')) demographics.education['Primary']++;
      else if (education.toLowerCase().includes('secondary')) demographics.education['Secondary']++;
      else if (education.toLowerCase().includes('tertiary')) demographics.education['Tertiary']++;
      else if (education.toLowerCase().includes('university')) demographics.education['University']++;

      // Employment analysis
      const employment = response.answers.employment || response.answers.q_employment || '';
      if (employment.toLowerCase().includes('employed')) demographics.employment['Employed']++;
      else if (employment.toLowerCase().includes('unemployed')) demographics.employment['Unemployed']++;
      else if (employment.toLowerCase().includes('self')) demographics.employment['Self-employed']++;
      else if (employment.toLowerCase().includes('student')) demographics.employment['Student']++;
    });

    return demographics;
  };

  // Analyze question responses by region
  const analyzeQuestionResponses = (regionResponses: SurveyResponse[], questions: Question[]) => {
    const questionStats: Record<string, any> = {};

    questions.forEach(question => {
      const responses = regionResponses.map(r => r.answers[question.id]).filter(Boolean);
      
      if (question.type === 'multiple_choice' || question.type === 'dropdown') {
        const options = question.options || [];
        const distribution = options.reduce((acc, option) => {
          acc[option] = responses.filter(r => r === option).length;
          return acc;
        }, {} as Record<string, number>);
        
        questionStats[question.id] = {
          type: 'categorical',
          distribution,
          total: responses.length
        };
      } else if (question.type === 'rating' || question.type === 'number') {
        const numericResponses = responses.map(r => parseFloat(r)).filter(r => !isNaN(r));
        if (numericResponses.length > 0) {
          questionStats[question.id] = {
            type: 'numeric',
            average: numericResponses.reduce((sum, r) => sum + r, 0) / numericResponses.length,
            min: Math.min(...numericResponses),
            max: Math.max(...numericResponses),
            median: numericResponses.sort((a, b) => a - b)[Math.floor(numericResponses.length / 2)],
            total: numericResponses.length
          };
        }
      } else if (question.type === 'yes_no') {
        const yesCount = responses.filter(r => r.toLowerCase() === 'yes').length;
        const noCount = responses.filter(r => r.toLowerCase() === 'no').length;
        
        questionStats[question.id] = {
          type: 'binary',
          yes: yesCount,
          no: noCount,
          total: responses.length
        };
      }
    });

    return questionStats;
  };

  // Generate insights and recommendations
  const generateInsights = () => {
    const insights = [];
    
    // Regional performance insights
    const topRegion = regionalData[0];
    const bottomRegion = regionalData[regionalData.length - 1];
    
    if (topRegion && bottomRegion) {
      insights.push({
        type: 'performance',
        title: 'Regional Performance Gap',
        description: `${topRegion.name} leads with ${topRegion.totalResponses} responses (${topRegion.avgQuality.toFixed(1)}% quality), while ${bottomRegion.name} has only ${bottomRegion.totalResponses} responses (${bottomRegion.avgQuality.toFixed(1)}% quality).`,
        impact: 'high',
        recommendation: 'Consider reallocating resources to improve coverage in underperforming regions.'
      });
    }

    // Quality insights
    const avgQuality = regionalData.reduce((sum, r) => sum + r.avgQuality, 0) / regionalData.length;
    const lowQualityRegions = regionalData.filter(r => r.avgQuality < avgQuality * 0.8);
    
    if (lowQualityRegions.length > 0) {
      insights.push({
        type: 'quality',
        title: 'Quality Concerns',
        description: `${lowQualityRegions.length} regions have quality scores below 80% of the average.`,
        impact: 'medium',
        recommendation: 'Provide additional training to agents in these regions or review data collection protocols.'
      });
    }

    // Demographic insights
    const totalResponses = regionalData.reduce((sum, r) => sum + r.totalResponses, 0);
    if (totalResponses > 100) {
      insights.push({
        type: 'demographics',
        title: 'Demographic Representation',
        description: 'Analyze demographic distribution to ensure representative sampling across all regions.',
        impact: 'medium',
        recommendation: 'Review sampling strategy to ensure balanced representation of all demographic groups.'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Prepare chart data
  const responseChartData = regionalData.map((region, index) => ({
    region: region.name,
    responses: region.totalResponses,
    quality: region.avgQuality,
    completion: region.completionRate,
    color: COLORS[index % COLORS.length]
  }));

  const qualityChartData = regionalData.map((region, index) => ({
    region: region.name,
    quality: region.avgQuality,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Comparative Regional Insights</h3>
          <p className="text-sm text-muted-foreground">
            Analyze and compare survey data across different regions and demographics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={comparisonType} onValueChange={(value: 'county' | 'constituency' | 'ward') => setComparisonType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="county">By County</SelectItem>
              <SelectItem value="constituency">By Constituency</SelectItem>
              <SelectItem value="ward">By Ward</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter' | 'all') => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
              {insight.impact === 'high' ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : insight.impact === 'medium' ? (
                <Target className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
              <p className="text-xs text-blue-600">
                <strong>Recommendation:</strong> {insight.recommendation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Distribution by Region</CardTitle>
                <CardDescription>Total responses collected in each region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#DC2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Scores by Region</CardTitle>
                <CardDescription>Average data quality across regions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={qualityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quality" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regional Performance Summary</CardTitle>
              <CardDescription>Key metrics comparison across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Region</th>
                      <th className="text-right p-2">Responses</th>
                      <th className="text-right p-2">Quality Score</th>
                      <th className="text-right p-2">Completion Rate</th>
                      <th className="text-right p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalData.map((region, index) => (
                      <tr key={region.name} className="border-b">
                        <td className="p-2 font-medium">{region.name}</td>
                        <td className="p-2 text-right">{region.totalResponses}</td>
                        <td className="p-2 text-right">
                          <span className={`font-medium ${
                            region.avgQuality >= 90 ? 'text-green-600' :
                            region.avgQuality >= 80 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {region.avgQuality.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <span className={`font-medium ${
                            region.completionRate >= 90 ? 'text-green-600' :
                            region.completionRate >= 70 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {region.completionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant={
                            region.avgQuality >= 90 && region.completionRate >= 90 ? 'default' :
                            region.avgQuality >= 80 && region.completionRate >= 70 ? 'secondary' : 'destructive'
                          }>
                            {region.avgQuality >= 90 && region.completionRate >= 90 ? 'Excellent' :
                             region.avgQuality >= 80 && region.completionRate >= 70 ? 'Good' : 'Needs Attention'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {regionalData.slice(0, 4).map((region, index) => (
              <Card key={region.name}>
                <CardHeader>
                  <CardTitle>{region.name} Demographics</CardTitle>
                  <CardDescription>Population distribution analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Age Groups</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={Object.entries(region.demographics.ageGroups).map(([age, count]) => ({ age, count }))}>
                          <XAxis dataKey="age" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill={COLORS[index % COLORS.length]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Gender Distribution</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={Object.entries(region.demographics.gender).map(([gender, count]) => ({ name: gender, value: count }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {Object.entries(region.demographics.gender).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="grid gap-4">
            {questions.slice(0, 3).map((question, questionIndex) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle>{question.question}</CardTitle>
                  <CardDescription>Regional comparison for this question</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {regionalData.slice(0, 4).map((region, regionIndex) => {
                      const questionStat = region.questionStats[question.id];
                      if (!questionStat) return null;

                      return (
                        <div key={region.name} className="space-y-2">
                          <h4 className="text-sm font-medium">{region.name}</h4>
                          {questionStat.type === 'categorical' && (
                            <div className="space-y-1">
                              {Object.entries(questionStat.distribution).map(([option, count]) => (
                                <div key={option} className="flex justify-between text-xs">
                                  <span>{option}</span>
                                  <span>{count} ({((count / questionStat.total) * 100).toFixed(1)}%)</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {questionStat.type === 'numeric' && (
                            <div className="space-y-1 text-xs">
                              <div>Average: {questionStat.average.toFixed(2)}</div>
                              <div>Range: {questionStat.min} - {questionStat.max}</div>
                              <div>Median: {questionStat.median}</div>
                            </div>
                          )}
                          {questionStat.type === 'binary' && (
                            <div className="space-y-1 text-xs">
                              <div>Yes: {questionStat.yes} ({((questionStat.yes / questionStat.total) * 100).toFixed(1)}%)</div>
                              <div>No: {questionStat.no} ({((questionStat.no / questionStat.total) * 100).toFixed(1)}%)</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Trends</CardTitle>
                <CardDescription>Response collection over time by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="responses" stroke="#DC2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality vs Completion</CardTitle>
                <CardDescription>Relationship between quality scores and completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={responseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="completion" name="Completion Rate" />
                    <YAxis dataKey="quality" name="Quality Score" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="responses" fill="#10B981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComparativeInsights;


