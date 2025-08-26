import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SystemManagement } from "@/components/system/system-management"

export default function SystemPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
            <p className="text-gray-600">Manage system settings, audit logs, and branding</p>
          </div>
          <SystemManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
