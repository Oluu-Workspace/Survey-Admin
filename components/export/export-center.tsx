"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  BarChart3,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

interface ExportJob {
  id: string
  name: string
  type: "survey_responses" | "analytics_report" | "user_data" | "regional_data"
  format: "csv" | "xlsx" | "pdf" | "json"
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  createdAt: string
  completedAt?: string
  fileSize?: string
  downloadUrl?: string
  filters: {
    surveys?: string[]
    regions?: string[]
    dateRange?: DateRange
    status?: string[]
  }
}

interface ExportTemplate {
  id: string
  name: string
  description: string
  type: "survey_responses" | "analytics_report" | "user_data" | "regional_data"
  defaultFormat: "csv" | "xlsx" | "pdf"
  fields: string[]
}

// Mock data
const mockExportJobs: ExportJob[] = [
  {
    id: "job-1",
    name: "Healthcare Survey Responses - January 2024",
    type: "survey_responses",
    format: "xlsx",
    status: "completed",
    progress: 100,
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:35:00Z",
    fileSize: "2.4 MB",
    downloadUrl: "#",
    filters: {
      surveys: ["Healthcare Access Survey 2024"],
      regions: ["Nairobi County", "Kiambu County"],
      dateRange: { from: new Date("2024-01-01"), to: new Date("2024-01-31") },
    },
  },
  {
    id: "job-2",
    name: "Monthly Analytics Report",
    type: "analytics_report",
    format: "pdf",
    status: "processing",
    progress: 65,
    createdAt: "2024-01-15T14:20:00Z",
    filters: {
      dateRange: { from: new Date("2024-01-01"), to: new Date("2024-01-31") },
    },
  },
  {
    id: "job-3",
    name: "User Management Export",
    type: "user_data",
    format: "csv",
    status: "failed",
    progress: 0,
    createdAt: "2024-01-15T09:15:00Z",
    filters: {},
  },
]

const exportTemplates: ExportTemplate[] = [
  {
    id: "template-1",
    name: "Survey Responses - Complete",
    description: "All survey response data with respondent information",
    type: "survey_responses",
    defaultFormat: "xlsx",
    fields: ["Response ID", "Survey", "Respondent", "Region", "Submitted Date", "Status", "All Responses"],
  },
  {
    id: "template-2",
    name: "Survey Responses - Summary",
    description: "Summary statistics and key metrics only",
    type: "survey_responses",
    defaultFormat: "csv",
    fields: ["Survey", "Region", "Total Responses", "Completion Rate", "Quality Score"],
  },
  {
    id: "template-3",
    name: "Analytics Dashboard Report",
    description: "Comprehensive analytics with charts and insights",
    type: "analytics_report",
    defaultFormat: "pdf",
    fields: ["Overview", "Regional Analysis", "Performance Metrics", "Quality Trends", "Charts"],
  },
  {
    id: "template-4",
    name: "User Activity Report",
    description: "User management and activity data",
    type: "user_data",
    defaultFormat: "xlsx",
    fields: ["User ID", "Name", "Role", "Region", "Last Login", "Activity Score"],
  },
]

export function ExportCenter() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(mockExportJobs)
  const [isCreateExportOpen, setIsCreateExportOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [exportConfig, setExportConfig] = useState({
    name: "",
    type: "survey_responses" as const,
    format: "xlsx" as const,
    surveys: [] as string[],
    regions: [] as string[],
    dateRange: undefined as DateRange | undefined,
    includeFields: [] as string[],
  })

  const handleCreateExport = () => {
    const newJob: ExportJob = {
      id: `job-${Date.now()}`,
      name: exportConfig.name || `Export ${new Date().toLocaleDateString()}`,
      type: exportConfig.type,
      format: exportConfig.format,
      status: "pending",
      progress: 0,
      createdAt: new Date().toISOString(),
      filters: {
        surveys: exportConfig.surveys,
        regions: exportConfig.regions,
        dateRange: exportConfig.dateRange,
      },
    }

    setExportJobs([newJob, ...exportJobs])
    setIsCreateExportOpen(false)

    // Simulate processing
    setTimeout(() => {
      setExportJobs((prev) =>
        prev.map((job) => (job.id === newJob.id ? { ...job, status: "processing", progress: 10 } : job)),
      )

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportJobs((prev) => {
          const updatedJobs = prev.map((job) => {
            if (job.id === newJob.id && job.status === "processing") {
              const newProgress = Math.min(job.progress + Math.random() * 20, 100)
              if (newProgress >= 100) {
                return {
                  ...job,
                  status: "completed" as const,
                  progress: 100,
                  completedAt: new Date().toISOString(),
                  fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
                  downloadUrl: "#",
                }
              }
              return { ...job, progress: newProgress }
            }
            return job
          })
          return updatedJobs
        })
      }, 1000)

      setTimeout(() => clearInterval(progressInterval), 10000)
    }, 1000)

    // Reset form
    setExportConfig({
      name: "",
      type: "survey_responses",
      format: "xlsx",
      surveys: [],
      regions: [],
      dateRange: undefined,
      includeFields: [],
    })
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = exportTemplates.find((t) => t.id === templateId)
    if (template) {
      setExportConfig({
        ...exportConfig,
        name: template.name,
        type: template.type,
        format: template.defaultFormat,
        includeFields: template.fields,
      })
    }
    setSelectedTemplate(templateId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "processing":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "survey_responses":
        return <FileText className="h-4 w-4" />
      case "analytics_report":
        return <BarChart3 className="h-4 w-4" />
      case "user_data":
        return <Database className="h-4 w-4" />
      case "regional_data":
        return <Database className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />
      case "csv":
        return <FileSpreadsheet className="h-4 w-4 text-blue-600" />
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />
      case "json":
        return <Database className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Export Center</h1>
          <p className="text-muted-foreground">Export survey data, analytics reports, and system information</p>
        </div>
        <Dialog open={isCreateExportOpen} onOpenChange={setIsCreateExportOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Create Export
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Export</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="template" className="space-y-4">
              <TabsList>
                <TabsTrigger value="template">Use Template</TabsTrigger>
                <TabsTrigger value="custom">Custom Export</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {exportTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getTypeIcon(template.type)}
                        <div className="flex-1">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.type.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.defaultFormat.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTemplate && (
                  <Button onClick={handleCreateExport} className="w-full">
                    Create Export from Template
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exportName">Export Name</Label>
                    <Input
                      id="exportName"
                      value={exportConfig.name}
                      onChange={(e) => setExportConfig({ ...exportConfig, name: e.target.value })}
                      placeholder="Enter export name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exportType">Export Type</Label>
                      <Select
                        value={exportConfig.type}
                        onValueChange={(value: any) => setExportConfig({ ...exportConfig, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="survey_responses">Survey Responses</SelectItem>
                          <SelectItem value="analytics_report">Analytics Report</SelectItem>
                          <SelectItem value="user_data">User Data</SelectItem>
                          <SelectItem value="regional_data">Regional Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exportFormat">Format</Label>
                      <Select
                        value={exportConfig.format}
                        onValueChange={(value: any) => setExportConfig({ ...exportConfig, format: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                          <SelectItem value="csv">CSV (.csv)</SelectItem>
                          <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                          <SelectItem value="json">JSON (.json)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range (Optional)</Label>
                    <DatePickerWithRange
                      date={exportConfig.dateRange}
                      onDateChange={(dateRange) => setExportConfig({ ...exportConfig, dateRange })}
                    />
                  </div>

                  <Button onClick={handleCreateExport} className="w-full">
                    Create Custom Export
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Export Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{exportJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {exportJobs.filter((job) => job.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {exportJobs.filter((job) => job.status === "processing").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {exportJobs.filter((job) => job.status === "failed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Export Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Export Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-medium">{job.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(job.type)}
                      <span className="capitalize">{job.type.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFormatIcon(job.format)}
                      <span className="uppercase">{job.format}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">
                        {job.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.status === "processing" ? (
                      <div className="space-y-1">
                        <Progress value={job.progress} className="w-20" />
                        <div className="text-xs text-muted-foreground">{Math.round(job.progress)}%</div>
                      </div>
                    ) : job.status === "completed" ? (
                      <div className="text-sm text-green-600">Complete</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{job.fileSize || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {job.status === "completed" && job.downloadUrl && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
