import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// This is a mock. In a real app, fetch from a database or API.
const mockLogs = [
  {
    id: 1,
    name: "Heet Mehta",
    file: "CERT-HHM-20250928.pdf",
    date: "2025-09-28",
    result: "Allowed",
  },
  {
    id: 2,
    name: "Alice Bob",
    file: "CERT-ABC-20240101.pdf",
    date: "2025-09-27",
    result: "Denied",
  },
]

export default function AdminAuditLog() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#fef9c3]">
      <div className="w-full max-w-3xl">
        <Card className="bg-white/90 shadow-2xl text-card-foreground border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Audit Log / Verification History</CardTitle>
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
                  {mockLogs.map((log) => (
                    <tr key={log.id} className="border-t border-border">
                      <td className="px-3 py-2">{log.date}</td>
                      <td className="px-3 py-2">{log.name}</td>
                      <td className="px-3 py-2">{log.file}</td>
                      <td className={"px-3 py-2 " + (log.result === "Allowed" ? "text-green-600" : "text-red-600")}>{log.result}</td>
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
