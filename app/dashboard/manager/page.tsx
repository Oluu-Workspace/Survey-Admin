import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"

export default function ManagerDashboardPage() {
  return (
    <ProtectedRoute requiredRole="manager">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600">Project management and team oversight</p>
          </div>
          <ManagerDashboard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

