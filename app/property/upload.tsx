import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { uploadProperty as uploadPropertyApi } from "@/services/api/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";

const { width } = Dimensions.get("window");

interface MediaFile {
  uri: string;
  type: "image" | "video";
  name: string;
  mimeType: string;
}

interface PropertyForm {
  title: string;
  description: string;
  price: string;
  region: string;
  district: string;
  street: string;
  bedrooms: string;
  area: string;
  type: string;
  purpose: string;
  localMedia: MediaFile[];
}

export default function UploadPropertyScreen() {
  const colorScheme = useColorScheme();
  const [formData, setFormData] = useState<PropertyForm>({
    title: "",
    description: "",
    price: "",
    region: "",
    district: "",
    street: "",
    bedrooms: "",
    area: "",
    type: "house",
    purpose: "sell",
    localMedia: [],
  });

  const [isUploading, setIsUploading] = useState(false);

  const propertyTypes = ["house", "apartment", "office", "hotel"];
  const purposes = ["sell", "rent"];

  // Media limits
  const MEDIA_LIMITS = {
    images: {
      maxCount: 8,
      maxSizeMB: 5,
    },
    videos: {
      maxCount: 3,
      maxSizeMB: 50,
      maxDurationSeconds: 60,
    },
  };

  const handleInputChange = (field: keyof PropertyForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateMediaFile = async (
    uri: string,
    mediaType: "image" | "video"
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        return { valid: false, error: "File does not exist" };
      }

      // Check if size property exists
      if (!fileInfo.size) {
        console.log("File size not available, skipping size validation");
        return { valid: true };
      }

      const sizeBytes = fileInfo.size;
      const sizeMB = sizeBytes / (1024 * 1024);
      const limits =
        mediaType === "image" ? MEDIA_LIMITS.images : MEDIA_LIMITS.videos;

      if (sizeMB > limits.maxSizeMB) {
        return {
          valid: false,
          error: `${mediaType === "image" ? "Image" : "Video"} size exceeds ${
            limits.maxSizeMB
          }MB limit (${sizeMB.toFixed(2)}MB)`,
        };
      }

      if (mediaType === "video") {
        if (sizeMB > 20) {
          return {
            valid: false,
            error: `Video might exceed ${
              MEDIA_LIMITS.videos.maxDurationSeconds
            }s duration limit (${sizeMB.toFixed(2)}MB)`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.log("Validation error:", error);
      return { valid: true };
    }
  };

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need media library permissions to upload files."
      );
      return;
    }

    // Count current images
    const currentImageCount = formData.localMedia.filter(
      (m) => m.type === "image"
    ).length;

    if (currentImageCount >= MEDIA_LIMITS.images.maxCount) {
      Alert.alert(
        "Limit Reached",
        `You can only add ${MEDIA_LIMITS.images.maxCount} images maximum.`
      );
      return;
    }

    const remainingSlots = MEDIA_LIMITS.images.maxCount - currentImageCount;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled) {
      try {
        const pickedAssets = result.assets ?? [];
        const validatedMedia: MediaFile[] = [];

        for (const asset of pickedAssets) {
          const validation = await validateMediaFile(asset.uri, "image");

          if (!validation.valid) {
            Alert.alert(
              "Invalid Image",
              validation.error || "Image validation failed"
            );
            continue;
          }

          // Extract file name from URI
          const uriParts = asset.uri.split("/");
          const fileName = uriParts[uriParts.length - 1];

          validatedMedia.push({
            uri: asset.uri,
            type: "image",
            name: fileName,
            mimeType: asset.mimeType || "image/jpeg",
          });
        }

        if (validatedMedia.length > 0) {
          setFormData((prev) => ({
            ...prev,
            localMedia: [...prev.localMedia, ...validatedMedia],
          }));

          Alert.alert(
            "Success",
            `Added ${validatedMedia.length} image(s) for upload`
          );
        }
      } catch (error) {
        Alert.alert("Error", "Failed to process image files.");
      }
    }
  };

  const handleVideoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need media library permissions to upload files."
      );
      return;
    }

    // Count current videos
    const currentVideoCount = formData.localMedia.filter(
      (m) => m.type === "video"
    ).length;

    if (currentVideoCount >= MEDIA_LIMITS.videos.maxCount) {
      Alert.alert(
        "Limit Reached",
        `You can only add ${MEDIA_LIMITS.videos.maxCount} videos maximum.`
      );
      return;
    }

    const remainingSlots = MEDIA_LIMITS.videos.maxCount - currentVideoCount;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled) {
      try {
        const pickedAssets = result.assets ?? [];
        const validatedMedia: MediaFile[] = [];

        for (const asset of pickedAssets) {
          const validation = await validateMediaFile(asset.uri, "video");

          if (!validation.valid) {
            Alert.alert(
              "Invalid Video",
              validation.error || "Video validation failed"
            );
            continue;
          }

          // Extract file name from URI
          const uriParts = asset.uri.split("/");
          const fileName = uriParts[uriParts.length - 1];

          validatedMedia.push({
            uri: asset.uri,
            type: "video",
            name: fileName,
            mimeType: asset.mimeType || "video/mp4",
          });
        }

        if (validatedMedia.length > 0) {
          setFormData((prev) => ({
            ...prev,
            localMedia: [...prev.localMedia, ...validatedMedia],
          }));

          Alert.alert(
            "Success",
            `Added ${validatedMedia.length} video(s) for upload`
          );
        }
      } catch (error) {
        Alert.alert("Error", "Failed to process video files.");
      }
    }
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      localMedia: prev.localMedia.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    const requiredFields: (keyof PropertyForm)[] = [
      "title",
      "description",
      "price",
      "region",
      "district",
      "bedrooms",
      "area",
      "purpose",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missingFields.join(", ")}`
      );
      return;
    }

    if (formData.localMedia.length === 0) {
      Alert.alert("Media Required", "Please add at least one image or video.");
      return;
    }

    setIsUploading(true);

    try {
      // Prepare files for backend
      const images = formData.localMedia
        .filter((m) => m.type === "image")
        .map((m) => ({
          uri: m.uri,
          name: m.name,
          type: m.mimeType,
        }));

      const videos = formData.localMedia
        .filter((m) => m.type === "video")
        .map((m) => ({
          uri: m.uri,
          name: m.name,
          type: m.mimeType,
        }));

      // Submit property with local file references
      await uploadPropertyApi({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        type: formData.type as "house" | "apartment" | "office" | "hotel",
        purpose: formData.purpose as "sell" | "rent",
        location: {
          region: formData.region,
          district: formData.district,
          street: formData.street,
        },
        bedrooms: Number(formData.bedrooms),
        area: Number(formData.area),
        images: images.length > 0 ? images : undefined,
        videos: videos.length > 0 ? videos : undefined,
      });

      Alert.alert("Success", "Property uploaded successfully!", [
        {
          text: "OK",
          onPress: () => {
            setFormData({
              title: "",
              description: "",
              price: "",
              region: "",
              district: "",
              street: "",
              bedrooms: "",
              area: "",
              type: "house",
              purpose: "sell",
              localMedia: [],
            });
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload property. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Get current media counts for display
  const imageCount = formData.localMedia.filter(
    (m) => m.type === "image"
  ).length;
  const videoCount = formData.localMedia.filter(
    (m) => m.type === "video"
  ).length;
  const currentImages = formData.localMedia.filter((m) => m.type === "image");
  const currentVideos = formData.localMedia.filter((m) => m.type === "video");

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? "light"].background,
    },
    header: {
      padding: 20,
      paddingTop: 60,
      backgroundColor:
        colorScheme === "dark"
          ? "#0a7ea4"
          : Colors[colorScheme ?? "light"].tint,
      flexDirection: "row",
      alignItems: "center",
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    backButton: {
      marginRight: 15,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.9)",
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 20,
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 15,
      color: Colors[colorScheme ?? "light"].text,
    },
    inputGroup: {
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 8,
      color: Colors[colorScheme ?? "light"].text,
    },
    input: {
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].icon,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: Colors[colorScheme ?? "light"].background,
      color: Colors[colorScheme ?? "light"].text,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    typeSelector: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    typeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].tint,
    },
    typeButtonSelected: {
      backgroundColor: Colors[colorScheme ?? "light"].tint,
    },
    typeButtonText: {
      fontSize: 14,
      color: Colors[colorScheme ?? "light"].tint,
    },
    typeButtonTextSelected: {
      color: "white",
    },
    imageUploadArea: {
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? "light"].icon,
      borderStyle: "dashed",
      borderRadius: 8,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme ?? "light"].card,
      marginBottom: 10,
    },
    imagePreviewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
    },
    previewImage: {
      width: (width - 20 * 2 - 10 * 3) / 4,
      height: (width - 20 * 2 - 10 * 3) / 4,
      borderRadius: 8,
    },
    imageUploadText: {
      fontSize: 16,
      color: Colors[colorScheme ?? "light"].text,
      marginTop: 10,
    },
    submitButton: {
      backgroundColor:
        colorScheme === "dark"
          ? "#0a7ea4"
          : Colors[colorScheme ?? "light"].tint,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
      marginBottom: 20,
    },
    submitButtonDisabled: {
      backgroundColor: Colors[colorScheme ?? "light"].icon,
    },
    submitButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    row: {
      flexDirection: "row",
      gap: 15,
    },
    rowInput: {
      flex: 1,
    },
    helperText: {
      fontSize: 12,
      color: Colors[colorScheme ?? "light"].secondaryText,
      marginTop: 5,
    },
    mediaPreviewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
    },
    mediaItem: {
      position: "relative",
    },
    videoThumbnail: {
      width: (width - 20 * 2 - 10 * 3) / 4,
      height: (width - 20 * 2 - 10 * 3) / 4,
      borderRadius: 8,
      backgroundColor: Colors[colorScheme ?? "light"].card,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].icon,
      alignItems: "center",
      justifyContent: "center",
    },
    removeButton: {
      position: "absolute",
      top: -5,
      right: -5,
      backgroundColor: "red",
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    mediaCountText: {
      fontSize: 12,
      color: Colors[colorScheme ?? "light"].tint,
      marginTop: 5,
      fontWeight: "500",
    },
    mediaUploadRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 15,
    },
    mediaUploadButton: {
      flex: 1,
      borderWidth: 2,
      borderColor: Colors[colorScheme ?? "light"].icon,
      borderStyle: "dashed",
      borderRadius: 8,
      padding: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme ?? "light"].card,
    },
    mediaUploadButtonDisabled: {
      opacity: 0.5,
    },
    uploadButtonTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginTop: 8,
      color: Colors[colorScheme ?? "light"].text,
    },
    uploadButtonSubtitle: {
      fontSize: 11,
      marginTop: 4,
      color: Colors[colorScheme ?? "light"].secondaryText,
      textAlign: "center",
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Upload Property</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Add a new property listing
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Property Title *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange("title", value)}
              placeholder="Enter property title"
              placeholderTextColor={
                Colors[colorScheme ?? "light"].secondaryText
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              placeholder="Describe the property..."
              placeholderTextColor={
                Colors[colorScheme ?? "light"].secondaryText
              }
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Property Type</ThemedText>
            <View style={styles.typeSelector}>
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonSelected,
                  ]}
                  onPress={() => handleInputChange("type", type)}
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Purpose *</ThemedText>
            <View style={styles.typeSelector}>
              {purposes.map((purpose) => (
                <TouchableOpacity
                  key={purpose}
                  style={[
                    styles.typeButton,
                    formData.purpose === purpose && styles.typeButtonSelected,
                  ]}
                  onPress={() => handleInputChange("purpose", purpose)}
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      formData.purpose === purpose &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Location & Price */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Location & Price</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Region *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.region}
              onChangeText={(value) => handleInputChange("region", value)}
              placeholder="Enter region"
              placeholderTextColor={
                Colors[colorScheme ?? "light"].secondaryText
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>District *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.district}
              onChangeText={(value) => handleInputChange("district", value)}
              placeholder="Enter district"
              placeholderTextColor={
                Colors[colorScheme ?? "light"].secondaryText
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Street *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.street}
              onChangeText={(value) => handleInputChange("street", value)}
              placeholder="Enter street"
              placeholderTextColor={
                Colors[colorScheme ?? "light"].secondaryText
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              {formData.purpose === "rent" ? "Rent Price Per Month" : "Price"} *
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(value) => handleInputChange("price", value)}
              placeholder={
                formData.purpose === "rent" ? "Enter rent price" : "Enter price"
              }
              placeholderTextColor={
                Colors[colorScheme ?? "light"].secondaryText
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Property Details</ThemedText>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.rowInput]}>
              <ThemedText style={styles.label}>Bedrooms *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.bedrooms}
                onChangeText={(value) => handleInputChange("bedrooms", value)}
                placeholder="0"
                placeholderTextColor={
                  Colors[colorScheme ?? "light"].secondaryText
                }
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.rowInput]}>
              <ThemedText style={styles.label}>Area (m²) *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.area}
                onChangeText={(value) => handleInputChange("area", value)}
                placeholder="0"
                placeholderTextColor={
                  Colors[colorScheme ?? "light"].secondaryText
                }
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Media Upload */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Property Media</ThemedText>

          {/* Upload Buttons */}
          <View style={styles.mediaUploadRow}>
            <TouchableOpacity
              style={[
                styles.mediaUploadButton,
                imageCount >= MEDIA_LIMITS.images.maxCount &&
                  styles.mediaUploadButtonDisabled,
              ]}
              onPress={handleImageUpload}
              disabled={
                isUploading || imageCount >= MEDIA_LIMITS.images.maxCount
              }
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={32}
                color={Colors[colorScheme ?? "light"].icon}
              />
              <ThemedText style={styles.uploadButtonTitle}>
                Add Images
              </ThemedText>
              <ThemedText style={styles.uploadButtonSubtitle}>
                {imageCount}/{MEDIA_LIMITS.images.maxCount} • Max{" "}
                {MEDIA_LIMITS.images.maxSizeMB}MB
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mediaUploadButton,
                videoCount >= MEDIA_LIMITS.videos.maxCount &&
                  styles.mediaUploadButtonDisabled,
              ]}
              onPress={handleVideoUpload}
              disabled={
                isUploading || videoCount >= MEDIA_LIMITS.videos.maxCount
              }
            >
              <MaterialIcons
                name="videocam"
                size={32}
                color={Colors[colorScheme ?? "light"].icon}
              />
              <ThemedText style={styles.uploadButtonTitle}>
                Add Videos
              </ThemedText>
              <ThemedText style={styles.uploadButtonSubtitle}>
                {videoCount}/{MEDIA_LIMITS.videos.maxCount} • Max{" "}
                {MEDIA_LIMITS.videos.maxSizeMB}MB
              </ThemedText>
            </TouchableOpacity>
          </View>

          {formData.localMedia.length > 0 && (
            <ThemedText style={styles.mediaCountText}>
              Total: {imageCount} image(s), {videoCount} video(s) ready to
              upload
            </ThemedText>
          )}

          {/* Image Previews */}
          {currentImages.length > 0 && (
            <>
              <ThemedText
                style={[styles.label, { marginTop: 15, marginBottom: 8 }]}
              >
                Images ({imageCount}/{MEDIA_LIMITS.images.maxCount})
              </ThemedText>
              <View style={styles.mediaPreviewGrid}>
                {currentImages.map((media, idx) => {
                  const globalIdx = formData.localMedia.indexOf(media);
                  return (
                    <View key={media.uri + idx} style={styles.mediaItem}>
                      <Image
                        source={{ uri: media.uri }}
                        style={styles.previewImage}
                      />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeMedia(globalIdx)}
                      >
                        <MaterialIcons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Video Previews */}
          {currentVideos.length > 0 && (
            <>
              <ThemedText
                style={[styles.label, { marginTop: 15, marginBottom: 8 }]}
              >
                Videos ({videoCount}/{MEDIA_LIMITS.videos.maxCount})
              </ThemedText>
              <View style={styles.mediaPreviewGrid}>
                {currentVideos.map((media, idx) => {
                  const globalIdx = formData.localMedia.indexOf(media);
                  return (
                    <View key={media.uri + idx} style={styles.mediaItem}>
                      <View style={styles.videoThumbnail}>
                        <MaterialIcons
                          name="play-circle-filled"
                          size={32}
                          color={Colors[colorScheme ?? "light"].tint}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeMedia(globalIdx)}
                      >
                        <MaterialIcons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isUploading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isUploading}
        >
          <ThemedText style={styles.submitButtonText}>
            {isUploading ? "Uploading..." : "Upload Property"}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}
