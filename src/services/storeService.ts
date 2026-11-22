import { 
  Dish, 
  TiffinPlan, 
  Order, 
  AdminSettings, 
  OrderStatus, 
  FirebaseConfig,
  AppUser,
  KitchenStatus,
  RiderProfile,
  RiderRecord,
  RestaurantRecord,
  ApprovalStatus,
  UserRole,
  RideBooking
} from '../types';
import { INITIAL_DISHES, INITIAL_TIFFIN_PLANS, INITIAL_SETTINGS } from '../data/initialData';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, firebaseConfig, handleFirestoreError, OperationType, signOutFirebase } from './firebase';

const STORAGE_KEYS = {
  DISHES: 'hellobite_dishes_v1',
  TIFFIN_PLANS: 'hellobite_tiffin_plans_v1',
  ORDERS: 'hellobite_orders_v1',
  SETTINGS: 'hellobite_settings_v1',
  ACTIVE_ORDER_ID: 'hellobite_active_order_id',
  USERS: 'hellobite_users_v1',
  AUTH_USER: 'hellobite_current_user_v1',
  FAVORITES: 'hellobite_favorites_v1',
  RIDER_PROFILE: 'hellobite_rider_profile_v1',
  RIDERS: 'hellobite_riders_v1',
  RESTAURANTS: 'hellobite_restaurants_v1',
  RIDES: 'hellobite_rides_v1'
};

// Sanitize objects for Firestore to prevent undefined field errors
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

class StoreService {
  private broadcastChannel: BroadcastChannel | null = null;
  private orderListeners: Array<(orders: Order[]) => void> = [];
  private newOrderAlertListeners: Array<(order: Order) => void> = [];
  private dishListeners: Array<(dishes: Dish[]) => void> = [];
  private settingsListeners: Array<(settings: AdminSettings) => void> = [];
  private userListeners: Array<(users: AppUser[]) => void> = [];
  private currentUserListeners: Array<(user: AppUser | null) => void> = [];
  private favoriteListeners: Array<(favIds: string[]) => void> = [];
  private riderListeners: Array<(riders: RiderRecord[]) => void> = [];
  private restaurantListeners: Array<(restaurants: RestaurantRecord[]) => void> = [];
  private rideListeners: Array<(rides: RideBooking[]) => void> = [];
  private isConnectedToFirestore = false;
  private knownOrderIds = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('hellobite_realtime_bus');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'NEW_ORDER') {
          this.notifyOrderListeners();
          this.notifyNewOrderAlert(payload);
        } else if (type === 'ORDER_UPDATED' || type === 'ORDERS_CHANGED') {
          this.notifyOrderListeners();
        } else if (type === 'DISHES_CHANGED') {
          this.notifyDishListeners();
        } else if (type === 'SETTINGS_CHANGED') {
          this.notifySettingsListeners();
        } else if (type === 'USERS_CHANGED') {
          this.notifyUserListeners();
        } else if (type === 'AUTH_CHANGED') {
          this.notifyCurrentUserListeners();
        } else if (type === 'RIDERS_CHANGED') {
          this.notifyRiderListeners();
        } else if (type === 'RESTAURANTS_CHANGED') {
          this.notifyRestaurantListeners();
        } else if (type === 'RIDES_CHANGED') {
          this.notifyRideListeners();
        }
      };
    }

    // Populate initial known order IDs from cache
    const cachedOrders = this.getOrders();
    cachedOrders.forEach(o => this.knownOrderIds.add(o.id));

    // Connect to live Firestore synchronization
    this.initFirestoreSync();
  }

  public isCloudConnected(): boolean {
    return this.isConnectedToFirestore;
  }

  public getFirebaseProjectId(): string {
    return firebaseConfig.projectId;
  }

  private initFirestoreSync() {
    try {
      // 1. REALTIME ORDERS SYNC ACROSS ALL PHONES & ADMIN PANEL
      const ordersCol = collection(db, 'orders');
      const q = query(ordersCol, orderBy('createdAt', 'desc'));

      onSnapshot(q, (snapshot) => {
        this.isConnectedToFirestore = true;
        const liveOrders: Order[] = [];
        let hasNewIncomingOrder = false;
        let newestIncomingOrder: Order | null = null;

        snapshot.forEach((docSnap) => {
          const order = docSnap.data() as Order;
          liveOrders.push(order);

          // If this order is new to this client session and has alert flag
          if (!this.knownOrderIds.has(order.id)) {
            this.knownOrderIds.add(order.id);
            if (
              order.isNewAlert || 
              order.status === 'Pending' || 
              order.status === 'Order Placed - Pay Cash on Delivery'
            ) {
              hasNewIncomingOrder = true;
              if (!newestIncomingOrder || order.createdAt > newestIncomingOrder.createdAt) {
                newestIncomingOrder = order;
              }
            }
          }
        });

        // Always update local cache
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(liveOrders));
        this.notifyOrderListeners();

        // Trigger audio alert if a new order arrived from another phone
        if (hasNewIncomingOrder && newestIncomingOrder) {
          this.notifyNewOrderAlert(newestIncomingOrder);
        }
      }, (err) => {
        if ((err as { code?: string }).code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.LIST, 'orders');
        } else {
          console.warn('Firestore orders live listener operating in offline/retry mode:', err.message || err);
        }
      });

      // 2. REALTIME DISHES / SERVICES SYNC ACROSS ALL PHONES
      const dishesCol = collection(db, 'dishes');
      onSnapshot(dishesCol, async (snapshot) => {
        this.isConnectedToFirestore = true;
        if (snapshot.empty) {
          // Auto-seed initial dishes into Firestore once
          console.log('Seeding initial dishes to live Firestore collection...');
          for (const dish of INITIAL_DISHES) {
            await setDoc(doc(db, 'dishes', dish.id), sanitizeForFirestore(dish)).catch((e) => {
              if ((e as { code?: string })?.code === 'permission-denied') {
                handleFirestoreError(e, OperationType.WRITE, `dishes/${dish.id}`);
              }
            });
          }
          return;
        }

        const liveDishes: Dish[] = [];
        snapshot.forEach((docSnap) => {
          liveDishes.push(docSnap.data() as Dish);
        });

        // Update local cache
        localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(liveDishes));
        this.notifyDishListeners();
      }, (err) => {
        if ((err as { code?: string }).code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.LIST, 'dishes');
        } else {
          console.warn('Firestore dishes live listener operating in offline/retry mode:', err.message || err);
        }
      });

      // 3. REALTIME GLOBAL SETTINGS & COUPONS SYNC
      const settingsDoc = doc(db, 'config', 'settings');
      onSnapshot(settingsDoc, async (docSnap) => {
        this.isConnectedToFirestore = true;
        if (!docSnap.exists()) {
          // Auto-seed initial settings into Firestore
          await setDoc(settingsDoc, sanitizeForFirestore(INITIAL_SETTINGS)).catch((e) => {
            if ((e as { code?: string })?.code === 'permission-denied') {
              handleFirestoreError(e, OperationType.WRITE, 'config/settings');
            }
          });
          return;
        }

        const remoteSettings = docSnap.data() as AdminSettings;
        if (remoteSettings) {
          const merged: AdminSettings = {
            ...INITIAL_SETTINGS,
            ...remoteSettings,
            coupons: remoteSettings.coupons && remoteSettings.coupons.length > 0
              ? remoteSettings.coupons
              : INITIAL_SETTINGS.coupons,
            useFirebaseCloud: true
          };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          this.notifySettingsListeners();
        }
      }, (err) => {
        if ((err as { code?: string }).code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.GET, 'config/settings');
        } else {
          console.warn('Firestore settings live listener operating in offline/retry mode:', err.message || err);
        }
      });

      // 4. REALTIME USERS & WHATSAPP CUSTOMERS SYNC
      const usersCol = collection(db, 'users');
      onSnapshot(usersCol, (snapshot) => {
        const liveUsers: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          liveUsers.push(docSnap.data() as AppUser);
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(liveUsers));
        this.notifyUserListeners();
      }, (err) => {
        if ((err as { code?: string }).code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.LIST, 'users');
        } else {
          console.warn('Firestore users live listener operating in offline/retry mode:', err.message || err);
        }
      });

      // 5. REALTIME RIDERS PARTNER KYC & STATUS SYNC
      const ridersCol = collection(db, 'riders');
      onSnapshot(ridersCol, (snapshot) => {
        const liveRiders: RiderRecord[] = [];
        snapshot.forEach((docSnap) => {
          liveRiders.push(docSnap.data() as RiderRecord);
        });
        localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(liveRiders));
        this.notifyRiderListeners();
      }, (err) => {
        if ((err as { code?: string }).code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.LIST, 'riders');
        } else {
          console.warn('Firestore riders listener notice:', err.message || err);
        }
      });

      // 6. REALTIME RESTAURANTS PARTNER SYNC
      const restaurantsCol = collection(db, 'restaurants');
      onSnapshot(restaurantsCol, (snapshot) => {
        const liveRestaurants: RestaurantRecord[] = [];
        snapshot.forEach((docSnap) => {
          liveRestaurants.push(docSnap.data() as RestaurantRecord);
        });
        localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(liveRestaurants));
        this.notifyRestaurantListeners();
      }, (err) => {
        if ((err as { code?: string }).code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.LIST, 'restaurants');
        } else {
          console.warn('Firestore restaurants listener notice:', err.message || err);
        }
      });

    } catch (e) {
      console.error('Failed to initialize Firestore sync:', e);
    }
  }

  // --- DISHES (SERVICES) ---
  public getDishes(): Dish[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISHES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_DISHES;
  }

  public saveDish(dish: Dish): Dish {
    // Optimistic local update
    const dishes = this.getDishes();
    const index = dishes.findIndex(d => d.id === dish.id);
    let updated: Dish[];
    if (index >= 0) {
      updated = [...dishes];
      updated[index] = dish;
    } else {
      updated = [dish, ...dishes];
    }
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(updated));
    this.broadcastMessage('DISHES_CHANGED', null);
    this.notifyDishListeners();

    // Direct write to Firestore live collection (reflects globally on all phones)
    setDoc(doc(db, 'dishes', dish.id), sanitizeForFirestore(dish)).catch((err) => {
      if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, `dishes/${dish.id}`);
      } else {
        console.warn('Dish synced locally (offline/retrying):', err.message || err);
      }
    });

    return dish;
  }

  public deleteDish(dishId: string) {
    // Optimistic local update
    const dishes = this.getDishes().filter(d => d.id !== dishId);
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
    this.broadcastMessage('DISHES_CHANGED', null);
    this.notifyDishListeners();

    // Direct delete in Firestore (removes globally on all phones)
    deleteDoc(doc(db, 'dishes', dishId)).catch((err) => {
      if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.DELETE, `dishes/${dishId}`);
      } else {
        console.warn('Dish deletion applied locally (offline/retrying):', err.message || err);
      }
    });
  }

  public toggleDishAvailability(dishId: string): boolean {
    const dishes = this.getDishes();
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      dish.isAvailable = !dish.isAvailable;
      this.saveDish(dish);
      return dish.isAvailable;
    }
    return false;
  }

  public updateDishPrice(dishId: string, newPrice: number) {
    const dishes = this.getDishes();
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      dish.price = newPrice;
      this.saveDish(dish);
    }
  }

  // --- TIFFIN PLANS ---
  public getTiffinPlans(): TiffinPlan[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIFFIN_PLANS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_TIFFIN_PLANS;
  }

  // --- ORDERS & TASK REQUESTS ---
  public getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public placeOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'isNewAlert'> & { status?: OrderStatus }): Order {
    const id = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const defaultStatus: OrderStatus = orderData.paymentMethod === 'Cash on Delivery' 
      ? 'Order Placed - Pay Cash on Delivery' 
      : 'Pending';

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt: Date.now(),
      status: orderData.status || defaultStatus,
      isNewAlert: true
    };

    // Track locally
    this.knownOrderIds.add(newOrder.id);
    const orders = [newOrder, ...this.getOrders()];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, newOrder.id);

    // Broadcast across current device tabs
    this.broadcastMessage('NEW_ORDER', newOrder);
    this.notifyOrderListeners();
    this.notifyNewOrderAlert(newOrder);

    // CRITICAL: Write directly to Firebase Firestore live collection
    // This immediately syncs to the central Admin Panel so Satyam Singh sees it on his phone in real time
    setDoc(doc(db, 'orders', newOrder.id), sanitizeForFirestore(newOrder)).then(() => {
      console.log('Order successfully synced to Firestore:', newOrder.id);
    }).catch(err => {
      if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${newOrder.id}`);
      } else {
        console.warn('Order stored locally, queued for Firestore sync (offline/retrying):', err.message || err);
      }
    });

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status !== 'Pending' && status !== 'Order Placed - Pay Cash on Delivery') {
        order.isNewAlert = false;
      }
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.broadcastMessage('ORDER_UPDATED', order);
      this.notifyOrderListeners();

      // Direct write to Firestore to update status across all customer phones
      updateDoc(doc(db, 'orders', orderId), { 
        status, 
        isNewAlert: order.isNewAlert 
      }).catch(err => {
        if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        } else {
          console.warn('Order status updated locally (offline/retrying):', err.message || err);
        }
      });

      return order;
    }
    return null;
  }

  public updateOrderRider(
    orderId: string, 
    riderInfo: { name: string; phone: string; bikeNumber: string; currentStep: number },
    status?: OrderStatus
  ): Order | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.riderInfo = riderInfo;
      if (status) {
        order.status = status;
        if (status !== 'Pending' && status !== 'Order Placed - Pay Cash on Delivery') {
          order.isNewAlert = false;
        }
      }
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.broadcastMessage('ORDER_UPDATED', order);
      this.notifyOrderListeners();

      const updatePayload: Record<string, unknown> = {
        riderInfo: sanitizeForFirestore(riderInfo)
      };
      if (status) {
        updatePayload.status = status;
        updatePayload.isNewAlert = order.isNewAlert;
      }

      updateDoc(doc(db, 'orders', orderId), updatePayload).catch(err => {
        if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        } else {
          console.warn('Rider update saved locally (offline/retrying):', err.message || err);
        }
      });

      return order;
    }
    return null;
  }

  // --- RIDER PROFILE METHODS ---
  public getRiderProfile(): RiderProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RIDER_PROFILE);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return {
      id: 'rider_default',
      name: 'Rider Sonu Kumar',
      phone: '7091472879',
      bikeNumber: 'BR-28-AB-4521',
      isOnline: true,
      hub: 'Gopalganj Central Kitchen',
      todayDeliveriesCount: 0,
      todayCashCollected: 0,
      todayTips: 0
    };
  }

  public saveRiderProfile(profile: RiderProfile) {
    localStorage.setItem(STORAGE_KEYS.RIDER_PROFILE, JSON.stringify(profile));
  }

  public acknowledgeOrderAlert(orderId?: string) {
    const orders = this.getOrders();
    let changed = false;
    orders.forEach(o => {
      if (!orderId || o.id === orderId) {
        if (o.isNewAlert) {
          o.isNewAlert = false;
          changed = true;
          // Sync alert acknowledge to Firestore
          updateDoc(doc(db, 'orders', o.id), { isNewAlert: false }).catch(() => {});
        }
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.broadcastMessage('ORDERS_CHANGED', null);
      this.notifyOrderListeners();
    }
  }

  public getActiveCustomerOrder(): Order | null {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
    if (!activeId) return null;
    const orders = this.getOrders();
    return orders.find(o => o.id === activeId) || null;
  }

  public clearActiveCustomerOrder() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
  }

  public deleteOrder(orderId: string) {
    const orders = this.getOrders().filter(o => o.id !== orderId);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    this.broadcastMessage('ORDERS_CHANGED', null);
    this.notifyOrderListeners();

    // Delete in Firestore
    deleteDoc(doc(db, 'orders', orderId)).catch(err => {
      if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
      } else {
        console.warn('Order deleted locally (offline/retrying):', err.message || err);
      }
    });
  }

  public async clearAllOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    this.clearActiveCustomerOrder();
    this.broadcastMessage('ORDERS_CHANGED', null);
    this.notifyOrderListeners();

    // Batch delete all order documents from Firestore
    try {
      const ordersCol = collection(db, 'orders');
      const snapshot = await getDocs(ordersCol);
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      console.log('All orders cleared from Firestore');
    } catch (e) {
      if ((e as { code?: string })?.code === 'permission-denied' || (e instanceof Error && e.message.includes('permission'))) {
        handleFirestoreError(e, OperationType.WRITE, 'orders');
      } else {
        console.warn('Orders cleared locally (offline/retrying):', e);
      }
    }
  }

  // --- SETTINGS & COUPONS ---
  public getSettings(): AdminSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          adminPassword: (parsed.adminPassword && parsed.adminPassword !== '9771264784') ? parsed.adminPassword : '161600',
          coupons: parsed.coupons && parsed.coupons.length > 0 ? parsed.coupons : INITIAL_SETTINGS.coupons,
          useFirebaseCloud: true
        };
      }
    } catch {
      // fallback
    }
    return {
      ...INITIAL_SETTINGS,
      useFirebaseCloud: true
    };
  }

  public saveSettings(settings: AdminSettings) {
    const cleanSettings = {
      ...settings,
      useFirebaseCloud: true
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cleanSettings));
    this.broadcastMessage('SETTINGS_CHANGED', cleanSettings);
    this.notifySettingsListeners();

    // Direct write to Firestore so coupons, helpline, etc. sync to every user
    setDoc(doc(db, 'config', 'settings'), sanitizeForFirestore(cleanSettings), { merge: true }).catch(err => {
      if ((err as { code?: string })?.code === 'permission-denied' || err.message?.includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, 'config/settings');
      } else {
        console.warn('Settings saved locally (offline/retrying):', err.message || err);
      }
    });
  }

  public resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(INITIAL_DISHES));
    localStorage.setItem(STORAGE_KEYS.TIFFIN_PLANS, JSON.stringify(INITIAL_TIFFIN_PLANS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    this.broadcastMessage('DISHES_CHANGED', null);
    this.broadcastMessage('ORDERS_CHANGED', null);
    this.notifyDishListeners();
    this.notifyOrderListeners();

    // Reset Firestore dishes
    INITIAL_DISHES.forEach(dish => {
      setDoc(doc(db, 'dishes', dish.id), sanitizeForFirestore(dish)).catch(() => {});
    });
    setDoc(doc(db, 'config', 'settings'), sanitizeForFirestore(INITIAL_SETTINGS)).catch(() => {});
  }

  // --- USERS & WHATSAPP AUTHENTICATION ---
  public getUsers(): AppUser[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public getCurrentUser(): AppUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return null;
  }

  public setCurrentUser(user: AppUser | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    this.broadcastMessage('AUTH_CHANGED', user);
    this.notifyCurrentUserListeners();
  }

  public async registerOrLoginWithWhatsApp(
    rawPhone: string,
    name: string,
    addressObj?: { address: string; landmark?: string; coordinates?: { latitude: number; longitude: number } }
  ): Promise<AppUser> {
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const userId = `user_${cleanPhone}`;
    const existingUsers = this.getUsers();
    const existing = existingUsers.find(u => u.id === userId || u.phoneNumber === cleanPhone);

    const now = Date.now();
    let savedAddresses = existing?.savedAddresses || [];
    if (addressObj && addressObj.address) {
      const alreadyHas = savedAddresses.some(a => a.address.toLowerCase() === addressObj.address.toLowerCase());
      if (!alreadyHas) {
        savedAddresses = [addressObj, ...savedAddresses];
      }
    }

    const updatedUser: AppUser = {
      id: userId,
      phoneNumber: cleanPhone,
      name: name.trim() || existing?.name || `Foodie #${cleanPhone.slice(-4)}`,
      role: 'Customer',
      group: 'Signed-In Users',
      tags: ['Verified WhatsApp', 'Active Foodie'],
      createdAt: existing?.createdAt || now,
      lastLoginAt: now,
      savedAddresses,
      orderCount: (existing?.orderCount || 0)
    };

    // Update local cache
    const newUsers = [updatedUser, ...existingUsers.filter(u => u.id !== userId)];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    this.setCurrentUser(updatedUser);
    this.broadcastMessage('USERS_CHANGED', updatedUser);
    this.notifyUserListeners();

    // Direct write to Firestore centralized users collection
    try {
      await setDoc(doc(db, 'users', userId), sanitizeForFirestore(updatedUser), { merge: true });
      console.log('User synced to Firestore "users" group:', userId);
    } catch (err) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      } else {
        console.warn('User stored locally (offline/retrying):', err);
      }
    }

    return updatedUser;
  }

  public async updateUserLocation(
    identifier: string,
    addressObj: { address: string; landmark?: string; coordinates?: { latitude: number; longitude: number } }
  ): Promise<void> {
    const cleanDigits = identifier.replace(/\D/g, '').slice(-10);
    const currentUser = this.getCurrentUser();
    const resolvedId =
      currentUser && (currentUser.id === identifier || currentUser.uid === identifier || (cleanDigits && currentUser.phoneNumber === cleanDigits))
        ? currentUser.id
        : (cleanDigits ? `user_${cleanDigits}` : identifier);
    if (!resolvedId) return;

    const users = this.getUsers();
    const existing = users.find(
      u => u.id === resolvedId || u.uid === identifier || (cleanDigits && cleanDigits !== '0000000000' && u.phoneNumber === cleanDigits)
    );
    const prevAddresses = existing?.savedAddresses || currentUser?.savedAddresses || [];
    const deduped = prevAddresses.filter(
      a => a.address.toLowerCase() !== addressObj.address.toLowerCase()
    );
    const savedAddresses = [addressObj, ...deduped].slice(0, 5);

    if (existing) {
      existing.savedAddresses = savedAddresses;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notifyUserListeners();
    }

    if (currentUser && (currentUser.id === resolvedId || currentUser.uid === identifier || (cleanDigits && currentUser.phoneNumber === cleanDigits))) {
      this.setCurrentUser({ ...currentUser, savedAddresses });
    }

    try {
      await setDoc(
        doc(db, 'users', resolvedId),
        { savedAddresses: sanitizeForFirestore(savedAddresses), lastLoginAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `users/${resolvedId}`);
      } else {
        console.warn('User location cached locally (offline/retrying):', err);
      }
    }
  }

  public incrementUserOrderCount(phoneNumber: string) {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const userId = `user_${cleanPhone}`;
    const users = this.getUsers();
    const user = users.find(u => u.id === userId || u.phoneNumber === cleanPhone);
    if (user) {
      user.orderCount = (user.orderCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notifyUserListeners();
      setDoc(doc(db, 'users', userId), { orderCount: user.orderCount }, { merge: true }).catch(console.warn);
    }
  }

  // --- FAVORITES ---
  public getFavorites(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public isFavorite(dishId: string): boolean {
    return this.getFavorites().includes(dishId);
  }

  public toggleFavorite(dishId: string): boolean {
    const favs = this.getFavorites();
    const isFav = favs.includes(dishId);
    let updated: string[];
    if (isFav) {
      updated = favs.filter(id => id !== dishId);
    } else {
      updated = [...favs, dishId];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    this.favoriteListeners.forEach(cb => cb(updated));
    return !isFav;
  }

  // --- KITCHEN STATUS ---
  public setKitchenStatus(status: KitchenStatus, note?: string) {
    const current = this.getSettings();
    const updated = {
      ...current,
      kitchenStatus: status,
      kitchenStatusNote: note || (
        status === 'busy' ? 'High order volume in Gopalganj & Siwan. Preparation time may be +15 mins.' :
        status === 'closed' ? 'Kitchen is currently closed. Opening soon for orders!' : undefined
      )
    };
    this.saveSettings(updated);
  }

  public async saveUserProfile(params: {
    uid?: string;
    phoneNumber: string;
    countryCode?: string;
    name: string;
    email?: string;
    profileImage?: string;
    role: UserRole;
    city?: string;
    addressObj?: { address: string; landmark?: string; coordinates?: { latitude: number; longitude: number } };
  }): Promise<AppUser> {
    const cleanPhone = params.phoneNumber.replace(/\D/g, '').slice(-10) || '0000000000';
    const userId = params.uid || `user_${cleanPhone}`;
    const existingUsers = this.getUsers();
    const existing = existingUsers.find(u => u.id === userId || (cleanPhone !== '0000000000' && u.phoneNumber === cleanPhone));
    const now = Date.now();

    let savedAddresses = existing?.savedAddresses || [];
    if (params.addressObj && params.addressObj.address) {
      const alreadyHas = savedAddresses.some(a => a.address.toLowerCase() === params.addressObj!.address.toLowerCase());
      if (!alreadyHas) {
        savedAddresses = [params.addressObj, ...savedAddresses].slice(0, 5);
      }
    }

    const groupMap: Record<UserRole, AppUser['group']> = {
      Customer: 'Signed-In Users',
      Rider: 'Delivery Partners',
      Restaurant: 'Restaurant Partners',
    };

    const updatedUser: AppUser = {
      id: userId,
      uid: userId,
      phoneNumber: cleanPhone,
      countryCode: params.countryCode || '+91',
      name: params.name.trim() || existing?.name || `Hello Bite ${params.role}`,
      email: params.email || existing?.email,
      profileImage: params.profileImage || existing?.profileImage,
      role: params.role,
      group: groupMap[params.role],
      tags: [`Verified ${params.role}`, params.email ? 'Gmail Firebase Auth' : 'Hello Bite Account'],
      isVerified: true,
      accountStatus: params.role === 'Customer' ? 'active' : (existing?.accountStatus || 'pending'),
      city: params.city || existing?.city || 'Gopalganj',
      createdAt: existing?.createdAt || now,
      lastLoginAt: now,
      savedAddresses,
      orderCount: existing?.orderCount || 0,
    };

    const newUsers = [updatedUser, ...existingUsers.filter(u => u.id !== userId)];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    this.setCurrentUser(updatedUser);
    this.broadcastMessage('USERS_CHANGED', updatedUser);
    this.notifyUserListeners();

    try {
      await setDoc(doc(db, 'users', userId), sanitizeForFirestore(updatedUser), { merge: true });
    } catch (err) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      } else {
        console.warn('User profile stored locally (offline/retrying):', err);
      }
    }

    return updatedUser;
  }

  public async logoutCurrentUser() {
    this.setCurrentUser(null);
    await signOutFirebase();
  }

  // --- RIDERS COLLECTION (KYC & PARTNER PORTAL) ---
  public getRiders(): RiderRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RIDERS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public getRiderByUserId(userId: string): RiderRecord | null {
    return this.getRiders().find(r => r.userId === userId) || null;
  }

  public async saveRiderRegistration(record: RiderRecord): Promise<RiderRecord> {
    const clean = { ...record, updatedAt: Date.now() };
    const existing = this.getRiders().filter(r => r.userId !== clean.userId);
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify([clean, ...existing]));
    this.broadcastMessage('RIDERS_CHANGED', clean);
    this.notifyRiderListeners();

    // Sync local RiderProfile convenience object too
    this.saveRiderProfile({
      id: clean.userId,
      name: clean.personalDetails.fullName,
      phone: clean.personalDetails.phoneNumber,
      bikeNumber: clean.vehicleDetails.vehicleNumber,
      isOnline: clean.availability,
      hub: clean.personalDetails.city.toLowerCase().includes('siwan')
        ? 'Siwan Express Hub'
        : 'Gopalganj Central Kitchen',
      todayDeliveriesCount: clean.earnings.deliveriesCount,
      todayCashCollected: 0,
      todayTips: 0,
    });

    try {
      await setDoc(doc(db, 'riders', clean.userId), sanitizeForFirestore(clean), { merge: true });
    } catch (err) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `riders/${clean.userId}`);
      } else {
        console.warn('Rider record saved locally (offline/retrying):', err);
      }
    }
    return clean;
  }

  public async updateRiderApproval(userId: string, approvalStatus: ApprovalStatus) {
    const riders = this.getRiders();
    const updated = riders.map(r => r.userId === userId ? { ...r, approvalStatus, updatedAt: Date.now() } : r);
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));
    this.broadcastMessage('RIDERS_CHANGED', null);
    this.notifyRiderListeners();

    const accountStatus = approvalStatus === 'approved' ? 'active' : approvalStatus === 'rejected' ? 'suspended' : 'pending';
    updateDoc(doc(db, 'riders', userId), { approvalStatus, updatedAt: Date.now() }).catch(console.warn);
    updateDoc(doc(db, 'users', userId), { accountStatus }).catch(console.warn);
  }

  public updateRiderAvailability(userId: string, availability: boolean) {
    const riders = this.getRiders();
    const updated = riders.map(r => r.userId === userId ? { ...r, availability, updatedAt: Date.now() } : r);
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));
    this.broadcastMessage('RIDERS_CHANGED', null);
    this.notifyRiderListeners();
    updateDoc(doc(db, 'riders', userId), { availability, updatedAt: Date.now() }).catch(console.warn);
  }

  // --- RESTAURANTS COLLECTION (PARTNER ONBOARDING & STORE) ---
  public getRestaurants(): RestaurantRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public getRestaurantByOwnerId(ownerId: string): RestaurantRecord | null {
    return this.getRestaurants().find(r => r.ownerId === ownerId) || null;
  }

  public async saveRestaurantRegistration(record: RestaurantRecord): Promise<RestaurantRecord> {
    const clean = { ...record, updatedAt: Date.now() };
    const existing = this.getRestaurants().filter(r => r.restaurantId !== clean.restaurantId);
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify([clean, ...existing]));
    this.broadcastMessage('RESTAURANTS_CHANGED', clean);
    this.notifyRestaurantListeners();

    try {
      await setDoc(doc(db, 'restaurants', clean.restaurantId), sanitizeForFirestore(clean), { merge: true });
    } catch (err) {
      if ((err as { code?: string })?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.WRITE, `restaurants/${clean.restaurantId}`);
      } else {
        console.warn('Restaurant saved locally (offline/retrying):', err);
      }
    }
    return clean;
  }

  public async updateRestaurantApproval(restaurantId: string, approvalStatus: ApprovalStatus) {
    const list = this.getRestaurants();
    const target = list.find(r => r.restaurantId === restaurantId);
    const updated = list.map(r => r.restaurantId === restaurantId ? { ...r, approvalStatus, updatedAt: Date.now() } : r);
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(updated));
    this.broadcastMessage('RESTAURANTS_CHANGED', null);
    this.notifyRestaurantListeners();

    updateDoc(doc(db, 'restaurants', restaurantId), { approvalStatus, updatedAt: Date.now() }).catch(console.warn);
    if (target?.ownerId) {
      const accountStatus = approvalStatus === 'approved' ? 'active' : approvalStatus === 'rejected' ? 'suspended' : 'pending';
      updateDoc(doc(db, 'users', target.ownerId), { accountStatus }).catch(console.warn);
    }
  }

  public toggleRestaurantOpen(restaurantId: string, isOpen: boolean) {
    const list = this.getRestaurants();
    const updated = list.map(r => r.restaurantId === restaurantId ? { ...r, isOpen, updatedAt: Date.now() } : r);
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(updated));
    this.broadcastMessage('RESTAURANTS_CHANGED', null);
    this.notifyRestaurantListeners();
    updateDoc(doc(db, 'restaurants', restaurantId), { isOpen, updatedAt: Date.now() }).catch(console.warn);
  }

  // --- RIDE BOOKINGS ---
  public getRides(): RideBooking[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RIDES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public saveRideBooking(data: Omit<RideBooking, 'id' | 'rideNumber' | 'createdAt' | 'status'>): RideBooking {
    const ride: RideBooking = {
      ...data,
      id: 'ride_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      rideNumber: 'HB-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Searching Rider',
      createdAt: Date.now(),
    };
    const updated = [ride, ...this.getRides()];
    localStorage.setItem(STORAGE_KEYS.RIDES, JSON.stringify(updated));
    this.broadcastMessage('RIDES_CHANGED', ride);
    this.notifyRideListeners();
    return ride;
  }

  // --- SUBSCRIPTIONS ---
  public subscribeOrders(cb: (orders: Order[]) => void): () => void {
    this.orderListeners.push(cb);
    cb(this.getOrders());
    return () => {
      this.orderListeners = this.orderListeners.filter(l => l !== cb);
    };
  }

  public subscribeNewOrderAlert(cb: (order: Order) => void): () => void {
    this.newOrderAlertListeners.push(cb);
    return () => {
      this.newOrderAlertListeners = this.newOrderAlertListeners.filter(l => l !== cb);
    };
  }

  public subscribeDishes(cb: (dishes: Dish[]) => void): () => void {
    this.dishListeners.push(cb);
    cb(this.getDishes());
    return () => {
      this.dishListeners = this.dishListeners.filter(l => l !== cb);
    };
  }

  public subscribeSettings(cb: (settings: AdminSettings) => void): () => void {
    this.settingsListeners.push(cb);
    cb(this.getSettings());
    return () => {
      this.settingsListeners = this.settingsListeners.filter(l => l !== cb);
    };
  }

  public subscribeUsers(cb: (users: AppUser[]) => void): () => void {
    this.userListeners.push(cb);
    cb(this.getUsers());
    return () => {
      this.userListeners = this.userListeners.filter(l => l !== cb);
    };
  }

  public subscribeCurrentUser(cb: (user: AppUser | null) => void): () => void {
    this.currentUserListeners.push(cb);
    cb(this.getCurrentUser());
    return () => {
      this.currentUserListeners = this.currentUserListeners.filter(l => l !== cb);
    };
  }

  public subscribeFavorites(cb: (favIds: string[]) => void): () => void {
    this.favoriteListeners.push(cb);
    cb(this.getFavorites());
    return () => {
      this.favoriteListeners = this.favoriteListeners.filter(l => l !== cb);
    };
  }

  public subscribeRiders(cb: (riders: RiderRecord[]) => void): () => void {
    this.riderListeners.push(cb);
    cb(this.getRiders());
    return () => {
      this.riderListeners = this.riderListeners.filter(l => l !== cb);
    };
  }

  public subscribeRestaurants(cb: (restaurants: RestaurantRecord[]) => void): () => void {
    this.restaurantListeners.push(cb);
    cb(this.getRestaurants());
    return () => {
      this.restaurantListeners = this.restaurantListeners.filter(l => l !== cb);
    };
  }

  public subscribeRides(cb: (rides: RideBooking[]) => void): () => void {
    this.rideListeners.push(cb);
    cb(this.getRides());
    return () => {
      this.rideListeners = this.rideListeners.filter(l => l !== cb);
    };
  }

  private broadcastMessage(type: string, payload: unknown) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, payload });
    }
  }

  private notifyOrderListeners() {
    const orders = this.getOrders();
    this.orderListeners.forEach(cb => cb(orders));
  }

  private notifyNewOrderAlert(order: Order) {
    this.newOrderAlertListeners.forEach(cb => cb(order));
  }

  private notifyDishListeners() {
    const dishes = this.getDishes();
    this.dishListeners.forEach(cb => cb(dishes));
  }

  private notifySettingsListeners() {
    const settings = this.getSettings();
    this.settingsListeners.forEach(cb => cb(settings));
  }

  private notifyUserListeners() {
    const users = this.getUsers();
    this.userListeners.forEach(cb => cb(users));
  }

  private notifyCurrentUserListeners() {
    const user = this.getCurrentUser();
    this.currentUserListeners.forEach(cb => cb(user));
  }

  private notifyRiderListeners() {
    const riders = this.getRiders();
    this.riderListeners.forEach(cb => cb(riders));
  }

  private notifyRestaurantListeners() {
    const restaurants = this.getRestaurants();
    this.restaurantListeners.forEach(cb => cb(restaurants));
  }

  private notifyRideListeners() {
    const rides = this.getRides();
    this.rideListeners.forEach(cb => cb(rides));
  }
}

export const storeService = new StoreService();
