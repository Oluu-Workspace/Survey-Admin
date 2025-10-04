"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search, Users, MapPin } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'enumerator' | 'agent'
  status: 'active' | 'inactive'
  location?: string
  assignedSurveys?: number
}

interface UserAssignmentProps {
  selectedUsers: string[]
  onUsersChange: (users: string[]) => void
  label?: string
}

// Mock users data - in real app this would come from API
const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Kamau',
    email: 'john.kamau@example.com',
    role: 'agent',
    status: 'active',
    location: 'Kiambu Town',
    assignedSurveys: 2
  },
  {
    id: 'user-2',
    name: 'Mary Wanjiku',
    email: 'mary.wanjiku@example.com',
    role: 'agent',
    status: 'active',
    location: 'Githunguri',
    assignedSurveys: 1
  },
  {
    id: 'user-3',
    name: 'Peter Ochieng',
    email: 'peter.ochieng@example.com',
    role: 'enumerator',
    status: 'active',
    location: 'Thika',
    assignedSurveys: 3
  },
  {
    id: 'user-4',
    name: 'Grace Muthoni',
    email: 'grace.muthoni@example.com',
    role: 'agent',
    status: 'active',
    location: 'Ruiru',
    assignedSurveys: 0
  },
  {
    id: 'user-5',
    name: 'David Kimani',
    email: 'david.kimani@example.com',
    role: 'manager',
    status: 'active',
    location: 'Juja',
    assignedSurveys: 1
  },
  {
    id: 'user-6',
    name: 'Sarah Njeri',
    email: 'sarah.njeri@example.com',
    role: 'agent',
    status: 'inactive',
    location: 'Gatundu',
    assignedSurveys: 0
  }
]

export function UserAssignment({ selectedUsers, onUsersChange, label = "Assign to Users" }: UserAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onUsersChange(selectedUsers.filter(id => id !== userId))
    } else {
      onUsersChange([...selectedUsers, userId])
    }
  }

  const handleSelectAll = () => {
    const allUserIds = filteredUsers.map(user => user.id)
    const newSelection = [...new Set([...selectedUsers, ...allUserIds])]
    onUsersChange(newSelection)
  }

  const handleDeselectAll = () => {
    const filteredUserIds = filteredUsers.map(user => user.id)
    onUsersChange(selectedUsers.filter(id => !filteredUserIds.includes(id)))
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'manager': return 'secondary'
      case 'enumerator': return 'outline'
      case 'agent': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary'
  }

  const selectedUsersData = mockUsers.filter(user => selectedUsers.includes(user.id))

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="enumerator">Enumerator</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selection Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          Select All ({filteredUsers.length})
        </Button>
        <Button variant="outline" size="sm" onClick={handleDeselectAll}>
          Deselect All
        </Button>
        {selectedUsers.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {selectedUsers.length} selected
          </Badge>
        )}
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={`cursor-pointer transition-colors ${
            selectedUsers.includes(user.id) ? 'ring-2 ring-primary' : ''
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
                  <div>
                    <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {user.role}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs">
                    {user.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {user.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {user.assignedSurveys} surveys
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Users Summary */}
      {selectedUsersData.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Users ({selectedUsersData.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedUsersData.map((user) => (
              <Badge 
                key={user.id} 
                variant="secondary" 
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleUserToggle(user.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}