import { CheckCircle2, X } from 'lucide-react'

function ICSAlreadyImportedPopup({ alreadyImportedCount, onCloseModal }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50" style={{ zIndex: 60 }} />
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 70 }}>
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Already imported</h2>
            <button onClick={onCloseModal} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Body of Popup */}
          <div className="px-6 py-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  All {alreadyImportedCount} item{alreadyImportedCount !== 1 ? 's' : ''} in this calendar are already imported.
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  There are no new assignments to import from this calendar feed right now.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 px-6 py-4">
            <button
              onClick={onCloseModal}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ICSAlreadyImportedPopup