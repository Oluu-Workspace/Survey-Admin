"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { mockAgents, kenyanRegions, type Agent } from "@/lib/mock-data"
import {
  Search,
  Plus,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Pause,
  Users,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
} from "lucide-react"

export function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.county.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (agentId: string, newStatus: Agent["status"]) => {
    setAgents((prev) => prev.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent)))
  }

  const getStatusBadge = (status: Agent["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      suspended: "bg-red-100 text-red-800 border-red-200",
      deactivated: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return variants[status]
  }

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Eye className="h-4 w-4" />
      case "suspended":
        return <Pause className="h-4 w-4" />
      case "deactivated":
        return <XCircle className="h-4 w-4" />
    }
  }

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    pending: agents.filter((a) => a.status === "pending").length,
    online: agents.filter((a) => a.isOnline).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <UserX className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-blue-600">{stats.online}</p>
              </div>
              <Wifi className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="agent@example.com" />
              </div>
              <div>
                <Label htmlFor="county">County Assignment</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(kenyanRegions).map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea id="message" placeholder="Welcome to our research team..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowInviteDialog(false)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Field Agents ({filteredAgents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Performance</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {agent.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-500">ID: {agent.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{agent.email}</div>
                        <div className="text-gray-500">{agent.phone}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{agent.county}</div>
                        <div className="text-gray-500">
                          {agent.subcounty}, {agent.ward}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusBadge(agent.status)} flex items-center gap-1`}>
                          {getStatusIcon(agent.status)}
                          {agent.status}
                        </Badge>
                        {agent.isOnline ? (
                          <Wifi className="h-4 w-4 text-green-500" title="Online" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-gray-400" title="Offline" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="font-medium">{agent.surveysCompleted} surveys</div>
                        <div className="text-gray-500">
                          Last active: {new Date(agent.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {agent.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(agent.id, "active")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        )}
                        {agent.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(agent.id, "suspended")}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Suspend
                          </Button>
                        )}
                        {agent.status === "suspended" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(agent.id, "active")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Reactivate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedAgent(agent)}>
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Agent Details Dialog */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agent Details: {selectedAgent.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Information</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Email: {selectedAgent.email}</div>
                  <div>Phone: {selectedAgent.phone}</div>
                </div>
              </div>
              <div>
                <Label>Assignment</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>County: {selectedAgent.county}</div>
                  <div>Sub-county: {selectedAgent.subcounty}</div>
                  <div>Ward: {selectedAgent.ward}</div>
                  <div>Village: {selectedAgent.village}</div>
                </div>
              </div>
              <div>
                <Label>Status & Activity</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    Status: <Badge className={getStatusBadge(selectedAgent.status)}>{selectedAgent.status}</Badge>
                  </div>
                  <div>Online: {selectedAgent.isOnline ? "Yes" : "No"}</div>
                  <div>Registered: {new Date(selectedAgent.registeredAt).toLocaleDateString()}</div>
                  <div>Last Active: {new Date(selectedAgent.lastActive).toLocaleDateString()}</div>
                </div>
              </div>
              <div>
                <Label>Performance</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>Surveys Completed: {selectedAgent.surveysCompleted}</div>
                  <div>Success Rate: 94%</div>
                  <div>Data Quality Score: 8.7/10</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
