import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ROOM_THEMES: Record<string, any> = {
  work: {
    icon: "briefcase",
    color: "#4A6572",
    secondaryColor: "#344955",
    background: require("../../assets/images/rooms/work.png"),
    decorations: ["desktop", "laptop", "books"],
  },
  study: {
    icon: "book",
    color: "#5B7DB1",
    secondaryColor: "#3A4F7A",
    background: require("../../assets/images/rooms/workout.png"),
    decorations: ["book", "graduation-cap", "pencil-alt"],
  },
  // health: {
  //   icon: "heartbeat",
  //   color: "#E57373",
  //   secondaryColor: "#C62828",
  //   background: require("../../assets/images/rooms/work.png"),
  //   decorations: ["dumbbell", "running", "apple-alt"],
  // },
  // sleep: {
  //   icon: "home",
  //   color: "#81C784",
  //   secondaryColor: "#4CAF50",
  //   background: require("../../assets/images/rooms/sleep.png"),
  //   decorations: ["couch", "utensils", "shower"],
  // },
  workout: {
    icon: "futbol",
    color: "#FFB74D",
    secondaryColor: "#FF9800",
    background: require("../../assets/images/rooms/work.png"),
    decorations: ["basketball-ball", "volleyball-ball", "trophy"],
  },
  default: {
    icon: "star",
    color: "#9575CD",
    secondaryColor: "#673AB7",
    background: require("../../assets/images/rooms/work.png"),
    decorations: [],
  },
};

const RoomDecoration = ({ icon, position, size }: any) => {
  const [wiggle] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = wiggle.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        transform: [{ rotate }],
      }}
    >
      <FontAwesome5 name={icon} size={size} color="rgba(255,255,255,0.7)" />
    </Animated.View>
  );
};
// 金币动画组件
const CoinAnimation = ({ startPosition, coins, onComplete }: any) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 2,
        duration: 500,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, []);

  // 计算飞行路径
  const path = animation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      `0, 0`,
      `${width / 2 - startPosition.x - 20}, ${-startPosition.y + 50}`,
      `${width / 2 - startPosition.x - 20}, ${-height}`,
    ],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: startPosition.y,
        left: startPosition.x,
        opacity: animation.interpolate({
          inputRange: [0, 0.8, 1.5, 2],
          outputRange: [1, 1, 1, 0],
        }),
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0, -200, -height],
            }),
          },
          {
            translateX: animation.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0, 50, width / 2 - startPosition.x - 20],
            }),
          },
          {
            scale: animation.interpolate({
              inputRange: [0, 0.5, 1, 2],
              outputRange: [1, 1.5, 1, 0.5],
            }),
          },
        ],
      }}
    >
      <FontAwesome5 name="coins" size={30} color="#FFD700" />
      <Text style={styles.coinBonusText}>+{coins}</Text>
    </Animated.View>
  );
};

export default function IndexTab() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category_id, setCategoryId] = useState(0);
  const [due_date, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [coins, setCoins] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [roomAnimation] = useState(new Animated.Value(0));
  const [coinAnimations, setCoinAnimations] = useState<any[]>([]);
  const [roomDecorations, setRoomDecorations] = useState<any[]>([]);
  const [roomTheme, setRoomTheme] = useState(ROOM_THEMES.default);
  const [taskCompletionAnim] = useState(new Animated.Value(0));

  const getRoomTheme = (categoryName: string) => {
    const themeKey = categoryName.toLowerCase();
    return ROOM_THEMES[themeKey] || ROOM_THEMES.default;
  };

  const generateDecorations = () => {
    const decorations = [];
    const theme = getRoomTheme(
      categories[currentRoom]?.category_name || "default"
    );

    for (let i = 0; i < 5; i++) {
      const iconIndex = i % theme.decorations.length;
      decorations.push({
        id: i,
        icon: theme.decorations[iconIndex],
        position: {
          x: Math.random() * (width - 60),
          y: Math.random() * 200 + 50,
        },
        size: 20 + Math.random() * 20,
      });
    }

    setRoomDecorations(decorations);
  };

  const fetchData = async () => {
    const token = await AsyncStorage.getItem("token");
    const user_id = await AsyncStorage.getItem("user_id");
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      // 获取任务
      const todosRes = await fetch("http://127.0.0.1:8000/api/todos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!todosRes.ok) throw new Error("获取任务失败");
      let todosData = await todosRes.json();

      // 获取类别
      const categoriesRes = await fetch(
        "http://127.0.0.1:8000/api/todo-categories",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const categoriesData = await categoriesRes.json();

      // 获取用户金币
      const userRes = await fetch(`http://127.0.0.1:8000/api/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userRes.json();

      setTodos(todosData);
      setCategories(categoriesData);
      setCategoryId(categoriesData[0].category_id);
      setCoins(userData.total_coins || 0);
    } catch (e: any) {
      Alert.alert("错误", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const theme = getRoomTheme(categories[currentRoom].category_name);
      setRoomTheme(theme);
      generateDecorations();
    }
  }, [categories, currentRoom]);

  const handleAddTodo = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!title) {
      Alert.alert("请输入任务标题");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          due_date: due_date.toISOString(),
          category_id: category_id,
        }),
      });
      if (!res.ok) throw new Error("添加失败");
      setTitle("");
      setDescription("");
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert("错误", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (todo_id: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/todos/${todo_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("删除失败");
      fetchData();
    } catch (e: any) {
      Alert.alert("错误", e.message);
    } finally {
      setLoading(false);
    }
  };
  const animateRoomChange = (newRoom: number) => {
    Animated.timing(roomAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCurrentRoom(newRoom);
      generateDecorations();
      roomAnimation.setValue(0);
      Animated.timing(roomAnimation, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };
  const animateTaskCompletion = () => {
    taskCompletionAnim.setValue(0);
    Animated.sequence([
      Animated.timing(taskCompletionAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(taskCompletionAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        delay: 500,
      }),
    ]).start();
  };
  const handleComplete = async (
    todo_id: number,
    position: { x: number; y: number },
    coinsEarned: number
  ) => {
    animateTaskCompletion();
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const animationId = Date.now();
    setCoinAnimations((prev) => [
      ...prev,
      { id: animationId, position, coins: coinsEarned },
    ]);

    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/todos/${todo_id}/complete`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("完成任务失败");
      const data = await res.json();
      setCoins((prev) => prev + data.coins_earned);
      setTimeout(() => {
        setCoinAnimations((prev) => prev.filter((a) => a.id !== animationId));
      }, 1500);
      fetchData();
    } catch (e: any) {
      Alert.alert("错误", e.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoomTasks = () => {
    if (!categories.length) return [];
    const currentCategory = categories[currentRoom];
    return todos.filter(
      (todo) => todo.category.category_id === currentCategory.category_id
    );
  };

  const getRoomProgress = (categoryId: number) => {
    const roomTasks = todos.filter((todo) => todo.category_id === categoryId);
    if (roomTasks.length === 0) return 0;
    const completedTasks = roomTasks.filter((todo) => todo.completed).length;
    return Math.round((completedTasks / roomTasks.length) * 100);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/game-background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* 房间装饰元素 */}
      {roomDecorations.map((decoration) => (
        <RoomDecoration
          key={decoration.id}
          icon={decoration.icon}
          position={decoration.position}
          size={decoration.size}
        />
      ))}
      {/* 任务完成动画效果 */}
      <Animated.View
        style={[
          styles.completionEffect,
          {
            opacity: taskCompletionAnim,
            transform: [
              {
                scale: taskCompletionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="sparkles" size={200} color="#FFD700" />
      </Animated.View>

      {/* 顶部金币栏 */}
      <View style={styles.coinHeader}>
        <FontAwesome5 name="coins" size={24} color="#FFD700" />
        <Text style={styles.coinText}>{coins} 金币</Text>
      </View>
      {/* 房间装饰元素 */}
      {roomDecorations.map((decoration) => (
        <RoomDecoration
          key={decoration.id}
          icon={decoration.icon}
          position={decoration.position}
          size={decoration.size}
        />
      ))}
      {/* 房间路线图 */}
      <View style={styles.mapContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapScroll}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.category_id}
              style={styles.roomContainer}
              onPress={() => animateRoomChange(index)}
            >
              {/* 房间之间的路径 */}
              {index > 0 && (
                <View
                  style={[
                    styles.path,
                    index <= currentRoom ? styles.pathActive : {},
                  ]}
                />
              )}

              {/* 房间图标 */}
              <Animated.View
                style={[
                  styles.roomIcon,
                  index === currentRoom && styles.activeRoom,
                  {
                    transform: [
                      {
                        scale: roomAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange:
                            index === currentRoom ? [0.8, 1] : [1, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <FontAwesome5
                  name={getRoomIcon(category.category_name)}
                  size={32}
                  color="#FFF"
                />

                {/* 房间进度 */}
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${getRoomProgress(category.category_id)}%` },
                    ]}
                  />
                </View>
              </Animated.View>

              <Text style={styles.roomName}>{category.category_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 当前房间任务 */}
      <Animated.View
        style={[
          styles.roomContent,
          {
            backgroundColor: `rgba(${hexToRgb(roomTheme.color).r}, ${
              hexToRgb(roomTheme.color).g
            }, ${hexToRgb(roomTheme.color).b}, 0.9)`,
            transform: [
              {
                translateY: roomAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
            opacity: roomAnimation,
          },
        ]}
      >
        <View style={styles.roomHeader}>
          <FontAwesome5 name={roomTheme.icon} size={28} color="#FFF" />
          <Text style={styles.roomTitle}>
            {categories[currentRoom]?.category_name || "加载中..."} 房间
          </Text>
        </View>
        <Text style={styles.roomSubtitle}>完成任务收集金币，解锁新房间</Text>

        <ScrollView style={styles.tasksContainer}>
          {getRoomTasks().length > 0 ? (
            getRoomTasks().map((todo) => (
              <TaskCard
                key={todo.todo_id}
                todo={todo}
                categories={categories}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <View style={styles.emptyRoom}>
              <Text style={styles.emptyRoomText}>这个房间没有任务</Text>
              <Text style={styles.emptyRoomSubtext}>
                创建新任务开始收集金币
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* 添加任务按钮 */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome5 name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* 添加任务模态框 */}
      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        category_id={category_id}
        setCategoryId={setCategoryId}
        due_date={due_date}
        setDueDate={setDueDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        categories={categories}
        onAdd={handleAddTodo}
        loading={loading}
      />

      {/* 金币收集动画 */}
      {coinAnimations.map((animation) => (
        <CoinAnimation
          key={animation.id}
          startPosition={animation.position}
          coins={animation.coins}
          onComplete={() => {
            setCoinAnimations((prev) =>
              prev.filter((a) => a.id !== animation.id)
            );
          }}
        />
      ))}
    </ImageBackground>
  );
}
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};
// 获取房间图标
const getRoomIcon = (categoryName: string) => {
  const icons: Record<string, string> = {
    work: "briefcase",
    study: "book",
    // 'health': 'heart',
    // 'sleep': 'home',
    workout: "running",
    // 'social': 'users',
    // 'entertainment': 'gamepad',
    // 'family': 'user-friends',
    // 'travel': 'plane'
  };

  return icons[categoryName] || "star";
};

// 任务卡片组件 - 添加位置测量
const TaskCard = ({ todo, categories, onComplete, onDelete }: any) => {
  const cardRef = useRef<View>(null);
  const category = categories.find(
    (c: any) => c.category_id === todo.category_id
  );
  const difficulty =
    category?.difficulty_multiplier || todo.category.difficulty_multiplier;
  const coins = Math.floor(todo.base_coin_value * difficulty);

  // 获取卡片位置
  const getPosition = (): Promise<{ x: number; y: number }> => {
    return new Promise((resolve) => {
      if (cardRef.current) {
        cardRef.current.measureInWindow((x, y) => {
          resolve({ x, y });
        });
      } else {
        resolve({ x: width / 2, y: height / 2 });
      }
    });
  };

  // 处理收集操作
  const handleCollect = async () => {
    const position = await getPosition();
    onComplete(todo.todo_id, position, coins);
  };

  return (
    <View
      ref={cardRef}
      style={[styles.taskCard, todo.completed && styles.completedTask]}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{todo.title}</Text>
        <View style={styles.coinBadge}>
          <FontAwesome5 name="coins" size={14} color="#FFD700" />
          <Text style={styles.coinCount}>{coins}</Text>
        </View>
      </View>

      {todo.description && (
        <Text style={styles.taskDescription}>{todo.description}</Text>
      )}

      <View style={styles.taskFooter}>
        <Text style={styles.taskDueDate}>
          {new Date(todo.due_date).toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
          })}
        </Text>
        <View style={styles.taskActions}>
          {!todo.completed && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCollect}
            >
              <Text style={styles.completeButtonText}>收集</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(todo.todo_id)}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// 样式表保持不变
const AddTaskModal = ({
  visible,
  onClose,
  title,
  setTitle,
  description,
  setDescription,
  category_id,
  setCategoryId,
  due_date,
  setDueDate,
  showDatePicker,
  setShowDatePicker,
  categories,
  onAdd,
  loading,
}: any) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalBg}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>添加新任务</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>任务标题</Text>
          <TextInput
            style={styles.input}
            placeholder="输入任务标题..."
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>任务描述</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="输入任务描述..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>截止日期</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{due_date.toLocaleDateString("zh-CN")}</Text>
            <MaterialIcons name="calendar-today" size={20} color="#4CAF50" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={due_date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>任务类别</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={category_id} onValueChange={setCategoryId}>
              {categories.map((category: any) => (
                <Picker.Item
                  key={category.category_id}
                  label={`${category.category_name} (x${category.difficulty_multiplier})`}
                  value={category.category_id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>取消</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.addButton]}
            onPress={onAdd}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "添加中..." : "添加任务"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// 样式表
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  coinHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },
  coinText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#FFD700",
  },
  mapContainer: {
    height: 120,
    marginBottom: 20,
  },
  mapScroll: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  roomContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginRight: 10,
  },
  path: {
    height: 4,
    width: 40,
    backgroundColor: "#AAA",
    marginHorizontal: -10,
    zIndex: -1,
  },
  pathActive: {
    backgroundColor: "#4CAF50",
  },
  roomIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#6A5ACD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  activeRoom: {
    transform: [{ scale: 1.1 }],
    backgroundColor: "#4CAF50",
    shadowColor: "#FFD700",
    shadowRadius: 10,
  },
  roomName: {
    position: "absolute",
    bottom: -25,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#FFF",
    padding: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBar: {
    position: "absolute",
    bottom: 5,
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  roomContent: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  roomSubtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "normal",
  },
  tasksContainer: {
    flex: 1,
  },
  emptyRoom: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyRoomText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  emptyRoomSubtext: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 6,
    borderLeftColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedTask: {
    opacity: 0.6,
    borderLeftColor: "#9E9E9E",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9C4",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coinCount: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
    color: "#FF9800",
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskDueDate: {
    fontSize: 12,
    color: "#E91E63",
    fontWeight: "500",
    backgroundColor: "#FCE4EC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  taskActions: {
    flexDirection: "row",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  completeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 4,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingButtonText: {
    fontSize: 32,
    color: "#FFF",
    marginTop: -4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  addButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  coinAnimation: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    alignItems: "center",
  },
  coinBonusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9800",
    marginTop: 4,
  },
  completionEffect: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    zIndex: 100,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});
