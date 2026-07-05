import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import ProgressBar from '../projects/ProgressBar'
import TaskRow from './TaskRow'
import { TASK_SORT_OPTIONS, USER_PREFERENCE_KEYS, readStoredPreference, writeStoredPreference } from '../../utils/userPreferences'

function TaskList({tasks, onAddTask, onTaskToggleComplete, onTaskStatusChange, onTaskEdit,onTaskDelete, taskStatusUpdatingIds = []}) {
	// Filter pill options to avoid hardcoding strings
	const FILTER_OPTIONS = {
		ALL: 'ALL',
		TODO: 'TODO',
		IN_PROGRESS: 'IN_PROGRESS',
		OVERDUE: 'OVERDUE',
		DUE_TODAY: 'DUE_TODAY',
		NO_DUE_DATE: 'NO_DUE_DATE',
	}

  const [selectedFilter, setSelectedFilter] = useState(() => {
    const saved = localStorage.getItem("tempo-task-list-filter");
    return saved !== null ? JSON.parse(saved) : FILTER_OPTIONS.ALL;
  });
  const [sortBy, setSortBy] = useState(() => {
    return readStoredPreference(USER_PREFERENCE_KEYS.TASK_SORT, TASK_SORT_OPTIONS.DUE_DATE_ASC)
  });
  const [showCompleted, setShowCompleted] = useState(() => {
    return readStoredPreference(USER_PREFERENCE_KEYS.SHOW_COMPLETED_TASKS, false)
  });

  useEffect(() => {
    localStorage.setItem("tempo-task-list-filter", JSON.stringify(selectedFilter));
  }, [selectedFilter]);

  useEffect(() => {
		writeStoredPreference(USER_PREFERENCE_KEYS.TASK_SORT, sortBy)
  }, [sortBy]);

  useEffect(() => {
		writeStoredPreference(USER_PREFERENCE_KEYS.SHOW_COMPLETED_TASKS, showCompleted)
  }, [showCompleted]);

  // Get task completion info for progress bar
	const safeTasks = Array.isArray(tasks) ? tasks : []
	const totalTasks = safeTasks.length
	const completedTasks = safeTasks.filter((task) => task?.status === 'COMPLETED').length

  // Calculate estimated hours remaining by summing the estimated hours of all incomplete tasks
	const estimatedHoursRemaining = safeTasks.reduce((sum, task) => {
		const taskHours = Number(task?.estimatedHours)
		const isIncomplete = task?.status !== 'COMPLETED'

		if (!isIncomplete || Number.isNaN(taskHours) || taskHours < 0) {
			return sum
		}

		return sum + taskHours
	}, 0)

	const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

	// Format estimated hours remaining to show no decimal if it's a whole number, and 1 decimal if it has a fraction, while also handling invalid numbers
	const formattedEstimatedHoursRemaining = Number.isInteger(estimatedHoursRemaining)
		? estimatedHoursRemaining.toString()
		: estimatedHoursRemaining.toFixed(1)

	// Normalizes date string to timestamp in milliseconds for sorting comparison
	const getTimestamp = (dateString) => {
		if (!dateString) return Number.POSITIVE_INFINITY
		return new Date(`${dateString}T00:00:00`).getTime()
	}

	// Builds due-date metadata once for filtering/grouping logic
	const getTaskDueInfo = (task) => {
		if (!task?.dueDate) {
			return {
				hasDueDate: false,
				isOverdue: false,
				isDueToday: false,
			}
		}

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const dueDate = new Date(`${task.dueDate}T00:00:00`)
		const diffMs = dueDate.getTime() - today.getTime()
		const dayDifference = Math.floor(diffMs / (1000 * 60 * 60 * 24))

		return {
			hasDueDate: true,
			isOverdue: dayDifference < 0,
			isDueToday: dayDifference === 0,
		}
	}

	// Applies the selected filter pill to tasks
	const filteredTasks = safeTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)

		if (selectedFilter === FILTER_OPTIONS.TODO) {
			return task.status === 'NOT_STARTED'
		}

		if (selectedFilter === FILTER_OPTIONS.IN_PROGRESS) {
			return task.status === 'IN_PROGRESS'
		}

		if (selectedFilter === FILTER_OPTIONS.OVERDUE) {
			return task.status !== 'COMPLETED' && dueInfo.isOverdue
		}

		if (selectedFilter === FILTER_OPTIONS.DUE_TODAY) {
			return task.status !== 'COMPLETED' && dueInfo.isDueToday
		}

		if (selectedFilter === FILTER_OPTIONS.NO_DUE_DATE) {
			return task.status !== 'COMPLETED' && !dueInfo.hasDueDate
		}

		return true
	})

	// Sorts tasks based on selected sort option
	const sortedTasks = [...filteredTasks].sort((a, b) => {
		const aHasDueDate = Boolean(a?.dueDate)
		const bHasDueDate = Boolean(b?.dueDate)

		if (sortBy === TASK_SORT_OPTIONS.DUE_DATE_DESC) {
			if (!aHasDueDate && !bHasDueDate) return 0
			if (!aHasDueDate) return 1
			if (!bHasDueDate) return -1
			return getTimestamp(b.dueDate) - getTimestamp(a.dueDate)
		}

		if (sortBy === TASK_SORT_OPTIONS.DIFFICULTY_DESC) {
			return Number(b.difficulty) - Number(a.difficulty)
		}

		if (sortBy === TASK_SORT_OPTIONS.ESTIMATED_HOURS_DESC) {
			return Number(b.estimatedHours) - Number(a.estimatedHours)
		}

    // Ensure not started comes first then in progress then completed for status sorting
		if (sortBy === TASK_SORT_OPTIONS.STATUS_ASC) {
			const statusRank = {
				NOT_STARTED: 0,
				IN_PROGRESS: 1,
				COMPLETED: 2,
			}
			return (statusRank[a.status]) - (statusRank[b.status])
		}

		// Default: due date soonest first
		if (!aHasDueDate && !bHasDueDate) return 0
		if (!aHasDueDate) return 1
		if (!bHasDueDate) return -1
		return getTimestamp(a.dueDate) - getTimestamp(b.dueDate)
	})

	const overdueTasks = sortedTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task.status !== 'COMPLETED' && dueInfo.isOverdue
	})

	const dueTodayTasks = sortedTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task.status !== 'COMPLETED' && dueInfo.isDueToday
	})

	const upcomingTasks = sortedTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task.status !== 'COMPLETED' && dueInfo.hasDueDate && !dueInfo.isOverdue && !dueInfo.isDueToday
	})

	const noDueDateTasks = sortedTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task.status !== 'COMPLETED' && !dueInfo.hasDueDate
	})

	const completedTasksList = sortedTasks.filter((task) => task.status === 'COMPLETED')
	const todoTasksCount = safeTasks.filter((task) => task?.status === 'NOT_STARTED').length
	const inProgressTasksCount = safeTasks.filter((task) => task?.status === 'IN_PROGRESS').length

	const overdueTasksCount = safeTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task?.status !== 'COMPLETED' && dueInfo.isOverdue
	}).length

	const dueTodayTasksCount = safeTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task?.status !== 'COMPLETED' && dueInfo.isDueToday
	}).length

	const noDueDateTasksCount = safeTasks.filter((task) => {
		const dueInfo = getTaskDueInfo(task)
		return task?.status !== 'COMPLETED' && !dueInfo.hasDueDate
	}).length
 
  // For non "All" filters, visible tasks are just the sorted tasks that match the filter
	let visibleTasksForNonAllFilter = []
  if (selectedFilter !== FILTER_OPTIONS.ALL) {
    visibleTasksForNonAllFilter = showCompleted  ? sortedTasks : sortedTasks.filter(task => task.status !== 'COMPLETED');
  }

  // Checks if there are any tasks to show in the "All" filter
	const hasVisibleTasksInAllGroups =
		overdueTasks.length > 0 ||
		dueTodayTasks.length > 0 ||
		upcomingTasks.length > 0 ||
		noDueDateTasks.length > 0 ||
		(showCompleted && completedTasksList.length > 0)

	return (
		<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
			{/** Task completion section with progress bar and task summary info */}
			<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Task Progress</p>

			{/** Header row with task count and add button */}
			<div className="flex items-center justify-between gap-3">
				<p className="shrink-0 text-sm font-semibold text-gray-800">Tasks ({totalTasks})</p>

				{/** Add Task button */}
				<button
					type="button"
					onClick={onAddTask}
					className="shrink-0 flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
				>
					<Plus size={16} />
					Add Task
				</button>
			</div>

			{/** Full-width progress bar and summary stats */}
			<div className="mt-3 space-y-1.5">
				<div className="w-full">
					<ProgressBar completed={completedTasks} total={totalTasks} thick={true} />
				</div>

				<div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
					<span>{completedTasks}/{totalTasks} tasks</span>
					<span>&middot;</span>
					<span>{completionPercentage}%</span>
					<span>&middot;</span>
					<span>{formattedEstimatedHoursRemaining}h remaining</span>
				</div>
			</div>

			{/** Task Filter and Sort controls */}
			<div className="mt-4 flex flex-wrap items-center gap-2">
				{/** Filter pills row */}
				<button
					type="button"
					onClick={() => {
						setSelectedFilter(FILTER_OPTIONS.ALL)
					}}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${selectedFilter === FILTER_OPTIONS.ALL ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}
				>
					All ({totalTasks})
				</button>
				<button
					type="button"
					onClick={() => setSelectedFilter(FILTER_OPTIONS.TODO)}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${selectedFilter === FILTER_OPTIONS.TODO ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}
				>
					To Do ({todoTasksCount})
				</button>
				<button
					type="button"
					onClick={() => setSelectedFilter(FILTER_OPTIONS.IN_PROGRESS)}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${selectedFilter === FILTER_OPTIONS.IN_PROGRESS ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}
				>
					In Progress ({inProgressTasksCount})
				</button>
				<button
					type="button"
					onClick={() => setSelectedFilter(FILTER_OPTIONS.OVERDUE)}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${selectedFilter === FILTER_OPTIONS.OVERDUE ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}
				>
					Overdue ({overdueTasksCount})
				</button>
				<button
					type="button"
					onClick={() => setSelectedFilter(FILTER_OPTIONS.DUE_TODAY)}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${selectedFilter === FILTER_OPTIONS.DUE_TODAY ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}
				>
					Due Today ({dueTodayTasksCount})
				</button>
				<button
					type="button"
					onClick={() => setSelectedFilter(FILTER_OPTIONS.NO_DUE_DATE)}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${selectedFilter === FILTER_OPTIONS.NO_DUE_DATE ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'}`}
				>
					No Due Date ({noDueDateTasksCount})
				</button>

				{/** Divider between filters and sort controls */}
				<div className="hidden h-6 w-px shrink-0 bg-gray-300 sm:block" />

				{/** Sort and completed toggle row */}
				<select
					id="task-sort"
					value={sortBy}
					onChange={(event) => setSortBy(event.target.value)}
					className="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
				>
					<option value={TASK_SORT_OPTIONS.DUE_DATE_ASC}>Due date (Soonest)</option>
					<option value={TASK_SORT_OPTIONS.DUE_DATE_DESC}>Due date (Latest)</option>
					<option value={TASK_SORT_OPTIONS.DIFFICULTY_DESC}>Difficulty (Hardest)</option>
					<option value={TASK_SORT_OPTIONS.ESTIMATED_HOURS_DESC}>Est. hours (Most)</option>
					<option value={TASK_SORT_OPTIONS.STATUS_ASC}>Status</option>
				</select>

				{selectedFilter === FILTER_OPTIONS.ALL && completedTasksList.length > 0 && (
					<button
						type="button"
						onClick={() => setShowCompleted((prev) => !prev)}
						className="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
					>
						{showCompleted ? 'Hide' : 'Show'} completed ({completedTasksList.length})
					</button>
				)}
			</div>

      {/** Lists all tasks as rows */}
			<div className="mt-4 space-y-2">
				{safeTasks.length === 0 ? (
					<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
						No tasks yet. Create your first task to start tracking progress.
					</div>
				) : selectedFilter !== FILTER_OPTIONS.ALL && visibleTasksForNonAllFilter.length === 0 ? (
					<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
						No matching tasks for this filter.
					</div>
				) : selectedFilter === FILTER_OPTIONS.ALL && !hasVisibleTasksInAllGroups ? (
					<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
						No active tasks right now. {completedTasksList.length > 0 ? 'Use Show completed to view finished tasks.' : 'Create your first task to get started.'}
					</div>
				) : (
					selectedFilter === FILTER_OPTIONS.ALL ? (
						<div className="space-y-5">
              {/** Overdue tasks */}
							<section>
								<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">
									Overdue ({overdueTasks.length})
								</h3>
								{overdueTasks.length === 0 ? (
									<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
										No overdue tasks.
									</div>
								) : (
									<div className="space-y-2">
										{overdueTasks.map((task) => (
											<TaskRow
												key={task.taskId}
												task={task}
												isStatusUpdating={taskStatusUpdatingIds.includes(task.taskId)}
												onToggleComplete={() => onTaskToggleComplete(task)}
												onStatusChange={(nextStatus) => onTaskStatusChange(task, nextStatus)}
												onEdit={() => onTaskEdit(task)}
												onDelete={() => onTaskDelete(task)}
											/>
										))}
									</div>
								)}
							</section>

              {/** Due today tasks */}
							<section>
								<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">Due Today ({dueTodayTasks.length})</h3>
								{dueTodayTasks.length === 0 ? (
									<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
										No tasks due today.
									</div>
								) : (
									<div className="space-y-2">
										{dueTodayTasks.map((task) => (
											<TaskRow
												key={task.taskId}
												task={task}
												isStatusUpdating={taskStatusUpdatingIds.includes(task.taskId)}
												onToggleComplete={() => onTaskToggleComplete(task)}
												onStatusChange={(nextStatus) => onTaskStatusChange(task, nextStatus)}
												onEdit={() => onTaskEdit(task)}
												onDelete={() => onTaskDelete(task)}
											/>
										))}
									</div>
								)}
							</section>

              {/** Upcoming tasks */}
							<section>
								<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Upcoming ({upcomingTasks.length})</h3>
								{upcomingTasks.length === 0 ? (
									<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
										No upcoming tasks.
									</div>
								) : (
									<div className="space-y-2">
										{upcomingTasks.map((task) => (
											<TaskRow
												key={task.taskId}
												task={task}
												isStatusUpdating={taskStatusUpdatingIds.includes(task.taskId)}
												onToggleComplete={() => onTaskToggleComplete(task)}
												onStatusChange={(nextStatus) => onTaskStatusChange(task, nextStatus)}
												onEdit={() => onTaskEdit(task)}
												onDelete={() => onTaskDelete(task)}
											/>
										))}
									</div>
								)}
							</section>

							<section>
								<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">No Due Date ({noDueDateTasks.length})</h3>
								{noDueDateTasks.length === 0 ? (
									<div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
										No tasks without due dates.
									</div>
								) : (
									<div className="space-y-2">
										{noDueDateTasks.map((task) => (
											<TaskRow
												key={task.taskId}
												task={task}
												isStatusUpdating={taskStatusUpdatingIds.includes(task.taskId)}
												onToggleComplete={() => onTaskToggleComplete(task)}
												onStatusChange={(nextStatus) => onTaskStatusChange(task, nextStatus)}
												onEdit={() => onTaskEdit(task)}
												onDelete={() => onTaskDelete(task)}
											/>
										))}
									</div>
								)}
							</section>

              {/** Completed tasks */}
							{showCompleted && completedTasksList.length > 0 && (
								<section>
									<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
										Completed ({completedTasksList.length})
									</h3>
									<div className="space-y-2">
										{completedTasksList.map((task) => (
											<TaskRow
												key={task.taskId}
												task={task}
												isStatusUpdating={taskStatusUpdatingIds.includes(task.taskId)}
												onToggleComplete={() => onTaskToggleComplete(task)}
												onStatusChange={(nextStatus) => onTaskStatusChange(task, nextStatus)}
												onEdit={() => onTaskEdit(task)}
												onDelete={() => onTaskDelete(task)}
											/>
										))}
									</div>
								</section>
							)}
						</div>
					) : (
						visibleTasksForNonAllFilter.map((task) => (
							<TaskRow
								key={task.taskId}
								task={task}
								isStatusUpdating={taskStatusUpdatingIds.includes(task.taskId)}
								onToggleComplete={() => onTaskToggleComplete(task)}
								onStatusChange={(nextStatus) => onTaskStatusChange(task, nextStatus)}
								onEdit={() => onTaskEdit(task)}
								onDelete={() => onTaskDelete(task)}
							/>
						))
					)
				)}
			</div>
		</div>
	)
}

export default TaskList
