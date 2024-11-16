import { Loader2 } from "lucide-react";

export default function Processing({
  title = "Processing your Payment...",
  status = "Initializing...",
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
        <h3 className=" font-bold text-center mb-4 ">
          {title !== "Success" || title !=="Failed" ? "Do not close this window":""}
        </h3>
        <div className="flex flex-col items-center space-y-4">
          {title == "Success" ? (
            <img src="../../public/success.svg" alt="success" />
          ) : title === "Failed" ? (
            <img src="../../public/failed.svg" alt="failed" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          )}

          <p className="text-center text-sm text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}
