"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { Suspense } from "react"

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">View comprehensive analytics and performance metrics</p>
          </div>
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading analytics...</div>}>
            <AnalyticsDashboard />
          </Suspense>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
