"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Use real API authentication
      await login({
        email,
        password,
      })
      
      // Redirect to dashboard after successful login
      router.push("/dashboard")
    } catch (error) {
      // Handle specific error cases with clear messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (error.message.includes('404') || error.message.includes('User not found')) {
          setError("User not found. Please check your email address or contact your administrator.")
        } else if (error.message.includes('403') || error.message.includes('Access denied')) {
          setError("Access denied. Your account may not have permission to access this system.")
        } else if (error.message.includes('500') || error.message.includes('Server error')) {
          setError("Server error. Please try again later or contact support if the problem persists.")
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          setError("Connection error. Please check your internet connection and try again.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border shadow-lg max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
        <p className="text-sm text-muted-foreground">Enter your credentials to access the dashboard</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200 text-center">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
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
