"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { PageLoader } from "@/components/PageLoader"
import { useState, useEffect, useRef, useMemo, type MouseEvent as ReactMouseEvent } from "react"
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
import { FileIcon, FolderIcon, FolderOpenIcon, GitPullRequest, Loader2, ChevronRight, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react"

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
    id: string
    body: string
    user: {
        login: string
    }
    created_at?: string
    source?: "issue" | "review"
}

interface PullRequestFileChange {
    sha: string
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
    patch?: string
    blob_url?: string
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

const getDiffLineClassName = (line: string) => {
    if (line.startsWith("+++ ") || line.startsWith("--- ") || line.startsWith("@@")) {
        return "text-gray-600"
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
        return "bg-green-50 text-green-800"
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
        return "bg-red-50 text-red-800"
    }
    return "text-gray-700"
}

export function ResizableCommon({
    owner,
    repo,
    branch,
    branches,
    onBranchChange,
}: {
    owner: string
    repo: string
    branch: string
    branches?: string[]
    onBranchChange?: (branchName: string) => void
}) {
    const { data: session, status } = useSession()
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
    const [reviewPrNumber, setReviewPrNumber] = useState<number | null>(null)
    const [reviewPrTitle, setReviewPrTitle] = useState<string>("")
    const [reviewFiles, setReviewFiles] = useState<PullRequestFileChange[]>([])
    const [loadingReviewFiles, setLoadingReviewFiles] = useState(false)
    const [reviewActionLoading, setReviewActionLoading] = useState(false)
    const [reviewActionMessage, setReviewActionMessage] = useState<string | null>(null)
    const [reviewBody, setReviewBody] = useState("")
    const [reviewEvent, setReviewEvent] = useState<"COMMENT" | "APPROVE" | "REQUEST_CHANGES">("COMMENT")
    const [isAnalyzingReview, setIsAnalyzingReview] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [fileTreeWidth, setFileTreeWidth] = useState(280)
    const prPanelWidth = 320

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
        setReviewPrNumber(null)
        setReviewPrTitle("")
        setReviewFiles([])
        setReviewActionMessage(null)
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

    const loadPullRequestComments = async (pr: PullRequestItem, showLoading = true) => {
        if (pr.isTemp) {
            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: previous[pr.number] ?? [
                    {
                        id: "demo-1",
                        body: "This is a temporary demo comment.",
                        user: { login: "demo-user" },
                        source: "issue",
                    },
                ],
            }))
            return
        }
        if (!token) return

        if (showLoading) {
            setLoadingCommentsPr(pr.number)
        }
        try {
            const [issueResponse, reviewResponse] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${pr.number}/comments?per_page=50`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/comments?per_page=50`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
            ])

            const issueData = issueResponse.ok ? await issueResponse.json() : []
            const reviewData = reviewResponse.ok ? await reviewResponse.json() : []

            const normalizedIssueComments: PullRequestComment[] = Array.isArray(issueData)
                ? issueData.map((comment: any) => ({
                    id: `issue-${comment.id}`,
                    body: comment.body ?? "",
                    user: { login: comment.user?.login ?? "unknown" },
                    created_at: comment.created_at,
                    source: "issue",
                }))
                : []

            const normalizedReviewComments: PullRequestComment[] = Array.isArray(reviewData)
                ? reviewData.map((comment: any) => ({
                    id: `review-${comment.id}`,
                    body: comment.body ?? "",
                    user: { login: comment.user?.login ?? "unknown" },
                    created_at: comment.created_at,
                    source: "review",
                }))
                : []

            const mergedComments = [...normalizedIssueComments, ...normalizedReviewComments].sort((first, second) => {
                const firstTimestamp = first.created_at ? new Date(first.created_at).getTime() : 0
                const secondTimestamp = second.created_at ? new Date(second.created_at).getTime() : 0
                return firstTimestamp - secondTimestamp
            })

            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: mergedComments,
            }))
        } catch {
            setCommentsByPr((previous) => ({
                ...previous,
                [pr.number]: [],
            }))
        } finally {
            if (showLoading) {
                setLoadingCommentsPr(null)
            }
        }
    }

    useEffect(() => {
        if (!token) return

        const expandedLivePrs = displayedPrs.filter(
            (pr) => expandedComments[pr.number] && !pr.isTemp
        )

        if (expandedLivePrs.length === 0) return

        const intervalId = setInterval(() => {
            expandedLivePrs.forEach((pr) => {
                void loadPullRequestComments(pr, false)
            })
        }, 5000)

        return () => clearInterval(intervalId)
    }, [token, owner, repo, displayedPrs, expandedComments])

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
                        id: `demo-${Date.now()}`,
                        body: commentText,
                        user: { login: "you" },
                        source: "issue",
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

    const startFileTreeResize = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        const container = containerRef.current
        if (!container) return

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            const minFileTreeWidth = 180
            const maxFileTreeWidth = 520
            const minContentWidth = 280
            const maxByLayout = Math.max(minFileTreeWidth, rect.width - prPanelWidth - minContentWidth)
            const clamped = Math.min(
                Math.max(moveEvent.clientX - rect.left, minFileTreeWidth),
                Math.min(maxFileTreeWidth, maxByLayout)
            )
            setFileTreeWidth(clamped)
        }

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }

    const handleFileClick = async (node: GHNode) => {
        setReviewPrNumber(null)
        setReviewPrTitle("")
        setReviewFiles([])
        setReviewActionMessage(null)
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

    const loadPullRequestChanges = async (pr: PullRequestItem) => {
        if (pr.isTemp || !token) return

        setIsAnalyzingReview(true)
        setReviewPrNumber(pr.number)
        setReviewPrTitle(pr.title)
        setReviewFiles([])
        setLoadingReviewFiles(true)
        setReviewActionMessage(null)
        const minimumLoaderDuration = new Promise<void>((resolve) => {
            window.setTimeout(resolve, 3000)
        })

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files?per_page=100`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            })

            await minimumLoaderDuration

            const data = await response.json()
            if (!response.ok) {
                setReviewActionMessage(data?.message ?? "Failed to load pull request changes.")
                return
            }

            setReviewFiles(Array.isArray(data) ? data : [])
        } catch {
            await minimumLoaderDuration
            setReviewActionMessage("Failed to load pull request changes.")
        } finally {
            setLoadingReviewFiles(false)
            setIsAnalyzingReview(false)
        }
    }

    const togglePullRequestComments = async (pr: PullRequestItem) => {
        const willExpand = !expandedComments[pr.number]
        setExpandedComments((previous) => ({
            ...previous,
            [pr.number]: willExpand,
        }))

        if (willExpand) {
            await loadPullRequestComments(pr)
        }     
    }

    const reviewSecuritySummary = useMemo(() => {
        if (!reviewPrNumber || reviewFiles.length === 0) {
            return {
                risk: "Minimal",
                totalAdded: 0,
                totalDeleted: 0,
                totalChanges: 0,
                findings: [
                    { name: "Sensitive files/properties", detail: "No review files loaded.", status: "passed" },
                    { name: "Environment changes", detail: "No review files loaded.", status: "passed" },
                    { name: "Large diff / churn", detail: "No review files loaded.", status: "passed" },
                ],
            }
        }

        const totalAdded = reviewFiles.reduce((sum, file) => sum + (file.additions ?? 0), 0)
        const totalDeleted = reviewFiles.reduce((sum, file) => sum + (file.deletions ?? 0), 0)
        const totalChanges = totalAdded + totalDeleted

        const sensitiveFileChanges = reviewFiles.filter((file) =>
            /(\.env|auth|secret|token|key|\.github\/workflows|dockerfile|nextauth|middleware|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)/i.test(file.filename)
        )

        const envTouched = reviewFiles.filter((file) => {
            const patch = file.patch ?? ""
            return /process\.env|NEXT_PUBLIC_|^\+\s*[A-Z0-9_]+\s*=|^\-\s*[A-Z0-9_]+\s*=/gim.test(patch)
        })

        const propertyStyleChanges = reviewFiles.filter((file) => {
            const patch = file.patch ?? ""
            return /^\+\s*"?[a-zA-Z0-9_.-]+"?\s*:\s*|^\-\s*"?[a-zA-Z0-9_.-]+"?\s*:\s*|^\+\s*[a-zA-Z0-9_.-]+\s*:\s*|^\-\s*[a-zA-Z0-9_.-]+\s*:\s*/gim.test(patch)
        })

        const findings = [
            {
                name: "Sensitive files/properties",
                detail: sensitiveFileChanges.length > 0
                    ? `${sensitiveFileChanges.length} sensitive file(s) changed; ${propertyStyleChanges.length} file(s) include property-like diff edits.`
                    : "No sensitive file path changes detected.",
                status: sensitiveFileChanges.length > 0 || propertyStyleChanges.length > 3 ? "warning" : "passed",
            },
            {
                name: "Environment changes",
                detail: envTouched.length > 0
                    ? `${envTouched.length} file(s) contain env-related additions/removals.`
                    : "No env additions/removals detected.",
                status: envTouched.length > 0 ? "warning" : "passed",
            },
            {
                name: "Large diff / churn",
                detail: `${totalAdded} additions, ${totalDeleted} deletions (${totalChanges} total).`,
                status: totalChanges > 600 ? "warning" : "passed",
            },
        ]

        const warningCount = findings.filter((finding) => finding.status === "warning").length
        const risk = warningCount >= 3 ? "High" : warningCount === 2 ? "Medium" : warningCount === 1 ? "Low" : "Minimal"

        return {
            risk,
            totalAdded,
            totalDeleted,
            totalChanges,
            findings,
        }
    }, [reviewPrNumber, reviewFiles])

    const submitPullRequestReview = async () => {
        if (!token || !reviewPrNumber) return
        setReviewActionLoading(true)
        setReviewActionMessage(null)

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${reviewPrNumber}/reviews`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    body: reviewBody,
                    event: reviewEvent,
                }),
            })

            const data = await response.json()
            if (!response.ok) {
                setReviewActionMessage(data?.message ?? "Failed to submit review.")
                return
            }

            setReviewBody("")
            setReviewActionMessage("Review submitted successfully.")
            const reviewedPr = displayedPrs.find((pr) => pr.number === reviewPrNumber)
            if (reviewedPr) {
                await loadPullRequestComments(reviewedPr, false)
            }
        } catch {
            setReviewActionMessage("Failed to submit review.")
        } finally {
            setReviewActionLoading(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="h-full w-full rounded-lg border overflow-hidden flex items-center justify-center text-sm text-gray-500">
                Loading repository data...
            </div>
        )
    }

    if (!token) {
        return (
            <div className="h-full w-full rounded-lg border overflow-hidden flex items-center justify-center text-sm text-gray-500">
                Unable to load repository. Please sign in again.
            </div>
        )
    }

    return (
        <div ref={containerRef} className="h-full w-full rounded-lg border overflow-hidden flex min-h-0">
            {isAnalyzingReview && <PageLoader />}
            <div style={{ width: fileTreeWidth }} className="h-full border-r bg-white overflow-hidden min-h-0 shrink-0">
                <div className="h-full flex flex-col min-h-0">
                    <div className="px-4 py-3 text-sm font-semibold border-b bg-gray-50 flex items-center justify-between gap-2">
                        <span className="truncate">{owner} / {repo}</span>
                        {onBranchChange && (
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium text-gray-500">Branch</span>
                                <select
                                    value={branch}
                                    onChange={(event) => onBranchChange(event.target.value)}
                                    className="h-8 rounded-md border bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {(branches && branches.length > 0 ? branches : ["main"]).map((branchName) => (
                                        <option key={branchName} value={branchName}>
                                            {branchName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
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

            <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={startFileTreeResize}
                className="w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-gray-200 active:bg-gray-300 transition-colors"
            />

            <div className="flex-1 min-w-0 h-full border-r bg-white overflow-hidden min-h-0">
                <div className="h-full flex flex-col min-w-0 min-h-0">
                    <div
                        className="px-4 py-3 text-sm font-semibold border-b bg-gray-50 truncate text-gray-600 shrink-0"
                        title={reviewPrNumber ? `PR #${reviewPrNumber}` : (selectedFilePath ?? "")}
                    >
                        {reviewPrNumber
                            ? `PR #${reviewPrNumber}: ${reviewPrTitle}`
                            : (selectedFilePath ?? "Select a file to view its content")}
                    </div>
                    <div className="flex-1 min-h-0 bg-white w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div className="p-4">
                            <div className="mx-auto w-full max-w-[1100px] min-w-0 overflow-x-hidden">
                            {reviewPrNumber ? (
                                <div className="space-y-4 min-w-0">
                                    <div className="space-y-4">
                                        <div className="rounded-lg border bg-white p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium">Security Analysis</p>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded font-medium ${reviewSecuritySummary.risk === "High"
                                                            ? "bg-red-100 text-red-700"
                                                            : reviewSecuritySummary.risk === "Medium"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : reviewSecuritySummary.risk === "Low"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {reviewSecuritySummary.risk} Risk
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {reviewSecuritySummary.findings.map((finding) => (
                                                    <div key={finding.name} className="rounded border bg-gray-50 px-2 py-1.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-medium text-gray-700">{finding.name}</p>
                                                            {finding.status === "warning" ? (
                                                                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                                                            ) : (
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500">{finding.detail}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-white p-3 space-y-2">
                                            <p className="text-sm font-medium">Submit review</p>
                                            <select
                                                value={reviewEvent}
                                                onChange={(event) => setReviewEvent(event.target.value as "COMMENT" | "APPROVE" | "REQUEST_CHANGES")}
                                                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                            >
                                                <option value="COMMENT">Comment</option>
                                                <option value="APPROVE">Approve</option>
                                                <option value="REQUEST_CHANGES">Request changes</option>
                                            </select>
                                            <Textarea
                                                placeholder="Write review summary"
                                                className="min-h-20"
                                                value={reviewBody}
                                                onChange={(event) => setReviewBody(event.target.value)}
                                            />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={submitPullRequestReview}
                                                    disabled={reviewActionLoading}
                                                >
                                                    {reviewActionLoading ? "Submitting..." : "Submit Review"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setReviewPrNumber(null)
                                                        setReviewPrTitle("")
                                                        setReviewFiles([])
                                                        setReviewActionMessage(null)
                                                    }}
                                                >
                                                    Exit Review
                                                </Button>
                                            </div>
                                            {reviewActionMessage && (
                                                <p className="text-xs text-gray-600">{reviewActionMessage}</p>
                                            )}
                                        </div>
                                    </div>

                                    {loadingReviewFiles ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-400 pt-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading pull request changes…
                                        </div>
                                    ) : reviewFiles.length === 0 ? (
                                        <div className="text-sm text-gray-500">No changed files found for this pull request.</div>
                                    ) : (
                                        <div className="space-y-4 min-w-0">
                                            {reviewFiles.map((file) => (
                                                <div key={file.sha} className="rounded-lg border bg-white overflow-hidden min-w-0 max-w-full">
                                                    <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate" title={file.filename}>{file.filename}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {file.status} · +{file.additions} / -{file.deletions} · {file.changes} changes
                                                            </p>
                                                        </div>
                                                        {file.blob_url && (
                                                            <a
                                                                href={file.blob_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline shrink-0"
                                                            >
                                                                Open file
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="p-3">
                                                        {file.patch ? (
                                                            <pre className="w-full max-w-full font-mono text-xs whitespace-pre-wrap break-all leading-relaxed overflow-x-hidden bg-gray-50 border rounded p-3">
                                                                {file.patch.split("\n").map((line, lineIndex) => (
                                                                    <span
                                                                        key={`${file.sha}-${lineIndex}`}
                                                                        className={`block w-full max-w-full px-1 rounded-sm break-all ${getDiffLineClassName(line)}`}
                                                                    >
                                                                        {line}
                                                                    </span>
                                                                ))}
                                                            </pre>
                                                        ) : (
                                                            <p className="text-xs text-gray-500">Binary file or patch unavailable.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            ) : loadingContent ? (
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-[320px] min-w-[320px] max-w-[320px] h-full bg-gray-50 overflow-hidden min-h-0 shrink-0">
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
                                <div
                                    key={pr.id}
                                    className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                                >
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
                                                <div className="flex items-start gap-1.5 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            void togglePullRequestComments(pr)
                                                        }}
                                                        className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-gray-100"
                                                        aria-label={expandedComments[pr.number] ? "Collapse comments" : "Expand comments"}
                                                    >
                                                        {expandedComments[pr.number] ? (
                                                            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                                                        ) : (
                                                            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                                                        )}
                                                    </button>
                                                    <h4 className="font-semibold text-sm leading-tight line-clamp-2 min-w-0" title={pr.title}>
                                                        {pr.title}
                                                    </h4>
                                                </div>
                                                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${pr.state === "open" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                                                    }`}>
                                                    {pr.state}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">#{pr.number} · {pr.user.login}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={() => void loadPullRequestChanges(pr)}
                                                    disabled={Boolean(pr.isTemp)}
                                                >
                                                    Review
                                                </Button>
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
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        <GitPullRequest className="h-3 w-3" /> Open PR
                                                    </a>
                                                )}
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
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
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            void setPullRequestState(pr.number, "closed")
                                                        }}
                                                        disabled={prActionLoading === pr.number || Boolean(pr.isTemp)}
                                                    >
                                                        Delete
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            void setPullRequestState(pr.number, "open")
                                                        }}
                                                        disabled={prActionLoading === pr.number || Boolean(pr.isTemp)}
                                                    >
                                                        Reopen
                                                    </Button>
                                                )}
                                            </div>

                                            {expandedComments[pr.number] && (
                                                <div className="mt-3 border-t pt-3 space-y-2">
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

                                                    {loadingCommentsPr === pr.number ? (
                                                        <div className="text-xs text-gray-400">Loading comments...</div>
                                                    ) : (commentsByPr[pr.number] ?? []).length === 0 ? (
                                                        <div className="text-xs text-gray-400">No comments yet.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {(commentsByPr[pr.number] ?? []).map((comment) => (
                                                                <div key={comment.id} className="rounded border bg-gray-50 px-2 py-1.5">
                                                                    <p className="text-[11px] text-gray-500 mb-1">
                                                                        {comment.user?.login ?? "unknown"}
                                                                        {comment.source === "review" ? " · review" : ""}
                                                                    </p>
                                                                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                                                                </div>
                                                            ))}
                                                        </div>
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
