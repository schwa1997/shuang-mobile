import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  Animated,
  Easing
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

export default function IndexTab() {
  // 状态管理
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
  
  // 动画效果
  const animateCoin = () => {
    completedAnimation.setValue(0);
    Animated.timing(completedAnimation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.elastic(1),
      useNativeDriver: true
    }).start();
  };

  // 获取数据
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
      const categoriesRes = await fetch("http://127.0.0.1:8000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriesData = await categoriesRes.json();
      
      // 获取用户金币
      const userRes = await fetch(`http://127.0.0.1:8000/api/users/${user_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userRes.json();
      
      setTodos(todosData);
      setCategories(categoriesData);
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
      const res = await fetch(`http://127.0.0.1:8000/api/todos/${todo_id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("完成任务失败");
      
      // 获取金币奖励
      const data = await res.json();
      setCoins(prev => prev + data.coins_earned);
      animateCoin();
      
      fetchData();
    } catch (e: any) {
      Alert.alert("错误", e.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取当前周日期范围
  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + currentWeek * 7 - start.getDay());
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
    return todos.filter(todo => {
      const due = new Date(todo.due_date);
      return due.getDate() === date.getDate() && 
             due.getMonth() === date.getMonth() && 
             due.getFullYear() === date.getFullYear();
    });
  };

  // 日期格式化
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const weekDates = getWeekDates();

  return (
    <View style={styles.container}>
      {/* 顶部金币栏 */}
      <View style={styles.coinHeader}>
        <FontAwesome5 name="coins" size={24} color="#FFD700" />
        <Text style={styles.coinText}>{coins} 金币</Text>
      </View>
      
      {/* 周导航 */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity 
          onPress={() => setCurrentWeek(prev => prev - 1)}
          style={styles.navButton}
        >
          <MaterialIcons name="chevron-left" size={28} color="#4CAF50" />
        </TouchableOpacity>
        
        <Text style={styles.weekTitle}>
          {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - 
          {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
        </Text>
        
        <TouchableOpacity 
          onPress={() => setCurrentWeek(prev => prev + 1)}
          style={styles.navButton}
        >
          <MaterialIcons name="chevron-right" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      
      {/* 周视图 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {weekDates.map((date, index) => (
          <View key={index} style={styles.dayColumn}>
            <Text style={[
              styles.dayHeader, 
              new Date().getDate() === date.getDate() && styles.todayHeader
            ]}>
              {formatDate(date)}
            </Text>
            
            {getTasksForDate(date).map(todo => (
              <TaskCard 
                key={todo.todo_id}
                todo={todo}
                categories={categories}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            ))}
            
            {getTasksForDate(date).length === 0 && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>无任务</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* 添加任务按钮 */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.floatingButtonText}>+</Text>
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
      
      {/* 金币动画 */}
      <Animated.View 
        style={[
          styles.coinAnimation,
          {
            transform: [
              { translateY: completedAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -100]
              })},
              { scale: completedAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.5, 1]
              })},
              { rotate: completedAnimation.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: ['0deg', '-15deg', '0deg', '15deg', '0deg']
              })}
            ],
            opacity: completedAnimation.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0]
            })
          }
        ]}
      >
        <FontAwesome5 name="coins" size={40} color="#FFD700" />
        <Text style={styles.coinBonusText}>+10</Text>
      </Animated.View>
    </View>
  );
}

// 任务卡片组件
const TaskCard = ({ todo, categories, onComplete, onDelete }: any) => {
  const category = categories.find((c: any) => c.category_id === todo.category_id);
  const difficulty = category?.difficulty_multiplier || todo.category.difficulty_multiplier;
  const coins = Math.floor(todo.base_coin_value * difficulty);
  
  return (
    <View style={[
      styles.taskCard,
      todo.completed && styles.completedTask
    ]}>
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
  loading
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
            <Text>{due_date.toLocaleDateString('zh-CN')}</Text>
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
            <Picker
              selectedValue={category_id}
              onValueChange={setCategoryId}
            >
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
    backgroundColor: "#F5F7FA",
    padding: 16,
  },
  coinHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coinText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#FF9800"
  },
  weekNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});