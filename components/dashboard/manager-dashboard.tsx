"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockAnalytics, mockAgents, mockSubmissions } from "@/lib/mock-data"
import { Users, FileText, TrendingUp, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

export function ManagerDashboard() {
  const recentSubmissions = mockSubmissions.slice(0, 5)
  const pendingAgents = mockAgents.filter((a) => a.status === "pending")
  const activeAgents = mockAgents.filter((a) => a.status === "active")

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{activeAgents.length}</p>
                <p className="text-xs text-green-600">{pendingAgents.length} pending approval</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold">{mockAnalytics.activeSurveys}</p>
                <p className="text-xs text-blue-600">{mockAnalytics.totalSurveys} total</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Submissions</p>
                <p className="text-2xl font-bold">{mockAnalytics.totalSubmissions}</p>
                <p className="text-xs text-yellow-600">{mockAnalytics.flaggedSubmissions} flagged</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Performance</p>
                <p className="text-2xl font-bold">87.3%</p>
                <p className="text-xs text-green-600">+5.2% this week</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAgents.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Agent Approvals</p>
                  <p className="text-xs text-gray-600">{pendingAgents.length} agents waiting for approval</p>
                </div>
                <Link href="/dashboard/agents">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Team Performance</p>
                <p className="text-xs text-gray-600">View detailed team analytics</p>
              </div>
              <Link href="/dashboard/analytics">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Assign Surveys</p>
                <p className="text-xs text-gray-600">Distribute surveys to team members</p>
              </div>
              <Link href="/dashboard/surveys">
                <Button size="sm" variant="outline">
                  Assign
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Team Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Recent Team Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{submission.agentName}</p>
                    <p className="text-xs text-gray-500">{submission.county}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        submission.status === "valid"
                          ? "bg-green-100 text-green-800"
                          : submission.status === "flagged"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {submission.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/data">
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View all team submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeAgents.slice(0, 3).map((agent) => (
              <div key={agent.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-600">{agent.county}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{agent.surveysCompleted || 0}</p>
                    <p className="text-xs text-gray-500">surveys</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

