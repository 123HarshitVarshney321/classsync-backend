export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-600 text-sm font-medium">{message}</span>
    </div>
  )
}
