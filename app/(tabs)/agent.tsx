import { AgentProperty, getPropertiesByStatus, getTotalStats, mockAgentProperties } from '@/components/AgentUi/mockAgentData';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function AgentScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'booked' | 'sold'>('all');
  
  const stats = getTotalStats();
  
  const getFilteredProperties = () => {
    switch (activeTab) {
      case 'available':
        return getPropertiesByStatus('available');
      case 'booked':
        return getPropertiesByStatus('booked');
      case 'sold':
        return getPropertiesByStatus('sold');
      default:
        return mockAgentProperties;
    }
  };

  const handleAddProperty = () => {
    router.push('/property/upload');
  };

  const handlePropertyPress = (property: AgentProperty) => {
    // Navigate to property details or management
    console.log('Property pressed:', property.id);
  };

  const renderPropertyCard = ({ item }: { item: AgentProperty }) => (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.propertyImage} />
      <View style={styles.propertyInfo}>
        <ThemedText style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.propertyLocation} numberOfLines={1}>
          {item.location}
        </ThemedText>
        <View style={styles.propertyDetails}>
          <ThemedText style={styles.propertyPrice}>
            {item.price.toLocaleString()}TZS
          </ThemedText>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <ThemedText style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.propertyStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={16} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.statText}>{item.views}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="message" size={16} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.statText}>{item.inquiries}</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#4CAF50';
      case 'booked':
        return '#FF9800';
      case 'sold':
        return '#F44336';
      default:
        return Colors[colorScheme ?? 'light'].icon;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    },
    header: {
      padding: 20,
      paddingTop: 60,
      backgroundColor: colorScheme === 'dark' ? '#0a7ea4' : Colors[colorScheme ?? 'light'].tint,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    addButton: {
      position: 'absolute',
      right: 20,
      top: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 25,
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].card,
      padding: 15,
      borderRadius: 12,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
    },
    statLabel: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].secondaryText,
      marginTop: 5,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      backgroundColor: Colors[colorScheme ?? 'light'].card,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors[colorScheme ?? 'light'].text,
    },
    activeTabText: {
      color: 'white',
    },
    propertyCard: {
      backgroundColor: Colors[colorScheme ?? 'light'].card,
      borderRadius: 12,
      marginBottom: 15,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    propertyImage: {
      width: 100,
      height: 100,
    },
    propertyInfo: {
      flex: 1,
      padding: 15,
    },
    propertyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 4,
    },
    propertyLocation: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].secondaryText,
      marginBottom: 8,
    },
    propertyDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    propertyPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].tint,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: 'white',
    },
    propertyStats: {
      flexDirection: 'row',
      gap: 15,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].secondaryText,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Property Management</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage your property listings</ThemedText>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{stats.total}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{stats.available}</ThemedText>
            <ThemedText style={styles.statLabel}>Available</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{stats.booked}</ThemedText>
            <ThemedText style={styles.statLabel}>Booked</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{stats.sold}</ThemedText>
            <ThemedText style={styles.statLabel}>Sold</ThemedText>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Available
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'booked' && styles.activeTab]}
            onPress={() => setActiveTab('booked')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'booked' && styles.activeTabText]}>
              Booked
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sold' && styles.activeTab]}
            onPress={() => setActiveTab('sold')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'sold' && styles.activeTabText]}>
              Sold
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Properties List */}
        <FlatList
          data={getFilteredProperties()}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </ThemedView>
  );
}
