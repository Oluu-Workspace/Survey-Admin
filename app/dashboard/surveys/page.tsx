import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SurveyManagement } from "@/components/surveys/survey-management"

export default function SurveysPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Survey Management</h1>
            <p className="text-gray-600">Create, edit, and manage surveys</p>
          </div>
          <SurveyManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
