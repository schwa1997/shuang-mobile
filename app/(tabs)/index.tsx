import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function IndexTab() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category_id, setCategoryId] = useState(1);
  const [due_date, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [coins, setCoins] = useState(0);
  const [completedAnimation] = useState(new Animated.Value(0));
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 动画效果
  const animateCoin = () => {
    completedAnimation.setValue(0);
    Animated.timing(completedAnimation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.elastic(1),
      useNativeDriver: true,
    }).start();
  };

  // 获取数据
  const fetchData = async () => {
    const token = await AsyncStorage.getItem("token");
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

  // 完成任务
  const handleComplete = async (todo_id: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

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

      // 获取金币奖励
      const data = await res.json();
      setCoins((prev) => prev + data.coins_earned);
      animateCoin();

      fetchData();
    } catch (e: any) {
      Alert.alert("错误", e.message);
    } finally {
      setLoading(false);
    }
  };

  // 完成任务

  //取当前周日期范围
  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + currentWeek * 7 - start.getDay() + 1);
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  // 获取某天任务
  const getTasksForDate = (date: Date) => {
    return todos.filter((todo) => {
      const due = new Date(todo.due_date);
      return (
        due.getDate() === date.getDate() &&
        due.getMonth() === date.getMonth() &&
        due.getFullYear() === date.getFullYear()
      );
    });
  };

  // 日期格式化 - 使用原生JS实现
  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  // 获取星期名称 - 使用原生JS实现
  const getWeekdayName = (date: Date) => {
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return `周${weekdays[date.getDay()]}`;
  };

  // 格式化月份和日期
  const formatMonthDay = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const weekDates = getWeekDates();

  return (
    <View style={styles.container}>
      {/* 顶部金币栏 */}
      <View style={styles.coinHeaderContainer}>
        <View style={styles.coinHeader}>
          <FontAwesome5 name="coins" size={24} color="#FFD700" />
          <Text style={styles.coinText}>{coins} 金币</Text>
          {/* 添加任务按钮 */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.floatingButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 周导航栏 */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity
          onPress={() => {
            setCurrentWeek((prev) => prev - 1);
            setSelectedDate(
              new Date(selectedDate.setDate(selectedDate.getDate() - 7))
            );
          }}
          style={styles.navButton}
        >
          <MaterialIcons name="chevron-left" size={28} color="#4CAF50" />
        </TouchableOpacity>

        <Text style={styles.weekTitle}>
          {formatMonthDay(weekDates[0])} - {formatMonthDay(weekDates[6])}
        </Text>

        <TouchableOpacity
          onPress={() => {
            setCurrentWeek((prev) => prev + 1);
            setSelectedDate(
              new Date(selectedDate.setDate(selectedDate.getDate() + 7))
            );
          }}
          style={styles.navButton}
        >
          <MaterialIcons name="chevron-right" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* 日历日期行 */}
      <View style={styles.calendarRow}>
        {weekDates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateCircle,
              selectedDate.getDate() === date.getDate() &&
                styles.selectedDateCircle,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={styles.weekdayText}>{getWeekdayName(date)}</Text>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 任务列表 - 只显示选中日期的任务 */}
      <ScrollView style={styles.tasksContainer}>
        <Text style={styles.sectionTitle}>
          Tasks For: {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日{" "}
          {getWeekdayName(selectedDate)}
        </Text>

        {getTasksForDate(selectedDate).map((todo) => (
          <TaskCard
            key={todo.todo_id}
            todo={todo}
            categories={categories}
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        ))}

        {getTasksForDate(selectedDate).length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>无任务</Text>
          </View>
        )}
      </ScrollView>

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

      {/* 金币动画 */}
      <Animated.View
        style={[
          styles.coinAnimation,
          {
            transform: [
              {
                translateY: completedAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
              {
                scale: completedAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.5, 1],
                }),
              },
              {
                rotate: completedAnimation.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: ["0deg", "-15deg", "0deg", "15deg", "0deg"],
                }),
              },
            ],
            opacity: completedAnimation.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          },
        ]}
      >
        <FontAwesome5 name="coins" size={40} color="#FFD700" />
        {/* <Text style={styles.coinBonusText}>+10</Text> */}
      </Animated.View>
    </View>
  );
}

// 任务卡片组件
const TaskCard = ({ todo, categories, onComplete, onDelete }: any) => {
  const category = categories.find(
    (c: any) => c.category_id === todo.category_id
  );
  const difficulty =
    category?.difficulty_multiplier || todo.category.difficulty_multiplier;
  const coins = Math.floor(todo.base_coin_value * difficulty);

  return (
    <View style={[styles.taskCard, todo.completed && styles.completedTask]}>
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
        <Text style={styles.taskCategory}>{category?.category_name || ""}</Text>
        <View style={styles.taskActions}>
          {!todo.completed && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => onComplete(todo.todo_id)}
            >
              <MaterialIcons name="check" size={20} color="#4CAF50" />
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

const getColorByDifficulty = (difficulty: number) => {
  if (difficulty === 1) return "#4CAF50";
  if (difficulty === 2) return "#FF9800";
  if (difficulty === 3) return "#F44336";
  if (difficulty === 4) return "#9C27B0";
  if (difficulty === 5) return "#2196F3";
  if (difficulty === 6) return "#FFEB3B";
  if (difficulty === 7) return "#FFC107";
  if (difficulty === 8) return "#FF5722";
  if (difficulty === 9) return "#607D8B";
  if (difficulty === 10) return "#3F51B5";
  return "#4CAF50";
};
// 添加任务模态框组件
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
            placeholder="Enter your task title..."
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>任务描述</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Describe your task..."
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
          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.buttonsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {categories.map((category: any) => {
                const isSelected = category_id === category.category_id;
                const bgColor = getColorByDifficulty(
                  category.difficulty_multiplier
                );

                return (
                  <TouchableOpacity
                    key={category.category_id}
                    style={[
                      styles.categoryButton,
                      { backgroundColor: bgColor },
                      isSelected && styles.selectedButton,
                    ]}
                    onPress={() => setCategoryId(category.category_id)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: isSelected ? "white" : "black" },
                      ]}
                    >
                      {category.category_name} (x
                      {category.difficulty_multiplier})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    backgroundColor: "#f0faf7",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  coinHeaderContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 35,
    padding: 20,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  coinHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#FF9800",
  },
  weekNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  dayColumn: {
    width: 280,
    marginRight: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#555",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  todayHeader: {
    color: "#4CAF50",
    borderBottomColor: "#4CAF50",
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    paddingVertical: 6,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  completedTask: {
    opacity: 0.6,
    borderLeftColor: "#9E9E9E",
    textDecorationStyle: "solid",
    textDecorationLine: "line-through",
    textDecorationColor: "#9E9E9E",
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
  taskCategory: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskActions: {
    flexDirection: "row",
  },
  completeButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyDay: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyDayText: {
    color: "#AAA",
    fontStyle: "italic",
  },
  floatingButton: {
    position: "absolute",
    // top: 30,
    right: -20,
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
    minHeight: 40,
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
    height: 40,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  picker: {
    height: 40,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
  pickerItem: {
    height: 40,
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
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 15,
  },
  dateCircle: {
    width: 48,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  selectedDateCircle: {
    backgroundColor: "#4CAF50",
    fontWeight: "bold",
    color: "#666",
  },
  dateText: {
    fontSize: 18,
    // fontWeight: "bold",
    color: "#333",
  },
  weekdayText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  tasksContainer: {
    flex: 1,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  buttonsContainer: {
    height: 60, // 固定高度防止布局抖动
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8, // 按钮间距
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    minWidth: 100, // 最小宽度
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: "white",
    elevation: 3, // Android 阴影
    shadowColor: "#000", // iOS 阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
