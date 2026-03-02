import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  PanResponder,
  Animated,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { getPropertyById } from "@/services/api/property";
import { useAuthStore } from "@/store/auth";
import { createInquiry } from "@/services/api/inquiries";

const { width, height } = Dimensions.get("window");

export default function PropertyDetail() {
  const { id, property: propertyJson } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse the property data from params
  useEffect(() => {
    if (propertyJson) {
      try {
        console.log("Raw propertyJson:", propertyJson);
        const parsedProperty = JSON.parse(propertyJson as string);
        console.log("Parsed property:", parsedProperty);
        setProperty(parsedProperty);
      } catch (e) {
        console.error("Failed to parse property from params:", e);
        // Try to fetch from API if parsing fails
        if (id) {
          fetchPropertyDetails(id as string);
        }
      }
    } else if (id) {
      // If no property data in params, fetch from API
      fetchPropertyDetails(id as string);
    }
  }, [id, propertyJson]);

  const fetchPropertyDetails = async (propertyId: string) => {
    setLoading(true);
    try {
      const data = await getPropertyById(propertyId);
      console.log("Fetched property from API:", data);
      setProperty(data);
    } catch (error) {
      console.error("Failed to fetch property details:", error);
      // Continue with empty state - property wasn't found
    } finally {
      setLoading(false);
    }
  };

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [fullScreenModalVisible, setFullScreenModalVisible] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [scale] = useState(new Animated.Value(1));
  const pinchScale = useRef(1);
  const videoRefsMap = useRef({});
  const [playingVideoIndex, setPlayingVideoIndex] = useState(-1);

  // ✅ THEME COLORS
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const secondaryText = useThemeColor({}, "secondaryText");
  const cardColor = useThemeColor({}, "card");
  const tintColor = "#0a7ea4";

  if (!property) {
    if (loading) {
      return (
        <ThemedView style={[styles.center, { backgroundColor }]}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={{ marginTop: 16, textAlign: "center" }}>
            Loading property details...
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={[styles.center, { backgroundColor }]}>
        <ThemedText
          type="subtitle"
          style={{ textAlign: "center", marginBottom: 16 }}
        >
          Property not found
        </ThemedText>
        <TouchableOpacity
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: "#0a7ea4",
            borderRadius: 8,
          }}
          onPress={() => router.back()}
        >
          <ThemedText style={{ color: "#fff" }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Safely handle media array - filter and combine
  const mediaArray = (
    Array.isArray(property.media) ? property.media : []
  ) as any[];
  const allImages = [
    property.cover?.url,
    ...mediaArray
      .filter((m: any) => (m as any)?.type === "image")
      .map((m: any) => (m as any)?.url),
  ].filter(Boolean);

  const videos = mediaArray.filter((m: any) => (m as any)?.type === "video");

  const handlePinch = (e: any) => {
    const { scale } = (e as any).nativeEvent;
    Animated.spring(scale, {
      toValue: pinchScale.current * scale,
      useNativeDriver: true,
    }).start();
  };

  const openFullScreenImage = (index: number): void => {
    setFullScreenImageIndex(index);
    setFullScreenModalVisible(true);
  };

  interface VideoRef {
    getStatusAsync(): Promise<{ isPlaying: boolean }>;
    pauseAsync(): Promise<void>;
    playAsync(): Promise<void>;
  }

  const pauseAllOtherVideos = async (
    exceptVideoIndex: number,
  ): Promise<void> => {
    try {
      for (const [index, videoRef] of Object.entries(videoRefsMap.current)) {
        const videoIdx = parseInt(index, 10);
        if (videoIdx !== exceptVideoIndex && videoRef) {
          const status = await (videoRef as VideoRef).getStatusAsync();
          if (status.isPlaying) {
            await (videoRef as VideoRef).pauseAsync();
          }
        }
      }
    } catch (error) {
      console.error("Error pausing other videos:", error);
    }
  };

  const handleVideoPlayPause = async (videoIndex: number) => {
    const videoRef = (videoRefsMap.current as any)[videoIndex];
    if (videoRef) {
      try {
        const status = await videoRef.getStatusAsync();
        if (status.isPlaying) {
          await videoRef.pauseAsync();
          setPlayingVideoIndex(-1);
        } else {
          await pauseAllOtherVideos(videoIndex);
          await videoRef.playAsync();
          setPlayingVideoIndex(videoIndex);
        }
      } catch (error) {
        console.error("Error controlling video:", error);
      }
    }
  };

  const renderMediaItem = (index: number) => {
    const idx = index as number;
    const item = idx < allImages.length ? allImages[idx] : null;
    const video =
      idx >= allImages.length ? videos[idx - allImages.length] : null;

    if (video) {
      const videoIndex = index;
      const isPlaying = playingVideoIndex === videoIndex;

      return (
        <View key={index} style={styles.mediaContainer}>
          <Video
            ref={(ref: any) => {
              if (ref) (videoRefsMap.current as any)[videoIndex] = ref;
            }}
            source={{ uri: (video as any)?.url }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            style={styles.video}
            onPlaybackStatusUpdate={(status: any) => {
              if (status.isPlaying && playingVideoIndex !== videoIndex) {
                pauseAllOtherVideos(videoIndex);
                setPlayingVideoIndex(videoIndex);
              } else if (
                !status.isPlaying &&
                playingVideoIndex === videoIndex
              ) {
                setPlayingVideoIndex(-1);
              }
            }}
          />
          <TouchableOpacity
            style={styles.videoIndicator}
            onPress={() => handleVideoPlayPause(videoIndex)}
          >
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      );
    }

    if (item) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => openFullScreenImage(index as number)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.mainImage}>
        <Image
          source={{
            uri: "https://via.placeholder.com/300x200?text=No+Image",
          }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    );
  };

  const handleInquiryRequest = async () => {
    // Check if user is logged in
    if (!user) {
      Alert.alert(
        "Login Required",
        `To ${
          property.purpose === "rent" ? "request to rent" : "request to buy"
        } this property, you need to have an account. Please log in or create an account first.`,
        [
          {
            text: "Cancel",
            onPress: () => console.log("Dismissed"),
            style: "cancel",
          },
          {
            text: "Go to Login",
            onPress: () => router.push("/(auth)/login"),
          },
        ],
      );
      return;
    }

    // Proceed with inquiry
    setIsSubmitting(true);
    try {
      const inquiryType = property.purpose === "rent" ? "rent" : "buy";
      const response = await createInquiry({
        propertyId: property._id || id,
        inquiryType,
      });

      if (response.success) {
        Alert.alert(
          "Success",
          `Your ${
            inquiryType === "rent" ? "rent" : "purchase"
          } inquiry has been sent successfully! The property owner will contact you soon.`,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ],
        );
      } else {
        // Handle server response with success: false
        const errorMsg =
          response.message || "Failed to send inquiry. Please try again.";
        Alert.alert("Unable to Send Inquiry", errorMsg, [
          {
            text: "OK",
            style: "cancel",
          },
        ]);
      }
    } catch (error: any) {
      let errorMessage = "Failed to send inquiry. Please try again.";
      let errorTitle = "Error";

      // Handle network/connection errors
      if (!error.response) {
        if (error.code === "ECONNABORTED") {
          errorTitle = "Connection Timeout";
          errorMessage =
            "The request took too long. Please check your internet connection and try again.";
        } else if (
          error.message === "Network Error" ||
          error.code === "ENOTFOUND" ||
          error.code === "ECONNREFUSED"
        ) {
          errorTitle = "Connection Error";
          errorMessage =
            "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (error.message?.includes("timeout")) {
          errorTitle = "Connection Timeout";
          errorMessage =
            "The request took too long. Please check your internet connection and try again.";
        } else {
          errorTitle = "Network Error";
          errorMessage =
            error.message || "An error occurred. Please check your connection.";
        }
      } else {
        // Handle HTTP error responses with data from server
        const errorData = error.response?.data;

        if (typeof errorData === "object" && errorData !== null) {
          // Check for message field (most common pattern)
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          // Check for error field (alternative pattern)
          else if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Check for errors array (validation errors)
          else if (
            Array.isArray(errorData.errors) &&
            errorData.errors.length > 0
          ) {
            errorMessage = errorData.errors
              .map(
                (err: any) =>
                  err.message ||
                  err.msg ||
                  (typeof err === "string" ? err : "Validation error"),
              )
              .join("\n");
          }
          // Check for details field (additional info)
          else if (errorData.details) {
            errorMessage = errorData.details;
          }
          // Fallback to status text
          else {
            errorMessage =
              error.response?.statusText ||
              "Failed to send inquiry. Please try again.";
          }
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }

        // Set error title based on status code
        const statusCode = error.response?.status;
        if (statusCode === 400) {
          errorTitle = "Invalid Request";
        } else if (statusCode === 401) {
          errorTitle = "Not Authenticated";
          errorMessage = "Your session has expired. Please log in again.";
        } else if (statusCode === 403) {
          errorTitle = "Access Denied";
        } else if (statusCode === 404) {
          errorTitle = "Not Found";
          errorMessage = "The property was not found.";
        } else if (statusCode === 409) {
          errorTitle = "Conflict";
        } else if (statusCode >= 500) {
          errorTitle = "Server Error";
          errorMessage =
            "The server encountered an error. Please try again later.";
        }
      }

      console.error("❌ Inquiry request error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      Alert.alert(errorTitle, errorMessage, [
        {
          text: "OK",
          style: "cancel",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 🖼️ Property Media Carousel */}
        <View style={styles.mediaCarouselWrapper}>
          {allImages.length + videos.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              onScroll={(e: any) => {
                const contentOffsetX = (e as any).nativeEvent.contentOffset.x;
                const index = Math.round(contentOffsetX / width);
                setActiveMediaIndex(index);
              }}
              style={styles.carouselScroll}
            >
              {allImages.map((image, index) => (
                <View key={index} style={{ width, height: 400 }}>
                  {renderMediaItem(index)}
                </View>
              ))}
              {videos.map((video: any, index: number) => (
                <View key={`video-${index}`} style={{ width, height: 400 }}>
                  {renderMediaItem(allImages.length + index)}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ width, height: 400 }}>{renderMediaItem(0)}</View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Media Counter */}
          {allImages.length + videos.length > 1 && (
            <View style={styles.mediaCounter}>
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                {activeMediaIndex + 1}/{allImages.length + videos.length}
              </ThemedText>
            </View>
          )}
        </View>

        {/* 📄 Property Info Section */}
        <ThemedView style={[styles.content, { backgroundColor }]}>
          {/* Category Tag */}
          <View
            style={[styles.categoryTag, { backgroundColor: tintColor + "20" }]}
          >
            <ThemedText style={[styles.categoryText, { color: tintColor }]}>
              {property.type?.charAt(0).toUpperCase() +
                property.type?.slice(1) || "Property"}
            </ThemedText>
          </View>

          {/* Title */}
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            {property.title}
          </ThemedText>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={secondaryText} />
            <ThemedText style={[styles.location, { color: secondaryText }]}>
              {typeof property.location === "object"
                ? `${property.location?.street || ""}, ${
                    property.location?.district || ""
                  }, ${property.location?.region || ""}`
                : property.location}
            </ThemedText>
          </View>

          {/* Property Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Bedrooms */}
            <View style={[styles.detailItem, { backgroundColor: cardColor }]}>
              <Ionicons name="bed-outline" size={20} color={tintColor} />
              <ThemedText
                style={[styles.detailLabel, { color: secondaryText }]}
              >
                Bedrooms
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>
                {property.bedrooms}
              </ThemedText>
            </View>

            {/* Area */}
            <View style={[styles.detailItem, { backgroundColor: cardColor }]}>
              <Ionicons name="expand-outline" size={20} color={tintColor} />
              <ThemedText
                style={[styles.detailLabel, { color: secondaryText }]}
              >
                Area
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>
                {property.area} m²
              </ThemedText>
            </View>

            {/* Property Type */}
            <View style={[styles.detailItem, { backgroundColor: cardColor }]}>
              <Ionicons name="home-outline" size={20} color={tintColor} />
              <ThemedText
                style={[styles.detailLabel, { color: secondaryText }]}
              >
                Type
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>
                {property.type}
              </ThemedText>
            </View>

            {/* Purpose */}
            <View style={[styles.detailItem, { backgroundColor: cardColor }]}>
              <Ionicons name="pricetag-outline" size={20} color={tintColor} />
              <ThemedText
                style={[styles.detailLabel, { color: secondaryText }]}
              >
                Purpose
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>
                {property.purpose}
              </ThemedText>
            </View>
          </View>

          {/* Description */}
          <View style={{ marginTop: 24 }}>
            <ThemedText
              type="subtitle"
              style={[styles.sectionTitle, { color: textColor }]}
            >
              Description
            </ThemedText>
            <ThemedText style={[styles.description, { color: secondaryText }]}>
              {property.description}
            </ThemedText>
          </View>

          {/* Owner/Agent Section */}
          <View style={{ marginTop: 24 }}>
            <ThemedText
              type="subtitle"
              style={[styles.sectionTitle, { color: textColor }]}
            >
              Owner Information
            </ThemedText>

            <View style={[styles.ownerCard, { backgroundColor: cardColor }]}>
              <View>
                <ThemedText style={[styles.ownerName, { color: textColor }]}>
                  {property.ownerUsername ||
                    property.ownerId?.email?.split("@")[0] ||
                    "Property Owner"}
                </ThemedText>
                <ThemedText
                  style={[styles.ownerEmail, { color: secondaryText }]}
                >
                  {property.ownerId?.email || "contact@example.com"}
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                { borderBottomColor: secondaryText + "30" },
              ]}
            />
          </View>

          {/* Status */}
          <View style={{ marginTop: 16 }}>
            <ThemedText style={[styles.statusLabel, { color: secondaryText }]}>
              Status
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    property.status === "available" ? "#10b98120" : "#ef444420",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  {
                    color:
                      property.status === "available" ? "#059669" : "#dc2626",
                  },
                ]}
              >
                {property.status
                  ? property.status.charAt(0).toUpperCase() +
                    property.status.slice(1)
                  : "Unknown"}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>

      {/* 💰 Bottom Bar */}
      <ThemedView style={[styles.bottomBar, { backgroundColor: cardColor }]}>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.priceLabel, { color: secondaryText }]}>
            Price
          </ThemedText>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <ThemedText style={[styles.totalPrice, { color: tintColor }]}>
              TZS {property.price?.toLocaleString() || "0"}
            </ThemedText>
            {property.purpose === "rent" && (
              <ThemedText
                style={[{ color: secondaryText, marginLeft: 8, fontSize: 14 }]}
              >
                per month
              </ThemedText>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: tintColor }]}
          onPress={handleInquiryRequest}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.bookButtonText}>
              {property.purpose === "rent"
                ? "Request to Rent"
                : "Request to Buy"}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenModalVisible(false)}
        statusBarTranslucent={true}
      >
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.fullScreenClose}
            onPress={() => setFullScreenModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            onScroll={(e: any) => {
              const contentOffsetX = (e as any).nativeEvent.contentOffset.x;
              const index = Math.round(contentOffsetX / width);
              setFullScreenImageIndex(index);
            }}
            style={styles.fullScreenScroll}
          >
            {allImages.map((image, index) => (
              <View key={index} style={{ width, height }}>
                <Image
                  source={{ uri: image }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>
            ))}
            {videos.map((video: any, index: number) => {
              const videoIndex = allImages.length + index;
              const isPlaying = playingVideoIndex === videoIndex;

              return (
                <View key={`video-${index}`} style={{ width, height }}>
                  <Video
                    ref={(ref: any) => {
                      if (ref) (videoRefsMap.current as any)[videoIndex] = ref;
                    }}
                    source={{ uri: (video as any)?.url }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    style={styles.fullScreenImage}
                    onPlaybackStatusUpdate={(status: any) => {
                      if (
                        status.isPlaying &&
                        playingVideoIndex !== videoIndex
                      ) {
                        pauseAllOtherVideos(videoIndex);
                        setPlayingVideoIndex(videoIndex);
                      } else if (
                        !status.isPlaying &&
                        playingVideoIndex === videoIndex
                      ) {
                        setPlayingVideoIndex(-1);
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.fullScreenVideoIndicator}
                    onPress={() => handleVideoPlayPause(videoIndex)}
                  >
                    <Ionicons
                      name={isPlaying ? "pause-circle" : "play-circle"}
                      size={48}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Image Counter in Full Screen */}
          <View style={styles.fullScreenCounter}>
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              {fullScreenImageIndex + 1}/{allImages.length}
            </ThemedText>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mediaCarouselWrapper: {
    position: "relative",
    width: "100%",
    height: 400,
  },
  carouselScroll: {
    flex: 1,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: height * 0.4,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  mediaContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
    flex: 1,
  },
  videoIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "#00000080",
    padding: 8,
    borderRadius: 20,
  },
  mediaCounter: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "#00000080",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectorContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 0,
    maxWidth: "100%",
  },
  selector: {
    width: 50,
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
    opacity: 0.6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectorActive: {
    opacity: 1,
    borderColor: "#0a7ea4",
  },
  selectorImage: {
    width: "100%",
    height: "100%",
  },
  selectorVideoIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -7,
    marginLeft: -7,
  },
  content: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
  },
  categoryTag: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryText: { fontSize: 13, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  location: { marginLeft: 0, fontSize: 14, flex: 1 },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  detailLabel: { fontSize: 12, marginTop: 4 },
  detailValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  description: { lineHeight: 20, fontSize: 14 },
  ownerCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  ownerName: { fontSize: 16, fontWeight: "600" },
  ownerEmail: { fontSize: 13, marginTop: 4 },
  divider: { borderBottomWidth: 1, marginTop: 12 },
  statusLabel: { fontSize: 13, marginBottom: 6 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 13, fontWeight: "600" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  priceLabel: { fontSize: 13 },
  totalPrice: { fontSize: 18, fontWeight: "700" },
  bookButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
  },
  bookButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 0,
  },
  fullScreenScroll: {
    flex: 1,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#00000080",
    borderRadius: 20,
  },
  fullScreenCounter: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#00000080",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fullScreenVideoIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -24,
    marginLeft: -24,
    zIndex: 10,
  },
});
