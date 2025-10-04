"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockAnalytics, mockSubmissions } from "@/lib/mock-data"
import { FileText, CheckCircle, Clock, MapPin, Smartphone, Wifi } from "lucide-react"
import Link from "next/link"

export function AgentDashboard() {
  const mySubmissions = mockSubmissions.slice(0, 5)
  const completedSurveys = mockSubmissions.filter(s => s.status === "valid").length
  const pendingSurveys = mockSubmissions.filter(s => s.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Surveys</p>
                <p className="text-2xl font-bold">{completedSurveys}</p>
                <p className="text-xs text-green-600">completed</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingSurveys}</p>
                <p className="text-xs text-yellow-600">awaiting review</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Quality</p>
                <p className="text-2xl font-bold">96.8%</p>
                <p className="text-xs text-green-600">excellent</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-sm font-bold">Kiambu</p>
                <p className="text-xs text-blue-600">Thika Township</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Start New Survey</p>
                <p className="text-xs text-gray-600">Begin data collection</p>
              </div>
              <Link href="/dashboard/surveys/new">
                <Button size="sm" variant="outline">
                  Start
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">View Assigned Surveys</p>
                <p className="text-xs text-gray-600">Check your survey assignments</p>
              </div>
              <Link href="/dashboard/surveys">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">My Performance</p>
                <p className="text-xs text-gray-600">View your statistics</p>
              </div>
              <Link href="/dashboard/profile">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-600" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Online</p>
                  <p className="text-xs text-gray-600">Connected to server</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Data Sync</p>
                <p className="text-xs text-gray-600">Last sync: 2 minutes ago</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Up to date</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Offline Mode</p>
                <p className="text-xs text-gray-600">3 surveys saved locally</p>
              </div>
              <Button size="sm" variant="outline">
                Sync
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mySubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Survey #{submission.id.slice(-6)}</p>
                  <p className="text-xs text-gray-500">{submission.county} • {new Date(submission.submittedAt).toLocaleDateString()}</p>
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
                    {submission.questionsAnswered || 15} questions
                  </p>
                </div>
              </div>
            ))}
            <Link href="/dashboard/submissions">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                View all my submissions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

