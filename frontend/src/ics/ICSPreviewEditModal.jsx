import { useState } from 'react'
import { X } from 'lucide-react'
import { formatPreviewDate } from '../utils/icsUtils'

function ICSPreviewEditModal({ item, onSave, onClose }) {
  // Pre fills the form with the current values of the item being edited.
  // Estimated hours and difficulty are intentionally not handled here
  const [form, setForm] = useState({
    title: item.title || '',
    category: item.category || '',
    description: item.description || '',
  })

  // On form change, update the corresponding field in the form state
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSave() {
    onSave({
      title: form.title.trim() || item.title,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white">

          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Edit before importing</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={70}
                autoFocus
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Due date: read only, came from ICS */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Due date</label>
              <input
                value={formatPreviewDate(item.dueDate)}
                disabled
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <p className="text-xs text-gray-400">Due date comes from your calendar and cannot be changed here.</p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Category <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                maxLength={30}
                placeholder="e.g. CS 571"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <span className="text-xs text-gray-400">{form.description.length}/2000</span>
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={8}
                maxLength={2000}
                placeholder="Assignment details..."
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <p className="text-xs text-gray-400">
              Estimated hours and difficulty are set by clicking the preview row to expand it and edit inline.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ICSPreviewEditModal