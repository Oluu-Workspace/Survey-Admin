"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Mock credentials for testing
    const mockCredentials = {
      "admin@research.ke": { password: "admin123", role: "admin", name: "Admin User" },
      "manager@research.ke": { password: "manager123", role: "manager", name: "Manager User" },
      "user@research.ke": { password: "user123", role: "user", name: "Regular User" },
    }

    setTimeout(() => {
      const user = mockCredentials[email as keyof typeof mockCredentials]

      if (user && user.password === password) {
        login({
          id: "1",
          email,
          name: user.name,
          role: user.role as "admin" | "manager" | "user",
        })
      } else {
        setError("Invalid email or password")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
        <p className="text-sm text-muted-foreground">Enter your credentials to access the dashboard</p>
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded border">
          <p className="font-medium mb-1">Demo Credentials:</p>
          <p>Admin: admin@research.ke / admin123</p>
          <p>Manager: manager@research.ke / manager123</p>
          <p>User: user@research.ke / user123</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@research.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <Button type="submit" className="w-full h-10" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
