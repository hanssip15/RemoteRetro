"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Share2, Check } from "lucide-react"

interface ShareLinkModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
}

export function ShareLinkModal({ isOpen, onClose, shareUrl }: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Share2 className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle>Share Retro Link</CardTitle>
          <CardDescription>Share this link with your team members to join the retrospective</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button onClick={handleCopy} variant="outline" size="icon">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {copied && <p className="text-sm text-green-600 text-center">Link copied to clipboard!</p>}
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
