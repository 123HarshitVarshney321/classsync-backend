export default function Alert({ type = 'error', message, onClose, className = '' }) {
  if (!message) return null

  const isError = type === 'error'
  const bgClasses = isError
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-green-50 border-green-200 text-green-800'

  return (
    <div
      role="alert"
      className={`border px-4 py-3 rounded-md flex items-center justify-between text-sm ${bgClasses} ${className}`}
    >
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 font-semibold text-lg leading-none hover:opacity-75"
          aria-label="Close"
        >
          &times;
        </button>
      )}
    </div>
  )
}
