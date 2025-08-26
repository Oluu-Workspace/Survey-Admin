"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Users, FileText, Activity, Download } from "lucide-react"

// Mock analytics data
const responsesByMonth = [
  { month: "Jan", responses: 1200, target: 1000 },
  { month: "Feb", responses: 1450, target: 1200 },
  { month: "Mar", responses: 1680, target: 1400 },
  { month: "Apr", responses: 1920, target: 1600 },
  { month: "May", responses: 2150, target: 1800 },
  { month: "Jun", responses: 2380, target: 2000 },
]

const responsesByRegion = [
  { region: "Nairobi", responses: 3245, percentage: 35 },
  { region: "Kiambu", responses: 2156, percentage: 23 },
  { region: "Kisumu", responses: 1834, percentage: 20 },
  { region: "Nakuru", responses: 1245, percentage: 13 },
  { region: "Meru", responses: 834, percentage: 9 },
]

const surveyPerformance = [
  { survey: "Healthcare Access", responses: 2847, completion: 87, quality: 92 },
  { survey: "Education Quality", responses: 1956, completion: 78, quality: 85 },
  { survey: "Agriculture Study", responses: 1234, completion: 92, quality: 88 },
  { survey: "Water & Sanitation", responses: 2156, completion: 95, quality: 94 },
]

const enumeratorPerformance = [
  { name: "Peter Ochieng", responses: 456, quality: 94, regions: 3 },
  { name: "Grace Muthoni", responses: 423, quality: 91, regions: 2 },
  { name: "Mary Wanjiku", responses: 398, quality: 89, regions: 4 },
  { name: "John Kamau", responses: 367, quality: 87, regions: 2 },
  { name: "Sarah Njeri", responses: 334, quality: 93, regions: 3 },
]

const responseQualityTrend = [
  { week: "Week 1", quality: 85, flagged: 12 },
  { week: "Week 2", quality: 87, flagged: 8 },
  { week: "Week 3", quality: 89, flagged: 6 },
  { week: "Week 4", quality: 91, flagged: 4 },
  { week: "Week 5", quality: 88, flagged: 7 },
  { week: "Week 6", quality: 92, flagged: 3 },
]

const demographicBreakdown = [
  { category: "18-25", value: 23, color: "#8884d8" },
  { category: "26-35", value: 32, color: "#82ca9d" },
  { category: "36-45", value: 28, color: "#ffc658" },
  { category: "46-55", value: 12, color: "#ff7c7c" },
  { category: "55+", value: 5, color: "#8dd1e1" },
]

export function AnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("6months")
  const [selectedSurvey, setSelectedSurvey] = useState("all")

  const totalResponses = responsesByMonth.reduce((sum, month) => sum + month.responses, 0)
  const avgCompletionRate = Math.round(
    surveyPerformance.reduce((sum, survey) => sum + survey.completion, 0) / surveyPerformance.length,
  )
  const avgQualityScore = Math.round(
    surveyPerformance.reduce((sum, survey) => sum + survey.quality, 0) / surveyPerformance.length,
  )
  const activeEnumerators = enumeratorPerformance.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalResponses.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{avgCompletionRate}%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +3.2% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{avgQualityScore}%</div>
            <div className="flex items-center gap-1 text-xs text-red-600">
              <TrendingDown className="h-3 w-3" />
              -1.1% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Enumerators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeEnumerators}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +2 from last period
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    responses: {
                      label: "Responses",
                      color: "hsl(var(--chart-1))",
                    },
                    target: {
                      label: "Target",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responsesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="responses"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.3}
                      />
                      <Line type="monotone" dataKey="target" stroke="hsl(var(--chart-2))" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {surveyPerformance.map((survey, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{survey.survey}</span>
                        <span className="text-sm text-muted-foreground">{survey.responses} responses</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Completion</span>
                            <span>{survey.completion}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${survey.completion}%` }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Quality</span>
                            <span>{survey.quality}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div className="bg-chart-2 h-2 rounded-full" style={{ width: `${survey.quality}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Responses by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    responses: {
                      label: "Responses",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responsesByRegion} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="region" type="category" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="responses" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    percentage: {
                      label: "Percentage",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={responsesByRegion}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ region, percentage }) => `${region}: ${percentage}%`}
                      >
                        {responsesByRegion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enumerator Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enumeratorPerformance.map((enumerator, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{enumerator.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {enumerator.responses} responses • {enumerator.regions} regions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={enumerator.quality >= 90 ? "default" : "secondary"}>
                          {enumerator.quality}% Quality
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    quality: {
                      label: "Quality Score",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responseQualityTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[80, 95]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="quality" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demographic Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Percentage",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographicBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ category, value }) => `${category}: ${value}%`}
                      >
                        {demographicBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
