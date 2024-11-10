import { X } from 'lucide-react'


export default function ErrorComponent( {message = "An error occurred", onClickClose }) {

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <button
            onClick={()=>onClickClose()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close error message"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className="text-center font-semibold text-gray-900 mb-6">{message}</p>
      </div>
    </div>
  )
}