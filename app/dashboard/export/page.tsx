import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ExportCenter } from "@/components/export/export-center"

export default function ExportPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
            <p className="text-gray-600">Export data and generate reports</p>
          </div>
          <ExportCenter />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
