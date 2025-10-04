import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Users, BarChart3, MapPin, Shield, Smartphone } from "lucide-react"

const features = [
  {
    icon: LayoutDashboard,
    title: "Real-time Dashboard",
    description:
      "Monitor survey progress, agent activity, and data collection in real-time. Get instant insights into your research project's performance.",
  },
  {
    icon: Users,
    title: "Agent Management",
    description:
      "Efficiently manage field agents across Kenya. Track their performance, assign surveys, and monitor data quality from a centralized platform.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Generate comprehensive reports and analytics. Visualize data trends, completion rates, and research insights to support evidence-based decisions.",
  },
  {
    icon: MapPin,
    title: "Regional Coverage",
    description:
      "Cover all 47 counties in Kenya with our regional assignment system. Track data collection across counties, subcounties, wards, and villages.",
  },
  {
    icon: Shield,
    title: "Data Security",
    description:
      "Enterprise-grade security ensures your research data is protected. Secure data collection, storage, and transmission with encryption.",
  },
  {
    icon: Smartphone,
    title: "Mobile Support",
    description:
      "Field agents can collect data offline and sync when connected. Works seamlessly on mobile devices for efficient field data collection.",
  },
]

export function Features() {
  return (
    <section className="border-b border-border bg-background py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Comprehensive Survey Research Platform
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Everything you need to conduct successful research across Kenya. From data collection to analysis and reporting.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border bg-card transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
