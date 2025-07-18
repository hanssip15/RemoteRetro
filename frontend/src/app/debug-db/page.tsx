"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugDbPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabaseStructure = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/debug/db-structure")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Debug Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDatabaseStructure} disabled={loading}>
              {loading ? "Testing..." : "Check Database Structure"}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
