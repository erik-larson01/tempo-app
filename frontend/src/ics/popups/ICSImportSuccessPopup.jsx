import { X, CheckCircle2 } from 'lucide-react'

function ICSImportSuccessPopup({ importResult, onClose }) {

  const MAX_VISIBLE = 6

  // Compute the visible projects and the remaining count
  const visibleProjects = importResult.createdProjects.slice(0, MAX_VISIBLE)
  const remaining = importResult.createdProjects.length - MAX_VISIBLE

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Import complete</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/** Imported projects display */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {importResult.createdProjects?.length ?? 0} project{importResult.createdProjects?.length !== 1 ? 's' : ''} imported
                </p>
                {importResult.createdProjects?.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {visibleProjects.map((project) => (
                      <li key={project.projectId} className="text-xs text-gray-500">
                        {project.title}
                      </li>
                    ))}
                    {remaining > 0 && (
                      <li className="text-xs font-medium text-gray-500">
                        and {remaining} more...
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ICSImportSuccessPopup