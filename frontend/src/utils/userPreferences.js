export const USER_PREFERENCE_KEYS = {
  PROJECT_SORT: 'tempo-preferences-project-sort',
  TASK_SORT: 'tempo-preferences-task-sort',
  SHOW_COMPLETED_TASKS: 'tempo-preferences-show-completed-tasks',
}

export const PROJECT_SORT_OPTIONS = {
  CREATED_AT_DESC: 'createdAt-desc',
  TITLE_ASC: 'title-asc',
  PRIORITY_ASC: 'priority-asc',
  PRIORITY_DESC: 'priority-desc',
  DUE_DATE_ASC: 'dueDate-asc',
  DUE_DATE_DESC: 'dueDate-desc',
}

export const TASK_SORT_OPTIONS = {
  DUE_DATE_ASC: 'dueDate-asc',
  DUE_DATE_DESC: 'dueDate-desc',
  DIFFICULTY_DESC: 'difficulty-desc',
  ESTIMATED_HOURS_DESC: 'estimatedHours-desc',
  STATUS_ASC: 'status-asc',
}

export function readStoredPreference(key, fallbackValue) {
  const saved = localStorage.getItem(key)
  return saved !== null ? JSON.parse(saved) : fallbackValue
}

export function writeStoredPreference(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
