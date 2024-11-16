export default function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/AB.png?alt=media&token=15eb34e1-18f5-4fa5-8d67-c82d23e5d6ab"
            alt="Loading"
            width={96}
            height={96}
            className={`transform animate-spin`}
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
