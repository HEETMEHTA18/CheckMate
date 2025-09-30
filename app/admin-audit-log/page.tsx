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
	const authed = cookieStore.get("admin_auth")?.value === "1"
		const logs = await getLogs()

	if (!authed) {
		return (
			<main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 text-white">
				<form action="/admin-audit-log/login" method="POST" className="bg-neutral-900/95 p-8 rounded-xl shadow-2xl flex flex-col gap-4 w-full max-w-xs border border-neutral-800">
					<h2 className="text-2xl font-bold mb-2 text-white">Admin Login</h2>
					<input
						type="password"
						name="password"
						placeholder="Enter admin password"
						aria-label="Admin password"
						className="bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
						autoFocus
					/>
					<button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:opacity-95 transition">Login</button>
					<p className="text-xs text-neutral-400 mt-2">Tip: Set <code>ADMIN_PASSWORD</code> in your environment for production.</p>
				</form>
			</main>
		)
	}

	return (
		<main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 text-white">
			<div className="w-full max-w-3xl">
				<Card className="bg-neutral-900/90 shadow-2xl text-white border border-neutral-800">
						<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle className="text-2xl font-bold text-white">Audit Log / Verification History</CardTitle>
							<div className="flex items-center gap-3">
								<Link href="/" className="inline-block mt-2 sm:mt-0 bg-white/5 text-white px-4 py-2 rounded font-semibold shadow hover:opacity-90 transition">← Back to Verification</Link>
								<Link href="/admin-audit-log/logout" className="mt-2 sm:mt-0 inline-block bg-red-600 text-white px-4 py-2 rounded font-semibold shadow hover:opacity-90 transition">Logout</Link>
							</div>
						</CardHeader>
					<CardContent>
									<div className="overflow-x-auto">
										<table className="w-full text-sm rounded-md border border-neutral-800">
											<thead>
												<tr className="bg-neutral-800 text-neutral-200">
													<th className="px-3 py-2 text-left">Date</th>
													<th className="px-3 py-2 text-left">Input Name</th>
													<th className="px-3 py-2 text-left">Extracted</th>
													<th className="px-3 py-2 text-left">File</th>
													<th className="px-3 py-2 text-left">Source</th>
												</tr>
											</thead>
											<tbody>
												{logs.length === 0 ? (
													<tr>
														<td colSpan={5} className="px-4 py-8 text-center text-neutral-300">No logs found</td>
													</tr>
												) : (
													logs.map((log: any, idx: number) => (
														<tr key={idx} className={"border-t border-neutral-800 " + (idx % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-850') }>
															<td className="px-3 py-2 text-sm">{log.date || log.timestamp || ''}</td>
															<td className="px-3 py-2 text-sm">{log.input?.name ?? log.name ?? (log.inputName || '')}</td>
															<td className="px-3 py-2 text-sm">{(log.extracted && (log.extracted.chosen || log.extracted.name)) ?? ''}</td>
															<td className="px-3 py-2 text-sm">{typeof log.file === 'string' ? log.file : (log.file?.filename ?? '')}</td>
															<td className="px-3 py-2 text-sm">{log.extractionSource ?? log.source ?? ''}</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>
					</CardContent>
				</Card>
			</div>
		</main>
	)
}