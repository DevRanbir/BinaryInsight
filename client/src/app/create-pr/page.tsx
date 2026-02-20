
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useState } from "react"

export default function CreatePRPage() {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Add GitHub API call logic here
        setTimeout(() => {
            setLoading(false)
            alert("PR Creation Simulation: Success")
        }, 1500)
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create Pull Request</CardTitle>
                    <CardDescription>Select branches and describe your changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Source Branch</label>
                                <Input placeholder="e.g., feature/new-login" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Branch</label>
                                <Input placeholder="e.g., main" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input placeholder="PR Title" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea placeholder="Describe your changes..." className="min-h-[150px]" />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create Pull Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
