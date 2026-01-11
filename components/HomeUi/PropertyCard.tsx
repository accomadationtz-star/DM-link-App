import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const CARD_WIDTH = Dimensions.get("window").width / 2 - 24;

type PropertyCardProps = {
  [key: string]: any;
};

export default function PropertyCard(props: PropertyCardProps) {
  const router = useRouter();
  const scaleValue = new Animated.Value(1);

  const { _id: id, cover, media, title, location, price, bedrooms } = props;

  // Theme
  const cardBackground = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const secondaryText = useThemeColor({}, "secondaryText");
  const shadowColor = useThemeColor({}, "shadow");

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePress = () => {
    router.push({
      pathname: "/property/[id]",
      params: { id, property: JSON.stringify(props) },
    });
  };
  return (
    <ThemedView style={{ flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: cardBackground,
              transform: [{ scale: scaleValue }],
              shadowColor,
            },
          ]}
        >
          {/* ✅ Show cover image */}
          <Image
            source={{
              uri:
                cover?.url ||
                "https://via.placeholder.com/300x200?text=No+Image",
            }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Info */}
          <View style={styles.infoContainer}>
            <ThemedText style={[styles.price, { color: "#0a7ea4" }]}>
              TZS {typeof price === "number" ? price.toLocaleString() : price}
            </ThemedText>

            <ThemedText
              style={[styles.title, { color: textColor }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </ThemedText>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={secondaryText}
              />
              <ThemedText
                style={[styles.location, { color: secondaryText }]}
                numberOfLines={1}
              >
                {typeof location === "string"
                  ? location
                  : `${location?.street || ""}, ${location?.district || ""}`}
              </ThemedText>
            </View>

            <View style={styles.roomsContainer}>
              <View style={styles.roomItem}>
                <Ionicons name="home-outline" size={16} color={secondaryText} />
                <ThemedText style={[styles.roomText, { color: secondaryText }]}>
                  {bedrooms || 0} {bedrooms === 1 ? "Room" : "Rooms"}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: 4,
    marginBottom: 20,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  image: {
    width: "100%",
    height: 180,
  },
  infoContainer: {
    padding: 14,
  },
  price: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 1,
  },
  location: {
    fontSize: 13,
    flex: 1,
  },
  roomsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
