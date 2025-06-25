import { Skeleton } from "../ui/skeleton";

const LoadingSkeleton = () => {
  return (
    <div className="w-full flex flex-col">
      <Skeleton className="w-full relative block overflow-hidden aspect-[6/4] rounded-md" />
      <div className="mt-4">
        <Skeleton className="h-[18px] w-[80%] rounded-sm" />
        <Skeleton className="h-[16px] w-[50%] rounded-sm mt-2" />
        <Skeleton className="h-[16px] w-[30%] rounded-sm mt-4" />
      </div>
    </div>
  );
};

export default LoadingSkeleton;
