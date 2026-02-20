
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const deployments = [
    { id: "dep_1", env: "Production", commit: "a1b2c3d", status: "Success", time: "2h ago", user: "devuser" },
    { id: "dep_2", env: "Staging", commit: "e5f6g7h", status: "Success", time: "5h ago", user: "devuser" },
    { id: "dep_3", env: "Preview", commit: "i9j0k1l", status: "Failed", time: "1d ago", user: "qa_user" },
]

export default function DeploymentsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Deployments</h1>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Environment</TableHead>
                            <TableHead>Commit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deployments.map((d) => (
                            <TableRow key={d.id}>
                                <TableCell className="font-medium">{d.env}</TableCell>
                                <TableCell className="font-mono text-xs">{d.commit}</TableCell>
                                <TableCell>
                                    <Badge variant={d.status === "Success" ? "default" : "destructive"}>
                                        {d.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{d.user}</TableCell>
                                <TableCell className="text-right text-gray-500">{d.time}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
