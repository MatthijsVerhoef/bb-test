export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-0 md:py-32 w-[1100px] max-w-full">
      <div className="flex flex-col md:flex-row gap-15">
        <div className="md:w-1/4 min-w-[360px]">
          <div className="bg-white rounded-2xl border py-10 pb-14">
            <div className="px-6">
              <div className="flex flex-col items-center">
                <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse" />
                <div className="mt-4 w-32 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="mt-2 w-24 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-full mt-10 space-y-3">
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-start justify-start h-[400px]">
          <div className="w-[200px] h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-[400px] h-5 mt-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
