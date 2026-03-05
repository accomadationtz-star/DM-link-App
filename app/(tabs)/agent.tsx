import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { getAgentDashboard } from "@/services/api/agent";
import { AgentProperty } from "@/components/AgentUi/mockAgentData";
import { Inquiry } from "@/components/AgentUi/mockInquiriesData";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function AgentScreen() {
  const colorScheme = useColorScheme();
  const [propertyStats, setPropertyStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    sold: 0,
  });

  const [inquiryStats, setInquiryStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    booked: 0,
  });

  const [recentPendingInquiries, setRecentPendingInquiries] = useState<
    Inquiry[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await getAgentDashboard();

        // Map stats using backend keys
        setPropertyStats({
          total: res.data.properties?.total ?? 0,
          available: res.data.properties?.available ?? 0,
          rented: res.data.properties?.rented ?? 0,
          sold: res.data.properties?.sold ?? 0,
        });

        setInquiryStats({
          total: res.data.inquiries?.total ?? 0,
          pending: res.data.inquiries?.pending ?? 0,
          contacted: res.data.inquiries?.contacted ?? 0,
          booked: res.data.inquiries?.booked ?? 0,
        });

        // Normalize recent inquiries to UI shape
        setRecentPendingInquiries(
          res.data.recentPendingInquiries.map((inq) => ({
            id: inq._id,
            propertyId: "", // not provided by API
            clientId: "", // not provided by API
            clientName: inq.user?.username ?? "Unknown client",
            clientPhone: inq.user?.phoneNumber ?? "N/A",
            propertyTitle: inq.property?.title ?? "Unknown property",
            propertyPrice: 0,
            message: inq.message ?? "",
            status: (inq.status as Inquiry["status"]) ?? "pending",
            createdAt: inq.createdAt,
          })),
        );
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleAddProperty = () => {
    router.push("/property/upload");
  };

  const handleViewAllProperties = () => {
    router.push("/agent/manage-properties");
  };

  const handleViewAllInquiries = () => {
    router.push("/agent/manage-inquiries");
  };

  const handleInquiryPress = (inquiry: Inquiry) => {
    console.log("Inquiry pressed:", inquiry.id);
    // Navigate to inquiry details screen
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPropertyCard = ({ item }: { item: AgentProperty }) => (
    <TouchableOpacity
      style={styles.overviewPropertyCard}
      onPress={() => handleViewAllProperties()}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.overviewPropertyImage}
      />
      <View style={styles.overviewPropertyInfo}>
        <ThemedText style={styles.overviewPropertyTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.propertyPrice}>
          {item.price.toLocaleString()}TZS
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderInquiryCard = ({ item }: { item: Inquiry }) => (
    <TouchableOpacity
      style={styles.inquiryCard}
      onPress={() => handleInquiryPress(item)}
    >
      <View style={styles.inquiryHeader}>
        <ThemedText style={styles.inquiryClientName}>
          {item.clientName}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <ThemedText style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.inquiryProperty} numberOfLines={1}>
        {item.propertyTitle}
      </ThemedText>
      <ThemedText style={styles.inquiryMessage} numberOfLines={2}>
        {item.message}
      </ThemedText>
      <View style={styles.inquiryFooter}>
        <ThemedText style={styles.inquiryDate}>
          {formatDate(item.createdAt)}
        </ThemedText>
        <ThemedText style={styles.inquiryPhone}>{item.clientPhone}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "contacted":
        return "#2196F3";
      case "booked":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return Colors[colorScheme ?? "light"].icon;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? "light"].background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor:
        colorScheme === "dark"
          ? "#0a7ea4"
          : Colors[colorScheme ?? "light"].tint,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "white",
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
    },
    addButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 25,
      width: 50,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: Colors[colorScheme ?? "light"].text,
    },
    seeAllText: {
      fontSize: 14,
      color: Colors[colorScheme ?? "light"].tint,
      fontWeight: "500",
    },
    overviewStatsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    overviewStatCard: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? "light"].card,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    overviewStatNumber: {
      fontSize: 20,
      fontWeight: "bold",
      color: Colors[colorScheme ?? "light"].tint,
      marginBottom: 4,
    },
    overviewStatLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? "light"].secondaryText,
    },
    overviewPropertyCard: {
      backgroundColor: Colors[colorScheme ?? "light"].card,
      borderRadius: 12,
      marginBottom: 12,
      overflow: "hidden",
      flexDirection: "row",
      height: 100,
    },
    overviewPropertyImage: {
      width: 100,
      height: 100,
    },
    overviewPropertyInfo: {
      flex: 1,
      padding: 12,
      justifyContent: "space-between",
    },
    overviewPropertyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors[colorScheme ?? "light"].text,
    },
    propertyPrice: {
      fontSize: 14,
      fontWeight: "bold",
      color: Colors[colorScheme ?? "light"].tint,
    },
    inquiryCard: {
      backgroundColor: Colors[colorScheme ?? "light"].card,
      borderRadius: 12,
      marginBottom: 12,
      padding: 15,
      borderLeftWidth: 4,
      borderLeftColor: "#FF9800",
    },
    inquiryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    inquiryClientName: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme ?? "light"].text,
      flex: 1,
    },
    inquiryProperty: {
      fontSize: 14,
      color: Colors[colorScheme ?? "light"].secondaryText,
      marginBottom: 8,
    },
    inquiryMessage: {
      fontSize: 13,
      color: Colors[colorScheme ?? "light"].text,
      marginBottom: 10,
      lineHeight: 18,
    },
    inquiryFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    inquiryDate: {
      fontSize: 12,
      color: Colors[colorScheme ?? "light"].secondaryText,
    },
    inquiryPhone: {
      fontSize: 12,
      color: Colors[colorScheme ?? "light"].tint,
      fontWeight: "500",
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "500",
      color: "white",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 14,
      color: Colors[colorScheme ?? "light"].secondaryText,
      marginTop: 10,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Welcome back, Agent
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Properties Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Properties</ThemedText>
            <TouchableOpacity onPress={handleViewAllProperties}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewStatsContainer}>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {propertyStats.total}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>Total</ThemedText>
            </View>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {propertyStats.available}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>
                Available
              </ThemedText>
            </View>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {propertyStats.rented}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>Rented</ThemedText>
            </View>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {propertyStats.sold}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>Sold</ThemedText>
            </View>
          </View>
        </View>

        {/* Inquiries Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Inquiries</ThemedText>
            <TouchableOpacity onPress={handleViewAllInquiries}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewStatsContainer}>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {inquiryStats.total}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>Total</ThemedText>
            </View>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {inquiryStats.pending}
              </ThemedText>
              <ThemedText
                style={[styles.overviewStatLabel, { color: "#FF9800" }]}
              >
                Pending
              </ThemedText>
            </View>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {inquiryStats.contacted}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>
                Contacted
              </ThemedText>
            </View>
            <View style={styles.overviewStatCard}>
              <ThemedText style={styles.overviewStatNumber}>
                {inquiryStats.booked}
              </ThemedText>
              <ThemedText style={styles.overviewStatLabel}>Booked</ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Pending Inquiries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              Recent Pending Inquiries
            </ThemedText>
            {recentPendingInquiries.length > 0 && (
              <TouchableOpacity onPress={handleViewAllInquiries}>
                <ThemedText style={styles.seeAllText}>View All</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {recentPendingInquiries.length > 0 ? (
            <FlatList
              data={recentPendingInquiries}
              renderItem={renderInquiryCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={{ marginTop: 10 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="inbox"
                size={48}
                color={Colors[colorScheme ?? "light"].secondaryText}
              />
              <ThemedText style={styles.emptyStateText}>
                No pending inquiries
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
