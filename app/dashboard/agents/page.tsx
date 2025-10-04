import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AgentsManagement } from "@/components/agents/agents-management"

export default function AgentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
            <p className="text-gray-600">Manage field agents, invitations, and registrations</p>
          </div>
          <AgentsManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
