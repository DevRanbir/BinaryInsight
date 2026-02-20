"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

interface PullRequestItem {
    id: number
    number: number
    title: string
    body?: string
    state: "open" | "closed"
    user: {
        login: string
    }
    html_url: string
    isTemp?: boolean
}

interface PullRequestComment {
    id: number
    body: string
    user: {
        login: string
    }
}

type FileViewType = "text" | "markdown" | "image"

const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"]

const getFileViewType = (path: string): FileViewType => {
    const normalizedPath = path.toLowerCase()
    if (imageExtensions.some((ext) => normalizedPath.endsWith(ext))) return "image"
    if (normalizedPath.endsWith(".md") || normalizedPath.endsWith(".markdown")) return "markdown"
    return "text"
}

const getImageMimeType = (path: string) => {
    const normalizedPath = path.toLowerCase()
    if (normalizedPath.endsWith(".png")) return "image/png"
    if (normalizedPath.endsWith(".jpg") || normalizedPath.endsWith(".jpeg")) return "image/jpeg"
    if (normalizedPath.endsWith(".gif")) return "image/gif"
    if (normalizedPath.endsWith(".webp")) return "image/webp"
    if (normalizedPath.endsWith(".bmp")) return "image/bmp"
    if (normalizedPath.endsWith(".svg")) return "image/svg+xml"
    return "application/octet-stream"
}

const decodeBase64Utf8 = (base64Text: string) => {
    const binaryString = atob(base64Text)
    const bytes = Uint8Array.from(binaryString, (character) => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

export function ResizableCommon({ owner, repo, branch }: { owner: string; repo: string; branch: string }) {
    const { data: session } = useSession()
    const token: string | undefined = (session as any)?.accessToken

    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
    const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
    const [selectedFileViewType, setSelectedFileViewType] = useState<FileViewType>("text")
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
    const [loadingContent, setLoadingContent] = useState(false)
    const [prs, setPrs] = useState<PullRequestItem[]>([])
    const [loadingPrs, setLoadingPrs] = useState(true)
    const [creatingPr, setCreatingPr] = useState(false)
    const [newPrTitle, setNewPrTitle] = useState("")
    const [newPrBody, setNewPrBody] = useState("")
    const [newPrHead, setNewPrHead] = useState(branch)
    const [newPrBase, setNewPrBase] = useState("main")
    const [availableBranches, setAvailableBranches] = useState<string[]>([])
    const [editingPrNumber, setEditingPrNumber] = useState<number | null>(null)
    const [editPrTitle, setEditPrTitle] = useState("")
    const [editPrBody, setEditPrBody] = useState("")
    const [prActionLoading, setPrActionLoading] = useState<number | null>(null)
    const [prActionMessage, setPrActionMessage] = useState<string | null>(null)
    const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({})
    const [commentsByPr, setCommentsByPr] = useState<Record<number, PullRequestComment[]>>({})
    const [commentInputByPr, setCommentInputByPr] = useState<Record<number, string>>({})
    const [loadingCommentsPr, setLoadingCommentsPr] = useState<number | null>(null)
    const [submittingCommentPr, setSubmittingCommentPr] = useState<number | null>(null)

    const displayedPrs: PullRequestItem[] =
        !loadingPrs && prs.length === 0
            ? [
                {
                    id: -1,
                    number: 0,
                    title: "Temp Pull Request (Demo)",
                    body: "This is a temporary placeholder PR shown when no pull requests are found.",
                    state: "open",
                    user: { login: "demo-user" },
                    html_url: "#",
                    isTemp: true,
                },
            ]
            : prs

    // Cache for already-fetched directory children
    const cache = useRef<Map<string, GHNode[]>>(new Map())

    const fetchContents = async (path: string): Promise<GHNode[]> => {
        const cacheKey = `${branch}:${path}`
        if (cache.current.has(cacheKey)) return cache.current.get(cacheKey)!
        if (!token) return []
        const apiPath = path === "__root__" ? "" : `/${path}`
        const refQuery = `?ref=${encodeURIComponent(branch)}`
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents${apiPath}${refQuery}`,
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
        cache.current.set(cacheKey, nodes)
        return nodes
    }

    useEffect(() => {
        cache.current.clear()
        setSelectedFilePath(null)
        setSelectedFileContent(null)
        setSelectedImageSrc(null)
        setSelectedFileViewType("text")
        setNewPrHead(branch)
    }, [branch])

    useEffect(() => {
        if (!token) {
            setAvailableBranches([])
            return
        }

        fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => response.json())
            .then((data) => {
                if (!Array.isArray(data)) {
                    setAvailableBranches([])
                    return
                }

                const branchNames = data
                    .map((branchData: { name?: string }) => branchData?.name)
                    .filter((branchName): branchName is string => Boolean(branchName))

                setAvailableBranches(branchNames)
                setNewPrHead((previousHead) =>
                    branchNames.includes(previousHead) ? previousHead : branch
                )
                setNewPrBase((previousBase) =>
                    branchNames.includes(previousBase)
                        ? previousBase
                        : branchNames.includes("main")
                            ? "main"
                            : branchNames.includes("master")
                                ? "master"
                                : branchNames[0] ?? "main"
                )
            })
            .catch(() => {
                setAvailableBranches([])
            })
    }, [token, owner, repo, branch])

    const fetchPullRequests = async () => {
        if (!token) {
            setPrs([])
            setLoadingPrs(false)
            return
        }
        setLoadingPrs(true)
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=30`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            setPrs(Array.isArray(data) ? data : [])
        } catch {
            setPrs([])
        } finally {
            setLoadingPrs(false)
        }
    }

    // Fetch PRs on load
    useEffect(() => {
        fetchPullRequests()
    }, [token, owner, repo])

    const createPullRequest = async () => {
        if (!token) return
        if (!newPrTitle.trim() || !newPrHead.trim() || !newPrBase.trim()) {
            setPrActionMessage("Title, head branch, and base branch are required.")
            return
        }
        if (newPrHead.trim() === newPrBase.trim()) {
            setPrActionMessage("Head and base branches must be different.")
            return
        }
        setPrActionLoading(-1)
        setPrActionMessage(null)
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: newPrTitle.trim(),
                    body: newPrBody,
                    head: newPrHead.trim(),
                    base: newPrBase.trim(),
                }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                if (response.status === 404) {
                    setPrActionMessage("Repository not found or missing write permission. Sign out/in again to refresh GitHub scopes.")
                } else {
                    setPrActionMessage(errorData?.message ?? "Failed to create pull request.")
                }
                return
            }
            setPrActionMessage("Pull request created.")
            setCreatingPr(false)
            setNewPrTitle("")
            setNewPrBody("")
            await fetchPullRequests()
        } catch {
            setPrActionMessage("Failed to create pull request.")
        } finally {
            setPrActionLoading(null)
        }
    }

    const updatePullRequest = async (prNumber: number) => {
        if (!token) return
        if (!editPrTitle.trim()) {
            setPrActionMessage("PR title is required.")
            return
        }
        setPrActionLoading(prNumber)
        setPrActionMessage(null)
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: editPrTitle.trim(),
                    body: editPrBody,
                }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                setPrActionMessage(errorData?.message ?? "Failed to update pull request.")
                return
            }
            setEditingPrNumber(null)
            setPrActionMessage("Pull request updated.")
            await fetchPullRequests()
        } catch {
            setPrActionMessage("Failed to update pull request.")
        } finally {
            setPrActionLoading(null)
        }
    }

    const setPullRequestState = async (prNumber: number, state: "open" | "closed") => {
        if (!token) return
        setPrActionLoading(prNumber)
        setPrActionMessage(null)
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ state }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                setPrActionMessage(errorData?.message ?? `Failed to ${state === "closed" ? "close" : "reopen"} pull request.`)
                return
            }
            setPrActionMessage(state === "closed" ? "Pull request closed." : "Pull request reopened.")
            await fetchPullRequests()
        } catch {
            setPrActionMessage(`Failed to ${state === "closed" ? "close" : "reopen"} pull request.`)
        } finally {
            setPrActionLoading(null)
        }
    }

    const loadPullRequestComments = async (pr: PullRequestItem) => {
        if (pr.isTemp) {
            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: previous[pr.number] ?? [
                    {
                        id: -100,
                        body: "This is a temporary demo comment.",
                        user: { login: "demo-user" },
                    },
                ],
            }))
            return
        }
        if (!token) return

        setLoadingCommentsPr(pr.number)
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${pr.number}/comments?per_page=30`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: Array.isArray(data) ? data : [],
            }))
        } catch {
            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: [],
            }))
        } finally {
            setLoadingCommentsPr(null)
        }
    }

    const addPullRequestComment = async (pr: PullRequestItem) => {
        const commentText = (commentInputByPr[pr.number] ?? "").trim()
        if (!commentText) {
            setPrActionMessage("Comment cannot be empty.")
            return
        }

        if (pr.isTemp) {
            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: [
                    ...(previous[pr.number] ?? []),
                    {
                        id: Date.now(),
                        body: commentText,
                        user: { login: "you" },
                    },
                ],
            }))
            setCommentInputByPr((previous) => ({ ...previous, [pr.number]: "" }))
            return
        }

        if (!token) return
        setSubmittingCommentPr(pr.number)
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${pr.number}/comments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ body: commentText }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                setPrActionMessage(errorData?.message ?? "Failed to add comment.")
                return
            }

            setCommentInputByPr((previous) => ({ ...previous, [pr.number]: "" }))
            await loadPullRequestComments(pr)
        } catch {
            setPrActionMessage("Failed to add comment.")
        } finally {
            setSubmittingCommentPr(null)
        }
    }

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
        setSelectedImageSrc(null)
        setLoadingContent(true)
        try {
            const res = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${node.path}?ref=${encodeURIComponent(branch)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const data = await res.json()
            if (data.content) {
                const sanitizedBase64Content = data.content.replace(/\s/g, "")
                const fileViewType = getFileViewType(node.path)
                setSelectedFileViewType(fileViewType)

                if (fileViewType === "image") {
                    const imageMimeType = getImageMimeType(node.path)
                    setSelectedImageSrc(`data:${imageMimeType};base64,${sanitizedBase64Content}`)
                    setSelectedFileContent(null)
                } else {
                    setSelectedFileContent(decodeBase64Utf8(sanitizedBase64Content))
                }
            } else {
                setSelectedFileViewType("text")
                setSelectedImageSrc(null)
                setSelectedFileContent("(Binary or empty file — cannot display)")
            }
        } catch {
            setSelectedFileViewType("text")
            setSelectedImageSrc(null)
            setSelectedFileContent("Error loading file content.")
        } finally {
            setLoadingContent(false)
        }
    }

    return (
        <div className="h-full w-full rounded-lg border overflow-hidden flex min-h-0">
            <div className="w-[24%] min-w-[220px] max-w-[420px] h-full border-r bg-white overflow-hidden min-h-0">
                <div className="h-full flex flex-col min-h-0">
                    <div className="px-4 py-3 text-sm font-semibold border-b bg-gray-50">Files</div>
                    <ScrollArea className="flex-1 min-h-0 p-1">
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

            <div className="flex-1 min-w-0 h-full border-r bg-white overflow-hidden min-h-0">
                <div className="h-full flex flex-col min-w-0 min-h-0">
                    <div
                        className="px-4 py-3 text-sm font-semibold border-b bg-gray-50 truncate text-gray-600 shrink-0"
                        title={selectedFilePath ?? ""}
                    >
                        {selectedFilePath ?? "Select a file to view its content"}
                    </div>
                    <ScrollArea className="flex-1 min-h-0 bg-white w-full">
                        <div className="p-4">
                            {loadingContent ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400 pt-4">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </div>
                            ) : selectedFileViewType === "image" && selectedImageSrc ? (
                                <div className="w-full flex items-start justify-center">
                                    <img
                                        src={selectedImageSrc}
                                        alt={selectedFilePath ?? "Selected image"}
                                        className="max-w-full h-auto rounded-md border"
                                    />
                                </div>
                            ) : selectedFileViewType === "markdown" && selectedFileContent ? (
                                <article className="text-sm text-gray-800 leading-relaxed space-y-3">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            h1: ({ children }) => <h1 className="text-2xl font-bold mt-2 mb-3">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>,
                                            p: ({ children }) => <p className="mb-2">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                            table: ({ children }) => <table className="w-full border-collapse border border-gray-200 mb-3">{children}</table>,
                                            th: ({ children }) => <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left">{children}</th>,
                                            td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
                                            code: ({ children }) => <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{children}</code>,
                                            pre: ({ children }) => <pre className="font-mono text-xs bg-gray-50 border rounded p-3 overflow-x-auto mb-3">{children}</pre>,
                                            a: ({ href, children }) => (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {children}
                                                </a>
                                            ),
                                        }}
                                    >
                                        {selectedFileContent}
                                    </ReactMarkdown>
                                </article>
                            ) : (
                                <pre className="font-mono text-xs whitespace-pre-wrap break-all text-gray-800 leading-relaxed">
                                    {selectedFileContent ?? "No file selected."}
                                </pre>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <div className="w-[24%] min-w-[220px] max-w-[420px] h-full bg-gray-50 overflow-hidden min-h-0">
                <div className="h-full flex flex-col bg-gray-50 min-h-0">
                    <div className="px-4 py-3 text-sm font-semibold border-b">
                        Pull Requests <span className="text-gray-400 font-normal">({prs.length})</span>
                    </div>
                    <ScrollArea className="flex-1 min-h-0 p-3">
                        <div className="space-y-3">
                            <div className="rounded-lg border bg-white p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-gray-600">PR Actions</p>
                                    <Button
                                        size="xs"
                                        onClick={() => {
                                            setCreatingPr((previous) => !previous)
                                            setPrActionMessage(null)
                                        }}
                                    >
                                        {creatingPr ? "Cancel" : "Add PR"}
                                    </Button>
                                </div>

                                {creatingPr && (
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="PR title"
                                            value={newPrTitle}
                                            onChange={(event) => setNewPrTitle(event.target.value)}
                                        />
                                        <Textarea
                                            placeholder="PR description (optional)"
                                            value={newPrBody}
                                            onChange={(event) => setNewPrBody(event.target.value)}
                                            className="min-h-20"
                                        />
                                        {availableBranches.length > 0 ? (
                                            <>
                                                <select
                                                    value={newPrHead}
                                                    onChange={(event) => setNewPrHead(event.target.value)}
                                                    className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                                >
                                                    {availableBranches.map((branchName) => (
                                                        <option key={`head-${branchName}`} value={branchName}>
                                                            {branchName}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={newPrBase}
                                                    onChange={(event) => setNewPrBase(event.target.value)}
                                                    className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                                >
                                                    {availableBranches.map((branchName) => (
                                                        <option key={`base-${branchName}`} value={branchName}>
                                                            {branchName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </>
                                        ) : (
                                            <>
                                                <Input
                                                    placeholder="Head branch"
                                                    value={newPrHead}
                                                    onChange={(event) => setNewPrHead(event.target.value)}
                                                />
                                                <Input
                                                    placeholder="Base branch"
                                                    value={newPrBase}
                                                    onChange={(event) => setNewPrBase(event.target.value)}
                                                />
                                            </>
                                        )}
                                        <Button
                                            size="xs"
                                            className="w-full"
                                            onClick={createPullRequest}
                                            disabled={prActionLoading === -1}
                                        >
                                            {prActionLoading === -1 ? "Creating..." : "Create Pull Request"}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {prActionMessage && (
                                <div className="text-xs px-2 py-1 rounded border bg-white text-gray-600">
                                    {prActionMessage}
                                </div>
                            )}

                            {loadingPrs && (
                                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center pt-8">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </div>
                            )}
                            {displayedPrs.map((pr) => (
                                <div key={pr.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                    {editingPrNumber === pr.number ? (
                                        <div className="space-y-2">
                                            <Input
                                                value={editPrTitle}
                                                onChange={(event) => setEditPrTitle(event.target.value)}
                                            />
                                            <Textarea
                                                value={editPrBody}
                                                onChange={(event) => setEditPrBody(event.target.value)}
                                                className="min-h-20"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="xs"
                                                    onClick={() => updatePullRequest(pr.number)}
                                                    disabled={prActionLoading === pr.number}
                                                >
                                                    {prActionLoading === pr.number ? "Saving..." : "Update"}
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={() => setEditingPrNumber(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
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
                                            <div className="flex flex-wrap items-center gap-2">
                                                {pr.isTemp ? (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <GitPullRequest className="h-3 w-3" /> Demo PR
                                                    </span>
                                                ) : (
                                                    <a
                                                        href={pr.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <GitPullRequest className="h-3 w-3" /> Open PR
                                                    </a>
                                                )}
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (pr.isTemp) return
                                                        setEditingPrNumber(pr.number)
                                                        setEditPrTitle(pr.title ?? "")
                                                        setEditPrBody(pr.body ?? "")
                                                    }}
                                                    disabled={Boolean(pr.isTemp)}
                                                >
                                                    Edit
                                                </Button>
                                                {pr.state === "open" ? (
                                                    <Button
                                                        size="xs"
                                                        variant="destructive"
                                                        onClick={() => setPullRequestState(pr.number, "closed")}
                                                        disabled={prActionLoading === pr.number || Boolean(pr.isTemp)}
                                                    >
                                                        Delete
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        onClick={() => setPullRequestState(pr.number, "open")}
                                                        disabled={prActionLoading === pr.number || Boolean(pr.isTemp)}
                                                    >
                                                        Reopen
                                                    </Button>
                                                )}
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={async () => {
                                                        const willExpand = !expandedComments[pr.number]
                                                        setExpandedComments((previous) => ({
                                                            ...previous,
                                                            [pr.number]: willExpand,
                                                        }))
                                                        if (willExpand) {
                                                            await loadPullRequestComments(pr)
                                                        }
                                                    }}
                                                >
                                                    {expandedComments[pr.number] ? "Hide Comments" : "Comments"}
                                                </Button>
                                            </div>

                                            {expandedComments[pr.number] && (
                                                <div className="mt-3 border-t pt-3 space-y-2">
                                                    {loadingCommentsPr === pr.number ? (
                                                        <div className="text-xs text-gray-400">Loading comments...</div>
                                                    ) : (
                                                        <>
                                                            {(commentsByPr[pr.number] ?? []).length === 0 ? (
                                                                <div className="text-xs text-gray-400">No comments yet.</div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {(commentsByPr[pr.number] ?? []).map((comment) => (
                                                                        <div key={comment.id} className="rounded border bg-gray-50 px-2 py-1.5">
                                                                            <p className="text-[11px] text-gray-500 mb-1">{comment.user?.login ?? "unknown"}</p>
                                                                            <p className="text-xs text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="space-y-2">
                                                                <Textarea
                                                                    placeholder="Write a comment"
                                                                    className="min-h-16"
                                                                    value={commentInputByPr[pr.number] ?? ""}
                                                                    onChange={(event) =>
                                                                        setCommentInputByPr((previous) => ({
                                                                            ...previous,
                                                                            [pr.number]: event.target.value,
                                                                        }))
                                                                    }
                                                                />
                                                                <Button
                                                                    size="xs"
                                                                    onClick={() => addPullRequestComment(pr)}
                                                                    disabled={submittingCommentPr === pr.number}
                                                                >
                                                                    {submittingCommentPr === pr.number ? "Posting..." : "Add Comment"}
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
