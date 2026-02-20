
import RepoList from "@/components/RepoList"

export default function DashboardPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <p>Welcome to your dashboard. Here you can view your PRs and assigned reviews.</p>
            <RepoList />
        </div>
    )
}
