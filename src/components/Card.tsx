import React from 'react'
import type { EditCard } from '../types'

type Props = {
  card: EditCard & { finalized?: boolean }
  onApply: (id: string) => void
  onReject: (id: string) => void
  className?: string
}

export default function Card({ card, onApply, onReject, className = '' }: Props) {
  const { finalized } = card // Marked true when the user accepts the change

  return (
    <div
      className={`rounded-2xl overflow-hidden border shadow-sm transition ${className} ${
        finalized ? 'border-emerald-700/50 bg-emerald-900/20' : 'border-zinc-800 bg-zinc-900/60'
      }`}
    >
      {/* Header: shows "Apply Changes?" and buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-300">Apply Changes?</span>
          {finalized && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-700/30 text-emerald-200 border border-emerald-600/40">
              Finalized
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* Reject button (red) */}
          <button
            onClick={() => onReject(card.cardid)}
            className={`w-8 h-8 rounded-full grid place-items-center border transition ${
              finalized
                ? 'opacity-40 cursor-not-allowed border-zinc-700 text-zinc-400'
                : 'border-red-600 text-red-500 hover:bg-red-900/30'
            }`}
            aria-label="Reject"
            title="Reject"
            disabled={finalized}
          >
            ✕
          </button>

          {/* Apply button (green) */}
          <button
            onClick={() => onApply(card.cardid)}
            className={`w-8 h-8 rounded-full grid place-items-center border transition ${
              finalized
                ? 'bg-emerald-600 text-white border-transparent'
                : 'border-emerald-600 text-emerald-500 hover:bg-emerald-900/30'
            }`}
            aria-label="Apply"
            title="Apply"
            disabled={finalized}
          >
            ✓
          </button>
        </div>
      </div>

      {/* Original text section */}
      <div className="p-4 border-b border-zinc-800">
        <div className="text-xs text-zinc-500 mb-1">Original</div>
        <div className="rounded-xl bg-zinc-950 px-3 py-3 text-zinc-200">
          {card.old_text}
        </div>
      </div>

      {/* Suggested text section */}
      <div className="p-4">
        <div className="text-xs text-zinc-500 mb-1">Suggestion</div>
        <div
          className={`rounded-xl px-3 py-3 transition ${
            finalized ? 'bg-emerald-900/30 ring-1 ring-emerald-700/40' : 'bg-zinc-950'
          }`}
        >
          <div className="text-zinc-200">{card.new_text}</div>
          <div className="mt-2 text-[10px] text-zinc-500">cardId: {card.cardid}</div>
        </div>
      </div>
    </div>
  )
}
