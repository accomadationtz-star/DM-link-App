import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type HomeHeaderProps = {
  username?: string;
  onSearch?: (text: string) => void;
};

export default function HomeHeader({ username = 'User', onSearch }: HomeHeaderProps) {
  return (
    <ThemedView style={styles.wrapper}>
      {/* Top Row */}
      <ThemedView style={styles.topRow}>
        <View style={styles.textContainer}>
          <ThemedText type="title" style={styles.welcomeLine}>
            Welcome, {username} 👋
          </ThemedText>
          <ThemedText style={styles.subText}>Find a room to rent here</ThemedText>
        </View>

        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={22} color="#333" />
        </TouchableOpacity>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search location..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          onChangeText={onSearch}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  textContainer: {
    flexShrink: 1,
    paddingRight: 10,
  },
  welcomeLine: {
    fontSize: 20,
    fontWeight: '700',
  },
  subText: {
    fontSize: 18,
    color: '#666',
    marginTop: 2,
  },
  notificationButton: {
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 29,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 7 : 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
