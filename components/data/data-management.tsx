"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Download, RefreshCw, Database, Activity, Clock } from "lucide-react"

interface SurveyResponse {
  id: string
  surveyId: string
  surveyTitle: string
  respondentId: string
  respondentName?: string
  region: string
  submittedAt: string
  status: "complete" | "partial" | "validated" | "flagged"
  responses: Record<string, any>
  enumeratorId: string
  enumeratorName: string
  validationScore?: number
}

interface DataQualityMetric {
  id: string
  metric: string
  value: number
  threshold: number
  status: "good" | "warning" | "critical"
  description: string
}

// Mock data
const mockResponses: SurveyResponse[] = [
  {
    id: "resp-1",
    surveyId: "survey-1",
    surveyTitle: "Healthcare Access Survey 2024",
    respondentId: "resp-001",
    respondentName: "Jane Doe",
    region: "Nairobi County",
    submittedAt: "2024-01-15T14:30:00Z",
    status: "complete",
    responses: {
      age: 34,
      gender: "Female",
      healthcare_access: "Good",
      distance_to_facility: "5km",
    },
    enumeratorId: "enum-1",
    enumeratorName: "Peter Ochieng",
    validationScore: 95,
  },
  {
    id: "resp-2",
    surveyId: "survey-1",
    surveyTitle: "Healthcare Access Survey 2024",
    respondentId: "resp-002",
    region: "Kiambu County",
    submittedAt: "2024-01-15T16:45:00Z",
    status: "flagged",
    responses: {
      age: 28,
      gender: "Male",
      healthcare_access: "Poor",
      distance_to_facility: "15km",
    },
    enumeratorId: "enum-2",
    enumeratorName: "Grace Muthoni",
    validationScore: 67,
  },
  {
    id: "resp-3",
    surveyId: "survey-2",
    surveyTitle: "Education Quality Assessment",
    respondentId: "resp-003",
    respondentName: "John Smith",
    region: "Kisumu County",
    submittedAt: "2024-01-15T11:20:00Z",
    status: "complete",
    responses: {
      children_in_school: 3,
      school_quality: "Average",
      teacher_availability: "Good",
    },
    enumeratorId: "enum-3",
    enumeratorName: "Mary Wanjiku",
    validationScore: 88,
  },
]

const mockQualityMetrics: DataQualityMetric[] = [
  {
    id: "metric-1",
    metric: "Response Completeness",
    value: 94.5,
    threshold: 90,
    status: "good",
    description: "Percentage of complete responses",
  },
  {
    id: "metric-2",
    metric: "Data Validation Score",
    value: 82.3,
    threshold: 85,
    status: "warning",
    description: "Average validation score across all responses",
  },
  {
    id: "metric-3",
    metric: "Duplicate Detection",
    value: 2.1,
    threshold: 5,
    status: "good",
    description: "Percentage of potential duplicate responses",
  },
  {
    id: "metric-4",
    metric: "Response Time Consistency",
    value: 76.8,
    threshold: 80,
    status: "warning",
    description: "Consistency in response submission times",
  },
]

export function DataManagement() {
  const [responses, setResponses] = useState<SurveyResponse[]>(mockResponses)
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetric[]>(mockQualityMetrics)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSurvey, setSelectedSurvey] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [isViewResponseOpen, setIsViewResponseOpen] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date())
      // Simulate new responses coming in
      if (Math.random() > 0.8) {
        const newResponse: SurveyResponse = {
          id: `resp-${Date.now()}`,
          surveyId: "survey-1",
          surveyTitle: "Healthcare Access Survey 2024",
          respondentId: `resp-${Date.now()}`,
          region: ["Nairobi County", "Kiambu County", "Kisumu County"][Math.floor(Math.random() * 3)],
          submittedAt: new Date().toISOString(),
          status: ["complete", "partial", "validated"][Math.floor(Math.random() * 3)] as any,
          responses: { age: Math.floor(Math.random() * 60) + 18 },
          enumeratorId: "enum-1",
          enumeratorName: "Peter Ochieng",
          validationScore: Math.floor(Math.random() * 40) + 60,
        }
        setResponses((prev) => [newResponse, ...prev])
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.surveyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.enumeratorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSurvey = selectedSurvey === "all" || response.surveyId === selectedSurvey
    const matchesStatus = selectedStatus === "all" || response.status === selectedStatus
    const matchesRegion = selectedRegion === "all" || response.region === selectedRegion
    return matchesSearch && matchesSurvey && matchesStatus && matchesRegion
  })

  const handleViewResponse = (response: SurveyResponse) => {
    setSelectedResponse(response)
    setIsViewResponseOpen(true)
  }

  const handleRefresh = () => {
    setLastRefresh(new Date())
    // Simulate data refresh
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "complete":
        return "default"
      case "validated":
        return "default"
      case "partial":
        return "secondary"
      case "flagged":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getQualityStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const uniqueSurveys = Array.from(new Set(responses.map((r) => r.surveyTitle)))
  const uniqueRegions = Array.from(new Set(responses.map((r) => r.region)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Data Management</h1>
          <p className="text-muted-foreground">Monitor and manage survey response data in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{responses.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10)} today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Complete Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {responses.filter((r) => r.status === "complete").length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((responses.filter((r) => r.status === "complete").length / responses.length) * 100)}%
              completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {responses.filter((r) => r.status === "flagged").length}
            </div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {Math.round(responses.reduce((sum, r) => sum + (r.validationScore || 0), 0) / responses.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Data validation score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="responses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="responses">Survey Responses</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Survey Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search responses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Surveys</SelectItem>
                    {uniqueSurveys.map((survey) => (
                      <SelectItem key={survey} value={survey}>
                        {survey}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {uniqueRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Enumerator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.slice(0, 50).map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="font-medium">{response.surveyTitle}</div>
                      </TableCell>
                      <TableCell>{response.respondentName || response.respondentId}</TableCell>
                      <TableCell>{response.region}</TableCell>
                      <TableCell>{response.enumeratorName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(response.status)} className="capitalize">
                          {response.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={response.validationScore && response.validationScore < 70 ? "text-red-600" : ""}
                          >
                            {response.validationScore || "-"}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(response.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewResponse(response)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{metric.metric}</div>
                        <div className="text-sm text-muted-foreground">{metric.description}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-semibold ${getQualityStatusColor(metric.status)}`}>
                          {metric.value}%
                        </div>
                        <div className="text-xs text-muted-foreground">Target: {metric.threshold}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="text-sm">
                      <span className="font-medium">New response</span> received from Nairobi County
                    </div>
                    <div className="text-xs text-muted-foreground ml-auto">2 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Quality check</span> flagged response for review
                    </div>
                    <div className="text-xs text-muted-foreground ml-auto">5 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Data validation</span> completed for batch #247
                    </div>
                    <div className="text-xs text-muted-foreground ml-auto">8 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="text-sm">
                      <span className="font-medium">Export completed</span> for Healthcare Survey data
                    </div>
                    <div className="text-xs text-muted-foreground ml-auto">12 min ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Response Detail Dialog */}
      <Dialog open={isViewResponseOpen} onOpenChange={setIsViewResponseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Survey</div>
                  <div>{selectedResponse.surveyTitle}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={getStatusBadgeVariant(selectedResponse.status)} className="capitalize">
                    {selectedResponse.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Region</div>
                  <div>{selectedResponse.region}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Enumerator</div>
                  <div>{selectedResponse.enumeratorName}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Response Data</div>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm">{JSON.stringify(selectedResponse.responses, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
