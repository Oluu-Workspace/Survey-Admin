import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UsersManagement } from "@/components/users/users-management"

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage admin users and permissions</p>
          </div>
          <UsersManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
