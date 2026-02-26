
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignIn } from "@/components/SignIn"
import { GitPullRequest, ShieldCheck, CheckCircle2 } from "lucide-react"
import ColorBends from "@/components/ColorBends"

export default function LoginPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
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
            <div className="absolute inset-0 -z-10 bg-background/75" />

            <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 md:py-16 min-h-screen grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                    <Link href="/" className="inline-flex items-center font-semibold text-lg">
                        <GitPullRequest className="h-5 w-5 mr-2" /> BinaryInsight
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Welcome back.
                        <span className="block">Let’s review better code today.</span>
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        Sign in with GitHub to access your dashboard, browse repository branches,
                        and review pull requests with full file context.
                    </p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5" />Branch-aware file exploration</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5" />Markdown and image preview support</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5" />Pull request visibility beside code</li>
                    </ul>
                </div>

                <Card className="w-full max-w-md justify-self-start md:justify-self-end bg-card/95 backdrop-blur">
                    <CardHeader className="space-y-2">
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription>Use your GitHub account to continue to the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <SignIn />
                        <p className="text-xs text-muted-foreground">
                            By continuing, you authorize BinaryInsight to access repositories needed for review.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
