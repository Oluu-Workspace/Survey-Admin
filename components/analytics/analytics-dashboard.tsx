"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, FileText, Activity, Download } from "lucide-react"

// Mock analytics data
const responsesByMonth = [
  { month: "Jan", responses: 1200, target: 1000 },
  { month: "Feb", responses: 1450, target: 1200 },
  { month: "Mar", responses: 1680, target: 1400 },
  { month: "Apr", responses: 1920, target: 1600 },
  { month: "May", responses: 2100, target: 1800 },
  { month: "Jun", responses: 2350, target: 2000 },
]

const responsesByRegion = [
  { region: "Nairobi", responses: 850, percentage: 35 },
  { region: "Kiambu", responses: 620, percentage: 25 },
  { region: "Mombasa", responses: 480, percentage: 20 },
  { region: "Kisumu", responses: 360, percentage: 15 },
  { region: "Nakuru", responses: 240, percentage: 10 },
]

const surveyStatusData = [
  { name: "Active", value: 12, color: "#10B981" },
  { name: "Completed", value: 8, color: "#3B82F6" },
  { name: "Draft", value: 3, color: "#F59E0B" },
  { name: "Paused", value: 2, color: "#EF4444" },
]

const responseQualityTrend = [
  { week: "Week 1", quality: 87.2 },
  { week: "Week 2", quality: 89.1 },
  { week: "Week 3", quality: 91.5 },
  { week: "Week 4", quality: 88.7 },
  { week: "Week 5", quality: 92.3 },
  { week: "Week 6", quality: 90.8 },
]

const demographicBreakdown = [
  { category: "18-25", value: 25, color: "#3B82F6" },
  { category: "26-35", value: 35, color: "#10B981" },
  { category: "36-45", value: 22, color: "#F59E0B" },
  { category: "46-55", value: 12, color: "#EF4444" },
  { category: "55+", value: 6, color: "#8B5CF6" },
]

export function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [selectedRegion, setSelectedRegion] = useState("all")

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="nairobi">Nairobi</SelectItem>
            <SelectItem value="kiambu">Kiambu</SelectItem>
            <SelectItem value="mombasa">Mombasa</SelectItem>
            <SelectItem value="kisumu">Kisumu</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold">12,450</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <p className="text-xs text-green-600">+12.5% from last month</p>
                </div>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold">12</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <p className="text-xs text-green-600">+2 new this week</p>
                </div>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Field Agents</p>
                <p className="text-2xl font-bold">45</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <p className="text-xs text-green-600">+3 new agents</p>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Quality</p>
                <p className="text-2xl font-bold">94.2%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <p className="text-xs text-green-600">+2.1% this week</p>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Response Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responsesByMonth.map((item) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{item.month}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.responses.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Target: {item.target.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responsesByRegion.map((item) => (
                    <div key={item.region} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{item.region}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.responses.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responseQualityTrend.map((item) => (
                    <div key={item.week} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">{item.week}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.quality}%</div>
                        <div className="text-sm text-gray-500">
                          {item.quality >= 90 ? "Excellent" : item.quality >= 85 ? "Good" : "Needs Improvement"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Survey Status */}
            <Card>
              <CardHeader>
                <CardTitle>Survey Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {surveyStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.value}</div>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: item.color + "20", color: item.color }}
                        >
                          {item.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demographicBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="font-medium">{item.category} years</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.value}%</div>
                        <div className="text-sm text-gray-500">
                          {item.value >= 30 ? "Majority" : item.value >= 20 ? "Significant" : "Minority"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Average Response Time</p>
                      <p className="text-xs text-gray-600">Time to complete surveys</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">8.5 min</div>
                      <div className="text-xs text-green-600">-0.3 min</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Completion Rate</p>
                      <p className="text-xs text-gray-600">Surveys completed vs started</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">87.3%</div>
                      <div className="text-xs text-green-600">+2.1%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Data Validation</p>
                      <p className="text-xs text-gray-600">Automated quality checks</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">94.2%</div>
                      <div className="text-xs text-green-600">+1.8%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}