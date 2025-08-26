// Mock data for testing the admin dashboard functionality

export interface Agent {
  id: string
  name: string
  email: string
  phone: string
  status: "pending" | "active" | "suspended" | "deactivated"
  county: string
  subcounty: string
  ward: string
  village: string
  registeredAt: string
  lastActive: string
  surveysCompleted: number
  isOnline: boolean
}

export interface Survey {
  id: string
  title: string
  description: string
  status: "draft" | "active" | "completed" | "archived"
  createdAt: string
  assignedRegions: string[]
  totalQuestions: number
  submissions: number
  targetSubmissions: number
  questions: SurveyQuestion[]
}

export interface SurveyQuestion {
  id: string
  type: "text" | "number" | "dropdown" | "multiple-choice" | "date"
  question: string
  required: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
}

export interface Submission {
  id: string
  surveyId: string
  agentId: string
  agentName: string
  county: string
  subcounty: string
  ward: string
  village: string
  submittedAt: string
  status: "valid" | "flagged" | "duplicate"
  responses: Record<string, any>
  isOfflineSubmission: boolean
}

export interface AuditLog {
  id: string
  adminId: string
  adminName: string
  action: string
  target: string
  details: string
  timestamp: string
}

// Mock Kenyan counties and their subdivisions
export const kenyanRegions = {
  Nairobi: {
    subcounties: [
      "Westlands",
      "Dagoretti North",
      "Dagoretti South",
      "Langata",
      "Kibra",
      "Roysambu",
      "Kasarani",
      "Ruaraka",
      "Embakasi South",
      "Embakasi North",
      "Embakasi Central",
      "Embakasi East",
      "Embakasi West",
      "Makadara",
      "Kamukunji",
      "Starehe",
      "Mathare",
    ],
    wards: {
      Westlands: ["Kitisuru", "Parklands/Highridge", "Karura", "Kangemi", "Mountain View"],
      Langata: ["Karen", "Nairobi West", "Mugumo-ini", "South C", "Nyayo Highrise"],
    },
  },
  Mombasa: {
    subcounties: ["Changamwe", "Jomba", "Kisauni", "Nyali", "Likoni", "Mvita"],
    wards: {
      Nyali: ["Frere Town", "Ziwa la Ng'ombe", "Mkomani", "Kongowea"],
      Mvita: ["Mji wa Kale/Makadara", "Tudor", "Tononoka", "Shimanzi/Ganjoni"],
    },
  },
  Kisumu: {
    subcounties: ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
    wards: {
      "Kisumu Central": ["Railways", "Migosi", "Shaurimoyo Kaloleni", "Market Milimani", "Kondele"],
      "Kisumu East": ["Kajulu", "Kolwa East", "Manyatta B", "Nyalenda A", "Nyalenda B"],
    },
  },
}

// Mock agents data
export const mockAgents: Agent[] = [
  {
    id: "agent-001",
    name: "John Kamau",
    email: "john.kamau@research.ke",
    phone: "+254712345678",
    status: "active",
    county: "Nairobi",
    subcounty: "Westlands",
    ward: "Kitisuru",
    village: "Kitisuru Village",
    registeredAt: "2024-01-15T10:30:00Z",
    lastActive: "2024-01-26T14:22:00Z",
    surveysCompleted: 45,
    isOnline: true,
  },
  {
    id: "agent-002",
    name: "Mary Wanjiku",
    email: "mary.wanjiku@research.ke",
    phone: "+254723456789",
    status: "active",
    county: "Nairobi",
    subcounty: "Langata",
    ward: "Karen",
    village: "Karen Estate",
    registeredAt: "2024-01-10T09:15:00Z",
    lastActive: "2024-01-26T16:45:00Z",
    surveysCompleted: 67,
    isOnline: true,
  },
  {
    id: "agent-003",
    name: "Peter Ochieng",
    email: "peter.ochieng@research.ke",
    phone: "+254734567890",
    status: "pending",
    county: "Kisumu",
    subcounty: "Kisumu Central",
    ward: "Railways",
    village: "Railways Estate",
    registeredAt: "2024-01-25T11:20:00Z",
    lastActive: "2024-01-25T11:20:00Z",
    surveysCompleted: 0,
    isOnline: false,
  },
  {
    id: "agent-004",
    name: "Grace Akinyi",
    email: "grace.akinyi@research.ke",
    phone: "+254745678901",
    status: "suspended",
    county: "Mombasa",
    subcounty: "Nyali",
    ward: "Frere Town",
    village: "Frere Town Center",
    registeredAt: "2024-01-05T08:45:00Z",
    lastActive: "2024-01-20T12:30:00Z",
    surveysCompleted: 23,
    isOnline: false,
  },
  {
    id: "agent-005",
    name: "David Kiprop",
    email: "david.kiprop@research.ke",
    phone: "+254756789012",
    status: "active",
    county: "Nairobi",
    subcounty: "Kasarani",
    ward: "Clay City",
    village: "Mwiki",
    registeredAt: "2024-01-08T13:10:00Z",
    lastActive: "2024-01-26T09:15:00Z",
    surveysCompleted: 38,
    isOnline: false,
  },
]

// Mock surveys data
export const mockSurveys: Survey[] = [
  {
    id: "survey-001",
    title: "Household Income Survey 2024",
    description: "Comprehensive survey on household income levels and economic status across Kenya",
    status: "active",
    createdAt: "2024-01-10T10:00:00Z",
    assignedRegions: ["Nairobi", "Mombasa", "Kisumu"],
    totalQuestions: 25,
    submissions: 1247,
    targetSubmissions: 2000,
    questions: [
      {
        id: "q1",
        type: "text",
        question: "What is your full name?",
        required: true,
      },
      {
        id: "q2",
        type: "number",
        question: "What is your monthly household income (KES)?",
        required: true,
        validation: { min: 0, max: 1000000 },
      },
      {
        id: "q3",
        type: "dropdown",
        question: "What is your highest level of education?",
        required: true,
        validation: {
          options: ["Primary", "Secondary", "Certificate", "Diploma", "Degree", "Masters", "PhD"],
        },
      },
    ],
  },
  {
    id: "survey-002",
    title: "Healthcare Access Study",
    description: "Research on healthcare accessibility and quality in rural and urban areas",
    status: "active",
    createdAt: "2024-01-15T14:30:00Z",
    assignedRegions: ["Nairobi", "Kisumu"],
    totalQuestions: 18,
    submissions: 892,
    targetSubmissions: 1500,
    questions: [
      {
        id: "q1",
        type: "text",
        question: "Name of nearest healthcare facility",
        required: true,
      },
      {
        id: "q2",
        type: "number",
        question: "Distance to nearest healthcare facility (km)",
        required: true,
        validation: { min: 0, max: 100 },
      },
    ],
  },
  {
    id: "survey-003",
    title: "Digital Literacy Assessment",
    description: "Assessment of digital skills and technology adoption rates",
    status: "draft",
    createdAt: "2024-01-20T09:00:00Z",
    assignedRegions: [],
    totalQuestions: 15,
    submissions: 0,
    targetSubmissions: 1000,
    questions: [],
  },
]

// Mock submissions data
export const mockSubmissions: Submission[] = [
  {
    id: "sub-001",
    surveyId: "survey-001",
    agentId: "agent-001",
    agentName: "John Kamau",
    county: "Nairobi",
    subcounty: "Westlands",
    ward: "Kitisuru",
    village: "Kitisuru Village",
    submittedAt: "2024-01-26T10:15:00Z",
    status: "valid",
    responses: {
      q1: "Jane Doe",
      q2: 45000,
      q3: "Degree",
    },
    isOfflineSubmission: false,
  },
  {
    id: "sub-002",
    surveyId: "survey-001",
    agentId: "agent-002",
    agentName: "Mary Wanjiku",
    county: "Nairobi",
    subcounty: "Langata",
    ward: "Karen",
    village: "Karen Estate",
    submittedAt: "2024-01-26T11:30:00Z",
    status: "flagged",
    responses: {
      q1: "John Smith",
      q2: 150000,
      q3: "Masters",
    },
    isOfflineSubmission: true,
  },
  {
    id: "sub-003",
    surveyId: "survey-002",
    agentId: "agent-001",
    agentName: "John Kamau",
    county: "Nairobi",
    subcounty: "Westlands",
    ward: "Kitisuru",
    village: "Kitisuru Village",
    submittedAt: "2024-01-26T12:45:00Z",
    status: "duplicate",
    responses: {
      q1: "Nairobi Hospital",
      q2: 2.5,
    },
    isOfflineSubmission: false,
  },
]

// Mock audit logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-001",
    adminId: "admin-001",
    adminName: "Admin User",
    action: "AGENT_APPROVED",
    target: "agent-001",
    details: "Approved agent John Kamau for Nairobi region",
    timestamp: "2024-01-26T09:30:00Z",
  },
  {
    id: "audit-002",
    adminId: "admin-001",
    adminName: "Admin User",
    action: "SURVEY_CREATED",
    target: "survey-001",
    details: "Created new survey: Household Income Survey 2024",
    timestamp: "2024-01-26T10:15:00Z",
  },
  {
    id: "audit-003",
    adminId: "admin-001",
    adminName: "Admin User",
    action: "AGENT_SUSPENDED",
    target: "agent-004",
    details: "Suspended agent Grace Akinyi due to data quality issues",
    timestamp: "2024-01-26T11:45:00Z",
  },
  {
    id: "audit-004",
    adminId: "admin-001",
    adminName: "Admin User",
    action: "DATA_EXPORT",
    target: "survey-001",
    details: "Exported survey data to CSV format",
    timestamp: "2024-01-26T14:20:00Z",
  },
]

// Analytics mock data
export const mockAnalytics = {
  totalAgents: mockAgents.length,
  activeAgents: mockAgents.filter((a) => a.status === "active").length,
  pendingAgents: mockAgents.filter((a) => a.status === "pending").length,
  onlineAgents: mockAgents.filter((a) => a.isOnline).length,
  totalSurveys: mockSurveys.length,
  activeSurveys: mockSurveys.filter((s) => s.status === "active").length,
  totalSubmissions: mockSubmissions.length,
  validSubmissions: mockSubmissions.filter((s) => s.status === "valid").length,
  flaggedSubmissions: mockSubmissions.filter((s) => s.status === "flagged").length,
  duplicateSubmissions: mockSubmissions.filter((s) => s.status === "duplicate").length,
  offlineSubmissions: mockSubmissions.filter((s) => s.isOfflineSubmission).length,
  submissionsByCounty: {
    Nairobi: 2,
    Mombasa: 0,
    Kisumu: 1,
  },
  submissionsByDate: [
    { date: "2024-01-20", count: 45 },
    { date: "2024-01-21", count: 52 },
    { date: "2024-01-22", count: 38 },
    { date: "2024-01-23", count: 67 },
    { date: "2024-01-24", count: 43 },
    { date: "2024-01-25", count: 58 },
    { date: "2024-01-26", count: 72 },
  ],
}
