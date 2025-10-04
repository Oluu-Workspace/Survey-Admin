"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, Eye, Wifi, WifiOff } from "lucide-react"

interface Agent {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  status: 'active' | 'pending' | 'suspended' | 'deactivated'
  county: string
  subcounty: string
  ward: string
  village: string
  is_online: boolean
  surveys_completed: number
  created_at: string
  last_active: string
}

export function AgentsManagement() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAgents()
      setAgents(response.agents || response)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    try {
      if (newStatus === 'active') {
        await apiClient.activateAgent(agentId)
      } else if (newStatus === 'suspended') {
        await apiClient.deactivateAgent(agentId)
      }
      fetchAgents() // Refresh the list
    } catch (error) {
      console.error('Failed to update agent status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      suspended: { color: "bg-red-100 text-red-800", label: "Suspended" },
      deactivated: { color: "bg-gray-100 text-gray-800", label: "Deactivated" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Agent Management</h2>
          <p className="text-muted-foreground">Manage field agents and their assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <p>Agent creation form will be implemented here</p>
                <p className="text-sm mt-2">This would include:</p>
                <ul className="text-sm text-left mt-2 space-y-1">
                  <li>• Personal information</li>
                  <li>• Contact details</li>
                  <li>• Regional assignment</li>
                  <li>• Initial status</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search agents by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Agents List */}
      <div className="grid gap-4">
        {filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {agents.length === 0 ? "No agents found" : "No agents match your search criteria"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAgents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {agent.first_name} {agent.last_name}
                      </h3>
                      {agent.is_online ? (
                        <Wifi className="h-4 w-4 text-green-500" title="Online" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-gray-400" title="Offline" />
                      )}
                      {getStatusBadge(agent.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Email:</span> {agent.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {agent.phone || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {agent.county}, {agent.subcounty}
                      </div>
                      <div>
                        <span className="font-medium">Surveys:</span> {agent.surveys_completed} completed
                      </div>
                    </div>
                    
                    {agent.last_active && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Last active: {new Date(agent.last_active).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {agent.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(agent.id, 'active')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    )}
                    {agent.status === 'active' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleStatusChange(agent.id, 'suspended')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{agents.filter(a => a.status === 'active').length}</div>
            <div className="text-sm text-muted-foreground">Active Agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{agents.filter(a => a.status === 'pending').length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{agents.filter(a => a.is_online).length}</div>
            <div className="text-sm text-muted-foreground">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p4 text-center">
            <div className="text-2xl font-bold text-purple-600">{agents.reduce((sum, a) => sum + a.surveys_completed, 0)}</div>
            <div className="text-sm text-muted-foreground">Total Surveys</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
