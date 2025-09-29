import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { promises as fs } from "fs"
import path from "path"
import { cookies } from "next/headers"

async function getLogs() {
	const logPath = path.join(process.cwd(), "logs.json")
	try {
		const data = await fs.readFile(logPath, "utf8")
		return JSON.parse(data)
	} catch {
		return []
	}
}

export default async function AdminAuditLog() {
	// Simple password check using cookies (not secure, demo only)
	const cookieStore = cookies()
	const authed = cookieStore.get("admin_auth")?.value === "admin123"
	const logs = await getLogs()

	if (!authed) {
		return (
			<main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#fef9c3]">
				<form action="/admin-audit-log/login" method="POST" className="bg-white/90 p-8 rounded-xl shadow-xl flex flex-col gap-4 w-full max-w-xs">
					<h2 className="text-xl font-bold mb-2">Admin Login</h2>
					<input
						type="password"
						name="password"
						placeholder="Enter admin password"
						className="border rounded px-3 py-2"
						autoFocus
					/>
					<button type="submit" className="bg-primary text-primary-foreground rounded px-4 py-2 font-semibold">Login</button>
				</form>
			</main>
		)
	}

	return (
		<main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#fef9c3]">
			<div className="w-full max-w-3xl">
				<Card className="bg-white/90 shadow-2xl text-card-foreground border-0">
									<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<CardTitle className="text-2xl font-bold">Audit Log / Verification History</CardTitle>
										<Link href="/" className="inline-block mt-2 sm:mt-0 bg-primary text-primary-foreground px-4 py-2 rounded font-semibold shadow hover:bg-primary/90 transition">← Back to Verification</Link>
									</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm border border-border rounded-md">
								<thead>
									<tr className="bg-muted">
										<th className="px-3 py-2 text-left">Date</th>
										<th className="px-3 py-2 text-left">Name</th>
										<th className="px-3 py-2 text-left">File</th>
										<th className="px-3 py-2 text-left">Result</th>
									</tr>
								</thead>
								<tbody>
									{logs.map((log: any, idx: number) => (
										<tr key={idx} className="border-t border-border">
											<td className="px-3 py-2">{log.date}</td>
											<td className="px-3 py-2">{log.name}</td>
											<td className="px-3 py-2">{log.file}</td>
											<td className={"px-3 py-2 " + (log.result === "allowed" ? "text-green-600" : "text-red-600")}>{log.result}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	)
}