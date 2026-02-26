
"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

export default function PRDetailsPage() {
    const params = useParams()
    const { id } = params

    // Mock data simulation
    const pr = {
        id: id,
        title: "Implement New Authentication Flow",
        author: "devuser",
        status: "Open",
        description: "This PR introduces GitHub OAuth using NextAuth.js. It includes new API routes and session management.",
        diff: {
            filesChanged: [
                "client/src/auth.ts",
                "client/src/app/api/auth/[...nextauth]/route.ts",
                ".github/workflows/deploy.yml",
                "client/.env.example"
            ],
            propertyChanges: [
                "workflow permissions: contents read -> write",
                "cookie config: secure false -> true"
            ],
            envAdded: ["GITHUB_CLIENT_SECRET"],
            envRemoved: ["NEXTAUTH_URL"],
            linesAdded: 482,
            linesRemoved: 289
        },
        checks: [
            { name: "Build", status: "passed" },
            { name: "Lint", status: "passed" },
            { name: "Tests", status: "failed" },
        ]
    }

    const totalChurn = pr.diff.linesAdded + pr.diff.linesRemoved
    const hasSensitiveFileChanges = pr.diff.filesChanged.some((file) =>
        file.includes(".env") || file.includes("workflow") || file.includes("auth")
    )
    const hasEnvChanges = pr.diff.envAdded.length > 0 || pr.diff.envRemoved.length > 0
    const hasLargeChurn = totalChurn > 600

    const findings = [
        {
            name: "Sensitive files/properties changed",
            detail: hasSensitiveFileChanges
                ? `${pr.diff.filesChanged.length} files include auth/workflow/env paths with ${pr.diff.propertyChanges.length} property updates.`
                : "No sensitive file paths or security-relevant property updates detected.",
            status: hasSensitiveFileChanges ? "warning" : "passed"
        },
        {
            name: "Environment variable changes",
            detail: hasEnvChanges
                ? `Added: ${pr.diff.envAdded.join(", ") || "none"} · Removed: ${pr.diff.envRemoved.join(", ") || "none"}`
                : "No environment variable additions or removals.",
            status: hasEnvChanges ? "warning" : "passed"
        },
        {
            name: "Large diff / churn",
            detail: `${pr.diff.linesAdded} additions, ${pr.diff.linesRemoved} deletions (${totalChurn} total).`,
            status: hasLargeChurn ? "warning" : "passed"
        }
    ]

    const warningCount = findings.filter((f) => f.status === "warning").length
    const risk = warningCount >= 3 ? "High" : warningCount === 2 ? "Medium" : warningCount === 1 ? "Low" : "Minimal"
    const riskDotClass = risk === "High" ? "bg-red-500" : risk === "Medium" ? "bg-yellow-500" : "bg-green-500"

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {pr.title} <span className="text-gray-400 font-normal">#{id}</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Opened by <span className="font-semibold text-gray-900">{pr.author}</span></p>
                </div>
                <Badge className="bg-green-500 text-white text-md px-3 py-1">{pr.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 leading-relaxed">{pr.description}</p>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${riskDotClass}`}></div>
                                <span className="font-medium text-lg">{risk} Risk</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Security analysis checks file/property changes, env updates, and total diff churn.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Security Analysis</CardTitle>
                            <CardDescription>Flags risky pull request changes before merge.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {findings.map((item, idx) => (
                                <div key={idx} className="rounded-md border p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        {item.status === "passed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {item.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Checks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pr.checks.map((check, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{check.name}</span>
                                    {check.status === "passed" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                    {check.status === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
                                    {check.status === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
