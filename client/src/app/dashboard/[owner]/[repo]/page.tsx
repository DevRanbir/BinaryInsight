
"use client"

import { ResizableCommon } from "@/components/ResizableCommon"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function RepoAnalyticsPage() {
    const { data: session } = useSession()
    const token: string | undefined = (session as any)?.accessToken
    const params = useParams()
    const { owner, repo } = params
    const [branches, setBranches] = useState<string[]>([])
    const [selectedBranch, setSelectedBranch] = useState("main")

    useEffect(() => {
        if (!token || !owner || !repo) return
        fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    const branchNames = data.map((branch: { name: string }) => branch.name)
                    setBranches(branchNames)
                    setSelectedBranch((previousBranch) =>
                        branchNames.includes(previousBranch)
                            ? previousBranch
                            : branchNames.includes("main")
                                ? "main"
                                : branchNames.includes("master")
                                    ? "master"
                                    : branchNames[0]
                    )
                }
            })
            .catch(() => {
                setBranches([])
            })
    }, [token, owner, repo])

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <header className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                <h1 className="text-xl font-bold truncate">
                    {owner} / {repo}
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Branch</span>
                    <select
                        value={selectedBranch}
                        onChange={(event) => setSelectedBranch(event.target.value)}
                        className="h-9 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {branches.length === 0 ? (
                            <option value="main">main</option>
                        ) : (
                            branches.map((branchName) => (
                                <option key={branchName} value={branchName}>
                                    {branchName}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </header>
            <main className="flex-1 overflow-hidden h-full">
                <ResizableCommon
                    key={`${owner as string}/${repo as string}:${selectedBranch}`}
                    owner={owner as string}
                    repo={repo as string}
                    branch={selectedBranch}
                />
            </main>
        </div>
    )
}
