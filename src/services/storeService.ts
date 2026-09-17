import { Dish, TiffinPlan, Order, AdminSettings, OrderStatus, FirebaseConfig } from '../types';
import { INITIAL_DISHES, INITIAL_TIFFIN_PLANS, INITIAL_SETTINGS } from '../data/initialData';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  Firestore,
  query,
  orderBy
} from 'firebase/firestore';

const STORAGE_KEYS = {
  DISHES: 'hellobite_dishes_v1',
  TIFFIN_PLANS: 'hellobite_tiffin_plans_v1',
  ORDERS: 'hellobite_orders_v1',
  SETTINGS: 'hellobite_settings_v1',
  ACTIVE_ORDER_ID: 'hellobite_active_order_id'
};

class StoreService {
  private broadcastChannel: BroadcastChannel | null = null;
  private firebaseApp: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private orderListeners: Array<(orders: Order[]) => void> = [];
  private newOrderAlertListeners: Array<(order: Order) => void> = [];
  private dishListeners: Array<(dishes: Dish[]) => void> = [];
  private settingsListeners: Array<(settings: AdminSettings) => void> = [];

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

    // Try initializing Firebase if saved
    this.initFirebaseFromSaved();
  }

  public initFirebaseFromSaved() {
    const settings = this.getSettings();
    if (settings.firebaseConfig && settings.firebaseConfig.apiKey && settings.useFirebaseCloud) {
      this.setupFirebase(settings.firebaseConfig);
    }
  }

  public setupFirebase(config: FirebaseConfig): boolean {
    try {
      if (!config.apiKey || !config.projectId) return false;
      if (!getApps().length) {
        this.firebaseApp = initializeApp(config);
      } else {
        this.firebaseApp = getApps()[0];
      }
      this.db = getFirestore(this.firebaseApp);

      // Start realtime listening to Firestore orders
      const ordersCol = collection(this.db, 'orders');
      const q = query(ordersCol, orderBy('createdAt', 'desc'));
      onSnapshot(q, (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((d) => orders.push(d.data() as Order));
        if (orders.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
          this.notifyOrderListeners();
        }
      }, (err) => {
        console.warn('Firestore orders sync notice:', err);
      });

      return true;
    } catch (e) {
      console.error('Firebase setup failed:', e);
      return false;
    }
  }

  // --- DISHES ---
  public getDishes(): Dish[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISHES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(INITIAL_DISHES));
    return INITIAL_DISHES;
  }

  public saveDish(dish: Dish): Dish {
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

    // Firebase sync if active
    if (this.db) {
      setDoc(doc(this.db, 'dishes', dish.id), dish).catch(console.warn);
    }

    return dish;
  }

  public deleteDish(dishId: string) {
    const dishes = this.getDishes().filter(d => d.id !== dishId);
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
    this.broadcastMessage('DISHES_CHANGED', null);
    this.notifyDishListeners();

    if (this.db) {
      deleteDoc(doc(this.db, 'dishes', dishId)).catch(console.warn);
    }
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
    localStorage.setItem(STORAGE_KEYS.TIFFIN_PLANS, JSON.stringify(INITIAL_TIFFIN_PLANS));
    return INITIAL_TIFFIN_PLANS;
  }

  // --- ORDERS ---
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

    const orders = [newOrder, ...this.getOrders()];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, newOrder.id);

    // Broadcast in real-time to other windows/tabs
    this.broadcastMessage('NEW_ORDER', newOrder);
    this.notifyOrderListeners();
    this.notifyNewOrderAlert(newOrder);

    // Sync to Firestore if configured
    if (this.db) {
      setDoc(doc(this.db, 'orders', newOrder.id), newOrder).catch(err => {
        console.warn('Could not push order to Firestore:', err);
      });
    }

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

      if (this.db) {
        updateDoc(doc(this.db, 'orders', orderId), { status, isNewAlert: order.isNewAlert }).catch(console.warn);
      }
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

    if (this.db) {
      deleteDoc(doc(this.db, 'orders', orderId)).catch(console.warn);
    }
  }

  public clearAllOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    this.clearActiveCustomerOrder();
    this.broadcastMessage('ORDERS_CHANGED', null);
    this.notifyOrderListeners();
  }

  // --- SETTINGS ---
  public getSettings(): AdminSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          coupons: parsed.coupons && parsed.coupons.length > 0 ? parsed.coupons : INITIAL_SETTINGS.coupons
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  }

  public saveSettings(settings: AdminSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.broadcastMessage('SETTINGS_CHANGED', settings);
    if (settings.firebaseConfig && settings.useFirebaseCloud) {
      this.setupFirebase(settings.firebaseConfig);
    }
  }

  public resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(INITIAL_DISHES));
    localStorage.setItem(STORAGE_KEYS.TIFFIN_PLANS, JSON.stringify(INITIAL_TIFFIN_PLANS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    this.broadcastMessage('DISHES_CHANGED', null);
    this.broadcastMessage('ORDERS_CHANGED', null);
    this.notifyDishListeners();
    this.notifyOrderListeners();
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
