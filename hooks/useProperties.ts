// hooks/useProperties.ts
import { useEffect, useState } from "react";
import { getProperties } from "@/services/api/property";
import { mapPropertyToCard } from "@/utils/mapPropertyToCard";

export function useProperties() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (pageToLoad = 1, refresh = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await getProperties(pageToLoad, 6);

      const mapped = res.data.map(mapPropertyToCard);

      setTotalPages(res.totalPages);
      setPage(res.currentPage);

      setData((prev) => (refresh ? mapped : [...prev, ...mapped]));
    } catch (e) {
      console.error("Failed to load properties", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(1, true);
  }, []);

  const loadMore = () => {
    if (page < totalPages) {
      load(page + 1);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  return {
    data,
    loading,
    refreshing,
    loadMore,
    refresh,
  };
}
