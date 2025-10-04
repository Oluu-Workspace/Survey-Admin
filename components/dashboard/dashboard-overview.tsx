"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useState, useEffect } from "react"
import { Users, FileText, Database, TrendingUp, CheckCircle, Clock, Wifi } from "lucide-react"
import Link from "next/link"

export function DashboardOverview() {
  const [analytics, setAnalytics] = useState(null)
  const [agents, setAgents] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, agentsData, submissionsData] = await Promise.all([
          apiClient.getDashboardData(),
          apiClient.getAgents(),
          apiClient.getResponses()
        ])
        
        setAnalytics(analyticsData)
        setAgents(agentsData.agents || agentsData)
        setSubmissions(submissionsData.responses || submissionsData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const recentSubmissions = submissions.slice(0, 5)
  const pendingAgents = agents.filter((a) => a.status === "pending")
  const onlineAgents = agents.filter((a) => a.is_online)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{analytics?.user_stats?.total_agents || agents.length}</p>
                <p className="text-xs text-green-600">{analytics?.user_stats?.active_agents || agents.filter(a => a.status === 'active').length} active</p>
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
                <p className="text-2xl font-bold">{analytics?.survey_stats?.active_surveys || 0}</p>
                <p className="text-xs text-blue-600">{analytics?.survey_stats?.total_surveys || 0} total</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold">{analytics?.response_stats?.total_responses || submissions.length}</p>
                <p className="text-xs text-yellow-600">{submissions.filter(s => s.status === 'flagged').length} flagged</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Quality</p>
                <p className="text-2xl font-bold">94.2%</p>
                <p className="text-xs text-green-600">+2.1% this week</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAgents.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Agent Approvals</p>
                  <p className="text-xs text-gray-600">{pendingAgents.length} agents waiting</p>
                </div>
                <Link href="/dashboard/agents">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            {submissions.filter(s => s.status === 'flagged').length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Flagged Data</p>
                  <p className="text-xs text-gray-600">{submissions.filter(s => s.status === 'flagged').length} submissions need review</p>
                </div>
                <Link href="/dashboard/data">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">System Backup</p>
                <p className="text-xs text-gray-600">Last backup: 2 hours ago</p>
              </div>
              <Button size="sm" variant="outline">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Online Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-600" />
              Online Agents ({onlineAgents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onlineAgents.slice(0, 4).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{agent.first_name} {agent.last_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{agent.county}</span>
                </div>
              ))}
              {onlineAgents.length > 4 && (
                <Link href="/dashboard/agents">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View all {onlineAgents.length} online agents
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{submission.agent_name || 'Unknown Agent'}</p>
                    <p className="text-xs text-gray-500">{submission.county || 'Unknown County'}</p>
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
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/data">
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View all submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(
              submissions.reduce((acc, submission) => {
                const county = submission.county || 'Unknown'
                acc[county] = (acc[county] || 0) + 1
                return acc
              }, {})
            ).map(([county, count]) => (
              <div key={county} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{county}</p>
                    <p className="text-sm text-gray-600">
                      {agents.filter((a) => a.county === county).length} agents
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-gray-500">submissions</p>
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
