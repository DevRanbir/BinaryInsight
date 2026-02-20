
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
        risk: "Low",
        checks: [
            { name: "Build", status: "passed" },
            { name: "Lint", status: "passed" },
            { name: "Tests", status: "failed" },
        ]
    }

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
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <span className="font-medium text-lg">{pr.risk} Risk</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">AI Analysis indicates minimal impact on core services.</p>
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
