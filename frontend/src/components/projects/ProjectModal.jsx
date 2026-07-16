import { X, LoaderCircle } from "lucide-react"
import { useEffect, useState, useContext } from "react"
import { useAuth0 } from '@auth0/auth0-react'
import UserContext from "../../contexts/UserContext"
// Default form values for both create and edit modes
const getDefaultForm = () => ({
  title: "",
  dueDate: "",
  status: "NOT_STARTED",
  category: "",
  description: "",
  difficulty: 5,
  estimatedHours: "",
})

// Normalize form values for accurate comparison with original project data
const normalizeFormForComparison = (formData) => ({
  ...formData,
  difficulty: Number(formData.difficulty),
  estimatedHours:
    formData.estimatedHours === "" || formData.estimatedHours === null
      ? ""
      : Number(formData.estimatedHours),
})

// Build edit-form values from a project object
const getFormFromProject = (project) => ({
  title: project.title || "",
  dueDate: project.dueDate || "",
  status: project.status || "NOT_STARTED",
  category: project.category || "",
  description: project.description || "",
  difficulty: project.difficulty ?? 5,
  estimatedHours: project.estimatedHours ?? "",
})

function ProjectModal({ mode, onClose, onProjectSaved, project = null }) {
  const { getAccessTokenSilently } = useAuth0()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const { currentUser, setCurrentUser, refreshCurrentUser } = useContext(UserContext)

  // Form to be passed to API when creating/updating a project
  const [form, setForm] = useState(getDefaultForm)

  // On mount, Load selected project data in edit mode, or reset to default form in create mode
  useEffect(() => {
    if (mode === "edit") {
      if (!project) return

      // Pre-fill the form with project data
      setForm(getFormFromProject(project))
      return
    }

    // Set the form to default values in create mode
    setForm(getDefaultForm())
  }, [mode, project])

  if (mode === "edit" && !project) return null

  // Ensure date inputs receive YYYY-MM-DD in local time to avoid timezone shift issues
  const getLocalDateString = (dateInput = new Date()) => {
    const date = new Date(dateInput)
    date.setHours(0, 0, 0, 0)

    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleInputChange = (e) => {
    // Ensure difficulty is always a number not a string
    const { name, value } = e.target
    const parsedValue = name === "difficulty" ? Number(value) : value

    setForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }))
  }

  // Sends form data to API to create or update project, then closes modal on success
  async function handleFormSubmit(e) {
    e.preventDefault()
    setSubmitError(null)
    setIsLoading(true)

    // Determine request behavior based on modal mode
    const isEditMode = mode === "edit"

    // Fetch request creates or updates project, then updates parent component state and closes modal
    try {
      const accessToken = await getAccessTokenSilently()

      // Send update request if in edit mode, or create request if in create mode
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/projects/${project.projectId}`
        : `${import.meta.env.VITE_API_URL}/projects`

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          dueDate: form.dueDate,
          status: form.status,
          category: form.category || null,
          description: form.description || null,
          difficulty: form.difficulty,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
          clientDate: !isEditMode ? getLocalDateString() : undefined, // Only send clientDate on create
        }),
      })

      // On error, retrieve the error message to display to the user
      if (!response.ok) {
        let message = isEditMode ? "Failed to update project." : "Failed to create project."

        if (response.status >= 500) {
          message = "Server error. Please try again later."
        } else {
          try {
            const errorData = await response.json()
            message = errorData.message || message
          } catch {} // If the error did not return json (failed to fetch)
        }

        throw new Error(message)
      }

      const savedProject = await response.json()

      // Update the projects' user's lifetime project creation count if in create mode
      if (!isEditMode) {
        await refreshCurrentUser()
      }

      onProjectSaved(savedProject)
      onClose()
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Ensure required fields are filled before allowing form submission
  const isValid = form.title.trim() !== "" && form.dueDate !== ""

  // Keep due date min consistent with mode: today for create, project createdAt for edit
  const isEditMode = mode === "edit"
  const minDateStr = isEditMode ? (project.createdOnDate || getLocalDateString()) : getLocalDateString()

  // In edit mode, only enable submission after at least one field differs from the original project values
  const hasFormChanges = isEditMode
    ? JSON.stringify(normalizeFormForComparison(form)) !==
      JSON.stringify(normalizeFormForComparison(getFormFromProject(project)))
    : true

  // Disable submit button if required values are missing, or if edit mode has no form changes
  const isSubmitDisabled = !isValid || (isEditMode && !hasFormChanges)

  const formId = `${mode}-project-form`

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-700">
              {isEditMode ? "Edit Project" : "New Project"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <form id={formId} className="space-y-5" onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                {/** Title */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    id="title"
                    name="title"
                    type="text"
                    maxLength={70}
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title"
                    className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
                      ${submitError?.toLowerCase().includes("title") ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>

                {/** Due Date, Status fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 min-w-0">
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      id="dueDate"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleInputChange}
                      min={minDateStr}
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      {isEditMode && <option value="COMPLETED">Completed</option>}
                    </select>
                  </div>
                </div>
              </div>

              {/** Optional fields: Category, Description, Difficulty, Estimated Hours */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    maxLength={30}
                    value={form.category}
                    onChange={handleInputChange}
                    placeholder="Work, School, Personal"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    maxLength={2000}
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Add notes about this project"
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                    Difficulty (1-10)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="difficulty"
                      name="difficulty"
                      type="range"
                      min="1"
                      max="10"
                      value={form.difficulty}
                      onChange={handleInputChange}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700 w-6 text-center">
                      {form.difficulty}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
                    Estimated Time (Hours)
                  </label>
                  <input
                    id="estimatedHours"
                    name="estimatedHours"
                    type="number"
                    value={form.estimatedHours}
                    onChange={handleInputChange}
                    min="0.5"
                    step="0.5"
                    max="500"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </form>
          </div>

          {/** Display an error message if submission fails */}
          {submitError && (
            <p className="text-sm text-red-500 px-6 py-2 border-t border-red-100">{submitError}</p>
          )}

          {/** Bottom section of form: Action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              form={formId}
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200"
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin" size={16} />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectModal