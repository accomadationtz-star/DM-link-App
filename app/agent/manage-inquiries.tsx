import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ManageInquiriesScreen() {
  return (
    <View style={styles.container}>
      <Text>Manage Inquiries</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
