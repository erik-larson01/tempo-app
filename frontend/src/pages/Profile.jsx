import { useAuth0 } from '@auth0/auth0-react'
import { useContext, useEffect, useState } from 'react'
import { LoaderCircle, Save, User, BarChart3, Settings2 } from 'lucide-react'
import UserContext from '../contexts/UserContext'
import ProjectsContext from '../contexts/ProjectsContext'
import {
  PROJECT_SORT_OPTIONS,
  TASK_SORT_OPTIONS,
  USER_PREFERENCE_KEYS,
  readStoredPreference,
  writeStoredPreference,
} from '../utils/userPreferences'

function Profile() {
  const { user, getAccessTokenSilently } = useAuth0()
  const { currentUser, setCurrentUser, refreshCurrentUser, isUserLoading } = useContext(UserContext)
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const { projects } = useContext(ProjectsContext)

  const [projectSort, setProjectSort] = useState(() => {
    return readStoredPreference(USER_PREFERENCE_KEYS.PROJECT_SORT, PROJECT_SORT_OPTIONS.PRIORITY_DESC)
  })
  const [taskSort, setTaskSort] = useState(() => {
    return readStoredPreference(USER_PREFERENCE_KEYS.TASK_SORT, TASK_SORT_OPTIONS.DUE_DATE_ASC)
  })
  const [showCompletedTasks, setShowCompletedTasks] = useState(() => {
    return readStoredPreference(USER_PREFERENCE_KEYS.SHOW_COMPLETED_TASKS, false)
  })

  useEffect(() => {
    setDisplayName(currentUser?.displayName || user?.nickname || '')
  }, [currentUser, user])

  useEffect(() => {
    writeStoredPreference(USER_PREFERENCE_KEYS.PROJECT_SORT, projectSort)
  }, [projectSort])

  useEffect(() => {
    writeStoredPreference(USER_PREFERENCE_KEYS.TASK_SORT, taskSort)
  }, [taskSort])

  useEffect(() => {
    writeStoredPreference(USER_PREFERENCE_KEYS.SHOW_COMPLETED_TASKS, showCompletedTasks)
  }, [showCompletedTasks])

  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A'

  const lifetimeCompletedTasks = Number(currentUser?.lifetimeCompletedTasks || 0)
  console.log('lifetimeCompletedTasks:', lifetimeCompletedTasks)
  const lifetimeCreatedProjects = Number(currentUser?.lifetimeCreatedProjects || 0)
  console.log('lifetimeCreatedProjects:', lifetimeCreatedProjects)

  const allTasks = projects.flatMap(project => project.tasks ?? [])

  const totalTasks = allTasks.length
  const currentCompletedTasks = allTasks.filter(task => task.status === 'COMPLETED').length
  const completionRate = totalTasks === 0 ? 0 : (currentCompletedTasks / totalTasks) * 100

  const profilePicture = user?.picture
  const fallbackInitial = (displayName || user?.name || 'Tempo User').charAt(0).toUpperCase()

  // Saves the updated display name to the backend and updates the current user context
  const handleDisplayNameSave = async (event) => {
    event.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const accessToken = await getAccessTokenSilently()
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName }),
      })

      if (!response.ok) {
        let message = 'Failed to update display name.'
        try {
          const errorData = await response.json()
          message = errorData.message || message
        } catch {}
        throw new Error(message)
      }

      const updatedUser = await response.json()
      setCurrentUser(updatedUser)
      setDisplayName(updatedUser.displayName || '')
      setSaveSuccess('Display name updated.')
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const isDisabled = isSaving || displayName.trim() === '' || displayName === (currentUser?.displayName || user?.nickname || '')

  return (
    <div className="space-y-6 p-6">
      {/* Profile header section */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
                {profilePicture ? (
                  <img src={profilePicture} alt={displayName || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-indigo-700">{fallbackInitial}</span>
                )}
              </div>

              <div className="overflow-auto">
                <p className="text-md font-medium text-gray-900">Profile</p>
                <h1 className="truncate mt-1 text-2xl font-semibold text-gray-900 max-w-xs sm:max-w-sm lg:max-w-md">{displayName || 'Tempo User'}</h1>
                <p className="mt-1 text-sm text-gray-600">Manage your identity and app preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Information */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-md font-semibold text-gray-700">
            <User size={15} />
            Profile information
          </div>

          {isUserLoading ? (
            <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleDisplayNameSave} className="mt-6 space-y-5">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                  <input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    placeholder="Enter display name"
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {currentUser?.email || user?.email || 'No email available'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {memberSince}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Display Name
                </button>
                {saveSuccess && <p className="text-sm text-emerald-700">{saveSuccess}</p>}
                {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
              </div>
            </form>
          )}
        </section>

        {/* Lifetime statistics */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-md font-semibold text-gray-700">
            <BarChart3 size={15} />
            Tempo Statistics
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium tracking-wide text-gray-500">Lifetime Projects Created</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{lifetimeCreatedProjects}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium tracking-wide text-gray-500">Lifetime Tasks Completed</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{lifetimeCompletedTasks}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-medium tracking-wide text-gray-500">Task Completion Rate</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{completionRate.toFixed(1)}%</p>
              <p className="mt-1 text-sm text-gray-500">Across your active tasks ({totalTasks})</p>
            </div>
          </div>
        </section>
      </div>

      {/* Preferences section */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-md font-semibold text-gray-700">
          <Settings2 size={15} />
          Preferences
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700">Default project sort</span>
            <select
              value={projectSort}
              onChange={(event) => setProjectSort(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              <option value={PROJECT_SORT_OPTIONS.PRIORITY_DESC}>Priority (High-Low)</option>
              <option value={PROJECT_SORT_OPTIONS.PRIORITY_ASC}>Priority (Low-High)</option>
              <option value={PROJECT_SORT_OPTIONS.DUE_DATE_ASC}>Due date (Soonest)</option>
              <option value={PROJECT_SORT_OPTIONS.DUE_DATE_DESC}>Due date (Latest)</option>
              <option value={PROJECT_SORT_OPTIONS.CREATED_AT_DESC}>Newest first</option>
              <option value={PROJECT_SORT_OPTIONS.TITLE_ASC}>Title (A-Z)</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700">Default task sort</span>
            <select
              value={taskSort}
              onChange={(event) => setTaskSort(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              <option value={TASK_SORT_OPTIONS.DUE_DATE_ASC}>Due date (Soonest)</option>
              <option value={TASK_SORT_OPTIONS.DUE_DATE_DESC}>Due date (Latest)</option>
              <option value={TASK_SORT_OPTIONS.DIFFICULTY_DESC}>Difficulty (Hardest)</option>
              <option value={TASK_SORT_OPTIONS.ESTIMATED_HOURS_DESC}>Est. hours (Most)</option>
              <option value={TASK_SORT_OPTIONS.STATUS_ASC}>Status</option>
            </select>
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <span className="block text-sm font-medium text-gray-700">Show completed tasks by default</span>
              <span className="mt-1 block text-sm text-gray-500">Applies to the task list on project detail pages.</span>
            </div>
            <input
              type="checkbox"
              checked={showCompletedTasks}
              onChange={(event) => setShowCompletedTasks(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </section>
    </div>
  )
}

export default Profile