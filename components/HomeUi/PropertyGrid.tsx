// components/HomeUi/PropertyGrid.tsx
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import PropertyCard from "./PropertyCard";

type PropertyGridProps = {
  data: any[];
  onEndReached?: () => void;
};

export default function PropertyGrid({
  data,
  onEndReached,
}: PropertyGridProps) {
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
