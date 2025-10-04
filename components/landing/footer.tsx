import { Github, Twitter, Linkedin } from "lucide-react"

const footerLinks = {
  platform: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Survey Management", href: "/dashboard" },
    { name: "Agent Management", href: "/dashboard" },
    { name: "Analytics", href: "/dashboard" },
  ],
  research: [
    { name: "Data Collection", href: "#" },
    { name: "Regional Coverage", href: "#" },
    { name: "Quality Assurance", href: "#" },
    { name: "Export & Reports", href: "#" },
  ],
  support: [
    { name: "Documentation", href: "#" },
    { name: "Help Center", href: "#" },
    { name: "Training", href: "#" },
    { name: "Contact Support", href: "#" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Data Protection", href: "#" },
    { name: "Compliance", href: "#" },
  ],
}

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-4 text-2xl font-bold text-foreground">Tafiti</div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tafiti - Streamline your research and boost team productivity. 
              Powered by <a href="https://olusiekwin.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Olusiekwin</a>.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-muted-foreground transition-colors hover:text-accent"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Research</h3>
            <ul className="space-y-3">
              {footerLinks.research.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tafiti by Olusiekwin. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
