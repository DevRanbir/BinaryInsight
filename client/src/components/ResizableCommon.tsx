"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import {
    hotkeysCoreFeature,
    asyncDataLoaderFeature,
    selectionFeature,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { FileIcon, FolderIcon, FolderOpenIcon, GitPullRequest, Loader2, ChevronRight, ChevronDown } from "lucide-react"

interface GHNode {
    name: string
    path: string
    type: "file" | "dir"
    html_url: string
}

export function ResizableCommon({ owner, repo }: { owner: string; repo: string }) {
    const { data: session } = useSession()
    const token: string | undefined = (session as any)?.accessToken

    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
    const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
    const [loadingContent, setLoadingContent] = useState(false)
    const [prs, setPrs] = useState<any[]>([])
    const [loadingPrs, setLoadingPrs] = useState(true)

    // Cache for already-fetched directory children
    const cache = useRef<Map<string, GHNode[]>>(new Map())

    const fetchContents = async (path: string): Promise<GHNode[]> => {
        if (cache.current.has(path)) return cache.current.get(path)!
        if (!token) return []
        const apiPath = path === "__root__" ? "" : `/${path}`
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents${apiPath}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) return []
        const data: any[] = await res.json()
        const nodes: GHNode[] = data.map((item) => ({
            name: item.name,
            path: item.path,
            type: item.type === "dir" ? "dir" : "file",
            html_url: item.html_url,
        }))
        cache.current.set(path, nodes)
        return nodes
    }

    // Fetch PRs on load
    useEffect(() => {
        if (!token) return
        setLoadingPrs(true)
        fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=30`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d)) setPrs(d)
                setLoadingPrs(false)
            })
            .catch(() => setLoadingPrs(false))
    }, [token, owner, repo])

    const tree = useTree<GHNode>({
        rootItemId: "__root__",
        getItemName: (item) => item.getItemData()?.name ?? item.getId(),
        isItemFolder: (item) => item.getItemData()?.type === "dir",
        indent: 16,
        dataLoader: {
            getItem: async (id) => {
                if (id === "__root__") return { name: repo, path: "__root__", type: "dir", html_url: "" }
                // find in cache
                for (const nodes of cache.current.values()) {
                    const found = nodes.find((n) => n.path === id)
                    if (found) return found
                }
                return { name: id.split("/").pop() ?? id, path: id, type: "file", html_url: "" }
            },
            getChildren: async (id) => {
                const nodes = await fetchContents(id)
                return nodes.map((n) => n.path)
            },
        },
        onPrimaryAction: (item) => {
            const data = item.getItemData()
            if (item.isFolder()) {
                if (item.isExpanded()) {
                    item.collapse()
                } else {
                    item.expand()
                }
            } else if (data?.type === "file") {
                handleFileClick(data)
            }
        },
        features: [asyncDataLoaderFeature, hotkeysCoreFeature, selectionFeature],
    })

    const handleFileClick = async (node: GHNode) => {
        setSelectedFilePath(node.path)
        setSelectedFileContent(null)
        setLoadingContent(true)
        try {
            const res = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${node.path}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const data = await res.json()
            if (data.content) {
                setSelectedFileContent(atob(data.content.replace(/\s/g, "")))
            } else {
                setSelectedFileContent("(Binary or empty file — cannot display)")
            }
        } catch {
            setSelectedFileContent("Error loading file content.")
        } finally {
            setLoadingContent(false)
        }
    }

    return (
        <div className="h-full w-full rounded-lg border overflow-hidden flex">
            <div className="w-[24%] min-w-[220px] max-w-[420px] h-full border-r bg-white">
                <div className="h-full flex flex-col">
                    <div className="px-4 py-3 text-sm font-semibold border-b bg-gray-50">Files</div>
                    <ScrollArea className="flex-1 p-1">
                        <ul {...(tree as any).getContainerProps()} className="select-none outline-none">
                            {tree.getItems().map((item) => {
                                const data = item.getItemData()
                                const isFolder = item.isFolder()
                                const isExpanded = item.isExpanded()
                                const level = item.getItemMeta().level
                                return (
                                    <li
                                        key={item.getId()}
                                        {...(item as any).getProps()}
                                        className="list-none"
                                    >
                                        <div
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-sm hover:bg-gray-100 transition-colors ${selectedFilePath === data?.path && !isFolder ? "bg-blue-100 text-blue-800" : ""
                                                }`}
                                            style={{ paddingLeft: `${8 + level * 16}px` }}
                                            onClick={() => {
                                                if (isFolder) {
                                                    if (isExpanded) {
                                                        item.collapse()
                                                    } else {
                                                        item.expand()
                                                    }
                                                } else if (data) handleFileClick(data)
                                            }}
                                        >
                                            {isFolder ? (
                                                <>
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
                                                    )}
                                                    {isExpanded ? (
                                                        <FolderOpenIcon className="h-4 w-4 shrink-0 text-yellow-500" />
                                                    ) : (
                                                        <FolderIcon className="h-4 w-4 shrink-0 text-yellow-500" />
                                                    )}
                                                </>
                                            ) : (
                                                <FileIcon className="h-4 w-4 shrink-0 text-gray-400 ml-4" />
                                            )}
                                            <span className="truncate">{item.getItemName()}</span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </ScrollArea>
                </div>
            </div>

            <div className="flex-1 min-w-0 h-full border-r bg-white">
                <div className="h-full flex flex-col min-w-0">
                    <div
                        className="px-4 py-3 text-sm font-semibold border-b bg-gray-50 truncate text-gray-600 shrink-0"
                        title={selectedFilePath ?? ""}
                    >
                        {selectedFilePath ?? "Select a file to view its content"}
                    </div>
                    <ScrollArea className="flex-1 bg-white w-full">
                        <div className="p-4">
                            {loadingContent ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400 pt-4">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </div>
                            ) : (
                                <pre className="font-mono text-xs whitespace-pre-wrap break-all text-gray-800 leading-relaxed">
                                    {selectedFileContent ?? "No file selected."}
                                </pre>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <div className="w-[24%] min-w-[220px] max-w-[420px] h-full bg-gray-50">
                <div className="h-full flex flex-col bg-gray-50">
                    <div className="px-4 py-3 text-sm font-semibold border-b">
                        Pull Requests <span className="text-gray-400 font-normal">({prs.length})</span>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                            {loadingPrs && (
                                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center pt-8">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </div>
                            )}
                            {!loadingPrs && prs.length === 0 && (
                                <div className="text-sm text-gray-400 text-center pt-8">
                                    No pull requests found.
                                </div>
                            )}
                            {prs.map((pr) => (
                                <div key={pr.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="font-semibold text-sm leading-tight line-clamp-2" title={pr.title}>
                                            {pr.title}
                                        </h4>
                                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${pr.state === "open" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                                            }`}>
                                            {pr.state}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-2">#{pr.number} · {pr.user.login}</p>
                                    <a
                                        href={pr.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <GitPullRequest className="h-3 w-3" /> Open PR
                                    </a>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
