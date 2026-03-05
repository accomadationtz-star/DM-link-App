// app/(tabs)/index.tsx
import CategorySelector from "@/components/HomeUi/CategorySelector";
import HomeHeader from "@/components/HomeUi/HomeHeader";
import { ThemedView } from "@/components/themed-view";
import { useProperties } from "@/hooks/useProperties";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import PropertyCard from "@/components/HomeUi/PropertyCard";

// Skeleton loader for initial loading
const PropertySkeleton = ({ isDark }: { isDark: boolean }) => (
  <View
    style={{
      backgroundColor: isDark ? "#2a2a2a" : "#e5e7eb",
      borderRadius: 12,
      marginBottom: 16,
      height: 240,
    }}
  />
);

export default function HomeScreen() {
  const [category, setCategory] = useState("All");
  const onEndReachedCalledDuringMomentum = useRef(false);
  const {
    data,
    loadMore,
    loading,
    loadingMore,
    error,
    retry,
    refreshing,
    refresh,
    hasMore,
  } = useProperties();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const bg = isDark ? "#1a1a1a" : "rgb(242, 242, 242)";
  const textColor = isDark ? "#fff" : "#000";
  const errorBg = isDark ? "#5a2e2e" : "#fee2e2";
  const errorText = isDark ? "#fca5a5" : "#991b1b";

  // Show error state (network error, auth error, etc.)
  if (error && data.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: "center" }}>
        <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
          {/* Error icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: errorBg,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 40 }}>⚠️</Text>
          </View>

          {/* Error message */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: textColor,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Unable to Load Properties
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: errorText,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {error}
          </Text>

          {/* Retry button */}
          <TouchableOpacity
            onPress={() => retry()}
            disabled={loading}
            style={{
              backgroundColor: "#3b82f6",
              paddingHorizontal: 28,
              paddingVertical: 12,
              borderRadius: 8,
              minWidth: 200,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Try Again
              </Text>
            )}
          </TouchableOpacity>

          {/* Helpful text */}
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#999" : "#666",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Check your internet connection and try again
          </Text>
        </View>
      </View>
    );
  }

  // Show initial loading skeleton
  if (data.length === 0 && loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <FlatList
          scrollEnabled={false}
          data={Array(6).fill(null)}
          keyExtractor={(_, i) => `skeleton-${i}`}
          renderItem={() => <PropertySkeleton isDark={isDark} />}
          contentContainerStyle={{
            padding: 16,
            paddingTop: 20,
          }}
        />
      </View>
    );
  }

  // Show empty state (no properties available)
  if (data.length === 0 && !loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bg,
          padding: 20,
        }}
      >
        <MaterialIcons
          name="home"
          size={64}
          color={isDark ? "#666" : "#ccc"}
          style={{ marginBottom: 16 }}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: textColor,
            marginBottom: 8,
          }}
        >
          No Properties Available
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? "#aaa" : "#666",
            textAlign: "center",
          }}
        >
          Check back later for new listings
        </Text>
      </View>
    );
  }

  // Render footer: loading indicator, end message, or error retry
  const renderFooter = () => {
    // If no more data available
    if (!hasMore) {
      return (
        <View
          style={{
            paddingVertical: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isDark ? "#999" : "#666",
              fontSize: 14,
            }}
          >
            ✓ You've reached the end
          </Text>
        </View>
      );
    }

    // If error occurred while loading more
    if (error && data.length > 0) {
      return (
        <View
          style={{
            paddingVertical: 20,
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              color: errorText,
              fontSize: 14,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadMore()}
            style={{
              backgroundColor: "#3b82f6",
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
              Retry Loading
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // If loading more data
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text
            style={{
              color: textColor,
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Loading more properties...
          </Text>
        </View>
      );
    }

    return null;
  };

  // Main content with infinite scroll
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: "48%", marginBottom: 16 }}>
            <PropertyCard
              {...item}
            />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <HomeHeader
              username="David"
              onSearch={(text) => console.log("Searching:", text)}
            />
            <CategorySelector
              categories={["All", "Houses", "Apartments", "Offices"]}
              onSelectCategory={setCategory}
            />
            <View style={{ height: 12 }} />
          </View>
        }
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          // Trigger load more when reaching 300px from end
          if (
            !onEndReachedCalledDuringMomentum.current &&
            !loadingMore &&
            hasMore &&
            !error
          ) {
            onEndReachedCalledDuringMomentum.current = true;
            loadMore();
          }
        }}
        onEndReachedThreshold={0.3} // Trigger when 30% from end
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        refreshing={refreshing}
        onRefresh={refresh}
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
