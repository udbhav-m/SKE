export default function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src="https://res.cloudinary.com/dkakfpolz/image/upload/v1730783242/ab/qeiyh0rpdyddi9xioard.png"
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
