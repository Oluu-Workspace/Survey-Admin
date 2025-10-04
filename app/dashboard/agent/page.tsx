import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AgentDashboard } from "@/components/dashboard/agent-dashboard"

export default function AgentDashboardPage() {
  return (
    <ProtectedRoute requiredRole="enumerator">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Field Agent Dashboard</h1>
            <p className="text-gray-600">Survey collection and data entry</p>
          </div>
          <AgentDashboard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

