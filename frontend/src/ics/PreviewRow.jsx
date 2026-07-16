import { useState } from 'react'
import { AlertCircle, ChevronDown, Pencil } from 'lucide-react'
import { getDueLabel } from '../utils/icsUtils'

function PreviewRow({ item, index, onToggle, onEdit, onInlineUpdate }) {
  // State to track whether the row is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false)
  const dueLabel = getDueLabel(item.dueDate)

  return (
    <div
      className={`rounded-lg border transition-colors duration-150 ${
        item.alreadyExists
          ? 'border-gray-100 bg-gray-50/60 opacity-70'
          : item.selected
          ? 'border-indigo-200 bg-white'
          : 'border-gray-200 bg-white opacity-60'
      }`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Checkbox */}
        <div className="mt-0.5 flex shrink-0 items-center">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => onToggle(index)}
            disabled={item.alreadyExists}
            className="h-4 w-4 rounded border-gray-300 accent-indigo-600 disabled:cursor-not-allowed"
          />
        </div>

        {/* Content (clicking expands) */}
        <button
          type="button"
          onClick={() => !item.alreadyExists && setIsExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
          disabled={item.alreadyExists}
        >
          {/* Title */}
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium ${item.selected && !item.alreadyExists ? 'text-gray-900' : 'text-gray-500'}`}>
              {item.title}
            </p>
          </div>

          {/* Metadata: due date, category, hours, difficulty */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${dueLabel.className}`}>
              {dueLabel.label}
            </span>

            {item.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {item.category}
              </span>
            )}

            {/* Hours and difficulty: muted when still the prefilled default, confirmed-looking once the user has touched it */}
            <span className={`text-xs ${item.hoursTouched ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
              {item.estimatedHours} hour{item.estimatedHours !== 1 ? 's' : ''}
            </span>
            <span className={`text-xs ${item.difficultyTouched ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
              Difficulty: {item.difficulty}/10
            </span>
          </div>
        </button>

        {/* Right side actions */}
        <div className="flex shrink-0 items-center gap-1">
          {!item.alreadyExists && (
            <>
              <button
                onClick={() => onEdit(index)}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Edit title, category & description"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description and inline hours/difficulty */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-gray-100 px-4 pb-3 pt-3">

          {/* Description from ICS */}
          {item.description && (
            <div className="mb-3 max-h-40 overflow-y-auto rounded-md bg-gray-50 p-2">
              <p className="text-xs leading-relaxed text-gray-500 whitespace-pre-line">
                {item.description}
              </p>
            </div>
          )}

          {/* Inline hours + difficulty */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-600">Est. hours</label>
              <input
                type="number"
                  min="0.5"
                  max="500"
                step="0.5"
                value={item.estimatedHours}
                onChange={(e) => onInlineUpdate(index, 'estimatedHours', e.target.value)}
                className="w-20 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-gray-600">Difficulty</label>
              <input
                type="number"
                min="1"
                max="10"
                step="1"
                value={item.difficulty}
                onChange={(e) => onInlineUpdate(index, 'difficulty', e.target.value)}
                className="w-16 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>
            <p className="text-[11px] text-gray-400">Used for priority scoring</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewRow