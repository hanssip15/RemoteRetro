"use client"

import React from "react"

type Category = "format_1" | "format_2" | "format_3"
type RetroFormat = "happy_sad_confused" | "start_stop_continue" | string

export interface CategoryIconProps {
  category: Category
  retroFormat: RetroFormat
  showLabel?: boolean
  className?: string
}

const labelMap: Record<string, Record<Category, string>> = {
  happy_sad_confused: {
    format_1: "Happy",
    format_2: "Sad",
    format_3: "Confused",
  },
  start_stop_continue: {
    format_1: "Start",
    format_2: "Stop",
    format_3: "Continue",
  },
}

const emojiMap: Record<string, Record<Category, string>> = {
  happy_sad_confused: {
    format_1: "😀",
    format_2: "😢",
    format_3: "🤔",
  },
  start_stop_continue: {
    format_1: "🟢",
    format_2: "🛑",
    format_3: "🔄",
  },
}

export function CategoryIcon({ category, retroFormat, showLabel = false, className }: CategoryIconProps) {
  const normalized = (retroFormat || "start_stop_continue") as RetroFormat
  const emoji = emojiMap[normalized]?.[category] || ""
  const label = labelMap[normalized]?.[category] || category

  return (
    <span className={className} aria-label={label} title={label} role="img">
      {emoji}
      {showLabel && <span className="ml-1 align-middle">{label}</span>}
    </span>
  )
}

export default CategoryIcon


