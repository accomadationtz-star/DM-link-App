// app/(tabs)/index.tsx
import CategorySelector from "@/components/HomeUi/CategorySelector";
import HomeHeader from "@/components/HomeUi/HomeHeader";
import PropertyGrid from "@/components/HomeUi/PropertyGrid";
import { ThemedView } from "@/components/themed-view";
import { useProperties } from "@/hooks/useProperties";
import React, { useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator } from "react-native";

export default function HomeScreen() {
  const [category, setCategory] = useState("All");
  const { data, loadMore, loading } = useProperties();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HomeHeader
          username="David"
          onSearch={(text) => console.log("Searching:", text)}
        />

        <CategorySelector
          categories={["All", "Houses", "Apartments", "Offices"]}
          onSelectCategory={setCategory}
        />

        <ThemedView style={styles.content}>
          <PropertyGrid data={data} loading={loading} />

          {loading && data.length > 0 && (
            <ActivityIndicator style={{ marginTop: 20 }} />
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { marginTop: 20 },
});
