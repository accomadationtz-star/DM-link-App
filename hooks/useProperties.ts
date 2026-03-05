// hooks/useProperties.ts
import { useEffect, useState, useRef } from "react";
import { getProperties } from "@/services/api/property";
import { mapPropertyToCard } from "@/utils/mapPropertyToCard";

export function useProperties() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Prevent duplicate requests
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const load = async (pageToLoad = 1, refresh = false) => {
    // Guard: prevent duplicate requests
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (refresh) {
      setLoading(true);
      setRefreshing(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const res = await getProperties(pageToLoad, 10);

      const availableOnly = (res.data || []).filter(
        (property: any) =>
          (property?.status || "").toString().toLowerCase() === "available",
      );
      const mapped = availableOnly.map(mapPropertyToCard);

      // Deduplicate: avoid adding properties that already exist
      setData((prev) => {
        if (refresh) {
          return mapped;
        }

        // For loadMore: filter out duplicates by _id
        const existingIds = new Set(prev.map((p) => p._id));
        const newItems = mapped.filter((p) => !existingIds.has(p._id));
        return [...prev, ...newItems];
      });

      setTotalPages(res.totalPages || 1);
      setPage(res.currentPage || pageToLoad);

      // Check if more pages available
      const currentPage = res.currentPage || pageToLoad;
      setHasMore(currentPage < (res.totalPages || 1));

      setError(null);
    } catch (e: any) {
      // Skip error if aborted (cleanup on unmount)
      if (e?.name === "AbortError") {
        console.log("Request cancelled");
        return;
      }

      console.error("Failed to load properties", e);
      const errorMsg =
        e?.message === "Network Error"
          ? "No internet connection. Please check your connection and try again."
          : e?.message || "Failed to load properties. Please try again.";
      setError(errorMsg);

      // Keep page unchanged on error so user can retry
      if (refresh) {
        setData([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    load(1, true);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadMore = () => {
    // Guard: prevent loading if already loading, no more data, or error state
    if (isLoadingRef.current || !hasMore || error) {
      return;
    }

    const nextPage = page + 1;
    load(nextPage, false);
  };

  const refresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    load(1, true);
  };

  const retry = () => {
    setError(null);
    load(1, true);
  };

  return {
    data,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    page,
    totalPages,
    loadMore,
    refresh,
    retry,
  };
}
