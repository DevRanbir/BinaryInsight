
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "./ui/button"
import { GitPullRequest } from "lucide-react"

export function AppNavbar() {
    const { data: session } = useSession()
    const pathname = usePathname()

    // Hide Navbar on Landing Page and Login
    if (!session || pathname === "/" || pathname === "/login") return null

    return (
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-950">
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center font-bold text-lg">
                    <GitPullRequest className="mr-2 h-6 w-6" /> BinaryInsight
                </Link>
                <nav className="flex items-center gap-4 text-sm font-medium">
                    <Link href="/dashboard" className={pathname === "/dashboard" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}>Dashboard</Link>
                    <Link href="/settings" className={pathname === "/settings" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}>Settings</Link>
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{session.user?.name}</span>
                <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</Button>
            </div>
        </header>
    )
}
