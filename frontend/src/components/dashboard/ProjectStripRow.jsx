import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProgressBar from '../projects/ProgressBar'

// Get due date label and styling info based on how close the due date is
const getDueDateStyleInfo = (dateString) => {
	if (!dateString) {
		return {
			label: 'No due date',
			style: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
		}
	}

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const dueDate = new Date(`${dateString}T00:00:00`)
	const diffMs = dueDate.getTime() - today.getTime()
	const dayDifference = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (dayDifference < 0) {
		return {
			label: 'Overdue',
			style: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
		}
	}

	if (dayDifference === 0) {
		return {
			label: 'Due today',
			style: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
		}
	}

	return {
		label: `${dayDifference} ${dayDifference === 1 ? 'day' : 'days'} left`,
		style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
	}
}

// Get priority label and styling info based on project priority and status
const getPriorityStyleInfo = (priority, status) => {
	if (status === 'COMPLETED') {
		return {
			label: 'Completed',
			style: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
		}
	}

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

function ProjectStripRow({ project }) {
	const tasks = Array.isArray(project.tasks) ? project.tasks : []
	const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length
	const totalTasks = tasks.length

	const dueInfo = getDueDateStyleInfo(project.dueDate)
	const priorityInfo = getPriorityStyleInfo(project.priority, project.status)

	const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

	return (
		<Link
			to={`/projects/${project.projectId}`}
			className="flex items-center gap-2 sm:gap-3 border-b border-gray-100 px-1 py-3 transition-colors hover:bg-gray-50 last:border-0 overflow-hidden"
		>
			<p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{project.title}</p>

			<div className="w-16 sm:w-20 shrink-0">
				<ProgressBar completed={completedTasks} total={totalTasks} />
			</div>

			<span className="hidden sm:block w-8 shrink-0 text-xs text-gray-500">{percentage}%</span>

			<span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${dueInfo.style}`}>
				{dueInfo.label}
			</span>

			<span className={`hidden sm:block shrink-0 rounded-full px-2 py-1 text-xs font-medium ${priorityInfo.style}`}>
				{priorityInfo.label}
			</span>

			<ChevronRight size={16} className="shrink-0 text-gray-400" />
		</Link>
	)
}

export default ProjectStripRow
