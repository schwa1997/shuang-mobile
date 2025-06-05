import { HapticTab } from "@/components/HapticTab";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#9e9e9e",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarStyle: styles.tabBarContainer,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialCommunityIcons
                size={26}
                name={focused ? "calendar-check" : "calendar-blank-outline"}
                color={focused ? "#FFFFFF" : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wish"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialCommunityIcons
                size={26}
                name={focused ? "heart" : "heart-outline"}
                color={focused ? "#FFFFFF" : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialCommunityIcons
                size={26}
                name={focused ? "account-circle" : "account-circle-outline"}
                color={focused ? "#FFFFFF" : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 50,
    height: 60,
    backgroundColor: "#f0faf7",
    elevation: 8,
    borderTopWidth: 0,
    shadowColor: "#f0faf7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    display: "flex",
    alignSelf: "center",
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 35,
    width: "90%",
    alignSelf: "center",
  },
  tabBarItem: {
    height: 40,
    paddingTop: 7,
    paddingBottom: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  activeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 40,
    alignSelf: "center",
    backgroundColor: "#2E7D32",
    alignItems: "center",
  },
});
