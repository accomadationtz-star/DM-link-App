import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const CARD_WIDTH = Dimensions.get("window").width / 2 - 24;

export default function PropertyCardSkeleton() {
  const cardBackground = useThemeColor({}, "card");
  const shimmerColor = useThemeColor({}, "secondaryText");

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
      {/* Image Skeleton */}
      <Animated.View
        style={[
          styles.imageSkeleton,
          {
            backgroundColor: shimmerColor,
            opacity: shimmerOpacity,
          },
        ]}
      />

      {/* Content Skeleton */}
      <View style={styles.content}>
        {/* Title Skeleton */}
        <Animated.View
          style={[
            styles.textSkeleton,
            styles.titleSkeleton,
            {
              backgroundColor: shimmerColor,
              opacity: shimmerOpacity,
            },
          ]}
        />

        {/* Location Skeleton */}
        <Animated.View
          style={[
            styles.textSkeleton,
            styles.locationSkeleton,
            {
              backgroundColor: shimmerColor,
              opacity: shimmerOpacity,
            },
          ]}
        />

        {/* Details Row Skeleton */}
        <View style={styles.detailsRow}>
          <Animated.View
            style={[
              styles.textSkeleton,
              styles.detailSkeleton,
              {
                backgroundColor: shimmerColor,
                opacity: shimmerOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.textSkeleton,
              styles.detailSkeleton,
              {
                backgroundColor: shimmerColor,
                opacity: shimmerOpacity,
              },
            ]}
          />
        </View>

        {/* Price Skeleton */}
        <Animated.View
          style={[
            styles.textSkeleton,
            styles.priceSkeleton,
            {
              backgroundColor: shimmerColor,
              opacity: shimmerOpacity,
            },
          ]}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageSkeleton: {
    width: "100%",
    height: 200,
  },
  content: {
    padding: 12,
  },
  textSkeleton: {
    borderRadius: 4,
  },
  titleSkeleton: {
    height: 16,
    marginBottom: 8,
    width: "80%",
  },
  locationSkeleton: {
    height: 12,
    marginBottom: 12,
    width: "60%",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailSkeleton: {
    height: 12,
    width: "35%",
  },
  priceSkeleton: {
    height: 18,
    width: "50%",
  },
});
