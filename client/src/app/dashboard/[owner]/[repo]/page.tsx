
"use client"

import { ResizableCommon } from "@/components/ResizableCommon"
import { useParams } from "next/navigation"

export default function RepoAnalyticsPage() {
    const params = useParams()
    const { owner, repo } = params

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <header className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                <h1 className="text-xl font-bold truncate">
                    {owner} / {repo}
                </h1>
            </header>
            <main className="flex-1 overflow-hidden h-full">
                <ResizableCommon owner={owner as string} repo={repo as string} />
            </main>
        </div>
    )
}
