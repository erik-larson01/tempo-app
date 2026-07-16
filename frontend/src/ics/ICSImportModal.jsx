import { useState, useRef } from 'react'
import { X, LoaderCircle, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Calendar, Pencil } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import HowToPopup from './popups/HowToPopup'
import PreviewRow from './PreviewRow'
import ICSPreviewEditModal from './ICSPreviewEditModal'
import ICSImportSuccessPopup from './popups/ICSImportSuccessPopup'
import ICSAlreadyImportedPopup from './popups/ICSAlreadyImportedPopup'
import { normalizeDifficulty, normalizeEstimatedHours } from '../utils/icsUtils'

// Default values for estimated hours and difficulty when importing new items
const DEFAULT_ESTIMATED_HOURS = 2
const DEFAULT_DIFFICULTY = 5

function ICSImportModal({ onClose, onProjectsImported }) {
  const { getAccessTokenSilently } = useAuth0()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // State for URL input and help popup
  const [url, setUrl] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const helpRef = useRef(null)

  // State for preview items and import process
  const [previewItems, setPreviewItems] = useState([])
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [hasPreviewed, setHasPreviewed] = useState(false)

  // State for showing already imported items
  const [showAlreadyImported, setShowAlreadyImported] = useState(false)

  // State for editing an item
  const [editingIndex, setEditingIndex] = useState(null)

  // State for import process
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)

  // Calls preview endpoint and updates previewItems state with results
  async function handlePreview() {
    if (!url.trim()) return
    setIsPreviewing(true)
    setPreviewError(null)
    setPreviewItems([])
    setHasPreviewed(false)
    setImportResult(null)

    try {
      const token = await getAccessTokenSilently()
      const response = await fetch(`${import.meta.env.VITE_API_URL}/integrations/ics/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Timezone': timezone,
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch calendar. Check your URL and try again.')
      }

      const data = await response.json()

      // Pre-select all non-duplicates, and prefill hours/difficulty with defaults rather than leaving them blank. 
      setPreviewItems(
        data.map((item) => ({
          ...item,
          selected: !item.alreadyExists,
          estimatedHours: DEFAULT_ESTIMATED_HOURS,
          difficulty: DEFAULT_DIFFICULTY,
          hoursTouched: false,
          difficultyTouched: false,
        }))
      )
      setHasPreviewed(true)
    } catch (err) {
      setPreviewError(err.message)
    } finally {
      setIsPreviewing(false)
    }
  }

  // Handle toggling selection of a preview item
  function handleToggle(index) {
    setPreviewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    )
  }

  // Handle saving edits to a preview item (title/category/description, from the modal)
  function handleEditSave(index, updatedFields) {
    setPreviewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updatedFields } : item))
    )
    setEditingIndex(null)
  }

  // Handle selecting or deselecting all preview items
  function handleSelectAll(selected) {
    setPreviewItems((prev) =>
      prev.map((item) => (item.alreadyExists ? item : { ...item, selected }))
    )
  }

  // Handle inline update of a preview item field (estimatedHours/difficulty,
  // from the row's expand panel). Marks the field as touched so the row can
  // stop showing it as a default guess.
  function handleInlineUpdate(index, field, value) {
    setPreviewItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        const touchedFlag = field === 'estimatedHours' ? 'hoursTouched' : 'difficultyTouched'
        return { ...item, [field]: value, [touchedFlag]: true }
      })
    )
  }

  // Handle importing selected preview items by calling the import endpoint
  async function handleImport() {
    const selectedItems = previewItems.filter((item) => item.selected && !item.alreadyExists)
    if (selectedItems.length === 0) return

    setIsImporting(true)
    setImportError(null)

    // Convert preview items to ProjectInputDTOs
    const projectsToImport = selectedItems.map((item) => ({
      title: item.title,
      dueDate: item.dueDate,
      category: item.category || null,
      description: item.description || null,
      status: 'NOT_STARTED',
      estimatedHours: normalizeEstimatedHours(item.estimatedHours),
      difficulty: normalizeDifficulty(item.difficulty),
      clientDate: new Date().toISOString().split('T')[0],
    }))

    try {
      const token = await getAccessTokenSilently()
      const response = await fetch(`${import.meta.env.VITE_API_URL}/integrations/ics/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Timezone': timezone,
        },
        body: JSON.stringify(projectsToImport),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Import failed. Please try again.')
      }

      const result = await response.json()
      setImportResult(result)

      // Pass created projects back to parent to update context
      if (result.createdProjects?.length > 0) {
        onProjectsImported(result.createdProjects)
      }
    } catch (error) {
      setImportError(error.message)
    } finally {
      setIsImporting(false)
    }
  }

  // Compute derived counts for new items, already imported items, and selection state
  const newItems = previewItems.filter((item) => !item.alreadyExists)
  const alreadyImportedItems = previewItems.filter((item) => item.alreadyExists)
  const selectedCount = previewItems.filter((item) => item.selected && !item.alreadyExists).length
  const allSelected = newItems.length > 0 && newItems.every((item) => item.selected)
  const allAlreadyImported = hasPreviewed && previewItems.length > 0 && newItems.length === 0 && alreadyImportedItems.length > 0

  // Import success screen after import is complete
  if (importResult) {
    return <ICSImportSuccessPopup importResult={importResult} onClose={onClose} />
  }

  // Render the edit modal if an item is being edited
  if (editingIndex !== null) {
    const item = previewItems[editingIndex]
    return (
      <ICSPreviewEditModal
        item={item}
        onSave={(updated) => handleEditSave(editingIndex, updated)}
        onClose={() => setEditingIndex(null)}
      />
    )
  }

  // Render the already imported popup if all items are already imported
  if (allAlreadyImported) {
    return (
      <ICSAlreadyImportedPopup
        alreadyImportedCount={alreadyImportedItems.length}
        onCloseModal={onClose}
      />
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex w-full max-w-2xl flex-col rounded-xl bg-white max-h-[90vh]">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">Import from Calendar</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Middle Calendar URL input section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Calendar URL
                </label>
                <div className="relative" ref={helpRef}>
                  <button
                    type="button"
                    onClick={() => setShowHelp((v) => !v)}
                    className="flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-600 transition-colors duration-150"
                  >
                    <HelpCircle size={15} />
                  </button>
                  {showHelp && (
                    <HowToPopup anchorRef={helpRef} onClose={() => setShowHelp(false)} />
                  )}
                </div>
              </div>
              {/* URL input field and preview button section */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                  placeholder="Paste your calendar feed URL"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={handlePreview}
                  disabled={!url.trim() || isPreviewing}
                  className="flex shrink-0 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPreviewing ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Preview'
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Paste your Canvas, Moodle, or any ICS calendar feed URL. Click the{' '}
                <span className="font-medium text-indigo-600">?</span> for help finding it.
              </p>
            </div>

            {/* Preview error */}
            {previewError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <p>{previewError}</p>
              </div>
            )}

            {/* Preview results */}
            {hasPreviewed && previewItems.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
                <Calendar size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">No upcoming assignments found</p>
                <p className="mt-1 text-xs text-gray-500">
                  Past events are filtered out. If you expected results, check your date range in the LMS export settings.
                </p>
              </div>
            )}

            {newItems.length > 0 && (
              <div className="space-y-3">
                {/* Select all row */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {newItems.length} assignment{newItems.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={() => handleSelectAll(!allSelected)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* New items */}
                <div className="space-y-2">
                  {newItems.map((item, i) => {
                    const originalIndex = previewItems.indexOf(item)
                    return (
                      <PreviewRow
                        key={i}
                        item={item}
                        index={originalIndex}
                        onToggle={handleToggle}
                        onEdit={setEditingIndex}
                        onInlineUpdate={handleInlineUpdate}
                      />
                    )
                  })}
                </div>

                {/* Edit hint */}
                <p className="text-xs text-gray-400">
                  Expand a row to adjust estimated hours and difficulty. Use <Pencil size={10} className="inline mb-0.5" /> to edit the title, category, or description.
                </p>
              </div>
            )}

            {/* Already imported section */}
            {alreadyImportedItems.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAlreadyImported((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-left transition-colors hover:bg-gray-100"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Already imported ({alreadyImportedItems.length})
                  </p>
                  {showAlreadyImported ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>

                {showAlreadyImported && (
                  <div className="space-y-2">
                    {alreadyImportedItems.map((item, i) => {
                      const originalIndex = previewItems.indexOf(item)
                      return (
                        <PreviewRow
                          key={i}
                          item={item}
                          index={originalIndex}
                          onToggle={handleToggle}
                          onEdit={setEditingIndex}
                          onInlineUpdate={handleInlineUpdate}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-200 px-6 py-4">
            {importError && (
              <p className="mb-3 text-sm text-rose-600">{importError}</p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {selectedCount > 0
                  ? `${selectedCount} project${selectedCount !== 1 ? 's' : ''} selected for import`
                  : hasPreviewed
                  ? 'Select assignments to import'
                  : 'Enter a calendar URL above to get started. Only upcoming events are shown.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  Cancel
                </button>

                {selectedCount > 0 && (
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <LoaderCircle size={14} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      `Import ${selectedCount} project${selectedCount !== 1 ? 's' : ''}`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ICSImportModal