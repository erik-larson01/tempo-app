import { X, LoaderCircle } from "lucide-react"
import { useEffect, useState, useContext } from "react"
import { useAuth0 } from '@auth0/auth0-react'
import UserContext from '../../contexts/UserContext'

// Default form values for both create and edit modes
const getDefaultForm = () => ({
	title: "",
	dueDate: "",
	status: "NOT_STARTED",
	description: "",
	difficulty: 5,
	estimatedHours: "",
})

// Normalize form values for accurate comparison with original task data
const normalizeFormForComparison = (formData) => ({
	...formData,
	difficulty: Number(formData.difficulty),
	estimatedHours:
		formData.estimatedHours === "" || formData.estimatedHours === null
			? ""
			: Number(formData.estimatedHours),
})

// Build edit-form values from a task object
const getFormFromTask = (task) => ({
	title: task.title || "",
	dueDate: task.dueDate || "",
	status: task.status || "NOT_STARTED",
	description: task.description || "",
	difficulty: task.difficulty ?? 5,
	estimatedHours: task.estimatedHours ?? "",
})

function TaskModal({mode, onClose, onTaskSaved, projectId,task = null}) {
  const { getAccessTokenSilently } = useAuth0()
	const [isLoading, setIsLoading] = useState(false)
	const [submitError, setSubmitError] = useState(null)
  const { refreshCurrentUser } = useContext(UserContext)

	// Form to be passed to API when creating/updating a task
	const [form, setForm] = useState(getDefaultForm)

	// On mount, Load selected task data in edit mode, or reset to default form in create mode
	useEffect(() => {
		if (mode === "edit") {
			if (!task) return

			// Pre-fill the form with task data
			setForm(getFormFromTask(task))
			return
		}

		// Set the form to default values in create mode
		setForm(getDefaultForm())
	}, [mode, task])

	if (mode === "edit" && !task) return null

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

	// Sends form data to API to create or update task, then closes modal on success
	async function handleFormSubmit(e) {
		e.preventDefault()
		setSubmitError(null)
		setIsLoading(true)

		// Determine request behavior based on modal mode
		const isEditMode = mode === "edit"

		// Fetch request creates or updates task, then updates parent component state and closes modal
		try {
			const accessToken = await getAccessTokenSilently()

			// Send update request if in edit mode, or create request if in create mode
			const url = isEditMode
				? `${import.meta.env.VITE_API_URL}/projects/${projectId}/tasks/${task.taskId}`
				: `${import.meta.env.VITE_API_URL}/projects/${projectId}/tasks`

			const response = await fetch(url, {
				method: isEditMode ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					title: form.title,
					dueDate: form.dueDate || null,
					status: form.status,
					description: form.description,
					difficulty: form.difficulty,
					estimatedHours: parseFloat(form.estimatedHours),
          clientDate: !isEditMode ? getLocalDateString() : undefined, // Only send clientDate on create
				}),
			})

      // Update the task's user's lifetime completed task count (backend will check if the task was newly completed)
      if (isEditMode) {
        await refreshCurrentUser()
      }

			// On error, retrieve the error message to display to the user
			if (!response.ok) {
				let message = isEditMode ? "Failed to update task." : "Failed to create task."

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

			const updatedProject = await response.json()

			onTaskSaved(updatedProject)
			onClose()
		} catch (error) {
			setSubmitError(error.message)
		} finally {
			setIsLoading(false)
		}
	}

	// Ensure required fields are filled before allowing form submission
	const isValid =
		form.title.trim() !== "" &&
		form.estimatedHours !== "" &&
		!Number.isNaN(Number(form.estimatedHours))

	// Keep due date min consistent with mode: today for create, task createdOnDate for edit
	const isEditMode = mode === "edit"
	const minDateStr = isEditMode && task?.createdOnDate ? task.createdOnDate : getLocalDateString()

	// In edit mode, only enable submission after at least one field differs from the original task values
	const hasFormChanges = isEditMode
		? JSON.stringify(normalizeFormForComparison(form)) !==
			JSON.stringify(normalizeFormForComparison(getFormFromTask(task)))
		: true

	// Disable submit button if required values are missing, or if edit mode has no form changes
	const isSubmitDisabled = !isValid || (isEditMode && !hasFormChanges)

	const formId = `${mode}-task-form`

	return (
		<>
			<div className="fixed inset-0 z-40 bg-black/50" />
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="w-full max-w-lg rounded-xl bg-white">
					<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
						<h2 className="text-base font-semibold text-gray-700">
							{isEditMode ? "Edit Task" : "New Task"}
						</h2>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
							<X size={24} />
						</button>
					</div>

					<div className="max-h-[70vh] overflow-y-auto px-6 py-4">
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
										placeholder="Enter task title"
										className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
											${submitError?.toLowerCase().includes("title") ? "border-red-500" : "border-gray-300"}`}
									/>
								</div>

								{/** Due Date, Status fields */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-1.5 min-w-0">
										<label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
											Due Date
										</label>
										<input
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

							{/** Description, Difficulty, Estimated Hours */}
							<div className="space-y-4">
								<div className="space-y-1.5">
									<label htmlFor="description" className="block text-sm font-medium text-gray-700">
										Description
									</label>
									<textarea
										id="description"
										name="description"
										rows={3}
										maxLength={500}
										value={form.description}
										onChange={handleInputChange}
										placeholder="Add notes about this task"
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
										<span className="w-6 text-center text-sm font-medium text-gray-700">
											{form.difficulty}
										</span>
									</div>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
										Estimated Time (Hours) <span className="text-red-500">*</span>
									</label>
									<input
										required
										id="estimatedHours"
										name="estimatedHours"
										type="number"
										value={form.estimatedHours}
										onChange={handleInputChange}
										min="0"
										step="0.5"
                    max="50"
										className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
									/>
								</div>
							</div>
						</form>
					</div>

					{/** Display an error message if submission fails */}
					{submitError && (
						<p className="border-t border-red-100 px-6 py-2 text-sm text-red-500">{submitError}</p>
					)}

					{/** Bottom section of form: Action buttons */}
					<div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
						<button
							onClick={onClose}
							className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
						>
							Cancel
						</button>
						<button
							form={formId}
							type="submit"
							className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700 disabled:opacity-50"
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

export default TaskModal
