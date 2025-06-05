import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem("token");
      const user_id = await AsyncStorage.getItem("user_id");
      if (!token || !user_id) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Token失效或用户不存在");
        const data = await res.json();
        setProfile(data);
      } catch (e: any) {
        Alert.alert("请重新登录", e.message);
        router.replace("/login");
      }
    };
    fetchProfile();
  }, []);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>User Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Username:</Text>
            <Text style={styles.infoValue}>{profile.username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>✉️ Email:</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🪙 Coins:</Text>
            <Text style={styles.infoValue}>{profile.total_coins}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          style={styles.logoutButton}
          onPress={async () => {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user_id");
            router.replace("/login");
          }}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0faf7",
    paddingTop: 80,
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 35,
    padding: 30,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1b5e20",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1b5e20",
    letterSpacing: 0.5,
  },
  infoContainer: {
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5e9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#37474f",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 16,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
