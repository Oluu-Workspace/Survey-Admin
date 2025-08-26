"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockAuditLogs, type AuditLog } from "@/lib/mock-data"
import { Settings, Shield, FileText, Save, Upload } from "lucide-react"

export function SystemManagement() {
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [systemSettings, setSystemSettings] = useState({
    systemName: "Kenya Research Platform",
    supportEmail: "support@research.ke",
    maxAgentsPerAdmin: 50,
    sessionTimeout: 30,
    enableMultiLanguage: true,
    enableAuditLogs: true,
    enableEmailNotifications: true,
    dataRetentionDays: 365,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSystemSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={systemSettings.systemName}
                    onChange={(e) => handleSettingChange("systemName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={systemSettings.supportEmail}
                    onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAgents">Max Agents per Admin</Label>
                  <Input
                    id="maxAgents"
                    type="number"
                    value={systemSettings.maxAgentsPerAdmin}
                    onChange={(e) => handleSettingChange("maxAgentsPerAdmin", Number.parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => handleSettingChange("sessionTimeout", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Multi-language Support</Label>
                    <p className="text-sm text-gray-600">Enable English and Swahili interface</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableMultiLanguage}
                    onCheckedChange={(checked) => handleSettingChange("enableMultiLanguage", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send system notifications via email</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableEmailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("enableEmailNotifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-gray-600">Track all admin actions</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableAuditLogs}
                    onCheckedChange={(checked) => handleSettingChange("enableAuditLogs", checked)}
                  />
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>System Logo</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload logo (PNG, JPG, SVG)</p>
                  <p className="text-xs text-gray-500">Recommended size: 200x60px</p>
                </div>
              </div>

              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" placeholder="Kenya Research Institute" />
              </div>

              <div>
                <Label htmlFor="tagline">System Tagline</Label>
                <Input id="tagline" placeholder="Empowering Data-Driven Decisions" />
              </div>

              <div>
                <Label htmlFor="description">System Description</Label>
                <Textarea id="description" placeholder="Brief description of your research platform..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 bg-blue-600 rounded border"></div>
                    <Input value="#2563eb" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 bg-gray-600 rounded border"></div>
                    <Input value="#4b5563" className="flex-1" />
                  </div>
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Update Branding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  value={systemSettings.dataRetentionDays}
                  onChange={(e) => handleSettingChange("dataRetentionDays", Number.parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-600 mt-1">How long to keep survey data before archival</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Restriction</Label>
                    <p className="text-sm text-gray-600">Limit access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-gray-600">Encrypt sensitive data at rest</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div>
                <Label>Allowed IP Addresses</Label>
                <Textarea placeholder="192.168.1.0/24&#10;10.0.0.0/8" rows={3} className="mt-2" />
                <p className="text-sm text-gray-600 mt-1">One IP address or CIDR block per line</p>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Update Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <p className="text-sm text-gray-600">Track all administrative actions and system events</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Timestamp</th>
                      <th className="text-left p-3 font-medium">Admin</th>
                      <th className="text-left p-3 font-medium">Action</th>
                      <th className="text-left p-3 font-medium">Target</th>
                      <th className="text-left p-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-sm font-medium">{log.adminName}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{log.action}</span>
                        </td>
                        <td className="p-3 text-sm">{log.target}</td>
                        <td className="p-3 text-sm text-gray-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
