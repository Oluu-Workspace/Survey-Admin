import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Survey Research Platform</h1>
          <p className="text-muted-foreground">Admin Dashboard - Kenya Research Initiative</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
