"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect based on role
      if (user?.role === "admin") {
        router.push("/dashboard")
      } else if (user?.role === "manager") {
        router.push("/dashboard/manager")
      } else {
        router.push("/dashboard/agent")
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">SurveyPro</h1>
          <p className="text-muted-foreground">Kenya Survey Research Platform - Admin Login</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
