import { useAuth0 } from "@auth0/auth0-react"
function GreetingHeader() {
  const { user } = useAuth0()

  // Make greeting based on current time of day
	const hour = new Date().getHours()
	let greeting = 'Good evening'
	if (hour < 12) {
		greeting = 'Good morning'
	} else if (hour < 17) {
		greeting = 'Good afternoon'
	}

	const todayLabel = new Date().toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	})

	return (
		<header className="flex flex-wrap items-center justify-between rounded-xl gap-2 border border-gray-200 bg-white px-4 py-4 shadow-sm">
			<h1 className="text-xl font-semibold min-w-0 truncate text-gray-900">{greeting}, {user.name}</h1>
			<p className="shrink-0 text-sm font-medium text-gray-500">{todayLabel}</p>
		</header>
	)
}

export default GreetingHeader
