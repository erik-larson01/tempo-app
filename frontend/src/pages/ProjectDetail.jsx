import { useContext, useEffect, useState, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Pencil, SearchX, Trash2, MoreHorizontal } from 'lucide-react'
import ProjectModal from '../components/projects/ProjectModal'
import DeleteProjectModal from '../components/projects/DeleteProjectModal'
import ProjectsContext from '../contexts/ProjectsContext'
import TaskModal from '../components/tasks/TaskModal'
import TaskList from '../components/tasks/TaskList'
import DeleteTaskModal from '../components/tasks/DeleteTaskModal'

function ProjectDetail() {
  const { getAccessTokenSilently } = useAuth0()

  // Fixed preview length for description truncation
  const DESCRIPTION_PREVIEW_LENGTH = 180

  // useParams gets the id param from the route /projects/:id to be used in the fetch
  const { id } = useParams()
  const navigate = useNavigate()
  const { setProjects } = useContext(ProjectsContext)

  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // State to track errors and error types for more specific error messaging and handling
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null)

  // State to track mobile menu open/close
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)

  // States to track modal open/close
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false)

  const [taskModalMode, setTaskModalMode] = useState('create')

  // States to track selected task for editing or deleting, and any errors from those actions
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskPendingDelete, setTaskPendingDelete] = useState(null)
  const [taskActionError, setTaskActionError] = useState(null)
  const [taskStatusUpdatingIds, setTaskStatusUpdatingIds] = useState([])

  // State to track status value for instant UI update on change, and to handle async update states
  const [statusValue, setStatusValue] = useState('NOT_STARTED')
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState(null)
  
  // State to track description expansion/truncation
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  // On every id change, fetch that specific projects's data
  useEffect(() => {
    async function fetchProjectById() {
      try {
        setIsLoading(true)
        setError(null)
        setErrorType(null)

        const accessToken = await getAccessTokenSilently()
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        // Handler to define not found errors for displaying not found UI
        if (!response.ok) {
          if ([400, 401, 403, 404].includes(response.status)) {
            const projectNotFoundError = new Error(
              "This project doesn't exist or you don't have access to it."
            )
            projectNotFoundError.code = 'PROJECT_NOT_FOUND'
            throw projectNotFoundError
          }

          throw new Error('Server error. Failed to fetch project details.')
        }

        const data = await response.json()
        setProject(data)
        setStatusValue(data.status)
      } catch (fetchError) {
        setError(fetchError.message)
        setErrorType(fetchError.code === 'PROJECT_NOT_FOUND' ? 'not-found' : 'generic')
        setProject(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectById()
  }, [id, getAccessTokenSilently])

  // Closes the overflow menu when clicking outside the menu
	useEffect(() => {
		if (!isMobileMenuOpen) return

    // Handler to detect clicks outside the menu and close it
		const handleOutsideClick = (event) => {
      const clickedInsideMobile = mobileMenuRef.current?.contains(event.target)

      if (!clickedInsideMobile) setIsMobileMenuOpen(false)
		}

    // Add event listener when menu is open
		document.addEventListener('pointerdown', handleOutsideClick)
		return () => document.removeEventListener('pointerdown', handleOutsideClick)
	}, [isMobileMenuOpen])

  // Formats the API dueDate string to readable text
  const formatDueDateLabel = (dateString) => {
    if (!dateString) return 'No due date'

    const dueDate = new Date(`${dateString}T00:00:00`)
    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCompletedDateLabel = (dateString) => {
    if (!dateString) return null

    const completedDate = new Date(dateString)
    return completedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Creates dynamic coloring for "due in X days" based on difference from today to due date (Red, Yellow, Green)
  const getDueDateStyleInfo = (dateString) => {
    if (!dateString) {
      return {
        label: 'No due date',
        style: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
      }
    }

    // Normalizes today to midnight 
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Forces due date to midnight, finds the diff in ms, and calculates the difference in days
    const dueDate = new Date(`${dateString}T00:00:00`)
    const diffMs = dueDate.getTime() - today.getTime()
    const dayDifference = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (dayDifference < 0) {
      return {
        label: 'Overdue',
        style: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
      }
    }

    if (dayDifference === 0) {
      return {
        label: 'Due today',
        style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
      }
    }

    return {
      label: `${dayDifference} ${dayDifference === 1 ? 'day' : 'days'} left`,
      style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    }
  }

  // Creates dynamic coloring for priority based on priority value and project status
  const getPriorityStyleInfo = (priority, status) => {
    if (status === 'COMPLETED') {
      return {
        label: 'Completed',
        style: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
      }
    }

    // Otherwise use the numeric priority to determine the badge color
    const numericPriority = Number(priority)

    if (Number.isNaN(numericPriority)) {
      return {
        label: 'No Priority',
        style: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
      }
    }

    if (numericPriority >= 7) {
      return {
        label: `Priority ${numericPriority.toFixed(1)}`,
        style: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      }
    }

    if (numericPriority >= 4) {
      return {
        label: `Priority ${numericPriority.toFixed(1)}`,
        style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      }
    }

    return {
      label: `Priority ${numericPriority.toFixed(1)}`,
      style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    }
  }

  // Creates dynamic styling for status pill based on project status
  const getStatusPillClasses = (status) => {
    const styles = {
      COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
      IN_PROGRESS: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
      NOT_STARTED: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
    }

    return styles[status] || styles.NOT_STARTED
  }

  // After a project is edited and saved, update the project in both the local state and the projects context
  const handleProjectSaved = (updatedProject) => {
    setProject(updatedProject)
    setStatusValue(updatedProject.status)
    setStatusUpdateError(null)

    setProjects((prevProjects) =>
      prevProjects.map((prevProject) =>
        prevProject.projectId === updatedProject.projectId ? updatedProject : prevProject
      )
    )
  }

  // Syncs the updated list of tasks to the projects context after a task is created, updated, or deleted
  const syncTasksToContext = (projectId, nextTasks) => {
    setProjects((prevProjects) =>
      prevProjects.map((prevProject) =>
        prevProject.projectId === projectId
          ? {
              ...prevProject,
              tasks: nextTasks,
            }
          : prevProject
      )
    )
  }

  // After a project is deleted, remove it from the projects context and navigate back to the projects list
  const handleProjectDeleted = (projectId) => {
    setProjects((prevProjects) =>
      prevProjects.filter((prevProject) => prevProject.projectId !== projectId)
    )

    setIsDeleteModalOpen(false)
    navigate('/projects')
  }

  // Handles status change with UI update first, API call second, and rolls back if the API call fails
  const handleProjectStatusChange = async (event) => {
    const nextStatus = event.target.value
    setStatusValue(nextStatus)
    setStatusUpdateError(null)

    // Stops re render on no change
    if (!project || nextStatus === project.status) {
      return
    }

    // Get previous status and project to fall back in case of API failure
    const previousStatus = project.status
    const previousProject = { ...project }

    // If next status is completed, set completedAt to now to be updated immediately
    const optimisticCompletedAt = nextStatus === 'COMPLETED'
      ? new Date().toISOString()
      : null

    // Update project status in UI
    setProject((prevProject) => {
      if (!prevProject) return prevProject

      return {
        ...prevProject,
        status: nextStatus,
        completedAt: optimisticCompletedAt,
      }
    })

    setIsStatusUpdating(true)

    try {
      // Make a PATCH request to the API to update the project's status
      const accessToken = await getAccessTokenSilently()

      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.projectId}/status?newStatus=${nextStatus}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        let message = 'Failed to update project status.'

        if (response.status >= 500) {
          message = 'Server error. Please try again later.'
        } else {
          try {
            const errorData = await response.json()
            message = errorData.message || message
          } catch {} // If the error did not return json (failed to fetch)
        }

        throw new Error(message)
      }

      const updatedProject = await response.json()
      handleProjectSaved(updatedProject)
    } catch (updateError) {
      // Roll back to previous status and project data on error, and show error message
      setStatusValue(previousStatus)
      setProject(previousProject)
      setStatusUpdateError(updateError.message)
    } finally {
      setIsStatusUpdating(false)
    }
  }

  // Sync full project state after task create/update responses from the backend
  const handleTaskSaved = (updatedProject) => {
    if (!updatedProject) return

    setProject(updatedProject)
    setStatusValue(updatedProject.status)
    setProjects((prevProjects) =>
      prevProjects.map((prevProject) =>
        prevProject.projectId === updatedProject.projectId ? updatedProject : prevProject
      )
    )
    setTaskActionError(null)
  }

  const openCreateTaskModal = () => {
    setTaskModalMode('create')
    setSelectedTask(null)
    setTaskActionError(null)
    setIsTaskModalOpen(true)
  }

  const openEditTaskModal = (task) => {
    setTaskModalMode('edit')
    setSelectedTask(task)
    setTaskActionError(null)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setSelectedTask(null)
  }

  const openDeleteTaskModal = (task) => {
    setTaskPendingDelete(task)
    setTaskActionError(null)
    setIsDeleteTaskModalOpen(true)
  }

  const closeDeleteTaskModal = () => {
    setIsDeleteTaskModalOpen(false)
    setTaskPendingDelete(null)
  }

  // Handles task status change with optimistic UI update and rollback on API failure
  const handleTaskStatusChange = async (task, nextStatus) => {
    if (!project || !task || nextStatus === task.status) return

    setTaskActionError(null)

    const previousTasks = [...tasks]
    const optimisticCompletedAt = nextStatus === 'COMPLETED' ? new Date().toISOString() : null
    const nextTasks = tasks.map((prevTask) =>
      prevTask.taskId === task.taskId
        ? {
            ...prevTask,
            status: nextStatus,
            completedAt: optimisticCompletedAt,
          }
        : prevTask
    )

    setProject((prevProject) => {
      if (!prevProject) return prevProject

      return {
        ...prevProject,
        tasks: nextTasks,
      }
    })

    syncTasksToContext(project.projectId, nextTasks)

    // Add task to updating state to disable interactions
    setTaskStatusUpdatingIds((prevIds) => [...prevIds, task.taskId])

    try {
      const accessToken = await getAccessTokenSilently()

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/projects/${project.projectId}/tasks/${task.taskId}/status?newStatus=${nextStatus}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        let message = 'Failed to update task status.'

        if (response.status >= 500) {
          message = 'Server error. Please try again later.'
        } else {
          try {
            const errorData = await response.json()
            message = errorData.message || message
          } catch {}
        }

        throw new Error(message)
      }

      const updatedProject = await response.json()
      handleTaskSaved(updatedProject)
    } catch (updateError) {
      // Roll back to previous tasks on error, and show error message
      setTaskActionError(updateError.message)

      // Roll back local task state
      setProject((prevProject) => {
        if (!prevProject) return prevProject

        return {
          ...prevProject,
          tasks: previousTasks,
        }
      })

      // Roll back tasks context outside setProject
      syncTasksToContext(project.projectId, previousTasks)
    } finally {
      // Remove task from updating state
      setTaskStatusUpdatingIds((prevIds) => prevIds.filter((taskId) => taskId !== task.taskId))
    }
  }

  // Toggles task completion status when the checkbox is clicked in the TaskRow component
  const handleTaskToggleComplete = async (task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED'
    await handleTaskStatusChange(task, nextStatus)
  }

  // Sync full project state after task deletion response from the backend
  const handleTaskDeleted = (updatedProject) => {
    if (!updatedProject) return

    setProject(updatedProject)
    setStatusValue(updatedProject.status)
    setProjects((prevProjects) =>
      prevProjects.map((prevProject) =>
        prevProject.projectId === updatedProject.projectId ? updatedProject : prevProject
      )
    )
    setTaskActionError(null)
    closeDeleteTaskModal()
  }

  const tasks = Array.isArray(project?.tasks) ? project.tasks : []

  // Render a pulsating card on project load
  if (isLoading) {
    return (
      <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      </section>
    )
  }


  if (error) {
    // Display message if a project is not found or a user does not have access
    if (errorType === 'not-found') {
      return (
        <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <SearchX size={14} />
            Not Found
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Project not found</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">{error}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
            >
              <ArrowLeft size={16} />
              Back to Projects
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      )
    }

    return (
      <section className="w-full rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm sm:p-6">
        <h1 className="text-lg font-semibold">Unable to load project</h1>
        <p className="mt-2 text-sm">{error}</p>
      </section>
    )
  }

  // Fallback: if there is no project data render a message
  if (!project) {
    return (
      <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-lg font-semibold text-gray-900">Project not found</h1>
      </section>
    )
  }

  // Checks if description is longer than the preview length
  const descriptionText = (project.description || '').trim()
  const shouldTruncateDescription = descriptionText.length > DESCRIPTION_PREVIEW_LENGTH

  // Determines the description text to display based on truncation logic
  const displayedDescription =
    descriptionText && !isDescriptionExpanded && shouldTruncateDescription
      ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`
      : descriptionText

  // Get styles and labels for status, priority, and due date based on project data
  const priorityInfo = getPriorityStyleInfo(project.priority, statusValue)
  const dueDateInfo = getDueDateStyleInfo(project.dueDate)
  const dueDateSummary = project.dueDate
    ? `${formatDueDateLabel(project.dueDate)} • ${dueDateInfo.label}`
    : dueDateInfo.label
  const completedDateLabel = formatCompletedDateLabel(project.completedAt)

  return (
    <>
      <section className="w-full space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {/** Top row with Back link and Edit/Delete buttons */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors duration-200 hover:bg-indigo-100"
            >
              <Pencil size={14} />
              Edit Project
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors duration-200 hover:bg-rose-100"
            >
              <Trash2 size={14} />
              Delete Project
            </button>
          </div>

          {/** Mobile Menu for Project Edit and Delete */}
          <div ref={mobileMenuRef} className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-[110%] z-30 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsEditModalOpen(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-indigo-700 hover:bg-gray-100"
                >
                  <Pencil size={14} />
                  Edit Project
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsDeleteModalOpen(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                  Delete Project
                </button>
              </div>
            )}
          </div>

        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.title}</h1>
          {/** Status pill and category */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={statusValue}
                onChange={handleProjectStatusChange}
                disabled={isStatusUpdating}
                className={`cursor-pointer appearance-none rounded-full px-2.5 py-1 pr-7 text-xs font-medium transition-all duration-200 focus:outline-none ${getStatusPillClasses(statusValue)} disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current"
              />
            </div>

            {/** Only show category if it exists*/}
            {project.category?.trim() && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {project.category}
              </span>
            )}

            {/** If status is completed, show completed date only, otherwise show priority and due date */}
            {statusValue === 'COMPLETED' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                <Check size={12} />
                {completedDateLabel ? `Completed ${completedDateLabel}` : 'Completed'}
              </span>
            ) : (
              <>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityInfo.style}`}>
                  {priorityInfo.label}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${dueDateInfo.style}`}>
                  {dueDateSummary}
                </span>
              </>
            )}
          </div>
          {statusUpdateError && <p className="mt-2 text-xs text-rose-600">{statusUpdateError}</p>}
        </div>

        {/** Description section with expand/collapse logic */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
            {shouldTruncateDescription && (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                className="text-xs font-medium text-indigo-600 transition-colors duration-200 hover:text-indigo-700"
              >
                {isDescriptionExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          <p className="max-w-3xl text-sm leading-6 text-gray-700 whitespace-pre-line">
            {displayedDescription || 'No description has been added for this project yet.'}
          </p>
        </div>

        {/** Task list with filtering and Progress Bar */}
        <TaskList
          tasks={tasks}
          taskStatusUpdatingIds={taskStatusUpdatingIds}
          onAddTask={openCreateTaskModal}
          onTaskToggleComplete={handleTaskToggleComplete}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskEdit={openEditTaskModal}
          onTaskDelete={openDeleteTaskModal}
        />

        {taskActionError && <p className="text-xs text-rose-600">{taskActionError}</p>}
      </section>

      {isEditModalOpen && (
        <ProjectModal
          mode="edit"
          project={project}
          onClose={() => setIsEditModalOpen(false)}
          onProjectSaved={handleProjectSaved}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteProjectModal
          project={project}
          onClose={() => setIsDeleteModalOpen(false)}
          onProjectDeleted={handleProjectDeleted}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal
          mode={taskModalMode}
          projectId={project.projectId}
          projectCreatedAt={project.createdAt}
          task={selectedTask}
          onClose={closeTaskModal}
          onTaskSaved={handleTaskSaved}
        />
      )}

      {isDeleteTaskModalOpen && (
        <DeleteTaskModal
          projectId={project.projectId}
          task={taskPendingDelete}
          onClose={closeDeleteTaskModal}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </>
  )
}

export default ProjectDetail
