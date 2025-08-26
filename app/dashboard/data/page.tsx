import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DataManagement } from "@/components/data/data-management"

export default function DataPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
            <p className="text-gray-600">Monitor and manage survey data submissions</p>
          </div>
          <DataManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
