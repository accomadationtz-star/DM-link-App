import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "@/services/api/property";
import { Property } from "@/types/property";
import { useAuthStore } from "@/store/auth";

export default function PropertyDetailsScreen() {
  const colorScheme = useColorScheme();
  const { id, edit } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(edit === "true");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    bedrooms: "",
    area: "",
  });

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (property && user) {
      const ownerCheck = property.ownerId?._id === user.id || property.ownerId === user.id;
      setIsOwner(ownerCheck);
    }
  }, [property, user]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await getPropertyById(id as string);
      const data = res.data || res;
      setProperty(data);

      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: String(data.price || ""),
        bedrooms: String(data.bedrooms || ""),
        area: String(data.area || ""),
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to load property");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.area) {
      Alert.alert("Validation", "Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await updateProperty(id as string, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms) || 0,
        area: Number(formData.area),
      });

      Alert.alert("Success", "Property updated successfully");
      setIsEditing(false);
      await fetchProperty();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProperty(id as string);
              Alert.alert("Success", "Property deleted successfully");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete property");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ThemedView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={{ marginTop: 12 }}>Loading property...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!property) {
    return (
      <ThemedView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme ?? "light"].background },
        ]}
      >
        <View style={styles.loader}>
          <ThemedText>Property not found</ThemedText>
          <TouchableOpacity
            style={[
              styles.retryBtn,
              {
                backgroundColor: Colors[colorScheme ?? "light"].tint,
              },
            ]}
            onPress={() => router.back()}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const bgColor = Colors[colorScheme ?? "light"].background;
  const cardBg = Colors[colorScheme ?? "light"].card;
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const secondaryText = Colors[colorScheme ?? "light"].secondaryText;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: bgColor }]}
    >
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                colorScheme === "dark" ? "#0a7ea4" : tintColor,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {isEditing ? "Edit Property" : "Property Details"}
          </ThemedText>
          {isEditing && (
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={handleDelete}
              disabled={deleting}
            >
              <MaterialIcons name="delete" size={24} color="#ff4444" />
            </TouchableOpacity>
          )}
          {isEditing && (
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => setIsEditing(false)}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Cover Image */}
          {!isEditing && property.cover?.url && (
            <Image
              source={{ uri: property.cover.url }}
              style={styles.coverImage}
            />
          )}

          {isEditing ? (
            // EDIT MODE
            <View style={styles.formContainer}>
              <ThemedText style={styles.sectionTitle}>
                Edit Property Information
              </ThemedText>

              <FormField
                label="Title *"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholder="Property title"
                colorScheme={colorScheme}
              />

              <FormField
                label="Description *"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Property description"
                multiline
                numberOfLines={5}
                colorScheme={colorScheme}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <FormField
                    label="Price (TZS) *"
                    value={formData.price}
                    onChangeText={(text) =>
                      setFormData({ ...formData, price: text })
                    }
                    placeholder="0"
                    keyboardType="decimal-pad"
                    colorScheme={colorScheme}
                  />
                </View>
                <View style={styles.halfInput}>
                  <FormField
                    label="Bedrooms *"
                    value={formData.bedrooms}
                    onChangeText={(text) =>
                      setFormData({ ...formData, bedrooms: text })
                    }
                    placeholder="0"
                    keyboardType="number-pad"
                    colorScheme={colorScheme}
                  />
                </View>
              </View>

              <FormField
                label="Area (m²) *"
                value={formData.area}
                onChangeText={(text) =>
                  setFormData({ ...formData, area: text })
                }
                placeholder="0"
                keyboardType="decimal-pad"
                colorScheme={colorScheme}
              />

              <View style={styles.readOnlySection}>
                <ThemedText style={styles.readOnlyLabel}>
                  Type (read-only)
                </ThemedText>
                <View style={[styles.readOnlyField, { backgroundColor: cardBg }]}>
                  <ThemedText>{property.type?.toUpperCase()}</ThemedText>
                </View>
              </View>

              <View style={styles.readOnlySection}>
                <ThemedText style={styles.readOnlyLabel}>
                  Purpose (read-only)
                </ThemedText>
                <View style={[styles.readOnlyField, { backgroundColor: cardBg }]}>
                  <ThemedText>{property.purpose?.toUpperCase()}</ThemedText>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: tintColor }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      Save Changes
                    </ThemedText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonSecondary,
                    { borderColor: tintColor },
                  ]}
                  onPress={() => setIsEditing(false)}
                  disabled={saving}
                >
                  <ThemedText style={[styles.buttonText, { color: tintColor }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // VIEW MODE
            <View style={styles.viewContainer}>
              {/* Property Title */}
              <View style={styles.titleSection}>
                <ThemedText style={[styles.propertyTitle, { color: textColor }]}>
                  {property.title}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        property.status === "available"
                          ? "#10b98120"
                          : property.status === "rented"
                            ? "#8b5cf620"
                            : property.status === "sold"
                              ? "#ef444420"
                              : "#e5e7eb20",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusText,
                      {
                        color:
                          property.status === "available"
                            ? "#059669"
                            : property.status === "rented"
                              ? "#7c3aed"
                              : property.status === "sold"
                                ? "#dc2626"
                                : "#6b7280",
                      },
                    ]}
                  >
                    {property.status?.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              {/* Location */}
              <View style={styles.locationSection}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={tintColor}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <ThemedText style={styles.locationText}>
                    {[
                      property.location?.street,
                      property.location?.district,
                      property.location?.region,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </ThemedText>
                </View>
              </View>

              {/* Key Details Grid */}
              <View style={styles.detailsGrid}>
                <DetailCard
                  icon="attach-money"
                  label="Price"
                  value={`TZS ${Number(property.price || 0).toLocaleString()}`}
                  cardBg={cardBg}
                  tintColor={tintColor}
                />
                <DetailCard
                  icon="home"
                  label="Bedrooms"
                  value={property.bedrooms || "0"}
                  cardBg={cardBg}
                  tintColor={tintColor}
                />
                <DetailCard
                  icon="crop-din"
                  label="Area"
                  value={`${property.area} m²`}
                  cardBg={cardBg}
                  tintColor={tintColor}
                />
                <DetailCard
                  icon="layers"
                  label="Type"
                  value={property.type?.toUpperCase() || "-"}
                  cardBg={cardBg}
                  tintColor={tintColor}
                />
                <DetailCard
                  icon="shopping-bag"
                  label="Purpose"
                  value={property.purpose?.toUpperCase() || "-"}
                  cardBg={cardBg}
                  tintColor={tintColor}
                />
                <DetailCard
                  icon="mail"
                  label="Inquiries"
                  value={String((property as any).inquiryCount || 0)}
                  cardBg={cardBg}
                  tintColor={tintColor}
                />
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <ThemedText
                  style={[styles.sectionTitle, { color: textColor }]}
                >
                  Description
                </ThemedText>
                <View
                  style={[
                    styles.descriptionBox,
                    { backgroundColor: cardBg },
                  ]}
                >
                  <ThemedText
                    style={[styles.descriptionText, { color: textColor }]}
                  >
                    {property.description}
                  </ThemedText>
                </View>
              </View>

              {/* Agent/Owner Info */}
              <View style={styles.ownerSection}>
                <ThemedText
                  style={[styles.sectionTitle, { color: textColor }]}
                >
                  Agent Information
                </ThemedText>
                <View
                  style={[
                    styles.ownerCard,
                    { backgroundColor: cardBg },
                  ]}
                >
                  <View style={styles.ownerInfo}>
                    <View style={styles.ownerAvatar}>
                      <ThemedText style={styles.ownerAvatarText}>
                        {(
                          property.ownerUsername?.[0] ||
                          property.ownerId?.email?.[0] ||
                          "A"
                        ).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.ownerName}>
                        {property.ownerUsername ||
                          property.ownerId?.email?.split("@")[0] ||
                          "Agent"}
                      </ThemedText>
                      <ThemedText
                        style={[styles.ownerEmail, { color: secondaryText }]}
                      >
                        {property.ownerId?.email || "N/A"}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Timestamps */}
              <View style={styles.timestampSection}>
                <View style={styles.timestamp}>
                  <ThemedText
                    style={[styles.timestampLabel, { color: secondaryText }]}
                  >
                    Created
                  </ThemedText>
                  <ThemedText style={styles.timestampValue}>
                    {new Date(property.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                {property.updatedAt && (
                  <View style={styles.timestamp}>
                    <ThemedText
                      style={[styles.timestampLabel, { color: secondaryText }]}
                    >
                      Updated
                    </ThemedText>
                    <ThemedText style={styles.timestampValue}>
                      {new Date(property.updatedAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const FormField = ({
  label,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  placeholder = "",
  colorScheme,
}: any) => {
  const inputBg = colorScheme === "dark" ? "#1f2937" : "#f3f4f6";
  const borderColor =
    colorScheme === "dark" ? "#374151" : Colors[colorScheme ?? "light"].tint;

  return (
    <View style={styles.fieldGroup}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: borderColor,
            color: colorScheme === "dark" ? "#f3f4f6" : "#0f172a",
            minHeight: multiline ? 100 : 44,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colorScheme === "dark" ? "#9ca3af" : "#9ca3af"}
      />
    </View>
  );
};

const DetailCard = ({
  icon,
  label,
  value,
  cardBg,
  tintColor,
}: any) => (
  <View style={[styles.detailCard, { backgroundColor: cardBg }]}>
    <MaterialIcons name={icon} size={24} color={tintColor} />
    <ThemedText style={styles.detailCardLabel}>{label}</ThemedText>
    <ThemedText style={styles.detailCardValue}>{value}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    flex: 1,
    marginHorizontal: 12,
  },
  content: { flex: 1 },
  coverImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#e5e7eb",
  },

  // VIEW MODE
  viewContainer: { padding: 16 },
  titleSection: {
    marginBottom: 16,
    gap: 12,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationSection: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  detailCard: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  detailCardLabel: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  detailCardValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownerSection: {
    marginBottom: 20,
  },
  ownerCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  ownerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  ownerEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  timestampSection: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  timestamp: {
    flex: 1,
  },
  timestampLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timestampValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  // EDIT MODE
  formContainer: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  readOnlySection: {
    marginBottom: 16,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  readOnlyField: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  buttonGroup: {
    gap: 10,
    marginTop: 20,
    flexDirection: "row",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
