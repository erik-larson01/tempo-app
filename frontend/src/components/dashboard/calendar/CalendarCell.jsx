// Get styling for calendar cell dot based on number of items and if any are overdue
const getDotStyle = (itemCount, hasOverdue) => {
	if (itemCount === 0) return null
	if (hasOverdue) return 'bg-rose-400'
	if (itemCount >= 5) return 'bg-indigo-700'
	if (itemCount >= 3) return 'bg-indigo-500'
	return 'bg-indigo-300'
}

function CalendarCell({day, dateString, isToday, isSelected, itemCount, hasOverdue, onClick}) {
  // If no day, render an empty cell for spacing
	if (!day || !dateString) {
		return <div className="aspect-square rounded-md max-w-14 mx-auto"/>
	}

	const dotStyle = getDotStyle(itemCount, hasOverdue)

  // Combine CSS classes for the cell based on its state (selected, today, etc.)
	const cellClasses = [
		'flex relative aspect-square max-w-14 mx-auto w-full flex-col items-center justify-center rounded-md text-sm transition-colors',
		isSelected ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100',
		isToday ? 'ring-2 ring-indigo-500' : '',
		'cursor-pointer',
	].filter(Boolean).join(' ')

	return (
		<button type="button" onClick={onClick} className={cellClasses}>
			<span className="font-medium text-xs sm:text-sm">{day}</span>
			{dotStyle ? <span className={`mt-0.5 h-1 w-1 sm:h-1.2.5 sm:w-1.2.5 inline-block rounded-full ${dotStyle}`} /> : null}
		</button>
	)
}

export default CalendarCell
