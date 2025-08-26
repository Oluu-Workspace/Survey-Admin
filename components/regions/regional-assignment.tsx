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
import { Plus, Search, Edit, Trash2, Users, MapPin, Building } from "lucide-react"

interface Region {
  id: string
  name: string
  type: "county" | "subcounty" | "ward" | "village"
  parentId?: string
  assignedUsers: string[]
  activeSurveys: number
  population?: number
  coordinates?: { lat: number; lng: number }
}

interface Assignment {
  id: string
  userId: string
  userName: string
  userRole: string
  regionId: string
  regionName: string
  regionType: string
  assignedAt: string
  status: "active" | "inactive"
}

// Mock data for Kenyan administrative regions
const mockRegions: Region[] = [
  // Counties
  {
    id: "county-1",
    name: "Nairobi County",
    type: "county",
    assignedUsers: ["user-1", "user-2"],
    activeSurveys: 5,
    population: 4397073,
  },
  {
    id: "county-2",
    name: "Kiambu County",
    type: "county",
    assignedUsers: ["user-3"],
    activeSurveys: 3,
    population: 2417735,
  },
  {
    id: "county-3",
    name: "Kisumu County",
    type: "county",
    assignedUsers: ["user-4"],
    activeSurveys: 2,
    population: 1155574,
  },
  // Sub-counties
  {
    id: "subcounty-1",
    name: "Westlands Sub-County",
    type: "subcounty",
    parentId: "county-1",
    assignedUsers: ["user-5"],
    activeSurveys: 2,
    population: 234533,
  },
  {
    id: "subcounty-2",
    name: "Starehe Sub-County",
    type: "subcounty",
    parentId: "county-1",
    assignedUsers: ["user-6"],
    activeSurveys: 1,
    population: 209617,
  },
  // Wards
  {
    id: "ward-1",
    name: "Parklands Ward",
    type: "ward",
    parentId: "subcounty-1",
    assignedUsers: ["user-7"],
    activeSurveys: 1,
    population: 45678,
  },
  {
    id: "ward-2",
    name: "Highridge Ward",
    type: "ward",
    parentId: "subcounty-1",
    assignedUsers: [],
    activeSurveys: 0,
    population: 38945,
  },
  // Villages
  {
    id: "village-1",
    name: "Parklands Village A",
    type: "village",
    parentId: "ward-1",
    assignedUsers: ["user-8"],
    activeSurveys: 1,
    population: 12345,
  },
]

const mockAssignments: Assignment[] = [
  {
    id: "assign-1",
    userId: "user-1",
    userName: "John Kamau",
    userRole: "manager",
    regionId: "county-1",
    regionName: "Nairobi County",
    regionType: "county",
    assignedAt: "2024-01-01",
    status: "active",
  },
  {
    id: "assign-2",
    userId: "user-3",
    userName: "Mary Wanjiku",
    userRole: "manager",
    regionId: "county-2",
    regionName: "Kiambu County",
    regionType: "county",
    assignedAt: "2024-01-02",
    status: "active",
  },
  {
    id: "assign-3",
    userId: "user-5",
    userName: "Peter Ochieng",
    userRole: "enumerator",
    regionId: "subcounty-1",
    regionName: "Westlands Sub-County",
    regionType: "subcounty",
    assignedAt: "2024-01-05",
    status: "active",
  },
]

export function RegionalAssignment() {
  const [regions, setRegions] = useState<Region[]>(mockRegions)
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegionType, setSelectedRegionType] = useState<string>("all")
  const [isCreateRegionOpen, setIsCreateRegionOpen] = useState(false)
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false)
  const [newRegion, setNewRegion] = useState({
    name: "",
    type: "county" as const,
    parentId: "",
    population: 0,
  })
  const [newAssignment, setNewAssignment] = useState({
    userId: "",
    userName: "",
    userRole: "",
    regionId: "",
  })

  const filteredRegions = regions.filter((region) => {
    const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedRegionType === "all" || region.type === selectedRegionType
    return matchesSearch && matchesType
  })

  const getRegionHierarchy = (regionId: string): Region[] => {
    const hierarchy: Region[] = []
    let currentRegion = regions.find((r) => r.id === regionId)

    while (currentRegion) {
      hierarchy.unshift(currentRegion)
      currentRegion = currentRegion.parentId ? regions.find((r) => r.id === currentRegion!.parentId) : undefined
    }

    return hierarchy
  }

  const getChildRegions = (parentId: string): Region[] => {
    return regions.filter((region) => region.parentId === parentId)
  }

  const handleCreateRegion = () => {
    const region: Region = {
      id: `${newRegion.type}-${Date.now()}`,
      ...newRegion,
      assignedUsers: [],
      activeSurveys: 0,
    }
    setRegions([...regions, region])
    setNewRegion({ name: "", type: "county", parentId: "", population: 0 })
    setIsCreateRegionOpen(false)
  }

  const handleAssignUser = () => {
    const assignment: Assignment = {
      id: `assign-${Date.now()}`,
      ...newAssignment,
      regionName: regions.find((r) => r.id === newAssignment.regionId)?.name || "",
      regionType: regions.find((r) => r.id === newAssignment.regionId)?.type || "",
      assignedAt: new Date().toISOString().split("T")[0],
      status: "active",
    }
    setAssignments([...assignments, assignment])

    // Update region's assigned users
    setRegions(
      regions.map((region) =>
        region.id === newAssignment.regionId
          ? { ...region, assignedUsers: [...region.assignedUsers, newAssignment.userId] }
          : region,
      ),
    )

    setNewAssignment({ userId: "", userName: "", userRole: "", regionId: "" })
    setIsAssignUserOpen(false)
  }

  const removeAssignment = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId)
    if (assignment) {
      // Remove from assignments
      setAssignments(assignments.filter((a) => a.id !== assignmentId))

      // Update region's assigned users
      setRegions(
        regions.map((region) =>
          region.id === assignment.regionId
            ? { ...region, assignedUsers: region.assignedUsers.filter((u) => u !== assignment.userId) }
            : region,
        ),
      )
    }
  }

  const getRegionTypeIcon = (type: string) => {
    switch (type) {
      case "county":
        return <Building className="h-4 w-4" />
      case "subcounty":
        return <MapPin className="h-4 w-4" />
      case "ward":
        return <MapPin className="h-4 w-4" />
      case "village":
        return <Users className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getRegionTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "county":
        return "default"
      case "subcounty":
        return "secondary"
      case "ward":
        return "outline"
      case "village":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Regional Assignment</h1>
          <p className="text-muted-foreground">Manage regional hierarchy and user assignments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateRegionOpen} onOpenChange={setIsCreateRegionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Region
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Region</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regionName">Region Name</Label>
                  <Input
                    id="regionName"
                    value={newRegion.name}
                    onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                    placeholder="Enter region name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regionType">Region Type</Label>
                  <Select
                    value={newRegion.type}
                    onValueChange={(value: any) => setNewRegion({ ...newRegion, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="county">County</SelectItem>
                      <SelectItem value="subcounty">Sub-County</SelectItem>
                      <SelectItem value="ward">Ward</SelectItem>
                      <SelectItem value="village">Village</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentRegion">Parent Region (Optional)</Label>
                  <Select
                    value={newRegion.parentId}
                    onValueChange={(value) => setNewRegion({ ...newRegion, parentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name} ({region.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="population">Population (Optional)</Label>
                  <Input
                    id="population"
                    type="number"
                    value={newRegion.population}
                    onChange={(e) => setNewRegion({ ...newRegion, population: Number.parseInt(e.target.value) || 0 })}
                    placeholder="Enter population"
                  />
                </div>
                <Button onClick={handleCreateRegion} className="w-full">
                  Add Region
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAssignUserOpen} onOpenChange={setIsAssignUserOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign User to Region</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">User Name</Label>
                  <Input
                    id="userName"
                    value={newAssignment.userName}
                    onChange={(e) => setNewAssignment({ ...newAssignment, userName: e.target.value })}
                    placeholder="Enter user name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">User Role</Label>
                  <Select
                    value={newAssignment.userRole}
                    onValueChange={(value) => setNewAssignment({ ...newAssignment, userRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="enumerator">Enumerator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignRegion">Region</Label>
                  <Select
                    value={newAssignment.regionId}
                    onValueChange={(value) => setNewAssignment({ ...newAssignment, regionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name} ({region.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignUser} className="w-full">
                  Assign User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{regions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Counties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{regions.filter((r) => r.type === "county").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{assignments.filter((a) => a.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Population</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {regions.reduce((sum, region) => sum + (region.population || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle>Regional Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search regions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRegionType} onValueChange={setSelectedRegionType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="subcounty">Sub-County</SelectItem>
                    <SelectItem value="ward">Ward</SelectItem>
                    <SelectItem value="village">Village</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Population</TableHead>
                    <TableHead>Assigned Users</TableHead>
                    <TableHead>Active Surveys</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegions.map((region) => {
                    const parentRegion = region.parentId ? regions.find((r) => r.id === region.parentId) : null
                    return (
                      <TableRow key={region.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRegionTypeIcon(region.type)}
                            <span className="font-medium">{region.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRegionTypeBadgeVariant(region.type)} className="capitalize">
                            {region.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{parentRegion ? parentRegion.name : "-"}</TableCell>
                        <TableCell>{region.population?.toLocaleString() || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{region.assignedUsers.length}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{region.activeSurveys}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>User Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Region Type</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {assignment.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.regionName}</TableCell>
                      <TableCell>
                        <Badge variant={getRegionTypeBadgeVariant(assignment.regionType)} className="capitalize">
                          {assignment.regionType}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.assignedAt}</TableCell>
                      <TableCell>
                        <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAssignment(assignment.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
