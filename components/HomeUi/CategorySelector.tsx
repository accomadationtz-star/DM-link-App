// components/HomeUi/CategorySelector.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

type CategorySelectorProps = {
  categories: string[];
  onSelectCategory: (category: string) => void;
};

export default function CategorySelector({ categories, onSelectCategory }: CategorySelectorProps) {
  const [selected, setSelected] = useState('All');

  return (
    <ThemedView style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => {
          const active = cat === selected;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setSelected(cat);
                onSelectCategory(cat);
              }}
              style={[styles.chip, active && styles.activeChip]}>
              <ThemedText style={[styles.chipText, active && styles.activeText]}>{cat}</ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  activeChip: {
    backgroundColor: '#0a7ea4',
  },
  chipText: {
    color: '#333',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
  },
});
