import { useAuth0 } from '@auth0/auth0-react'
import { ArrowRight, BarChart3, CalendarClock, CheckCircle2, Layers, Target } from 'lucide-react'

function LandingPage({ error }) {
  const { loginWithRedirect } = useAuth0()

  // Example data for the focus view and project progress bars:
  const focusPreviewTasks = [
    {
      title: 'Final Analysis Report',
      score: 9.1,
      scoreColor: 'text-rose-600',
      meta: 'STAT 340 · Due tomorrow · 2h left',
    },
    {
      title: 'History Seminar Paper',
      score: 7.8,
      scoreColor: 'text-amber-600',
    meta: 'HIST 151 · Due in 4 days · 5.5h left',
    },
    {
      title: 'Chapter 7 Textbook Reading',
      score: 4.9,
      scoreColor: 'text-indigo-600',
      meta: 'CS 300 · Due next week · 2h left',
    },
  ]

  const projectPreview = [
    { name: 'STAT 340', pct: 30, priority: '8.4', color: 'bg-indigo-500' },
    { name: 'HIST 151', pct: 60, priority: '5.8', color: 'bg-indigo-500' },
    { name: 'CS 300', pct: 80, priority: '4.2', color: 'bg-indigo-500' },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-white via-indigo-50/30 to-indigo-100/90 text-gray-900">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-12 pt-10 sm:px-10">
        {/* Header section with title and sign in */}
        <header className="animate-fade-in-slow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10">
              <rect width="48" height="48" rx="10" fill="#4f46e5"/>
              <rect x="7" y="11" width="34" height="8" rx="4" fill="white"/>
              <rect x="7" y="21" width="25" height="8" rx="4" fill="white" opacity="0.6"/>
              <rect x="7" y="31" width="16" height="8" rx="4" fill="white" opacity="0.35"/>
            </svg>
            <div>
              <p className="text-2xl font-semibold text-indigo-700">Tempo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'login' } })}
            className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition duration-200 hover:bg-indigo-50"
          >
            Sign in
          </button>
        </header>

       {/* Main content section with features and call to action */}
        <main className="mt-14 grid gap-10 lg:grid-cols-[1.10fr_0.90fr] lg:items-center">
          <section className="animate-fade-up space-y-8">
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                Your projects, ranked by what actually needs attention right now.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
                Tempo organizes your classes, projects, and tasks into a single ranked system so you always know what deserves attention next.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}

            {/* Sign Up Button and Log In Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-indigo-700"
              >
                Start Planning
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'login' } })}
                className="rounded-lg border border-indigo-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition duration-200 hover:bg-indigo-50"
              >
                I already have an account
              </button>
            </div>

            {/* Features section */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
                <Layers size={16} className="text-indigo-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">Task Breakdown</p>
                <p className="mt-1.5 text-xs text-gray-600">Turn large projects into small, actionable steps.</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
                <Target size={16} className="text-indigo-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">Focus List</p>
                <p className="mt-1.5 text-xs text-gray-600">Automatically surfaces your 5 most important tasks.</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
                <CalendarClock size={16} className="text-indigo-500" />
                <p className="mt-2 text-sm font-medium text-gray-900">Calendar View</p>
                <p className="mt-1.5 text-xs text-gray-600">See deadlines and tasks organized across your timeline.</p>
              </div>
            </div>
          </section>

          {/** Focus view section with example ranked tasks */}
          <section className="animate-fade-up-delay rounded-3xl border border-indigo-100 bg-white p-5 shadow-xl sm:p-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-gray-500">Top Priority Tasks</p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">What to work on next</h2>
                </div>
              </div>

              <div className="space-y-3">
                {focusPreviewTasks.map((task) => (
                  <div key={task.title} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      {task.meta && <p className="mt-0.5 text-xs text-gray-600">{task.meta}</p>}
                    </div>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${task.scoreColor} bg-opacity-10 text-[13px] font-semibold`}>
                      {task.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="my-4 border-t border-gray-100" />

            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Active Projects
            </p>
            <div className="space-y-2">
              {projectPreview.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <p className="w-28 shrink-0 truncate text-xs text-gray-600">{p.name}</p>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-semibold text-gray-500">
                    {p.priority}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
              Scores recalculate as deadlines approach and tasks are completed.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default LandingPage