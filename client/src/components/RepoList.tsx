
"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import Link from "next/link"

export default function RepoList() {

    const { data: session } = useSession()
    const [repos, setRepos] = useState([])
    const [loading, setLoading] = useState(false)

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
                                <span>Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
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
