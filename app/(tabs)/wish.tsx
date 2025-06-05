import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, TouchableOpacity, FlatList, Animated, Modal, TextInput } from "react-native";
import { AntDesign, FontAwesome, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

export default function WishScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [showWishModal, setShowWishModal] = useState(false);
  const [newWishTitle, setNewWishTitle] = useState("");
  const [newWishDescription, setNewWishDescription] = useState("");
  const [newWishCoins, setNewWishCoins] = useState("50");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWish, setSelectedWish] = useState<any>(null);
  const router = useRouter();

  const coinAnimation = useState(new Animated.Value(1))[0];

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

  const animateCoins = () => {
    Animated.sequence([
      Animated.timing(coinAnimation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(coinAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFulfillWish = async (wishId: number) => {
    setIsProcessing(true);
    try {
      // 在实际应用中，这里会调用API实现愿望
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/wishes/${wishId}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('无法实现愿望');
      
      const data = await response.json();
      setProfile(data.user);
      animateCoins();
      Alert.alert("成功", "愿望已实现！");
    } catch (error) {
      Alert.alert("错误", "无法实现愿望");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddWish = async () => {
    if (!newWishTitle.trim() || !newWishDescription.trim() || !newWishCoins) {
      Alert.alert("错误", "请填写所有字段");
      return;
    }
    
    setIsProcessing(true);
    try {
      // 在实际应用中，这里会调用API添加愿望
      const token = await AsyncStorage.getItem("token");
      const response = await fetch('http://127.0.0.1:8000/api/wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newWishTitle,
          description: newWishDescription,
          coin_cost: parseInt(newWishCoins)
        })
      });
      
      if (!response.ok) throw new Error('添加愿望失败');
      
      const data = await response.json();
      setProfile(data.user);
      setShowWishModal(false);
      setNewWishTitle("");
      setNewWishDescription("");
      setNewWishCoins("50");
      Alert.alert("成功", "愿望已添加！");
    } catch (error) {
      Alert.alert("错误", "添加愿望失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWish = async (wishId: number) => {
    setIsProcessing(true);
    try {
      // 在实际应用中，这里会调用API删除愿望
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/wishes/${wishId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('删除愿望失败');
      
      const data = await response.json();
      setProfile(data.user);
      setSelectedWish(null);
      Alert.alert("成功", "愿望已删除！");
    } catch (error) {
      Alert.alert("错误", "删除愿望失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderWishItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.wishCard, 
        item.is_fulfilled ? styles.fulfilledWish : styles.pendingWish
      ]}
      onPress={() => setSelectedWish(item)}
    >
      <View style={styles.wishHeader}>
        <Text style={styles.wishTitle}>{item.title}</Text>
        <View style={styles.coinBadge}>
          <FontAwesome5 name="coins" size={14} color="#FFD700" />
          <Text style={styles.coinText}>{item.coin_cost}</Text>
        </View>
      </View>
      
      <Text style={styles.wishDescription}>{item.description}</Text>
      
      <View style={styles.wishFooter}>
        <Text style={styles.wishDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        
        {item.is_fulfilled ? (
          <View style={styles.fulfilledBadge}>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#4CAF50" />
            <Text style={styles.fulfilledText}>已实现</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.fulfillButton}
            onPress={(e) => {
              e.stopPropagation();
              handleFulfillWish(item.wish_id);
            }}
            disabled={isProcessing}
          >
            <Text style={styles.fulfillButtonText}>实现愿望</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {item.is_fulfilled && (
        <View style={styles.fulfilledInfo}>
          <Feather name="gift" size={14} color="#4CAF50" />
          <Text style={styles.fulfilledDate}>
            于 {new Date(item.fulfilled_at).toLocaleDateString()} 实现
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 用户信息卡片 */}
      <View style={styles.profileCard}>
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{profile.username}</Text>
            <Animated.View style={{ transform: [{ scale: coinAnimation }] }}>
              <View style={styles.coinContainer}>
                <FontAwesome5 name="coins" size={20} color="#FFD700" />
                <Text style={styles.coinCount}>{profile.total_coins}</Text>
              </View>
            </Animated.View>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.wishes.length}</Text>
            <Text style={styles.statLabel}>愿望总数</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.wishes.filter((w: any) => w.is_fulfilled).length}
            </Text>
            <Text style={styles.statLabel}>已实现</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile.wishes.filter((w: any) => !w.is_fulfilled).length}
            </Text>
            <Text style={styles.statLabel}>待实现</Text>
          </View>
        </View>
      </View>
      
      {/* 愿望列表 */}
      <View style={styles.wishesContainer}>
        <Text style={styles.sectionTitle}>我的愿望清单</Text>
        
        {profile.wishes.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="star-o" size={50} color="#FFD700" />
            <Text style={styles.emptyText}>你还没有任何愿望</Text>
            <Text style={styles.emptySubtext}>点击下方按钮添加第一个愿望吧！</Text>
          </View>
        ) : (
          <FlatList
            data={profile.wishes}
            renderItem={renderWishItem}
            keyExtractor={(item) => item.wish_id.toString()}
            contentContainerStyle={styles.wishList}
          />
        )}
      </View>
      
      {/* 添加愿望按钮 */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowWishModal(true)}
      >
        <AntDesign name="plus" size={28} color="white" />
      </TouchableOpacity>
      
      {/* 添加愿望模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWishModal}
        onRequestClose={() => setShowWishModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>许下新愿望</Text>
            
            <Text style={styles.inputLabel}>愿望名称</Text>
            <TextInput
              style={styles.input}
              placeholder="输入愿望名称"
              value={newWishTitle}
              onChangeText={setNewWishTitle}
            />
            
            <Text style={styles.inputLabel}>愿望描述</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="描述你的愿望"
              multiline
              value={newWishDescription}
              onChangeText={setNewWishDescription}
            />
            
            <Text style={styles.inputLabel}>需要金币</Text>
            <View style={styles.coinInputContainer}>
              <TextInput
                style={[styles.input, styles.coinInput]}
                keyboardType="numeric"
                value={newWishCoins}
                onChangeText={setNewWishCoins}
              />
              <FontAwesome name="star" size={20} color="#FFD700" style={styles.coinIcon} />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWishModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddWish}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Text style={styles.addButtonText}>添加中...</Text>
                ) : (
                  <Text style={styles.addButtonText}>添加愿望</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* 愿望详情模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedWish}
        onRequestClose={() => setSelectedWish(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedWish && (
              <view>
                <Text style={styles.modalTitle}>{selectedWish.title}</Text>
                
                <Text style={styles.detailLabel}>愿望描述</Text>
                <Text style={styles.detailText}>{selectedWish.description}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>所需金币:</Text>
                  <View style={styles.coinBadge}>
                    <FontAwesome name="star" size={16} color="#FFD700" />
                    <Text style={styles.coinText}>{selectedWish.coin_cost}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>创建时间:</Text>
                  <Text style={styles.detailText}>
                    {new Date(selectedWish.created_at).toLocaleString()}
                  </Text>
                </View>
                
                {selectedWish.is_fulfilled && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>实现时间:</Text>
                    <Text style={styles.detailText}>
                      {new Date(selectedWish.fulfilled_at).toLocaleString()}
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalButtons}>
                  {!selectedWish.is_fulfilled && (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.fulfillButtonModal]}
                      onPress={() => {
                        handleFulfillWish(selectedWish.wish_id);
                        setSelectedWish(null);
                      }}
                    >
                      <Text style={styles.fulfillButtonText}>实现愿望</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => handleDeleteWish(selectedWish.wish_id)}
                    disabled={isProcessing}
                  >
                    <Text style={styles.deleteButtonText}>删除愿望</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setSelectedWish(null)}
                  >
                    <Text style={styles.cancelButtonText}>关闭</Text>
                  </TouchableOpacity>
                </View>
              </view>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  coinCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  wishesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 5,
  },
  wishList: {
    paddingBottom: 20,
  },
  wishCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingWish: {
    borderLeftWidth: 5,
    borderLeftColor: '#b7ffb1',
  },
  fulfilledWish: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  wishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wishTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  coinText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 5,
  },
  wishDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 15,
  },
  wishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishDate: {
    fontSize: 13,
    color: '#888',
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  fulfilledText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 5,
  },
  fulfillButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  fulfillButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fulfilledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  fulfilledDate: {
    fontSize: 13,
    color: '#4CAF50',
    marginLeft: 5,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  coinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinInput: {
    flex: 1,
    marginRight: 10,
  },
  coinIcon: {
    position: 'absolute',
    right: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    flexWrap: 'wrap',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    marginVertical: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButtonModal: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fulfillButtonModal: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});