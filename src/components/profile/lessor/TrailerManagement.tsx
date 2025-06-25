// components/TrailerManagement.tsx
"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useTransition,
  Suspense,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FilterX, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClosedTrailerDouble } from "@/lib/icons/trailer-icons";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { draftService } from "@/services/draft.service";
import type { TrailerData } from "@/types/trailer";
import {
  convertDraftToTrailerData,
  checkTrailerCompleteness,
} from "@/lib/utils/trailer-utils";
import TrailerCard from "./management/TrailerCard";
import { useTranslation } from "@/lib/i18n/client";

// Types
interface TrailerManagementProps {
  initialListings?: TrailerData[];
}

interface TrailerCounts {
  all: number;
  active: number;
  deactivated: number;
  maintenance: number;
  draft: number;
  incomplete: number;
}

interface FetchTrailersResponse {
  trailers: TrailerData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

type TrailerStatus = "all" | "ACTIVE" | "DEACTIVATED" | "MAINTENANCE" | "DRAFT";

interface DeleteMutationVariables {
  trailerId: string;
  isDraft: boolean;
}

interface UpdateStatusMutationVariables {
  trailerId: string;
  status: string;
  available: boolean;
}

// Constants
const QUERY_KEYS = {
  TRAILERS_ALL: ["trailers", "all-data"] as const,
  TRAILER_DETAILS: (id: string) => ["trailer", id] as const,
} as const;

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Error boundary for trailer cards
class TrailerCardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="rounded-none border-0 w-full shadow-none p-4">
          <div className="text-center text-muted-foreground">
            Error loading trailer card
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Fallback component
const TrailerCardFallback: React.FC = () => (
  <Card className="rounded-none border-0 w-full shadow-none p-4">
    <div className="animate-pulse">
      <div className="h-20 bg-gray-200 rounded" />
    </div>
  </Card>
);

// API Functions
const fetchAllTrailers = async (
  signal?: AbortSignal
): Promise<FetchTrailersResponse> => {
  try {
    const promises: Promise<TrailerData[]>[] = [];

    // Fetch from API
    promises.push(
      fetch("/api/user/profile/trailers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || "Failed to fetch trailers");
        }
        const data = await res.json();
        return data.trailers || [];
      })
    );

    // Fetch drafts
    if (draftService.isDraftSupported()) {
      promises.push(
        new Promise<TrailerData[]>((resolve) => {
          try {
            const drafts = draftService.getDrafts();
            resolve(drafts.map(convertDraftToTrailerData));
          } catch (error) {
            console.error("Error fetching drafts:", error);
            resolve([]);
          }
        })
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    const [apiTrailers, draftTrailers] = await Promise.all(promises);
    const combinedTrailers = [...apiTrailers, ...draftTrailers];

    return {
      trailers: combinedTrailers,
      pagination: {
        total: combinedTrailers.length,
        limit: 50,
        offset: 0,
        pages: Math.ceil(combinedTrailers.length / 50),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error("Error in fetchAllTrailers:", error);
    throw error;
  }
};

const deleteTrailer = async (
  trailerId: string,
  isDraft = false
): Promise<{ success: boolean }> => {
  if (isDraft) {
    if (!draftService.isDraftSupported()) {
      throw new Error("Draft deletion not supported");
    }
    draftService.deleteDraft(trailerId);
    return { success: true };
  }

  const response = await fetch(`/api/user/profile/trailers/${trailerId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete trailer");
  }

  return response.json();
};

const updateTrailerStatus = async ({
  trailerId,
  status,
  available,
}: UpdateStatusMutationVariables): Promise<TrailerData> => {
  const response = await fetch(`/api/trailers/${trailerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, available }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update trailer status");
  }

  return response.json();
};

// Utility functions
const calculateTrailerCounts = (trailers: TrailerData[]): TrailerCounts => {
  const counts: TrailerCounts = {
    all: 0,
    active: 0,
    deactivated: 0,
    maintenance: 0,
    draft: 0,
    incomplete: 0,
  };

  trailers.forEach((trailer) => {
    counts.all++;

    switch (trailer.status) {
      case "ACTIVE":
        counts.active++;
        break;
      case "DEACTIVATED":
        counts.deactivated++;
        break;
      case "MAINTENANCE":
        counts.maintenance++;
        break;
      case "DRAFT":
        counts.draft++;
        break;
    }

    if (!checkTrailerCompleteness(trailer).isComplete) {
      counts.incomplete++;
    }
  });

  return counts;
};

const filterTrailersByStatus = (
  trailers: TrailerData[],
  status: TrailerStatus
): TrailerData[] => {
  if (status === "all") return trailers;
  return trailers.filter((trailer) => trailer.status === status);
};

// Main component
export default function TrailerManagement({
  initialListings = [],
}: TrailerManagementProps) {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // State
  const tabFromUrl = (searchParams?.get("trailerTab") ||
    "all") as TrailerStatus;
  const [activeTab, setActiveTab] = useState<TrailerStatus>(tabFromUrl);
  const [activeListing, setActiveListing] = useState<TrailerData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch all trailers
  const { data, isLoading, error, refetch, isRefetching } = useQuery<
    FetchTrailersResponse,
    Error
  >({
    queryKey: QUERY_KEYS.TRAILERS_ALL,
    queryFn: ({ signal }) => fetchAllTrailers(signal),
    initialData:
      initialListings.length > 0
        ? {
            trailers: initialListings,
            pagination: {
              total: initialListings.length,
              limit: 50,
              offset: 0,
              pages: 1,
            },
          }
        : undefined,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error.name === "AbortError") return false;
      return failureCount < 2;
    },
  });

  const allTrailers = useMemo(() => data?.trailers || [], [data]);

  // Calculate counts from all trailers
  const trailerCounts = useMemo(
    () => calculateTrailerCounts(allTrailers),
    [allTrailers]
  );

  // Filter trailers for display
  const displayTrailers = useMemo(
    () => filterTrailersByStatus(allTrailers, activeTab),
    [allTrailers, activeTab]
  );

  // Delete mutation
  const deleteMutation = useMutation<
    { success: boolean },
    Error,
    DeleteMutationVariables,
    { previousData: FetchTrailersResponse | undefined }
  >({
    mutationFn: ({ trailerId, isDraft }) => deleteTrailer(trailerId, isDraft),
    onMutate: async ({ trailerId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TRAILERS_ALL });
      const previousData = queryClient.getQueryData<FetchTrailersResponse>(
        QUERY_KEYS.TRAILERS_ALL
      );

      queryClient.setQueryData<FetchTrailersResponse>(
        QUERY_KEYS.TRAILERS_ALL,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            trailers: old.trailers.filter((t) => t.id !== trailerId),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.TRAILERS_ALL, context.previousData);
      }
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setActiveListing(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRAILERS_ALL });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation<
    TrailerData,
    Error,
    UpdateStatusMutationVariables,
    { previousData: FetchTrailersResponse | undefined }
  >({
    mutationFn: updateTrailerStatus,
    onMutate: async ({ trailerId, status, available }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TRAILERS_ALL });
      const previousData = queryClient.getQueryData<FetchTrailersResponse>(
        QUERY_KEYS.TRAILERS_ALL
      );

      queryClient.setQueryData<FetchTrailersResponse>(
        QUERY_KEYS.TRAILERS_ALL,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            trailers: old.trailers.map((t) =>
              t.id === trailerId ? { ...t, status, available } : t
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.TRAILERS_ALL, context.previousData);
      }
    },
    onSuccess: () => {
      console.log("updated status for");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRAILERS_ALL });
    },
  });

  // URL sync
  useEffect(() => {
    if (activeTab !== tabFromUrl) {
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("trailerTab", activeTab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
  }, [activeTab, pathname, router, searchParams, tabFromUrl]);

  // Callbacks
  const getStatusBadge = useCallback(
    (status: string): React.JSX.Element => {
      const statusConfig: Record<string, React.JSX.Element> = {
        ACTIVE: (
          <Badge variant="default">
            {t("trailerManagement.status.active")}
          </Badge>
        ),
        DEACTIVATED: (
          <Badge variant="secondary">
            {t("trailerManagement.status.deactivated")}
          </Badge>
        ),
        MAINTENANCE: (
          <Badge variant="outline">
            {t("trailerManagement.status.maintenance")}
          </Badge>
        ),
        DRAFT: (
          <Badge
            variant="outline"
            className="text-white border-[#222222] bg-[#222222]"
          >
            {t("trailerManagement.status.draft")}
          </Badge>
        ),
      };
      return statusConfig[status] || <Badge variant="outline">{status}</Badge>;
    },
    [t]
  );

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TrailerStatus);
  }, []);

  const handleDeleteClick = useCallback((trailer: TrailerData) => {
    setActiveListing(trailer);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!activeListing) return;

    deleteMutation.mutate({
      trailerId: activeListing.id,
      isDraft: activeListing.isDraft || false,
    });
  }, [activeListing, deleteMutation]);

  const handleEditClick = useCallback(
    (e: React.MouseEvent, trailer: TrailerData) => {
      e.stopPropagation();
      e.preventDefault();

      if (trailer.isDraft && trailer.draftId) {
        router.push(`/plaatsen?draft=${trailer.draftId}`);
      } else {
        router.push(`/trailers/${trailer.id}/edit`);
      }
    },
    [router]
  );

  const handleStatusChange = useCallback(
    (trailerId: string, newStatus: string) => {
      updateStatusMutation.mutate({
        trailerId,
        status: newStatus,
        available: newStatus === "ACTIVE",
      });
    },
    [updateStatusMutation]
  );

  const prefetchTrailerDetails = useCallback(
    (trailerId: string) => {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.TRAILER_DETAILS(trailerId),
        queryFn: async () => {
          const response = await fetch(`/api/trailers/${trailerId}`);
          if (!response.ok) throw new Error("Failed to fetch trailer details");
          return response.json();
        },
        staleTime: STALE_TIME,
      });
    },
    [queryClient]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-1 font-semibold text-[#222222] tracking-tight">
              {t("trailerManagement.title")}
            </h2>
            <p className="text-muted-foreground text-base">
              {t("trailerManagement.description")}
            </p>
          </div>
        </div>
        <Card className="border-0 shadow-none bg-[#f6f8f9]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="font-medium text-lg">
              {t("trailerManagement.loading")}
            </h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1 font-semibold text-[#222222] tracking-tight">
            {t("trailerManagement.title")}
          </h2>
          <p className="text-muted-foreground text-base">
            {t("trailerManagement.description")}
          </p>
        </div>
        {isRefetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("trailerManagement.refreshing", {
              defaultValue: "Refreshing...",
            })}
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        className="w-full"
        onValueChange={handleTabChange}
      >
        <div className="flex justify-between items-center">
          <TabsList className="bg-white p-0 rounded-0 flex items-center justify-start rounded-none overflow-x-auto h-[40px]">
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="all"
            >
              {t("trailerManagement.tabs.all")}{" "}
              {trailerCounts.all > 0 && `(${trailerCounts.all})`}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="ACTIVE"
            >
              {t("trailerManagement.tabs.active")}{" "}
              {trailerCounts.active > 0 && `(${trailerCounts.active})`}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 me-3 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="DEACTIVATED"
            >
              {t("trailerManagement.tabs.deactivated")}{" "}
              {trailerCounts.deactivated > 0 &&
                `(${trailerCounts.deactivated})`}
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
              value="DRAFT"
            >
              {t("trailerManagement.tabs.draft")}{" "}
              {trailerCounts.draft > 0 && `(${trailerCounts.draft})`}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {/* Error state */}
          {error && (
            <Card className="border-0 shadow-none bg-[#f8f6f6]">
              <CardContent className="flex flex-col items-center justify-center h-[350px]">
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <h3 className="font-medium text-lg">
                  {t("trailerManagement.error.title")}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mt-1">
                  {error.message ||
                    t("trailerManagement.error.message", {
                      defaultValue: "An error occurred while loading trailers",
                    })}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleRefresh}
                  disabled={isRefetching}
                >
                  {isRefetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("trailerManagement.error.retrying")}
                    </>
                  ) : (
                    t("trailerManagement.error.tryAgain")
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty states */}
          {!error && allTrailers.length === 0 && (
            <Card className="border-0 shadow-none bg-[#f6f8f9]">
              <CardContent className="flex flex-col items-center justify-center h-[350px]">
                <ClosedTrailerDouble size={48} strokeWidth={"1.5"} />
                <h3 className="font-medium text-lg mt-4">
                  {t("trailerManagement.empty.title")}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mt-1">
                  {t("trailerManagement.empty.description")}
                </p>
                <Button
                  className="mt-4 rounded-full"
                  onClick={() => router.push("/plaatsen")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("trailerManagement.empty.button")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty filter state */}
          {!error && allTrailers.length > 0 && displayTrailers.length === 0 && (
            <Card className="border-0 shadow-none bg-[#f6f8f9]">
              <CardContent className="flex flex-col items-center justify-center h-[350px]">
                <FilterX className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">
                  {t("trailerManagement.emptyFilter.title")}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mt-1">
                  {t("trailerManagement.emptyFilter.description")}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("all")}
                >
                  {t("trailerManagement.emptyFilter.button")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Trailer list */}
          {!error && displayTrailers.length > 0 && (
            <div className="space-y-5 mt-2">
              {displayTrailers.map((trailer) => (
                <TrailerCardErrorBoundary key={trailer.id}>
                  <Suspense fallback={<TrailerCardFallback />}>
                    <TrailerCard
                      trailer={trailer}
                      getStatusBadge={getStatusBadge}
                      onEdit={(e) => handleEditClick(e, trailer)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteClick(trailer);
                      }}
                      onStatusChange={handleStatusChange}
                      onHover={() => prefetchTrailerDetails(trailer.id)}
                    />
                  </Suspense>
                </TrailerCardErrorBoundary>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-8">
          <DialogHeader>
            <DialogTitle>
              {t("trailerManagement.deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="pt-3">
              <span className="block mb-2">
                {t("trailerManagement.deleteDialog.confirmation", {
                  title: activeListing?.title || "",
                })}
              </span>
              <span className="text-sm text-destructive">
                {t("trailerManagement.deleteDialog.warning")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {t("trailerManagement.deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("trailerManagement.deleteDialog.deleting")}
                </>
              ) : (
                t("trailerManagement.deleteDialog.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
