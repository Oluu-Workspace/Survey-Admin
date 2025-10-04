import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span>Powered by Olusiekwin • olusiekwin.com</span>
          </div>

          <h1 className="mb-6 text-balance font-sans text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Streamline your research with <span className="text-accent">Tafiti</span>
          </h1>

          <p className="mb-10 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            The comprehensive survey research platform for Kenya. Collect data seamlessly, track progress effortlessly, and
            deliver insights for evidence-based decision making.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="group w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Trusted by research teams across Kenya • Secure data collection • Real-time analytics
          </p>
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_50%)] opacity-10" />
    </section>
  )
}
