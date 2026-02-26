
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, GitPullRequest, ShieldCheck, Activity, Sparkles, CheckCircle2 } from "lucide-react"
import ColorBends from "@/components/ColorBends"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur px-4 lg:px-8 h-16 flex items-center">
        <Link className="flex items-center justify-center font-bold text-lg" href="#">
          <GitPullRequest className="h-5 w-5 mr-2" />
          BinaryInsight
        </Link>
        <nav className="ml-auto flex items-center gap-3 sm:gap-4">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
            How it works
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link href="/login">
            <Button size="sm">Start Reviewing</Button>
          </Link>
        </nav>
      </header>
      <main>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 opacity-80">
            <ColorBends
              colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
              rotation={0}
              speed={0.2}
              scale={1}
              frequency={1}
              warpStrength={1}
              mouseInfluence={1}
              parallax={0.5}
              noise={0.1}
              transparent
              autoRotate={0}
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-background/70" />
          <div className="px-4 md:px-8 py-20 md:py-28 lg:py-32">
            <div className="max-w-5xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border bg-card/80 px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-2" /> AI-powered pull request intelligence
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Review code faster,
                <span className="block">merge with confidence.</span>
              </h1>
              <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
                BinaryInsight helps your team inspect repository changes, understand risk quickly,
                and ship with fewer surprises.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link href="/login">
                  <Button className="h-11 px-8" size="lg">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" className="h-11 px-8" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-sm">
                <div className="rounded-lg border bg-card/85 px-4 py-3">Repository tree + branch browsing</div>
                <div className="rounded-lg border bg-card/85 px-4 py-3">Markdown & image preview in-app</div>
                <div className="rounded-lg border bg-card/85 px-4 py-3">Centralized PR visibility</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-4 md:px-8 py-14 md:py-20 border-b">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">Everything your review flow needs</h2>
              <p className="text-muted-foreground mt-2">Built for speed, context, and confident decisions.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                  <GitPullRequest className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Pull request visibility</h3>
                <p className="text-sm text-muted-foreground">
                  Track pull requests by repository and keep context close to the code you inspect.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Risk-aware workflow</h3>
                <p className="text-sm text-muted-foreground">
                  Review file changes, inspect key content, and reduce surprises before merge and deploy.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Live repository exploration</h3>
                <p className="text-sm text-muted-foreground">
                  Browse by branch, open files quickly, and preview markdown and images without leaving the dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 md:px-8 py-14 md:py-20">
          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 items-start">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold">How it works</h2>
              <p className="text-muted-foreground">
                Connect your GitHub account and inspect repositories through one focused review workspace.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5" />Choose repository and branch context</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5" />Inspect files with syntax-friendly previews</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5" />Review pull requests side-by-side with code</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6 md:p-8">
              <h3 className="font-semibold text-lg">Ready to start?</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-5">
                Sign in with GitHub and open your dashboard in under a minute.
              </p>
              <Link href="/login">
                <Button className="w-full h-11">
                  Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t px-4 md:px-8 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center">
        <p>© 2026 BinaryInsight. All rights reserved.</p>
        <div className="sm:ml-auto">Built for faster, smarter code reviews.</div>
      </footer>
    </div>
  )
}
