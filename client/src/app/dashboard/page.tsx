
import RepoList from "@/components/RepoList"

export default function DashboardPage() {
    return (
        <div className="mx-auto w-full max-w-[1400px] px-6 py-8 space-y-6">
            <section className="rounded-xl border bg-card p-6 shadow-sm">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">Workspace</p>
                <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Welcome to your dashboard. Track repositories, open pull requests, and review activity from one place.
                </p>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
                <RepoList />
            </section>
        </div>
    )
}
