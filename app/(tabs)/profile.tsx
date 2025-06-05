import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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
        const res = await fetch(`http://127.0.0.1:8000/api/users/${user_id}`, {
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
      <Text style={styles.title}>个人信息</Text>
      <Text style={styles.info}>用户名：{profile.username}</Text>
      <Text style={styles.info}>邮箱：{profile.email}</Text>
      <Text style={styles.info}>金币：{profile.total_coins}</Text>
      <Text style={styles.info}>连续天数：{profile.streak_count}</Text>
      <Button
        title="退出登录"
        onPress={async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user_id");
          router.replace("/login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    alignSelf: "center",
  },
  info: { fontSize: 18, marginBottom: 12 },
});
