import { Dish, TiffinPlan, Order, AdminSettings, OrderStatus, FirebaseConfig } from '../types';
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
import { db, firebaseConfig } from './firebase';

const STORAGE_KEYS = {
  DISHES: 'hellobite_dishes_v1',
  TIFFIN_PLANS: 'hellobite_tiffin_plans_v1',
  ORDERS: 'hellobite_orders_v1',
  SETTINGS: 'hellobite_settings_v1',
  ACTIVE_ORDER_ID: 'hellobite_active_order_id'
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
            if (order.isNewAlert || order.status === 'Pending') {
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
        console.warn('Firestore orders live listener notice:', err);
      });

      // 2. REALTIME DISHES / SERVICES SYNC ACROSS ALL PHONES
      const dishesCol = collection(db, 'dishes');
      onSnapshot(dishesCol, async (snapshot) => {
        this.isConnectedToFirestore = true;
        if (snapshot.empty) {
          // Auto-seed initial dishes into Firestore once
          console.log('Seeding initial dishes to live Firestore collection...');
          for (const dish of INITIAL_DISHES) {
            await setDoc(doc(db, 'dishes', dish.id), sanitizeForFirestore(dish)).catch(console.warn);
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
        console.warn('Firestore dishes live listener notice:', err);
      });

      // 3. REALTIME GLOBAL SETTINGS & COUPONS SYNC
      const settingsDoc = doc(db, 'config', 'settings');
      onSnapshot(settingsDoc, async (docSnap) => {
        this.isConnectedToFirestore = true;
        if (!docSnap.exists()) {
          // Auto-seed initial settings into Firestore
          await setDoc(settingsDoc, sanitizeForFirestore(INITIAL_SETTINGS)).catch(console.warn);
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
        console.warn('Firestore settings live listener notice:', err);
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
      console.error('Error syncing dish to Firestore:', err);
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
      console.error('Error deleting dish from Firestore:', err);
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

  public placeOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'isNewAlert'>): Order {
    const id = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt: Date.now(),
      status: 'Pending',
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
      console.error('Error syncing order to Firestore:', err);
    });

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status !== 'Pending') {
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
        console.error('Error updating order status in Firestore:', err);
      });

      return order;
    }
    return null;
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
      console.error('Error deleting order from Firestore:', err);
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
      console.error('Error clearing orders from Firestore:', e);
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
      console.error('Error syncing settings to Firestore:', err);
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
}

export const storeService = new StoreService();
