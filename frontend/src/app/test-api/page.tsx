"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCreateRetro = async () => {
    setLoading(true)
    setResult(null)

    try {

      const response = await fetch("/api/retros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Retro " + Date.now(),
          description: "Test description",
          teamSize: 5,
          duration: 60,
        }),
      })

      const data = await response.json()

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
      })
    } catch (error) {
      console.error("Test error:", error)
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const testGetRetros = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/retros")
      const data = await response.json()

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>API Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={testCreateRetro} disabled={loading}>
                {loading ? "Testing..." : "Test Create Retro"}
              </Button>
              <Button onClick={testGetRetros} disabled={loading}>
                {loading ? "Testing..." : "Test Get Retros"}
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
