import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

function HowToPopup({ anchorRef, onClose }) {
  // State to track the position of the popup
  const [position, setPosition] = useState(null)
  const popupRef = useRef(null)

  // Effect to update the position of the popup and handle outside clicks
  useEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef?.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 336 - 16),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    // Handle clicks outside the popup and anchor to close the popup
    const handleOutsideClick = (event) => {
      const clickedInsidePopup = popupRef.current?.contains(event.target)
      const clickedInsideAnchor = anchorRef?.current?.contains(event.target)

      if (!clickedInsidePopup && !clickedInsideAnchor) {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [anchorRef, onClose])

  // Use createPortal to render the popup at the end of the body, so it can overlay other content
  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-50 w-80 rounded-xl border border-indigo-100 bg-white p-4 shadow-2xl"
      style={{ top: `${position?.top}px`, left: `${position?.left}px` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">How to get your calendar URL</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {/** Canvas instructions */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">Canvas</p>
          <ol className="space-y-1 text-xs text-gray-700">
            <li>1. Click <span className="font-medium text-gray-800">Calendar</span> in the left navigation bar</li>
            <li>2. In the bottom right corner, click <span className="font-medium text-gray-800">Calendar Feed</span></li>
            <li>3. Copy the URL from the field that appears</li>
          </ol>
          <p className="mt-1.5 text-[11px] text-gray-500">
            Includes assignments from all courses. Re-import after enrolling in new courses.
          </p>
        </div>

        {/** Moodle instructions */}
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">Moodle</p>
          <ol className="space-y-1 text-xs text-gray-700">
            <li>1. Go to your Dashboard and scroll to the <span className="font-medium">Calendar</span> block</li>
            <li>2. Click <span className="font-medium text-gray-800">Export calendar</span> at the bottom</li>
            <li>3. Select <span className="font-medium text-gray-800">Events</span>  related to courses and a time range</li>
            <li>4. Click <span className="font-medium text-gray-800">Get calendar URL</span> and copy it</li>
          </ol>
        </div>

        {/** Other LMS instructions */}
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">Other LMS</p>
          <p className="text-xs text-gray-700">
            Look for a <span className="font-medium text-gray-800">Calendar Export</span> or <span className="font-medium text-gray-700">iCal Feed</span> option in your LMS settings. Any URL ending in <span className="font-mono text-indigo-600">.ics</span> will work.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default HowToPopup