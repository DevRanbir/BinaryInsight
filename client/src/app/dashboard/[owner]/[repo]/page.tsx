
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
            <main className="flex-1 overflow-hidden h-full">
                <ResizableCommon
                    key={`${owner as string}/${repo as string}:${selectedBranch}:${token ? "authed" : "guest"}`}
                    owner={owner as string}
                    repo={repo as string}
                    branch={selectedBranch}
                    branches={branches}
                    onBranchChange={setSelectedBranch}
                />
            </main>
        </div>
    )
}
