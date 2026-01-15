// components/HomeUi/PropertyGrid.tsx
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import PropertyCard from "./PropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";

type PropertyGridProps = {
  data: any[];
  onEndReached?: () => void;
  loading?: boolean;
};

export default function PropertyGrid({
  data,
  onEndReached,
  loading = false,
}: PropertyGridProps) {
  // Show skeleton loaders when loading and no data
  if (loading && data.length === 0) {
    const skeletonData = Array.from({ length: 6 }, (_, i) => ({
      id: `skeleton-${i}`,
    }));
    return (
      <FlatList
        data={skeletonData}
        numColumns={2}
        keyExtractor={(item, index) => item.id || String(index)}
        columnWrapperStyle={styles.row}
        renderItem={() => <PropertyCardSkeleton />}
        scrollEnabled={false}
      />
    );
  }

  return (
    <FlatList
      data={data}
      numColumns={2}
      keyExtractor={(item, index) => item?._id || String(index)}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => <PropertyCard {...item} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
});
