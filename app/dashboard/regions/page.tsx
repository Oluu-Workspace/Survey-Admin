import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { RegionalAssignment } from "@/components/regions/regional-assignment"

export default function RegionsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regional Assignment</h1>
            <p className="text-gray-600">Manage regional assignments and coverage</p>
          </div>
          <RegionalAssignment />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
