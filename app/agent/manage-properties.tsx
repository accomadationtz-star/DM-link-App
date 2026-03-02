import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import {
  getAllProperties,
  updatePropertyStatus,
} from "@/services/api/property";
import { Property } from "@/types/property";

type PropertyStatus =
  | "available"
  | "under_offer"
  | "booked"
  | "sold"
  | "unavailable"
  | string;

type FilterKey = "all" | PropertyStatus;

type StatusMeta = {
  label: string;
  color: string;
  dot: string;
  priority: number;
};

const statusOrder: Record<string, StatusMeta> = {
  available: { label: "Available", color: "#16a34a", dot: "🟢", priority: 0 },
  under_offer: {
    label: "Under Offer",
    color: "#f59e0b",
    dot: "🟡",
    priority: 1,
  },
  booked: { label: "Booked / Sold", color: "#ef4444", dot: "🔴", priority: 2 },
  sold: { label: "Booked / Sold", color: "#ef4444", dot: "🔴", priority: 2 },
  unavailable: {
    label: "Unavailable",
    color: "#94a3b8",
    dot: "⚪",
    priority: 3,
  },
};

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "under_offer", label: "Under Offer" },
  { key: "booked", label: "Booked/Sold" },
  { key: "sold", label: "Sold" },
  { key: "unavailable", label: "Unavailable" },
];

export default function ManagePropertiesScreen() {
  const colorScheme = useColorScheme();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAllProperties(1, 50);
      setProperties(res.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const metaForStatus = (status: PropertyStatus): StatusMeta => {
    const normalized = status?.toLowerCase?.() || "";
    return (
      statusOrder[normalized] || {
        label: normalized || "Unknown",
        color: Colors[colorScheme ?? "light"].icon,
        dot: "⚪",
        priority: 4,
      }
    );
  };

  const filteredAndSorted = useMemo(() => {
    const list =
      filter === "all"
        ? properties
        : properties.filter((p) => p.status === filter);

    return [...list].sort((a, b) => {
      const aMeta = metaForStatus(a.status);
      const bMeta = metaForStatus(b.status);

      if (aMeta.priority !== bMeta.priority)
        return aMeta.priority - bMeta.priority;

      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });
  }, [properties, filter]);

  const allowedTransitions = (status: PropertyStatus): PropertyStatus[] => {
    switch (status) {
      case "available":
        return ["under_offer", "booked", "sold", "unavailable"];
      case "under_offer":
        return ["booked", "sold", "unavailable"];
      case "booked":
      case "sold":
        return ["unavailable"];
      default:
        return ["available", "unavailable"];
    }
  };

  const handleChangeStatus = (property: Property, next: PropertyStatus) => {
    Alert.alert(
      "Change status",
      `Move this property to ${metaForStatus(next).label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            setUpdatingId(property._id);
            try {
              await updatePropertyStatus(property._id, next);
              setProperties((prev) =>
                prev.map((p) =>
                  p._id === property._id ? { ...p, status: next } : p,
                ),
              );
            } catch (e: any) {
              Alert.alert("Failed", e?.message || "Could not update status");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const renderItem = ({ item }: { item: Property }) => {
    const meta = metaForStatus(item.status);
    const locationText = [
      item.location?.street,
      item.location?.district,
      item.location?.region,
    ]
      .filter(Boolean)
      .join(", ");
    const inquiryCount =
      (item as any)?.inquiryCount || (item as any)?.inquiries?.length || 0;
    const cardBorder = colorScheme === "dark" ? "#1f2937" : "#e2e8f0";
    const cardBg =
      Colors[colorScheme ?? "light"].card ||
      (colorScheme === "dark" ? "#1f2937" : "#fff");

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/agent/property-details?id=${item._id}`)}
        style={[
          styles.card,
          { borderColor: cardBorder, backgroundColor: cardBg },
        ]}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri:
                item.cover?.url ||
                item.media?.[0]?.url ||
                "https://via.placeholder.com/160x160",
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <StatusBadge meta={meta} />
          </View>

          <ThemedText style={styles.subtitle} numberOfLines={1}>
            {locationText || "Location pending"}
          </ThemedText>

          <View style={styles.chipsRow}>
            <Chip>{(item.type || "-").toUpperCase()}</Chip>
            <Chip>{(item.purpose || "").toUpperCase() || ""}</Chip>
            {item.bedrooms !== undefined && item.bedrooms !== null ? (
              <Chip>
                {item.bedrooms === 0 ? "Studio" : `${item.bedrooms} BR`}
              </Chip>
            ) : null}
          </View>

          <View style={styles.rowBetween}>
            <ThemedText
              style={[
                styles.price,
                { color: Colors[colorScheme ?? "light"].tint },
              ]}
            >
              TZS {Number(item.price || 0).toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.inquiryText}>
              {inquiryCount} inquiries
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={() => router.push(`/property/manage?id=${item._id}`)}
            >
              <MaterialIcons name="edit" size={18} color="#fff" />
              <ThemedText style={styles.actionText}>Edit property</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtnOutline,
                {
                  borderColor: Colors[colorScheme ?? "light"].tint,
                  backgroundColor: colorScheme === "dark" ? "#0b1524" : "#fff",
                },
              ]}
              disabled={updatingId === item._id}
              onPress={() => {
                const options = allowedTransitions(item.status);
                if (!options.length) return;

                Alert.alert(
                  "Select status",
                  "Pick a new status",
                  options.map((status) => ({
                    text: metaForStatus(status).label,
                    onPress: () => handleChangeStatus(item, status),
                  })),
                );
              }}
            >
              <MaterialIcons
                name={
                  updatingId === item._id ? "hourglass-empty" : "swap-horiz"
                }
                size={18}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <ThemedText
                style={[
                  styles.actionText,
                  { color: Colors[colorScheme ?? "light"].tint },
                ]}
              >
                {updatingId === item._id ? "Updating..." : "Change status"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "#0a7ea4"
                : Colors[colorScheme ?? "light"].tint,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Manage Properties</ThemedText>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.filters}>
        {filters.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterBtn,
              item.key === filter && {
                backgroundColor: Colors[colorScheme ?? "light"].tint,
              },
            ]}
            onPress={() => setFilter(item.key)}
          >
            <ThemedText
              style={[
                styles.filterText,
                item.key === filter && { color: "#fff" },
              ]}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loaderText}>
            Loading properties...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.loader}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProperties}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAndSorted}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.loader}>
              <ThemedText>No properties found.</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const StatusBadge = ({ meta }: { meta: StatusMeta }) => (
  <View style={[styles.badge, { backgroundColor: meta.color }]}>
    <ThemedText style={styles.badgeText}>
      {meta.dot} {meta.label}
    </ThemedText>
  </View>
);

const Chip = ({ children }: { children: string }) => (
  <View style={styles.chip}>
    <ThemedText style={styles.chipText}>{children}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerTitle: { fontSize: 20, color: "#fff", fontWeight: "700" },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#E6E6E6",
  },
  filterText: { fontSize: 13, fontWeight: "600", color: "#333" },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
  },
  imageWrapper: {
    width: 120,
    alignSelf: "stretch",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#0f172a0d",
  },
  image: { width: "100%", flex: 1 },
  cardBody: { flex: 1, padding: 12, gap: 8 },
  title: { fontSize: 15, fontWeight: "700", flex: 1 },
  subtitle: { fontSize: 12, color: "#475569" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  price: { fontSize: 15, fontWeight: "700" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtnOutline: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  chipsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipText: { fontSize: 11, color: "#0f172a", fontWeight: "600" },
  inquiryText: { fontSize: 12, color: "#64748b" },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  loaderText: { fontSize: 14, color: "#475569" },
  errorText: { color: "#ef4444", fontWeight: "600", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  retryText: { color: "#0f172a", fontWeight: "700" },
});
