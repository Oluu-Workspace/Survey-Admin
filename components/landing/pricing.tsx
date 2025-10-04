import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$9",
    description: "Perfect for small research teams getting started",
    features: ["Up to 5 team members", "10 surveys", "Basic reporting", "Email support", "5GB storage"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$29",
    description: "For growing teams that need more power",
    features: [
      "Up to 25 team members",
      "Unlimited surveys",
      "Advanced reporting & analytics",
      "Priority support",
      "100GB storage",
      "Custom workflows",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For large organizations with advanced needs",
    features: [
      "Unlimited team members",
      "Unlimited surveys",
      "Advanced security & compliance",
      "Dedicated account manager",
      "Unlimited storage",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section className="bg-background py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Choose the perfect plan for your team. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border-border bg-card ${
                plan.popular ? "border-2 border-accent shadow-xl" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl font-bold text-card-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-accent" />
                      <span className="text-sm leading-relaxed text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
