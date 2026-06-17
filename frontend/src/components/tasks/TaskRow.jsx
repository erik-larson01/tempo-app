import { CheckSquare, ChevronDown, MoreHorizontal, Pencil, Square, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function TaskRow({task, isStatusUpdating = false, onToggleComplete, onStatusChange, onEdit, onDelete,}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
	const menuRef = useRef(null)

	// Closes the overflow menu when clicking outside the menu
	useEffect(() => {
		if (!isMenuOpen) return

    // Handler to detect clicks outside the menu and close it
		const handleOutsideClick = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setIsMenuOpen(false)
			}
		}

    // Add event listener when menu is open
		document.addEventListener('mousedown', handleOutsideClick)
		return () => document.removeEventListener('mousedown', handleOutsideClick)
	}, [isMenuOpen])

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

	// Creates dynamic coloring for due date based on task status and difference from today
	const getDueDateStyleInfo = (taskData) => {
		if (taskData.status === 'COMPLETED') {
			return {
				label: taskData.completedAt
					? `Completed ${formatCompletedDateLabel(taskData.completedAt)}`
					: 'Completed',
				style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
				leftAccent: '',
			}
		}

		if (!taskData.dueDate) {
			return {
				label: 'No due date',
				style: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
				leftAccent: '',
			}
		}

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const dueDate = new Date(`${taskData.dueDate}T00:00:00`)
		const diffMs = dueDate.getTime() - today.getTime()
		const dayDifference = Math.floor(diffMs / (1000 * 60 * 60 * 24))
		if (dayDifference < 0) {
			return {
				label: `Overdue ${formatDueDateLabel(taskData.dueDate)}`,
				style: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
				leftAccent: 'border-l-4 border-l-rose-400',
			}
		}

		if (dayDifference === 0) {
			return {
				label: 'Due today',
				style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
				leftAccent: 'border-l-4 border-l-amber-400',
			}
		}

		return {
			label: `${dayDifference} ${dayDifference === 1 ? 'day' : 'days'} left`,
			style: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
			leftAccent: '',
		}
	}

	// Creates dynamic coloring for difficulty based on numeric value
	const getDifficultyStyleInfo = (difficulty) => {
		const numericDifficulty = Number(difficulty)

		if (Number.isNaN(numericDifficulty)) {
			return {
				label: 'Difficulty: --',
				style: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
			}
		}

		if (numericDifficulty >= 8) {
			return {
				label: `Difficulty: ${numericDifficulty}`,
				style: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
			}
		}

		if (numericDifficulty >= 5) {
			return {
				label: `Difficulty: ${numericDifficulty}`,
				style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
			}
		}

		return {
			label: `Difficulty: ${numericDifficulty}`,
			style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
		}
	}

	// Creates dynamic styling for status pill based on task status
	const getStatusPillClasses = (status) => {
		const styles = {
			COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
			IN_PROGRESS: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
			NOT_STARTED: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
		}

		return styles[status] || styles.NOT_STARTED
	}

	const numericHours = Number(task.estimatedHours)
	const formattedEstimatedHours = Number.isNaN(numericHours)
		? '--'
		: Number.isInteger(numericHours)
			? numericHours.toString()
			: numericHours.toFixed(1)

	const isCompleted = task.status === 'COMPLETED'
	const dueDateInfo = getDueDateStyleInfo(task)
	const difficultyInfo = getDifficultyStyleInfo(task.difficulty)

	return (
		<article
			onClick={() => setIsExpanded((prev) => !prev)}
			className={`group relative rounded-lg border border-gray-200 ${isCompleted ? 'bg-gray-50 border-gray-100' : 'bg-white'} px-3 py-2.5 transition-all duration-200 hover:shadow-sm hover:bg-gray-50/40 hover:border-gray-300 ${dueDateInfo.leftAccent} cursor-pointer`}
		>
      <div className="flex items-center gap-3">
        {/** Checkbox for instant completion toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete()
          }}
          disabled={isStatusUpdating}
          aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
          className={`shrink-0 rounded p-1 text-indigo-600 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed active:scale-95 disabled:opacity-60`}
        >
          {isCompleted ? <CheckSquare size={19} /> : <Square size={19} />}
        </button>

        {/** Task title */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
          <p
            title={task.title}
            className={`truncate text-sm font-medium ${isCompleted ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-700'}`}
          >
            {task.title}
          </p>
          {task.description && (
            <ChevronDown
              size={13}
              className={`shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>

        {/** Due date */}
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${dueDateInfo.style}`}>
          {dueDateInfo.label}
        </span>

        <span className="shrink-0 text-xs text-gray-500">{formattedEstimatedHours} hrs</span>

        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${difficultyInfo.style}`}
        >
          {difficultyInfo.label}
        </span>

        {/** Status dropdown */}
        <div className="relative shrink-0">
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(event) => onStatusChange(event.target.value)}
            disabled={isStatusUpdating}
            className={`cursor-pointer appearance-none rounded-full px-2.5 py-1 pr-7 text-xs font-medium transition-all duration-200 focus:outline-none ${getStatusPillClasses(task.status)} disabled:cursor-not-allowed disabled:opacity-70`}
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

        {/** Button for Edit/Delete menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen((prev) => !prev)
            }}
            className="rounded-md p-1 text-gray-500 opacity-0 duration-200 hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 transition-opacity"
            aria-label="Task actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {/** Menu for Edit/Delete actions */}
          {isMenuOpen && (
            <div className="absolute right-0 top-[110%] z-10 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  onEdit()
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-indigo-700 transition-colors duration-150 hover:bg-gray-100"
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  onDelete()
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-rose-700 transition-colors duration-150 hover:bg-rose-50"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

		  {/** Expanded task description when TaskRow is clicked */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded && task.description ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-10 mt-2.5 border-t border-gray-100 pt-2.5">
          <p className={`text-xs leading-relaxed ${task.description ? 'text-gray-500' : 'text-gray-400 italic'}`}>
            {task.description || 'No description added.'}
          </p>
        </div>
      </div>
		</article>
	)
}

export default TaskRow
