"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Eye, Play, Pause, BarChart3 } from "lucide-react"

interface Survey {
  id: string
  title: string
  description: string
  status: "draft" | "active" | "paused" | "completed"
  category: string
  targetRegions: string[]
  responses: number
  targetResponses: number
  createdAt: string
  createdBy: string
  lastModified: string
}

// Mock data
const mockSurveys: Survey[] = [
  {
    id: "1",
    title: "Healthcare Access Survey 2024",
    description: "Comprehensive survey on healthcare accessibility across rural Kenya",
    status: "active",
    category: "Healthcare",
    targetRegions: ["Nairobi County", "Kiambu County", "Machakos County"],
    responses: 1247,
    targetResponses: 2000,
    createdAt: "2024-01-01",
    createdBy: "John Kamau",
    lastModified: "2024-01-15",
  },
  {
    id: "2",
    title: "Education Quality Assessment",
    description: "Evaluating the quality of primary education in public schools",
    status: "active",
    category: "Education",
    targetRegions: ["Kisumu County", "Nakuru County"],
    responses: 856,
    targetResponses: 1500,
    createdAt: "2024-01-05",
    createdBy: "Mary Wanjiku",
    lastModified: "2024-01-14",
  },
  {
    id: "3",
    title: "Agricultural Practices Study",
    description: "Understanding modern farming techniques adoption among smallholder farmers",
    status: "draft",
    category: "Agriculture",
    targetRegions: ["Meru County", "Embu County"],
    responses: 0,
    targetResponses: 1000,
    createdAt: "2024-01-10",
    createdBy: "Peter Ochieng",
    lastModified: "2024-01-12",
  },
  {
    id: "4",
    title: "Water Access and Sanitation",
    description: "Assessing water accessibility and sanitation facilities in rural areas",
    status: "completed",
    category: "Infrastructure",
    targetRegions: ["Turkana County", "Marsabit County"],
    responses: 2156,
    targetResponses: 2000,
    createdAt: "2023-12-01",
    createdBy: "Grace Muthoni",
    lastModified: "2024-01-08",
  },
]

export function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isCreateSurveyOpen, setIsCreateSurveyOpen] = useState(false)
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    category: "",
    targetRegions: [] as string[],
    targetResponses: 1000,
  })

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || survey.status === selectedStatus
    const matchesCategory = selectedCategory === "all" || survey.category === selectedCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleCreateSurvey = () => {
    const survey: Survey = {
      id: Date.now().toString(),
      ...newSurvey,
      status: "draft",
      responses: 0,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: "Current User",
      lastModified: new Date().toISOString().split("T")[0],
    }
    setSurveys([...surveys, survey])
    setNewSurvey({
      title: "",
      description: "",
      category: "",
      targetRegions: [],
      targetResponses: 1000,
    })
    setIsCreateSurveyOpen(false)
  }

  const updateSurveyStatus = (surveyId: string, newStatus: Survey["status"]) => {
    setSurveys(
      surveys.map((survey) =>
        survey.id === surveyId
          ? { ...survey, status: newStatus, lastModified: new Date().toISOString().split("T")[0] }
          : survey,
      ),
    )
  }

  const deleteSurvey = (surveyId: string) => {
    setSurveys(surveys.filter((survey) => survey.id !== surveyId))
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "draft":
        return "secondary"
      case "paused":
        return "outline"
      case "completed":
        return "outline"
      default:
        return "outline"
    }
  }

  const getProgressPercentage = (responses: number, target: number) => {
    return Math.min((responses / target) * 100, 100)
  }

  const categories = Array.from(new Set(surveys.map((s) => s.category)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Survey Management</h1>
          <p className="text-muted-foreground">Create, manage, and monitor your research surveys</p>
        </div>
        <Dialog open={isCreateSurveyOpen} onOpenChange={setIsCreateSurveyOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Survey</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title</Label>
                <Input
                  id="title"
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                  placeholder="Enter survey title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  placeholder="Describe the purpose and scope of this survey"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newSurvey.category}
                    onChange={(e) => setNewSurvey({ ...newSurvey, category: e.target.value })}
                    placeholder="e.g., Healthcare, Education"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target Responses</Label>
                  <Input
                    id="target"
                    type="number"
                    value={newSurvey.targetResponses}
                    onChange={(e) =>
                      setNewSurvey({ ...newSurvey, targetResponses: Number.parseInt(e.target.value) || 1000 })
                    }
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regions">Target Regions (comma-separated)</Label>
                <Input
                  id="regions"
                  value={newSurvey.targetRegions.join(", ")}
                  onChange={(e) =>
                    setNewSurvey({
                      ...newSurvey,
                      targetRegions: e.target.value
                        .split(",")
                        .map((r) => r.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Nairobi County, Kiambu County"
                />
              </div>
              <Button onClick={handleCreateSurvey} className="w-full">
                Create Survey
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{surveys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{surveys.filter((s) => s.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {surveys.reduce((sum, survey) => sum + survey.responses, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {Math.round(
                (surveys.reduce((sum, survey) => sum + survey.responses, 0) /
                  surveys.reduce((sum, survey) => sum + survey.targetResponses, 0)) *
                  100,
              )}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{survey.title}</div>
                      <div className="text-sm text-muted-foreground">{survey.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{survey.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(survey.status)} className="capitalize">
                      {survey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${getProgressPercentage(survey.responses, survey.targetResponses)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getProgressPercentage(survey.responses, survey.targetResponses).toFixed(0)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {survey.responses.toLocaleString()} / {survey.targetResponses.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{survey.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {survey.status === "active" ? (
                        <Button variant="ghost" size="sm" onClick={() => updateSurveyStatus(survey.id, "paused")}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : survey.status === "paused" ? (
                        <Button variant="ghost" size="sm" onClick={() => updateSurveyStatus(survey.id, "active")}>
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSurvey(survey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
