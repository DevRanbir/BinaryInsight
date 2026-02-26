
"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"

const parseRepoInput = (value: string): { owner: string; repo: string } | null => {
    const raw = value.trim()
    if (!raw) return null

    let path = raw

    try {
        if (raw.includes("github.com")) {
            const normalized = raw.startsWith("http") ? raw : `https://${raw}`
            const url = new URL(normalized)
            if (!url.hostname.includes("github.com")) return null
            path = url.pathname
        }
    } catch {
        return null
    }

    const parts = path
        .replace(/^\//, "")
        .replace(/\.git$/i, "")
        .split("/")
        .filter(Boolean)

    if (parts.length < 2) return null

    return {
        owner: parts[0],
        repo: parts[1],
    }
}

export default function RepoList() {

    const { data: session } = useSession()
    const router = useRouter()
    const [repos, setRepos] = useState([])
    const [loading, setLoading] = useState(false)
    const [repoLinkInput, setRepoLinkInput] = useState("")
    const [repoLinkError, setRepoLinkError] = useState<string | null>(null)

    const handleAnalyzeRepoLink = () => {
        const parsedRepo = parseRepoInput(repoLinkInput)
        if (!parsedRepo) {
            setRepoLinkError("Enter a valid GitHub repo link or owner/repo.")
            return
        }

        setRepoLinkError(null)
        router.push(`/dashboard/${parsedRepo.owner}/${parsedRepo.repo}`)
    }

    useEffect(() => {
        const fetchRepos = async () => {
            // @ts-ignore - accessToken is not in default type
            if (session?.accessToken) {
                setLoading(true)
                try {
                    const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
                        headers: {
                            // @ts-ignore - accessToken is not in default type
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setRepos(data)
                    }
                } catch (error) {
                    console.error("Failed to fetch repos", error)
                } finally {
                    setLoading(false)
                }
            }
        }

        if (session) {
            fetchRepos()
        }
    }, [session])

    if (!session) return <p>Please sign in to view repositories.</p>

    return (
        <div className="mt-4">
            <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold mb-2">Analyze any repository</h2>
                <p className="text-sm text-gray-500 mb-3">Paste a GitHub repo URL or <span className="font-medium">owner/repo</span> to open it.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        value={repoLinkInput}
                        onChange={(event) => setRepoLinkInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                handleAnalyzeRepoLink()
                            }
                        }}
                        placeholder="https://github.com/owner/repo or owner/repo"
                    />
                    <Button onClick={handleAnalyzeRepoLink}>Open Repository</Button>
                </div>
                {repoLinkError && <p className="mt-2 text-xs text-red-600">{repoLinkError}</p>}
            </div>

            <h2 className="text-xl font-semibold mb-4">Your Recent Repositories</h2>
            {loading ? (
                <p>Loading repositories...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repos.map((repo: any) => (
                        <div key={repo.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="font-semibold text-lg truncate">{repo.name}</h3>
                            <p className="text-sm text-gray-500 mb-2 truncate">{repo.full_name}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>{repo.language || 'Unknown'}</span>
                                <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                            <Link
                                href={`/dashboard/${repo.owner.login}/${repo.name}`}
                                className="mt-3 block text-sm text-blue-600 hover:underline font-medium"
                            >
                                Analyze Repository &rarr;
                            </Link>
                            <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 block text-xs text-gray-500 hover:underlin inline-block"
                            >
                                View on GitHub
                            </a>
                        </div>
                    ))}
                    {repos.length === 0 && !loading && <p>No repositories found.</p>}
                </div>
            )}
        </div>
    )

}
