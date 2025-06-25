export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-full w-full bg-gray-50/50">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-primary animate-spin"></div>
      </div>
    </div>
  );
}
