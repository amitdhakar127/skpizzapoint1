import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Product,
  CartItem,
  Order,
  OrderStatus,
  GalleryItem,
  VideoItem,
  Review,
  RestaurantSettings,
  PizzaSize,
  AddOn,
  UserProfile,
  LiveLocation,
  BroadcastNotification,
  OrderItemSnapshot,
  ProductCategory,
} from '../types';
import { soundAlerts } from '../lib/soundAlerts';
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_GALLERY,
  INITIAL_VIDEOS,
  INITIAL_REVIEWS,
  INITIAL_ORDERS,
  INITIAL_ADDONS,
} from '../data/initialData';
import {
  auth,
  rtdb,
  AUTHORIZED_ADMIN_UID,
  isUserAdmin,
} from '../lib/firebase';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onChildAdded,
  query,
  limitToLast,
  goOnline,
} from 'firebase/database';
import { sendOrderPushNotification } from '../lib/fcmSender';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Navigation & Routing
  currentPath: string;
  navigate: (path: string) => void;

  // Firebase Auth State
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAuthLoading: boolean;
  isAdmin: boolean;
  authorizedAdminUid: string;

  // Customer Auth Methods
  registerCustomer: (
    email: string,
    pass: string,
    displayName?: string,
    phone?: string,
    address?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginCustomer: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAdminWithFirebase: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginAdminWithPasscode: (passcode: string) => boolean;
  isPasscodeAdmin: boolean;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateCustomerProfile: (data: Partial<UserProfile>) => Promise<boolean>;

  // Cloud Database Status
  isCloudDbConnected: boolean;
  cloudDbError: string | null;

  // Cart (Temporary In-Memory State)
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  finalTotal: number;
  addToCart: (
    product: Product,
    size: PizzaSize | 'Standard',
    quantity?: number,
    addOns?: AddOn[],
    instructions?: string
  ) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  updateCartItemSize: (itemId: string, newSize: PizzaSize | 'Standard') => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Cloud Orders & Device Persistent Orders
  orders: Order[];
  myOrders: Order[];
  createOrder: (customer: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    orderType: 'delivery' | 'pickup';
    deliveryAddress?: string;
    city?: string;
    pinCode?: string;
    instructions?: string;
    customerLocation?: LiveLocation;
    paymentStatus?: 'Pending' | 'Cash on Delivery' | 'Paid Online' | 'Verified';
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderLocation: (orderId: string, location: LiveLocation, isRider?: boolean) => Promise<void>;
  updateOrderPaymentStatus: (
    orderId: string,
    paymentStatus: 'Pending' | 'Cash on Delivery' | 'Paid Online' | 'Verified'
  ) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  generateWhatsAppUrl: (order: Order) => string;
  generateCustomerStatusWhatsAppUrl: (order: Order, status: OrderStatus) => string;
  acceptOrderWithLiveLocation: (orderId: string, status?: OrderStatus) => Promise<void>;
  seedDemoOrders: () => Promise<void>;

  // Real-time Sound Alerts & Notifications
  isSoundMuted: boolean;
  toggleSoundMute: () => void;
  testOrderAlertSound: () => void;
  latestAlertOrder: Order | null;
  dismissOrderAlert: () => void;
  stopContinuousAlarm: () => void;

  // Real-time Push Broadcast System
  broadcasts: BroadcastNotification[];
  activeBroadcast: BroadcastNotification | null;
  dismissActiveBroadcast: (id?: string) => void;
  sendBroadcastNotification: (broadcast: {
    title: string;
    message: string;
    type: 'offer' | 'update' | 'urgent';
    link?: string;
    badge?: string;
  }) => Promise<void>;
  deleteBroadcastNotification: (id: string) => Promise<void>;

  // Products & Menu (Cloud Synced)
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  toggleProductFeatured: (id: string) => Promise<void>;
  updateProductPrice: (productId: string, sizeName: string, newPrice: number) => Promise<void>;
  saveAllProductPrices: (products: Product[]) => Promise<boolean>;
  activeProductModal: Product | null;
  setActiveProductModal: (product: Product | null) => void;

  // Settings (Cloud Synced)
  settings: RestaurantSettings;
  updateSettings: (updates: Partial<RestaurantSettings>) => Promise<void>;

  // Gallery (Cloud Synced)
  gallery: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<void>;
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;

  // Videos (Cloud Synced)
  videos: VideoItem[];
  addVideoItem: (item: Omit<VideoItem, 'id'>) => Promise<void>;
  updateVideoItem: (id: string, updates: Partial<VideoItem>) => Promise<void>;
  deleteVideoItem: (id: string) => Promise<void>;

  // Reviews (Cloud Synced)
  reviews: Review[];
  addReview: (customerName: string, rating: number, comment: string) => Promise<void>;
  toggleReviewApproval: (id: string) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;

  // Favorites & Recently Viewed (In-Session)
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Helpers
  formatPrice: (amount: number) => string;
  syncInitialDataToCloud: () => Promise<void>;
}

// Robust product normalization helper to guarantee crash-free sizes & add-ons across all components
export const normalizeProduct = (raw: any): Product | null => {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw.productId || `prod-${Math.random().toString(36).slice(2, 8)}`);

  // Ensure sizes is always a valid non-empty array
  let sizesList: any[] = [];
  if (Array.isArray(raw.sizes)) {
    sizesList = raw.sizes.filter(Boolean);
  } else if (raw.sizes && typeof raw.sizes === 'object') {
    sizesList = Object.values(raw.sizes).filter(Boolean);
  }

  const safeSizes: { size: PizzaSize | 'Standard'; price: number }[] = sizesList
    .map((s: any) => ({
      size: (s?.size as PizzaSize | 'Standard') || 'Small',
      price: Math.max(0, Number(s?.price) || 0),
    }))
    .filter((s) => s.price >= 0);

  // If no sizes were provided or array is empty, create standard sizes based on raw.price or defaults
  if (safeSizes.length === 0) {
    const base = Math.max(1, Number(raw.price) || 69);
    const cat = String(raw.category || 'pizza').toLowerCase();
    if (cat === 'pizza') {
      safeSizes.push(
        { size: 'Small', price: base },
        { size: 'Medium', price: Math.round(base * 1.6) },
        { size: 'Large', price: Math.round(base * 2.5) }
      );
    } else {
      safeSizes.push({ size: 'Small', price: base });
    }
  }

  // Ensure availableAddOns is always an array
  let addOnsList: any[] = [];
  if (Array.isArray(raw.availableAddOns)) {
    addOnsList = raw.availableAddOns.filter(Boolean);
  } else if (raw.availableAddOns && typeof raw.availableAddOns === 'object') {
    addOnsList = Object.values(raw.availableAddOns).filter(Boolean);
  }

  const safeAddOns: AddOn[] = addOnsList.map((a: any, idx: number) => ({
    id: String(a?.id || `addon-${idx}`),
    name: String(a?.name || 'Extra Cheese'),
    price: Math.max(0, Number(a?.price) || 0),
  }));

  const cat = String(raw.category || 'pizza').toLowerCase() as ProductCategory;
  const safeCategory: ProductCategory = (['pizza', 'burger', 'sandwich'] as ProductCategory[]).includes(cat)
    ? cat
    : 'pizza';

  return {
    id,
    name: String(raw.name || 'SK Pizza Special'),
    category: safeCategory,
    description: String(raw.description || 'Freshly prepared at SK Pizza Point'),
    imageUrl: String(
      raw.imageUrl ||
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
    ),
    sizes: safeSizes,
    availableAddOns: safeAddOns.length > 0 ? safeAddOns : INITIAL_ADDONS,
    isAvailable: raw.isAvailable !== false,
    isFeatured: Boolean(raw.isFeatured),
    badge: raw.badge ? String(raw.badge) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : new Date().toISOString(),
  };
};

// Robust order normalization helper to guarantee crash-free properties across all components
export const normalizeOrder = (raw: any): Order | null => {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;

  let items: any[] = [];
  if (Array.isArray(raw.items)) {
    items = raw.items.filter(Boolean);
  } else if (raw.items && typeof raw.items === 'object') {
    items = Object.values(raw.items).filter(Boolean);
  }

  const safeItems: OrderItemSnapshot[] = items.map((it: any) => {
    let addOns: string[] = [];
    if (Array.isArray(it?.addOns)) {
      addOns = it.addOns.filter(Boolean);
    } else if (it?.addOns && typeof it.addOns === 'object') {
      addOns = Object.values(it.addOns).filter(Boolean) as string[];
    }

    return {
      productId: String(it?.productId || 'item'),
      productName: String(it?.productName || 'Pizza Item'),
      category: (it?.category as ProductCategory) || 'pizza',
      imageUrl: it?.imageUrl ? String(it.imageUrl) : undefined,
      size: String(it?.size || 'Regular'),
      quantity: Math.max(1, Number(it?.quantity) || 1),
      unitPrice: Number(it?.unitPrice) || 0,
      totalPrice: Number(it?.totalPrice) || Number(it?.unitPrice) || 0,
      addOns,
    };
  });

  return {
    id: String(raw.id),
    userId: raw.userId ? String(raw.userId) : 'guest',
    customerEmail: raw.customerEmail ? String(raw.customerEmail) : undefined,
    customerName: String(raw.customerName || 'Customer'),
    customerPhone: String(raw.customerPhone || ''),
    orderType: raw.orderType === 'pickup' ? 'pickup' : 'delivery',
    deliveryAddress: raw.deliveryAddress ? String(raw.deliveryAddress) : '',
    city: raw.city ? String(raw.city) : '',
    pinCode: raw.pinCode ? String(raw.pinCode) : '',
    instructions: raw.instructions ? String(raw.instructions) : '',
    items: safeItems,
    subtotal: Number(raw.subtotal) || 0,
    deliveryFee: Number(raw.deliveryFee) || 0,
    discount: Number(raw.discount) || 0,
    finalTotal: Number(raw.finalTotal) || 0,
    paymentMode: raw.paymentMode ? String(raw.paymentMode) : 'Cash on Delivery',
    paymentStatus: (raw.paymentStatus as 'Pending' | 'Cash on Delivery' | 'Paid Online' | 'Verified') || 'Pending',
    status: (raw.status as OrderStatus) || 'Pending',
    customerLocation:
      raw.customerLocation && typeof raw.customerLocation.latitude === 'number'
        ? raw.customerLocation
        : undefined,
    deliveryRiderLocation:
      (raw.deliveryRiderLocation || raw.riderLocation) &&
      typeof (raw.deliveryRiderLocation || raw.riderLocation).latitude === 'number'
        ? (raw.deliveryRiderLocation || raw.riderLocation)
        : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
  };
};

export const normalizePath = (rawPath: string): string => {
  if (!rawPath) return '/';
  let p = rawPath.replace(/^#[!/]?/, '').trim();
  if (p.includes('?')) {
    p = p.split('?')[0];
  }
  p = p.trim();
  if (!p || p === '/') return '/';
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\/+/g, '/');
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p || '/';
};

// Permanently deleted orders set (ensures deleted orders never resurrect across devices)
export const getDeletedOrderIds = (): Set<string> => {
  try {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('sk_pizza_deleted_orders');
    return new Set(saved ? JSON.parse(saved) : []);
  } catch {
    return new Set();
  }
};

export const markOrderAsDeleted = (orderId: string) => {
  try {
    if (typeof window === 'undefined') return;
    const current = getDeletedOrderIds();
    current.add(orderId);
    localStorage.setItem('sk_pizza_deleted_orders', JSON.stringify(Array.from(current)));
    if (rtdb) {
      set(ref(rtdb, `system/deletedOrderIds/${orderId}`), true).catch(() => {});
    }
  } catch {}
};

// Check if an order is completed/delivered and locked (cannot be reverted after 10 minutes)
export const isOrderLocked = (order: Order | null | undefined): boolean => {
  if (!order) return false;
  const s = (order.status || '').toLowerCase().trim();
  if (s !== 'completed' && s !== 'delivered') return false;
  const compTime = order.completedAt
    ? new Date(order.completedAt).getTime()
    : order.updatedAt
    ? new Date(order.updatedAt).getTime()
    : 0;
  if (!compTime || isNaN(compTime)) return false;
  return Date.now() - compTime >= 10 * 60 * 1000; // 10 minutes limit
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Routing state (safe URL parsing)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return normalizePath(hash);
    return normalizePath(window.location.pathname || '/');
  });

  const navigate = useCallback((path: string) => {
    const clean = normalizePath(path);
    window.location.hash = clean;
    setCurrentPath(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setCurrentPath(normalizePath(hash || '/'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toasts notification system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const formatPrice = useCallback((amount: number): string => {
    return `₹${Math.round(amount)}`;
  }, []);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sk_pizza_user_profile') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Safety timeout: Ensure authentication loading state NEVER blocks UI indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Passcode Admin Session (Allows instant APK / Mobile access with restaurant passcode)
  const [isPasscodeAdmin, setIsPasscodeAdmin] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      return (
        sessionStorage.getItem('sk_pizza_admin_session') === 'true' ||
        localStorage.getItem('sk_pizza_admin_session') === 'true'
      );
    } catch {
      return false;
    }
  });

  // Authoritative admin verification: User's UID must match authorized ID or owner email OR passcode session
  const isAdmin = useMemo(() => {
    if (isPasscodeAdmin) return true;
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('sk_pizza_admin_session') === 'true') return true;
    }
    return isUserAdmin(currentUser?.uid, currentUser?.email);
  }, [isPasscodeAdmin, currentUser]);

  // Keep admin reference for real-time Firebase listeners and stop alarms if not admin
  const isAdminRef = useRef(isAdmin);
  useEffect(() => {
    isAdminRef.current = isAdmin;
    if (!isAdmin) {
      soundAlerts.stopContinuousAlarm();
    }
  }, [isAdmin]);

  // Cloud Database States (Realtime Database)
  const [products, setProducts] = useState<Product[]>(() => {
    return INITIAL_PRODUCTS.map(normalizeProduct).filter((p): p is Product => p !== null);
  });
  const [settings, setSettings] = useState<RestaurantSettings>(INITIAL_SETTINGS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [reviews, setReviews] = useState<Review[]>(() => {
    return [];
  });

  // Recursive sanitizer to completely eliminate undefined values before saving to Firebase RTDB
  const sanitizeForFirebase = <T,>(data: T): T => {
    if (data === undefined) return null as unknown as T;
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeForFirebase(item)) as unknown as T;
    }
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        result[key] = sanitizeForFirebase(val);
      }
    }
    return result as T;
  };

  // Helper to identify legacy demo orders that must never show
  const isDemoRecord = (raw: any) => {
    if (!raw) return true;
    const id = String(raw.id || '');
    const name = String(raw.customerName || '');
    return (
      id.startsWith('SKP-20260929-') ||
      name === 'Vikram Singh' ||
      name === 'Anjali Sharma' ||
      name === 'Deepak Verma'
    );
  };

  // Device-level My Orders (Permanently persists user orders on this device whether logged in or guest)
  const [myOrders, setMyOrders] = useState<Order[]>(() => {
    try {
      const deletedIds = getDeletedOrderIds();
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sk_pizza_my_orders') : null;
      const raw: any[] = saved ? JSON.parse(saved) : [];
      const filtered = raw
        .map(normalizeOrder)
        .filter((o): o is Order => o !== null && !deletedIds.has(o.id) && !isDemoRecord(o));
      try {
        localStorage.setItem('sk_pizza_my_orders', JSON.stringify(filtered.slice(0, 50)));
      } catch {}
      return filtered;
    } catch {
      return [];
    }
  });

  // All restaurant orders (cached locally & synced bidirectional with cloud)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const deletedIds = getDeletedOrderIds();
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sk_pizza_local_orders') : null;
      const savedMy = typeof window !== 'undefined' ? localStorage.getItem('sk_pizza_my_orders') : null;
      const o1: any[] = saved ? JSON.parse(saved) : [];
      const o2: any[] = savedMy ? JSON.parse(savedMy) : [];
      const mergedMap = new Map<string, Order>();

      [...o1, ...o2].forEach((raw) => {
        const o = normalizeOrder(raw);
        if (o && !deletedIds.has(o.id) && !isDemoRecord(o)) {
          mergedMap.set(o.id, o);
        }
      });
      const sorted = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      try {
        localStorage.setItem('sk_pizza_local_orders', JSON.stringify(sorted.slice(0, 100)));
      } catch {}
      return sorted;
    } catch {
      return [];
    }
  });
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastNotification | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundAlerts.getIsMuted());
  const [latestAlertOrder, setLatestAlertOrder] = useState<Order | null>(null);

  // Audio alert tracking refs (prevents false alarms on initial load)
  const initialOrdersLoadedRef = useRef(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const initialBroadcastsLoadedRef = useRef(false);
  const acknowledgedAlarmOrderIdRef = useRef<string | null>(null);
  const activeRiderWatchIdRef = useRef<number | null>(null);

  const [isCloudDbConnected, setIsCloudDbConnected] = useState<boolean>(false);
  const [cloudDbError, setCloudDbError] = useState<string | null>(null);

  // Helper to delete any record safely by direct key or by matching internal id/youtubeId
  const removeCloudRecord = useCallback(async (collectionPath: string, targetId: string) => {
    try {
      const colRef = ref(rtdb, collectionPath);
      const snap = await get(colRef);
      if (snap.exists()) {
        const val = snap.val();
        if (typeof val === 'object' && val !== null) {
          if (val[targetId] !== undefined) {
            await remove(ref(rtdb, `${collectionPath}/${targetId}`));
            return;
          }
          for (const [key, item] of Object.entries(val)) {
            if (
              item &&
              typeof item === 'object' &&
              ((item as any).id === targetId || (item as any).youtubeId === targetId)
            ) {
              await remove(ref(rtdb, `${collectionPath}/${key}`));
              return;
            }
          }
        }
      }
      await remove(ref(rtdb, `${collectionPath}/${targetId}`));
    } catch (err) {
      console.error(`Error deleting from ${collectionPath}:`, err);
      throw err;
    }
  }, []);

  // Helper to update any record safely by direct key or by matching internal id/youtubeId
  const updateCloudRecord = useCallback(
    async (collectionPath: string, targetId: string, updates: Record<string, any>) => {
      try {
        const colRef = ref(rtdb, collectionPath);
        const snap = await get(colRef);
        if (snap.exists()) {
          const val = snap.val();
          if (typeof val === 'object' && val !== null) {
            if (val[targetId] !== undefined) {
              await update(ref(rtdb, `${collectionPath}/${targetId}`), updates);
              return;
            }
            for (const [key, item] of Object.entries(val)) {
              if (
                item &&
                typeof item === 'object' &&
                ((item as any).id === targetId || (item as any).youtubeId === targetId)
              ) {
                await update(ref(rtdb, `${collectionPath}/${key}`), updates);
                return;
              }
            }
          }
        }
        await update(ref(rtdb, `${collectionPath}/${targetId}`), updates);
      } catch (err) {
        console.error(`Error updating in ${collectionPath}:`, err);
        throw err;
      }
    },
    []
  );

  // Temporary In-Memory Cart State (Clean session architecture)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);

  // In-session Favorites & Recently Viewed
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // 1. Listen to Firebase Authentication & Real-Time User Profile / Orders
  useEffect(() => {
    let unsubUserProfile: (() => void) | null = null;
    let unsubUserOrders: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (unsubUserProfile) {
        unsubUserProfile();
        unsubUserProfile = null;
      }
      if (unsubUserOrders) {
        unsubUserOrders();
        unsubUserOrders = null;
      }

      if (user) {
        // Real-time listener for User Profile in Firebase RTDB users/{uid}
        const userRef = ref(rtdb, `users/${user.uid}`);
        unsubUserProfile = onValue(userRef, (snapshot) => {
          let prof: UserProfile;
          if (snapshot.exists()) {
            prof = snapshot.val();
          } else {
            prof = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
              createdAt: new Date().toISOString(),
            };
            set(userRef, prof).catch(() => {});
          }
          setUserProfile(prof);
          try {
            localStorage.setItem('sk_pizza_user_profile', JSON.stringify(prof));
            localStorage.setItem(
              'sk_pizza_cached_auth',
              JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
              })
            );
          } catch {}
        });

        // Real-time listener for Customer's specific Orders in userOrders/{uid}
        const userOrdersRef = ref(rtdb, `userOrders/${user.uid}`);
        unsubUserOrders = onValue(userOrdersRef, (snapshot) => {
          try {
            const deletedIds = getDeletedOrderIds();
            if (snapshot.exists()) {
              const val = snapshot.val();
              const rawList = Array.isArray(val)
                ? val.filter(Boolean)
                : Object.values(val || {}).filter(Boolean);
              const personalOrders = rawList
                .map(normalizeOrder)
                .filter((o): o is Order => o !== null && !deletedIds.has(o.id));

              const safeSort = (a: Order, b: Order) => {
                const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
              };

              const sortedPersonal = personalOrders.sort(safeSort);

              // 1. Authoritative update for logged in user across ANY browser
              setMyOrders(sortedPersonal);
              try {
                localStorage.setItem('sk_pizza_my_orders', JSON.stringify(sortedPersonal.slice(0, 50)));
              } catch {}

              // 2. Sync into global orders map without resurrecting deleted orders
              setOrders((prev) => {
                const map = new Map<string, Order>();
                prev.forEach((o) => {
                  if (o && o.id && !deletedIds.has(o.id) && o.userId !== user.uid) {
                    map.set(o.id, o);
                  }
                });
                sortedPersonal.forEach((o) => map.set(o.id, o));
                return Array.from(map.values()).sort(safeSort);
              });
            } else {
              // If user has no orders or admin deleted all orders:
              setMyOrders([]);
              try {
                localStorage.removeItem('sk_pizza_my_orders');
              } catch {}
              setOrders((prev) => prev.filter((o) => o && o.userId !== user.uid));
            }
          } catch (err) {
            console.warn('Error reading user orders:', err);
          }
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserProfile) unsubUserProfile();
      if (unsubUserOrders) unsubUserOrders();
    };
  }, []);

  // 2. Realtime Database Synchronization for Products, Settings, Gallery, Videos, Reviews, Orders
  useEffect(() => {
    const productsRef = ref(rtdb, 'products');
    const settingsRef = ref(rtdb, 'settings');
    const galleryRef = ref(rtdb, 'gallery');
    const videosRef = ref(rtdb, 'videos');
    const reviewsRef = ref(rtdb, 'reviews');
    const ordersRef = ref(rtdb, 'orders');

    // Subscribe to products
    const unsubProducts = onValue(
      productsRef,
      (snapshot) => {
        setIsCloudDbConnected(true);
        setCloudDbError(null);
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: any[] = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.keys(val || {}).map((k) => val[k]);
          const normalized = items
            .map(normalizeProduct)
            .filter((p): p is Product => p !== null);
          setProducts(normalized.length > 0 ? normalized : INITIAL_PRODUCTS.map(normalizeProduct).filter((p): p is Product => p !== null));
        } else {
          // Database is empty on initial run: seed initial products
          const initialMap: Record<string, Product> = {};
          INITIAL_PRODUCTS.forEach((p) => {
            initialMap[p.id] = p;
          });
          set(productsRef, initialMap).catch(() => {});
        }
      },
      (error) => {
        setCloudDbError(error.message);
      }
    );

    // Subscribe to settings
    const unsubSettings = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings((prev) => ({ ...INITIAL_SETTINGS, ...prev, ...(snapshot.val() || {}) }));
        } else {
          set(settingsRef, INITIAL_SETTINGS).catch(() => {});
        }
      },
      (error) => {
        console.warn('Settings listener error:', error);
      }
    );

    // Subscribe to gallery
    const unsubGallery = onValue(
      galleryRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: GalleryItem[] = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.keys(val || {}).map((k) => val[k]);
          setGallery(items.sort((a, b) => a.sortOrder - b.sortOrder));
        } else {
          const galMap: Record<string, GalleryItem> = {};
          INITIAL_GALLERY.forEach((g) => {
            galMap[g.id] = g;
          });
          set(galleryRef, galMap).catch(() => {});
        }
      },
      (error) => {
        console.warn('Gallery listener error:', error);
      }
    );

    // Subscribe to videos
    const unsubVideos = onValue(
      videosRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: VideoItem[] = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.keys(val || {}).map((k) => val[k]);
          setVideos(items.sort((a, b) => a.sortOrder - b.sortOrder));
        } else {
          const vidMap: Record<string, VideoItem> = {};
          INITIAL_VIDEOS.forEach((v) => {
            vidMap[v.id] = v;
          });
          set(videosRef, vidMap).catch(() => {});
        }
      },
      (error) => {
        console.warn('Videos listener error:', error);
      }
    );

    // Subscribe to cloud deleted orders list (permanently synchronizes deletions across all devices & browsers)
    const deletedOrdersRef = ref(rtdb, 'system/deletedOrderIds');
    const unsubDeletedOrders = onValue(deletedOrdersRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() || {};
        const ids = Object.keys(val);
        const local = getDeletedOrderIds();
        ids.forEach((id) => local.add(id));
        try {
          localStorage.setItem('sk_pizza_deleted_orders', JSON.stringify(Array.from(local)));
        } catch {}

        // 1. Immediately purge deleted orders from active React state across all browsers/tabs
        setOrders((prev) => prev.filter((o) => o && !local.has(o.id)));
        setMyOrders((prev) => prev.filter((o) => o && !local.has(o.id)));
        setActiveOrder((prev) => (prev && local.has(prev.id) ? null : prev));

        // 2. Clean all local storage order caches so they never persist or reappear
        try {
          const savedLocal = localStorage.getItem('sk_pizza_local_orders');
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            const cleaned = parsed.filter((o: any) => o && !local.has(o.id));
            localStorage.setItem('sk_pizza_local_orders', JSON.stringify(cleaned));
          }
          const savedMy = localStorage.getItem('sk_pizza_my_orders');
          if (savedMy) {
            const parsed = JSON.parse(savedMy);
            const cleaned = parsed.filter((o: any) => o && !local.has(o.id));
            localStorage.setItem('sk_pizza_my_orders', JSON.stringify(cleaned));
          }
          const activeOrdRaw = localStorage.getItem('sk_pizza_active_order');
          if (activeOrdRaw) {
            const parsedAct = JSON.parse(activeOrdRaw);
            if (parsedAct && local.has(parsedAct.id)) {
              localStorage.removeItem('sk_pizza_active_order');
            }
          }
        } catch {}
      }
    });

    // Subscribe to reviews (Real reviews only)
    const unsubReviews = onValue(
      reviewsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: Review[] = (Array.isArray(val)
            ? val.filter(Boolean)
            : Object.keys(val || {}).map((k) => val[k])
          ).filter((r: Review) => {
            if (!r || !r.id) return false;
            const dummyReviewIds = new Set(['rev-1', 'rev-2', 'rev-3', 'rev-demo-1', 'rev-demo-2']);
            return !dummyReviewIds.has(r.id) && !(r as any).isDemo;
          });
          setReviews(items);
        } else {
          setReviews([]);
        }
      },
      (error) => {
        console.warn('Reviews listener error:', error);
      }
    );

    // Subscribe to orders (Bidirectional Sync with safe normalization and deletion protection)
    const unsubOrders = onValue(
      ordersRef,
      (snapshot) => {
        const deletedIds = getDeletedOrderIds();
        let cloudItems: Order[] = [];
        if (snapshot.exists()) {
          const val = snapshot.val();
          const rawList = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.keys(val || {}).map((k) => val[k]);
          cloudItems = rawList
            .map(normalizeOrder)
            .filter((o): o is Order => o !== null && !deletedIds.has(o.id) && !isDemoRecord(o));
        }

        // Clean up any deleted orders from local storage and active states
        if (deletedIds.size > 0) {
          setMyOrders((prev) => prev.filter((o) => o && !deletedIds.has(o.id)));
          setActiveOrder((prev) => (prev && deletedIds.has(prev.id) ? null : prev));
          try {
            const savedLocal = localStorage.getItem('sk_pizza_local_orders');
            if (savedLocal) {
              const parsed: any[] = JSON.parse(savedLocal);
              const cleaned = parsed.filter((o) => o && !deletedIds.has(o.id));
              localStorage.setItem('sk_pizza_local_orders', JSON.stringify(cleaned));
            }
            const savedMy = localStorage.getItem('sk_pizza_my_orders');
            if (savedMy) {
              const parsed: any[] = JSON.parse(savedMy);
              const cleaned = parsed.filter((o) => o && !deletedIds.has(o.id));
              localStorage.setItem('sk_pizza_my_orders', JSON.stringify(cleaned));
            }
            const act = localStorage.getItem('sk_pizza_active_order');
            if (act) {
              const parsed = JSON.parse(act);
              if (parsed && deletedIds.has(parsed.id)) {
                localStorage.removeItem('sk_pizza_active_order');
              }
            }
          } catch {}
        }

        // Read local storage orders to merge safely
        let localOrders: Order[] = [];
        try {
          const savedLocal = localStorage.getItem('sk_pizza_local_orders');
          const savedMy = localStorage.getItem('sk_pizza_my_orders');
          const l1: any[] = savedLocal ? JSON.parse(savedLocal) : [];
          const l2: any[] = savedMy ? JSON.parse(savedMy) : [];
          localOrders = [...l1, ...l2]
            .map(normalizeOrder)
            .filter((o): o is Order => o !== null && !deletedIds.has(o.id) && !isDemoRecord(o));
        } catch {}

        // Build unified merged map: Cloud items are authoritative; recently created local orders are preserved
        const mergedMap = new Map<string, Order>();
        const nowMs = Date.now();
        localOrders.forEach((lo) => {
          if (lo && lo.id && !deletedIds.has(lo.id) && !isDemoRecord(lo)) {
            const age = nowMs - new Date(lo.createdAt).getTime();
            // Preserve orders created in the last 2 minutes that might still be syncing
            if (age < 2 * 60 * 1000) {
              mergedMap.set(lo.id, lo);
            }
          }
        });
        cloudItems.forEach((co) => {
          if (co && co.id && !deletedIds.has(co.id) && !isDemoRecord(co)) {
            mergedMap.set(co.id, co);
          }
        });

        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Save back to local storage
        try {
          localStorage.setItem('sk_pizza_local_orders', JSON.stringify(sorted.slice(0, 100)));
        } catch {}

        // Check for unaccepted pending orders created recently
        const pendingOrders = sorted.filter((o) => {
          const s = (o.status || '').toLowerCase().trim();
          return (s.includes('pending') || s.includes('received') || s === 'draft') && !isDemoRecord(o);
        });

        // Detect newly arrived orders or active pending orders for voice & audio alerts
        if (!initialOrdersLoadedRef.current) {
          initialOrdersLoadedRef.current = true;
          previousOrderIdsRef.current = new Set(sorted.map((o) => o.id));

          // If there is any unaccepted pending order when admin opens, sound continuous alarm ONLY for admin!
          const isAdminActive =
            isAdminRef.current ||
            (typeof window !== 'undefined' && (
              localStorage.getItem('sk_pizza_admin_session') === 'true' ||
              sessionStorage.getItem('sk_pizza_admin_session') === 'true' ||
              window.location.hash.includes('admin') ||
              window.location.pathname.includes('admin')
            ));

          if (isAdminActive && pendingOrders.length > 0) {
            const newest = pendingOrders[0];
            const ageMs = nowMs - new Date(newest.createdAt).getTime();
            if (ageMs < 60 * 60 * 1000 && acknowledgedAlarmOrderIdRef.current !== newest.id) {
              setLatestAlertOrder(newest);
              soundAlerts.startContinuousOrderAlarm({
                id: newest.id,
                customerName: newest.customerName,
                amount: newest.finalTotal,
              });
              showToast(`🚨 Action Required: Pending Order #${newest.id} (${newest.customerName})`, 'info');
            }
          }
        } else {
          const freshOrders = sorted.filter((o) => !previousOrderIdsRef.current.has(o.id));
          if (freshOrders.length > 0) {
            freshOrders.forEach((o) => previousOrderIdsRef.current.add(o.id));
            const newest = freshOrders[0];
            acknowledgedAlarmOrderIdRef.current = null;

            // Only trigger loud siren alarm and desktop push notification if user is Admin!
            const isAdminActive =
              isAdminRef.current ||
              (typeof window !== 'undefined' && (
                localStorage.getItem('sk_pizza_admin_session') === 'true' ||
                sessionStorage.getItem('sk_pizza_admin_session') === 'true' ||
                window.location.hash.includes('admin') ||
                window.location.pathname.includes('admin')
              ));

            if (isAdminActive) {
              setLatestAlertOrder(newest);
              soundAlerts.startContinuousOrderAlarm({
                id: newest.id,
                customerName: newest.customerName,
                amount: newest.finalTotal,
              });
              showToast(`🔔 New Order! #${newest.id} from ${newest.customerName} (₹${newest.finalTotal})`, 'success');

              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification('🍕 New SK Pizza Point Order!', {
                    body: `Order #${newest.id} from ${newest.customerName} for ₹${newest.finalTotal}`,
                    icon: '/favicon.ico',
                  });
                } catch {}
              }
            }
          }
        }

        setOrders(sorted);
      },
      (error) => {
        console.warn('Orders listener error:', error);
      }
    );

    // Instant Sub-second Child Order Listener: fires immediately when any order is created
    const unsubChildOrders = onChildAdded(query(ordersRef, limitToLast(25)), (snapshot) => {
      if (!snapshot.exists()) return;
      const raw = snapshot.val();
      const order = normalizeOrder(raw);
      if (!order || isDemoRecord(order) || getDeletedOrderIds().has(order.id)) return;

      if (!previousOrderIdsRef.current.has(order.id)) {
        previousOrderIdsRef.current.add(order.id);

        setOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const s = (order.status || '').toLowerCase().trim();
        const isPending = s.includes('pending') || s.includes('received') || s === 'draft';
        const isRecent = Date.now() - new Date(order.createdAt).getTime() < 30 * 60 * 1000;

        const isAdminActive =
          isAdminRef.current ||
          (typeof window !== 'undefined' && (
            localStorage.getItem('sk_pizza_admin_session') === 'true' ||
            sessionStorage.getItem('sk_pizza_admin_session') === 'true' ||
            window.location.hash.includes('admin') ||
            window.location.pathname.includes('admin')
          ));

        if (isPending && isRecent && isAdminActive) {
          setLatestAlertOrder(order);
          soundAlerts.startContinuousOrderAlarm({
            id: order.id,
            customerName: order.customerName,
            amount: order.finalTotal,
          });
          showToast(`🚨 Instant Order Alert: #${order.id} from ${order.customerName} (₹${order.finalTotal})`, 'success');

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('🍕 New SK Pizza Point Order!', {
                body: `Order #${order.id} from ${order.customerName} for ₹${order.finalTotal}`,
                icon: 'https://i.imgur.com/x7VzA1Q.jpeg',
              });
            } catch {}
          }
        }
      }
    });

    // Subscribe to broadcasts
    const broadcastsRef = ref(rtdb, 'broadcasts');
    const unsubBroadcasts = onValue(broadcastsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const items: BroadcastNotification[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => val[k]);
        const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBroadcasts(sorted);

        // Find active broadcast
        const active = sorted.find((b) => b.isActive);
        if (active) {
          const isDismissed =
            typeof window !== 'undefined' && sessionStorage.getItem(`dismissed_broadcast_${active.id}`);
          if (!isDismissed) {
            setActiveBroadcast(active);
            if (!initialBroadcastsLoadedRef.current) {
              initialBroadcastsLoadedRef.current = true;
            } else {
              soundAlerts.playNotificationPing();
            }
          }
        } else {
          setActiveBroadcast(null);
        }
      } else {
        setBroadcasts([]);
        setActiveBroadcast(null);
      }
    });

    // Connection monitor & Reconnect keep-alive
    const connectedRef = ref(rtdb, '.info/connected');
    const unsubConnected = onValue(connectedRef, (snap) => {
      const isConnected = !!snap.val();
      setIsCloudDbConnected(isConnected);
    });

    const handleWakeup = () => {
      try {
        goOnline(rtdb);
      } catch {}
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWakeup);
      window.addEventListener('online', handleWakeup);
      (window as any).onAndroidResume = handleWakeup;
    }

    // Smart 8-second polling fallback: Guarantees zero missed orders even if WebSocket sleeps in WebView
    const pollTimer = setInterval(async () => {
      const isAdminActive =
        isAdminRef.current ||
        (typeof window !== 'undefined' && (
          localStorage.getItem('sk_pizza_admin_session') === 'true' ||
          sessionStorage.getItem('sk_pizza_admin_session') === 'true' ||
          window.location.hash.includes('admin') ||
          window.location.pathname.includes('admin')
        ));

      if (isAdminActive) {
        try {
          const snap = await get(query(ref(rtdb, 'orders'), limitToLast(20)));
          if (snap.exists()) {
            const val = snap.val();
            const rawList = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
            const deletedIds = getDeletedOrderIds();
            const fetched = rawList
              .map(normalizeOrder)
              .filter((o): o is Order => o !== null && !deletedIds.has(o.id) && !isDemoRecord(o));

            setOrders((prev) => {
              const map = new Map<string, Order>();
              prev.forEach((o) => map.set(o.id, o));
              let hasNew = false;
              fetched.forEach((fo) => {
                if (!map.has(fo.id)) {
                  map.set(fo.id, fo);
                  hasNew = true;
                  const s = (fo.status || '').toLowerCase().trim();
                  if (s.includes('pending') || s.includes('received') || s === 'draft') {
                    soundAlerts.startContinuousOrderAlarm({
                      id: fo.id,
                      customerName: fo.customerName,
                      amount: fo.finalTotal,
                    });
                  }
                }
              });
              if (!hasNew) return prev;
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        } catch {}
      }
    }, 8000);

    return () => {
      unsubProducts();
      unsubSettings();
      unsubGallery();
      unsubVideos();
      unsubReviews();
      unsubDeletedOrders();
      unsubOrders();
      unsubChildOrders();
      unsubBroadcasts();
      unsubConnected();
      clearInterval(pollTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWakeup);
        window.removeEventListener('online', handleWakeup);
      }
    };
  }, []);

  // Auto-sync pending offline orders as soon as network reconnects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncOfflineOrders = async () => {
      try {
        const raw = localStorage.getItem('sk_pizza_pending_sync_orders');
        if (!raw) return;
        const list: Order[] = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) return;
        const remaining: Order[] = [];
        for (const ord of list) {
          try {
            await set(ref(rtdb, `orders/${ord.id}`), sanitizeForFirebase(ord));
          } catch {
            remaining.push(ord);
          }
        }
        localStorage.setItem('sk_pizza_pending_sync_orders', JSON.stringify(remaining));
      } catch {}
    };

    window.addEventListener('online', syncOfflineOrders);
    syncOfflineOrders();
    return () => window.removeEventListener('online', syncOfflineOrders);
  }, []);

  // Helper: Seed all default data to Cloud
  const syncInitialDataToCloud = useCallback(async () => {
    try {
      const prodMap: Record<string, Product> = {};
      INITIAL_PRODUCTS.forEach((p) => (prodMap[p.id] = p));
      await set(ref(rtdb, 'products'), prodMap);

      await set(ref(rtdb, 'settings'), INITIAL_SETTINGS);

      const galMap: Record<string, GalleryItem> = {};
      INITIAL_GALLERY.forEach((g) => (galMap[g.id] = g));
      await set(ref(rtdb, 'gallery'), galMap);

      const vidMap: Record<string, VideoItem> = {};
      INITIAL_VIDEOS.forEach((v) => (vidMap[v.id] = v));
      await set(ref(rtdb, 'videos'), vidMap);

      const revMap: Record<string, Review> = {};
      INITIAL_REVIEWS.forEach((r) => (revMap[r.id] = r));
      await set(ref(rtdb, 'reviews'), revMap);

      showToast('Firebase Cloud Database seeded with official SK Pizza Point items!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      showToast(`Cloud Sync error: ${msg}`, 'error');
    }
  }, [showToast]);

  // Translate Firebase Auth error codes into friendly user messages
  const getAuthErrorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      switch (code) {
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/user-disabled':
          return 'This account has been disabled by the administrator.';
        case 'auth/user-not-found':
          return 'No account found with this email. Please check or register a new account.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Incorrect password or email credentials. Please check and try again.';
        case 'auth/email-already-in-use':
          return 'An account with this email address already exists. Please sign in instead.';
        case 'auth/weak-password':
          return 'Password must be at least 6 characters long.';
        case 'auth/too-many-requests':
          return 'Access temporarily blocked due to many failed attempts. Please try again later or reset password.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection.';
        default:
          return (error as { message?: string }).message || 'Authentication error. Please try again.';
      }
    }
    return 'An unexpected error occurred during authentication.';
  };

  // Customer Authentication: Register
  const registerCustomer = useCallback(
    async (
      email: string,
      pass: string,
      displayName?: string,
      phone?: string,
      address?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        const user = credential.user;

        if (displayName) {
          await updateProfile(user, { displayName: displayName.trim() });
        }

        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: displayName?.trim() || user.email?.split('@')[0] || 'Customer',
          phone: phone?.trim() || '',
          defaultAddress: address?.trim() || '',
          createdAt: new Date().toISOString(),
        };

        await set(ref(rtdb, `users/${user.uid}`), profile);
        setUserProfile(profile);

        // Dual storage: LocalStorage + Firebase RTDB
        try {
          localStorage.setItem('sk_pizza_user_profile', JSON.stringify(profile));
          localStorage.setItem(
            'sk_pizza_cached_auth',
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: profile.displayName,
            })
          );
        } catch {}

        showToast(`Welcome, ${profile.displayName}! Account created.`, 'success');
        return { success: true };
      } catch (err: unknown) {
        const msg = getAuthErrorMessage(err);
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    },
    [showToast]
  );

  // Customer Authentication: Login
  const loginCustomer = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
        showToast(`Signed in as ${res.user.email}`, 'success');
        return { success: true };
      } catch (err: unknown) {
        const msg = getAuthErrorMessage(err);
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    },
    [showToast]
  );

  // Separate Admin Login with strict UID authorization check
  const loginAdminWithFirebase = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
        const uid = res.user.uid;

        // Authoritative verification against AUTHORIZED_ADMIN_UID or owner email
        if (!isUserAdmin(uid, res.user.email)) {
          // Normal customer signed in at admin login
          showToast('Admin access required. This account is not authorized as administrator.', 'error');
          return {
            success: false,
            error: `Admin access denied. Account (${res.user.email || uid.slice(0, 8)}) is not authorized as administrator.`,
          };
        }

        try {
          sessionStorage.setItem('sk_pizza_admin_session', 'true');
          localStorage.setItem('sk_pizza_admin_session', 'true');
        } catch {}
        setIsPasscodeAdmin(true);

        showToast('Authorized Administrator logged in to Admin Studio.', 'success');
        return { success: true };
      } catch (err: unknown) {
        const msg = getAuthErrorMessage(err);
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    },
    [showToast]
  );

  // Password reset
  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        showToast(`Password reset link sent to ${email}. Check your inbox.`, 'success');
        return { success: true };
      } catch (err: unknown) {
        const msg = getAuthErrorMessage(err);
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    },
    [showToast]
  );

  // Quick Passcode Admin Login (For Restaurant Mobile / APK / Owner quick access)
  const loginAdminWithPasscode = useCallback(
    (passcode: string): boolean => {
      const target = (settings.adminPasscode || 'admin123').trim();
      const entered = passcode.trim();
      if (entered === target) {
        setIsPasscodeAdmin(true);
        try {
          sessionStorage.setItem('sk_pizza_admin_session', 'true');
          localStorage.setItem('sk_pizza_admin_session', 'true');
        } catch {}
        showToast('Admin Studio Passcode Verified!', 'success');
        return true;
      }
      showToast('Incorrect Admin Passcode. Please try again.', 'error');
      return false;
    },
    [settings.adminPasscode, showToast]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsPasscodeAdmin(false);
      try {
        sessionStorage.removeItem('sk_pizza_admin_session');
      } catch {}
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      showToast('You have been signed out.', 'info');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logout failed';
      showToast(msg, 'error');
    }
  }, [navigate, showToast]);

  // Update customer profile
  const updateCustomerProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<boolean> => {
      if (!currentUser) return false;
      try {
        await update(ref(rtdb, `users/${currentUser.uid}`), data);
        const updated = (prev: UserProfile | null) => (prev ? { ...prev, ...data } : { uid: currentUser.uid, email: currentUser.email || '', ...data });
        setUserProfile((prev) => {
          const next = updated(prev);
          try {
            localStorage.setItem('sk_pizza_user_profile', JSON.stringify(next));
          } catch {}
          return next;
        });
        if (data.displayName && auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.displayName }).catch(() => {});
        }
        showToast('Profile details saved to cloud and local storage!', 'success');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not save profile';
        showToast(`Profile update error: ${msg}`, 'error');
        return false;
      }
    },
    [currentUser, showToast]
  );

  // Cart Math
  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const addOnsTotal = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
      return total + (item.unitPrice + addOnsTotal) * item.quantity;
    }, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (!settings.isDeliveryAvailable) return 0;
    const baseFee = Number(settings.deliveryFee) || 0;
    if (
      settings.freeDeliveryThreshold &&
      settings.freeDeliveryThreshold > 0 &&
      subtotal >= settings.freeDeliveryThreshold
    ) {
      return 0;
    }
    return baseFee;
  }, [settings.isDeliveryAvailable, settings.deliveryFee, settings.freeDeliveryThreshold, subtotal]);

  const discount = useMemo(() => 0, []);

  const finalTotal = useMemo(() => {
    return subtotal + deliveryFee - discount;
  }, [subtotal, deliveryFee, discount]);

  // Cart Operations
  const addToCart = useCallback(
    (
      product: Product,
      size: PizzaSize | 'Standard',
      quantity = 1,
      addOns: AddOn[] = [],
      instructions = ''
    ) => {
      if (!product.isAvailable) {
        showToast(`${product.name} is currently out of stock`, 'error');
        return;
      }

      const sizeOption = product.sizes.find((s) => s.size === size) || product.sizes[0];
      const unitPrice = sizeOption ? sizeOption.price : 0;

      const addOnIds = addOns.map((a) => a.id).sort().join('-');
      const itemInstanceId = `${product.id}_${size}_${addOnIds}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === itemInstanceId);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += quantity;
          return updated;
        }
        return [
          ...prev,
          {
            id: itemInstanceId,
            productId: product.id,
            productName: product.name,
            category: product.category,
            imageUrl: product.imageUrl,
            selectedSize: size,
            unitPrice,
            quantity,
            selectedAddOns: addOns,
            specialInstructions: instructions,
          },
        ];
      });

      showToast(`Added ${quantity}x ${product.name} (${size}) to cart!`, 'success');
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== itemId);
      }
      return prev.map((item) => (item.id === itemId ? { ...item, quantity } : item));
    });
  }, []);

  const updateCartItemSize = useCallback(
    (itemId: string, newSize: PizzaSize | 'Standard') => {
      setCart((prev) => {
        return prev.map((item) => {
          if (item.id !== itemId) return item;
          const product = products.find((p) => p.id === item.productId);
          if (!product) return item;
          const sizeObj = product.sizes.find((s) => s.size === newSize);
          if (!sizeObj) return item;

          return {
            ...item,
            selectedSize: newSize,
            unitPrice: sizeObj.price,
          };
        });
      });
    },
    [products]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      setCart((prev) => prev.filter((item) => item.id !== itemId));
      showToast('Item removed from cart', 'info');
    },
    [showToast]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Unique Order ID generator: SKP-YYYYMMDD-XXXXXX
  const generateOrderId = useCallback((): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
    return `SKP-${year}${month}${day}-${randomHex}`;
  }, []);

  // Create Order with Real-Time Cloud Price Verification and Firebase RTDB Write
  const createOrder = useCallback(
    async (customer: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      orderType: 'delivery' | 'pickup';
      deliveryAddress?: string;
      city?: string;
      pinCode?: string;
      instructions?: string;
      customerLocation?: LiveLocation;
      paymentStatus?: 'Pending' | 'Cash on Delivery' | 'Paid Online' | 'Verified';
    }): Promise<Order> => {
      const orderId = generateOrderId();
      const now = new Date().toISOString();

      // Recalculate and freeze current prices from trusted live product catalog
      const itemsSnapshot = cart.map((cartItem) => {
        const prod = products.find((p) => p.id === cartItem.productId);
        const sizeObj = prod?.sizes.find((s) => s.size === cartItem.selectedSize);
        const verifiedUnitPrice = sizeObj ? sizeObj.price : cartItem.unitPrice;
        const addOnsPrice = cartItem.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
        const total = (verifiedUnitPrice + addOnsPrice) * cartItem.quantity;

        return {
          productId: cartItem.productId,
          productName: cartItem.productName,
          category: cartItem.category,
          imageUrl: cartItem.imageUrl || prod?.imageUrl,
          size: cartItem.selectedSize,
          quantity: cartItem.quantity,
          unitPrice: verifiedUnitPrice,
          totalPrice: total,
          addOns: cartItem.selectedAddOns.map((a) => a.name),
        };
      });

      const orderSubtotal = itemsSnapshot.reduce((acc, item) => acc + item.totalPrice, 0);
      const isFreeDelivery =
        settings.freeDeliveryThreshold &&
        settings.freeDeliveryThreshold > 0 &&
        orderSubtotal >= settings.freeDeliveryThreshold;
      const orderFee = customer.orderType === 'delivery' ? (isFreeDelivery ? 0 : Number(settings.deliveryFee) || 0) : 0;
      const orderFinal = orderSubtotal + orderFee;

      const newOrder: Order = {
        id: orderId,
        userId: currentUser ? currentUser.uid : 'guest',
        customerEmail: customer.customerEmail || currentUser?.email || '',
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        orderType: customer.orderType,
        deliveryAddress: customer.deliveryAddress || '',
        city: customer.city || '',
        pinCode: customer.pinCode || '',
        instructions: customer.instructions || '',
        items: itemsSnapshot,
        subtotal: orderSubtotal,
        deliveryFee: orderFee,
        discount: 0,
        finalTotal: orderFinal,
        paymentMode: 'Pay on Delivery / WhatsApp Confirmation',
        paymentStatus: customer.paymentStatus || 'Pending',
        status: 'Pending',
        customerLocation: customer.customerLocation || undefined,
        createdAt: now,
        updatedAt: now,
      };

      // Immediate responsive state update
      setActiveOrder(newOrder);
      try {
        localStorage.setItem('sk_pizza_active_order', JSON.stringify(newOrder));
      } catch {}

      setMyOrders((prev) => {
        const next = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
        try {
          localStorage.setItem('sk_pizza_my_orders', JSON.stringify(next.slice(0, 50)));
        } catch {}
        return next;
      });
      setOrders((prev) => {
        const next = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
        try {
          localStorage.setItem('sk_pizza_local_orders', JSON.stringify(next.slice(0, 100)));
        } catch {}
        return next;
      });
      clearCart();

      // Fast write to Firebase Realtime Database with guaranteed sanitation (no undefined values)
      const sanitized = sanitizeForFirebase(newOrder);
      try {
        const cloudWrites: Promise<any>[] = [
          set(ref(rtdb, `orders/${newOrder.id}`), sanitized),
        ];

        if (currentUser) {
          cloudWrites.push(
            set(ref(rtdb, `userOrders/${currentUser.uid}/${newOrder.id}`), sanitized)
          );
          if (customer.customerPhone || customer.deliveryAddress) {
            cloudWrites.push(
              update(
                ref(rtdb, `users/${currentUser.uid}`),
                sanitizeForFirebase({
                  phone: customer.customerPhone || null,
                  defaultAddress: customer.deliveryAddress || null,
                  city: customer.city || null,
                  pinCode: customer.pinCode || null,
                })
              ).catch(() => {})
            );
          }
        }

        // Fire & forget push notification to admin devices (Android APK & Web Admin)
        sendOrderPushNotification(newOrder).catch((e) => {
          console.warn('Background push notification notice:', e);
        });

        // Fast race: wait max 1.5s so user UI completes instantaneously
        await Promise.race([
          Promise.all(cloudWrites),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch (err: unknown) {
        console.warn('Background order sync alert, queued locally:', err);
        try {
          const rawPending = localStorage.getItem('sk_pizza_pending_sync_orders');
          const list: Order[] = rawPending ? JSON.parse(rawPending) : [];
          if (!list.some((o) => o.id === newOrder.id)) {
            list.push(newOrder);
            localStorage.setItem('sk_pizza_pending_sync_orders', JSON.stringify(list));
          }
        } catch {}
      }

      return newOrder;
    },
    [cart, generateOrderId, products, settings.deliveryFee, clearCart, currentUser, showToast]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const currentOrd = orders.find((o) => o.id === orderId);

      // Check if order is completed and locked (cannot revert after 10 minutes)
      if (currentOrd && isOrderLocked(currentOrd) && status !== 'Completed' && status !== 'Delivered') {
        showToast('⚠️ This order was completed more than 10 minutes ago and cannot be changed back.', 'error');
        return;
      }

      const now = new Date().toISOString();
      const isCompleting = status === 'Completed' || status === 'Delivered';
      const completedAtTime = isCompleting ? (currentOrd?.completedAt || now) : undefined;

      const orderPatch: Partial<Order> = {
        status,
        updatedAt: now,
      };
      if (isCompleting && !currentOrd?.completedAt) {
        orderPatch.completedAt = completedAtTime;
      }

      // If completing order, stop rider GPS watcher and schedule live location shutdown after 10m
      if (isCompleting) {
        if (activeRiderWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(activeRiderWatchIdRef.current);
          activeRiderWatchIdRef.current = null;
        }

        setTimeout(() => {
          try {
            update(ref(rtdb, `orders/${orderId}`), { deliveryRiderActive: false }).catch(() => {});
            set(ref(rtdb, 'system/adminLiveLocation'), null).catch(() => {});
          } catch {}
        }, 10 * 60 * 1000);
      }

      // 1. Optimistic local state update
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, ...orderPatch } : o));
        try { localStorage.setItem('sk_pizza_local_orders', JSON.stringify(next.slice(0, 100))); } catch {}
        return next;
      });
      setMyOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, ...orderPatch } : o));
        try { localStorage.setItem('sk_pizza_my_orders', JSON.stringify(next.slice(0, 50))); } catch {}
        return next;
      });

      // 2. Direct real-time cloud sync to Realtime Database
      try {
        const rtdbPayload: Record<string, any> = {
          status,
          updatedAt: now,
        };
        if (completedAtTime) {
          rtdbPayload.completedAt = completedAtTime;
        }

        await update(ref(rtdb, `orders/${orderId}`), rtdbPayload);

        if (currentOrd?.userId && currentOrd.userId !== 'guest') {
          await update(ref(rtdb, `userOrders/${currentOrd.userId}/${orderId}`), rtdbPayload).catch(() => {});
        }
        showToast(`Order #${orderId} moved to "${status}"`, 'success');
      } catch (err: unknown) {
        console.warn('Direct RTDB update error, attempting fallback:', err);
        try {
          await updateCloudRecord('orders', orderId, {
            status,
            updatedAt: now,
            ...(completedAtTime ? { completedAt: completedAtTime } : {}),
          });
          showToast(`Order #${orderId} moved to "${status}"`, 'success');
        } catch {
          showToast(`Order updated locally to "${status}"`, 'info');
        }
      }
    },
    [orders, updateCloudRecord, showToast]
  );

  const updateOrderLocation = useCallback(
    async (orderId: string, location: LiveLocation, isRider: boolean = false) => {
      const field = isRider ? 'deliveryRiderLocation' : 'customerLocation';
      const updates: Record<string, any> = {
        [field]: location,
        updatedAt: new Date().toISOString(),
      };
      if (isRider) {
        updates.deliveryRiderActive = true;
      }

      setOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
        try { localStorage.setItem('sk_pizza_local_orders', JSON.stringify(next.slice(0, 100))); } catch {}
        return next;
      });
      setMyOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
        try { localStorage.setItem('sk_pizza_my_orders', JSON.stringify(next.slice(0, 50))); } catch {}
        return next;
      });

      try {
        await update(ref(rtdb, `orders/${orderId}`), updates);
        const currentOrd = orders.find((o) => o.id === orderId);
        if (currentOrd?.userId && currentOrd.userId !== 'guest') {
          await update(ref(rtdb, `userOrders/${currentOrd.userId}/${orderId}`), updates).catch(() => {});
        }
      } catch (err) {
        console.warn('Direct RTDB updateOrderLocation error, attempting fallback:', err);
        try {
          await updateCloudRecord('orders', orderId, updates);
        } catch {}
      }
    },
    [orders, updateCloudRecord]
  );

  const updateOrderPaymentStatus = useCallback(
    async (
      orderId: string,
      paymentStatus: 'Pending' | 'Cash on Delivery' | 'Paid Online' | 'Verified'
    ) => {
      const updates = {
        paymentStatus,
        updatedAt: new Date().toISOString(),
      };
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
        try { localStorage.setItem('sk_pizza_local_orders', JSON.stringify(next.slice(0, 100))); } catch {}
        return next;
      });
      setMyOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
        try { localStorage.setItem('sk_pizza_my_orders', JSON.stringify(next.slice(0, 50))); } catch {}
        return next;
      });
      try {
        await updateCloudRecord('orders', orderId, updates);
        showToast(`Payment status updated to "${paymentStatus}"`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        showToast(`Failed to update payment status: ${msg}`, 'error');
      }
    },
    [updateCloudRecord, showToast]
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      // 1. Permanently record deletion in deletedOrderIds so it never resurrects
      markOrderAsDeleted(orderId);

      const currentOrd = orders.find((o) => o.id === orderId);

      // 2. Optimistic local state update
      setOrders((prev) => {
        const next = prev.filter((o) => o.id !== orderId);
        try {
          localStorage.setItem('sk_pizza_local_orders', JSON.stringify(next.slice(0, 100)));
        } catch {}
        return next;
      });

      setMyOrders((prev) => {
        const next = prev.filter((o) => o.id !== orderId);
        try {
          localStorage.setItem('sk_pizza_my_orders', JSON.stringify(next.slice(0, 50)));
        } catch {}
        return next;
      });

      // 3. Remove directly from Firebase Realtime Database
      try {
        await remove(ref(rtdb, `orders/${orderId}`));
      } catch (e) {
        console.warn('RTDB direct remove error:', e);
      }

      try {
        await removeCloudRecord('orders', orderId).catch(() => {});
      } catch (e) {
        console.warn('removeCloudRecord error:', e);
      }

      // 4. Also remove from userOrders
      try {
        if (currentOrd?.userId && currentOrd.userId !== 'guest') {
          await remove(ref(rtdb, `userOrders/${currentOrd.userId}/${orderId}`)).catch(() => {});
          await removeCloudRecord(`userOrders/${currentOrd.userId}`, orderId).catch(() => {});
        }
      } catch {}

      showToast(`Order #${orderId} deleted permanently`, 'info');
    },
    [orders, removeCloudRecord, showToast]
  );

  // Real-time Push Broadcast Methods
  const sendBroadcastNotification = useCallback(
    async (broadcastData: {
      title: string;
      message: string;
      type: 'offer' | 'update' | 'urgent';
      link?: string;
      badge?: string;
    }) => {
      const id = `bc-${Date.now()}`;
      const newBroadcast: BroadcastNotification = {
        ...broadcastData,
        id,
        createdAt: new Date().toISOString(),
        isActive: true,
        sentBy: currentUser?.email || 'admin',
      };

      try {
        await set(ref(rtdb, `broadcasts/${id}`), newBroadcast);
        soundAlerts.playNotificationPing();
        showToast('🚀 Push notification broadcast sent to all users live!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send broadcast';
        showToast(`Broadcast failed: ${msg}`, 'error');
      }
    },
    [currentUser, showToast]
  );

  const deleteBroadcastNotification = useCallback(
    async (id: string) => {
      try {
        await remove(ref(rtdb, `broadcasts/${id}`));
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        if (activeBroadcast?.id === id) {
          setActiveBroadcast(null);
        }
        showToast('Broadcast notification deleted', 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete';
        showToast(`Error: ${msg}`, 'error');
      }
    },
    [activeBroadcast, showToast]
  );

  const dismissActiveBroadcast = useCallback(
    (id?: string) => {
      const targetId = id || activeBroadcast?.id;
      if (targetId && typeof window !== 'undefined') {
        sessionStorage.setItem(`dismissed_broadcast_${targetId}`, 'true');
      }
      setActiveBroadcast(null);
    },
    [activeBroadcast]
  );

  // Sound Alerts helpers
  const toggleSoundMute = useCallback(() => {
    const muted = soundAlerts.toggleMute();
    setIsSoundMuted(muted);
    showToast(muted ? '🔇 Voice Alert Muted' : '🔔 Loud Voice Alert Enabled', 'info');
  }, [showToast]);

  const testOrderAlertSound = useCallback(() => {
    soundAlerts.testAlarm();
    showToast('🚨 Siren Test Started! (Continuous Loud Siren & Vibration)', 'info');
  }, [showToast]);

  const dismissOrderAlert = useCallback(() => {
    soundAlerts.stopContinuousAlarm();
    setLatestAlertOrder(null);
  }, []);

  const stopContinuousAlarm = useCallback(() => {
    soundAlerts.stopContinuousAlarm();
  }, []);

  // WhatsApp pre-filled message generator with Live GPS Link, System Tracker Link, and Store Google Maps Link
  const generateWhatsAppUrl = useCallback(
    (order: Order): string => {
      const itemsList = (order.items || [])
        .map((item) => {
          const addOns = Array.isArray(item.addOns) ? item.addOns : [];
          const addOnText = addOns.length > 0 ? ` (+${addOns.join(', ')})` : '';
          return `• ${item.productName || 'Pizza'} — ${item.size || 'Regular'} × ${item.quantity || 1} — ₹${item.totalPrice || 0}${addOnText}`;
        })
        .join('\n');

      const deliveryText =
        order.orderType === 'delivery'
          ? order.deliveryFee > 0
            ? `₹${order.deliveryFee}`
            : settings.deliveryFeeNote || 'To be confirmed'
          : '₹0 (Self Pickup)';

      const addressSection =
        order.orderType === 'delivery' && order.deliveryAddress
          ? `\n📍 *Delivery Address:* ${order.deliveryAddress}${order.city ? ', ' + order.city : ''}${order.pinCode ? ' - ' + order.pinCode : ''}`
          : '';

      const locationSection =
        order.customerLocation?.latitude && order.customerLocation?.longitude
          ? `\n📍 *Customer Live GPS Location (Google Maps):* https://www.google.com/maps?q=${order.customerLocation.latitude},${order.customerLocation.longitude}\n(GPS Coordinates: ${order.customerLocation.latitude.toFixed(6)}, ${order.customerLocation.longitude.toFixed(6)}${order.customerLocation.accuracy ? ` | Accuracy: ±${Math.round(order.customerLocation.accuracy)}m` : ''})${order.customerLocation.addressText ? `\n(Pinned Area: ${order.customerLocation.addressText})` : ''}`
          : '';

      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://sk-pizza-point.web.app';

      const trackerSection = `\n🗺️ *Live Order & GPS Tracker Link:* ${origin}/#track-${order.id}`;

      const storeLocationUrl =
        settings.googleMapsUrl || 'https://maps.app.goo.gl/ahwPDzJqRtSEXVYb8?g_st=ac';
      const storeSection = `\n🏪 *SK Pizza Point Store Location:* ${storeLocationUrl}`;

      const instructionsSection = order.instructions ? `\nInstructions: ${order.instructions}` : '';

      const rawMessage = `*SK PIZZA POINT — NEW ORDER*

*Order ID:* ${order.id}
*Customer Name:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Order Type:* ${order.orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}${addressSection}${locationSection}${trackerSection}${storeSection}

*Items:*
${itemsList}

*Subtotal:* ₹${order.subtotal}
*Delivery:* ${deliveryText}
*Discount:* ₹${order.discount}
*Total:* ₹${order.finalTotal}${instructionsSection}

_Please confirm this order and its preparation status._`;

      let cleanPhone = (settings.whatsAppNumber || '+919617142439').replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      }
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;
    },
    [settings.whatsAppNumber, settings.deliveryFeeNote, settings.googleMapsUrl]
  );

  // Generate 1-click status update WhatsApp notification for the customer
  const generateCustomerStatusWhatsAppUrl = useCallback(
    (order: Order, newStatus: OrderStatus): string => {
      let statusMsg = '';
      const orderId = order.id;
      const customerName = order.customerName || 'Valued Customer';
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://sk-pizza-point.web.app';
      const trackLink = `${origin}/#live-track-${orderId}`;
      const storeLocationUrl =
        settings.googleMapsUrl || 'https://maps.app.goo.gl/ahwPDzJqRtSEXVYb8?g_st=ac';
      const reviewLink = `${origin}/#reviews`;

      const itemsSummary = (order.items || [])
        .map((it) => `${it.productName} (${it.size}×${it.quantity})`)
        .join(', ');

      if (newStatus === 'Preparing') {
        statusMsg = `🍕 *SK PIZZA POINT — ORDER ACCEPT HO GAYA HAI!*\n\nNamaste *${customerName}*!\nAapka SK Pizza Point par order *#${orderId}* accept kar liya gaya hai! ✅\n\n🍕 *Aapka Order:*\n${itemsSummary}\n\n💰 *Bill Amount:* ₹${order.finalTotal}\n📍 *Delivery Address:* ${order.deliveryAddress || 'Store Counter'}\n\nHamari kitchen me aapka pizza fresh bake hona shuru ho gaya hai. Jaldi hi pickup aur delivery ke liye ready ho jayega!\n\n🗺️ *Live Order Status Track Link:*\n${trackLink}\n\nDhanyawad!\n*SK Pizza Point* 🍕`;
      } else if (newStatus === 'Out for delivery') {
        const riderGps =
          order.deliveryRiderLocation?.latitude && order.deliveryRiderLocation?.longitude
            ? `\n🛵 *Delivery Boy Live GPS Location:*\nhttps://www.google.com/maps?q=${order.deliveryRiderLocation.latitude},${order.deliveryRiderLocation.longitude}\n`
            : '';
        statusMsg = `🛵 *SK PIZZA POINT — ORDER PICKUP HO GAYA HAI!*\n\nNamaste *${customerName}*!\nAapka order *#${orderId}* (${itemsSummary}) kitchen se pickup ho gaya hai aur delivery partner aapke address ke liye nikal chuka hai! 🚀\n\n🗺️ *LIVE MAP TRACKING LINK:*\n${trackLink}\n${riderGps}\nUpar diye gaye Map link par click karke aap Delivery Boy ki live location aur route real-time me track kar sakte hain!\nRider jaldi hi aapke paas pahunch raha hai. Kripya apna phone active rakhein.\n\nDhanyawad!\n*SK Pizza Point* 🍕`;
      } else if (newStatus === 'Ready for Pickup') {
        statusMsg = `🛍️ *SK PIZZA POINT — ORDER READY FOR PICKUP!*\n\nNamaste *${customerName}*!\nAapka order *#${orderId}* (${itemsSummary}) counter par pickup ke liye ready hai!\nAap store par aakar apna fresh pizza collect kar sakte hain.\n\n🏪 Store Location: ${storeLocationUrl}\n🗺️ Order Details: ${trackLink}\n\nDhanyawad, SK Pizza Point! 🍕`;
      } else if (newStatus === 'Delivered') {
        statusMsg = `🎉 *SK PIZZA POINT — ORDER DELIVERED!*\n\nNamaste *${customerName}*!\nAapka order *#${orderId}* successfully deliver ho gaya hai! ✅\n\nSK Pizza Point choose karne ke liye aapka bahut-bahut dhanyawad! Hum ummeed karte hain ki aapko humara pizza pasand aaya hoga. 🍕❤️\n\n⭐ *Apna review zaroor dein:*\n${reviewLink}\n\nAgli baar fir milte hain!\n*SK Pizza Point*`;
      } else if (newStatus === 'Cancelled') {
        statusMsg = `Hello ${customerName}.\nAapka order *#${orderId}* cancel kar diya gaya hai.\nAap kisi bhi query ke liye humein call ya message kar sakte hain: ${settings.whatsAppNumber || '+919617142439'}.\n🏪 Store Location: ${storeLocationUrl}`;
      } else {
        statusMsg = `Namaste ${customerName}!\nAapke order *#${orderId}* ka status update ho gaya hai: *${newStatus}*.\nLive map track yahan karein: ${trackLink}\n🏪 SK Pizza Point: ${storeLocationUrl}`;
      }

      let cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      }
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(statusMsg)}`;
    },
    [settings.whatsAppNumber, settings.googleMapsUrl]
  );

  // Accept order with live location broadcast (Stops alarm, updates status, requests Admin GPS, streams live to customer)
  const acceptOrderWithLiveLocation = useCallback(
    async (orderId: string, targetStatus: OrderStatus = 'Preparing') => {
      const currentOrd = orders.find((o) => o.id === orderId);
      if (currentOrd && isOrderLocked(currentOrd) && targetStatus !== 'Completed' && targetStatus !== 'Delivered') {
        showToast('⚠️ This order was completed more than 10 minutes ago and cannot be changed back.', 'error');
        return;
      }

      // 1. Stop continuous ringing alarm immediately
      soundAlerts.stopContinuousAlarm();

      // 2. Mark this order's alarm as acknowledged
      acknowledgedAlarmOrderIdRef.current = orderId;
      setLatestAlertOrder(null);

      // 3. Update status in local state and Firebase RTDB
      await updateOrderStatus(orderId, targetStatus);

      // 4. Request Admin / Rider mobile GPS directly inside user click handler
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        showToast('📍 Requesting Admin / Kitchen GPS location...', 'info');

        const onGpsSuccess = async (pos: GeolocationPosition) => {
          const riderLoc: LiveLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 10),
            heading: pos.coords.heading || null,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
            googleMapsLink: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`,
            updatedAt: new Date().toISOString(),
          };

          await updateOrderLocation(orderId, riderLoc, true);
          try {
            if (rtdb) {
              set(ref(rtdb, 'system/adminLiveLocation'), riderLoc).catch(() => {});
            }
          } catch {}

          showToast('✓ Live Kitchen / Rider GPS connected! Streaming live to customer.', 'success');

          // Start continuous real-time watchPosition for rider/admin movement
          if (activeRiderWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(activeRiderWatchIdRef.current);
          }
          activeRiderWatchIdRef.current = navigator.geolocation.watchPosition(
            (p) => {
              const liveLoc: LiveLocation = {
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                accuracy: Math.round(p.coords.accuracy || 10),
                heading: p.coords.heading || null,
                speed: p.coords.speed ? Math.round(p.coords.speed * 3.6) : null,
                googleMapsLink: `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`,
                updatedAt: new Date().toISOString(),
              };
              updateOrderLocation(orderId, liveLoc, true).catch(() => {});
              try {
                if (rtdb) {
                  set(ref(rtdb, 'system/adminLiveLocation'), liveLoc).catch(() => {});
                }
              } catch {}
            },
            (err) => console.warn('Rider live tracking error:', err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
        };

        const onGpsFail = (err: any) => {
          console.warn('High accuracy GPS error on accept:', err);
          if (err?.code === 1) {
            showToast('⚠️ Location access was denied. Please allow GPS so customer can track delivery live.', 'error');
            return;
          }
          // Fallback to standard accuracy for devices where high-accuracy GPS times out
          navigator.geolocation.getCurrentPosition(
            onGpsSuccess,
            (err2) => {
              console.warn('Standard GPS error on accept:', err2);
              showToast('Order Accepted! (Allow device GPS so customer can track your live movement)', 'info');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 15000 }
          );
        };

        navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsFail, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
      }

      // Automatically trigger WhatsApp update for the customer with the live tracking link
      try {
        const currentOrd = orders.find((o) => o.id === orderId);
        if (currentOrd && currentOrd.customerPhone) {
          const whatsAppUrl = generateCustomerStatusWhatsAppUrl(currentOrd, targetStatus);
          if (whatsAppUrl && typeof window !== 'undefined') {
            window.open(whatsAppUrl, '_blank');
          }
        }
      } catch {}
    },
    [updateOrderStatus, updateOrderLocation, showToast, orders, generateCustomerStatusWhatsAppUrl]
  );

  const seedDemoOrders = useCallback(async () => {
    // Demo orders have been permanently disabled
  }, []);

  // Products Cloud CRUD
  const addProduct = useCallback(
    async (newP: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = `prod-${Date.now()}`;
      const now = new Date().toISOString();
      const product: Product = {
        ...newP,
        id,
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic local update
      setProducts((prev) => [product, ...prev]);

      try {
        await set(ref(rtdb, `products/${id}`), product);
        showToast(`Product "${product.name}" added to Firebase cloud!`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error writing product';
        showToast(`Cloud save failed: ${msg}`, 'error');
      }
    },
    [showToast]
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      // Optimistic local update
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
      );

      try {
        await updateCloudRecord('products', id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        showToast('Product updated in cloud!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error updating product';
        showToast(`Cloud update failed: ${msg}`, 'error');
      }
    },
    [updateCloudRecord, showToast]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      // Optimistic local update
      setProducts((prev) => prev.filter((p) => p.id !== id));

      try {
        await removeCloudRecord('products', id);
        showToast('Product removed from cloud', 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting product';
        showToast(`Cloud deletion failed: ${msg}`, 'error');
      }
    },
    [removeCloudRecord, showToast]
  );

  const toggleProductAvailability = useCallback(
    async (id: string) => {
      const prod = products.find((p) => p.id === id);
      if (!prod) return;
      const nextVal = !prod.isAvailable;

      // Optimistic local update
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isAvailable: nextVal } : p)));

      try {
        await updateCloudRecord('products', id, {
          isAvailable: nextVal,
          updatedAt: new Date().toISOString(),
        });
        showToast(`${prod.name} is now ${nextVal ? 'In Stock' : 'Out of Stock'}`, 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error toggling availability';
        showToast(`Cloud update failed: ${msg}`, 'error');
      }
    },
    [products, updateCloudRecord, showToast]
  );

  const toggleProductFeatured = useCallback(
    async (id: string) => {
      const prod = products.find((p) => p.id === id);
      if (!prod) return;
      const nextVal = !prod.isFeatured;

      // Optimistic local update
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isFeatured: nextVal } : p)));

      try {
        await updateCloudRecord('products', id, {
          isFeatured: nextVal,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error toggling featured';
        showToast(`Cloud update failed: ${msg}`, 'error');
      }
    },
    [products, updateCloudRecord, showToast]
  );

  const updateProductPrice = useCallback(
    async (productId: string, sizeName: string, newPrice: number) => {
      if (newPrice < 0 || isNaN(newPrice)) {
        showToast('Price must be a valid positive number', 'error');
        return;
      }
      const prod = products.find((p) => p.id === productId);
      if (!prod) return;

      const updatedSizes = prod.sizes.map((s) =>
        s.size === sizeName ? { ...s, price: newPrice } : s
      );

      // Optimistic local update
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, sizes: updatedSizes } : p)));

      try {
        await updateCloudRecord('products', productId, {
          sizes: updatedSizes,
          updatedAt: new Date().toISOString(),
        });
        showToast(`Price updated to ₹${newPrice} in cloud`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error updating price';
        showToast(`Cloud update failed: ${msg}`, 'error');
      }
    },
    [products, updateCloudRecord, showToast]
  );

  const saveAllProductPrices = useCallback(
    async (updatedProducts: Product[]): Promise<boolean> => {
      // 1. Optimistic local state update
      setProducts(updatedProducts);

      try {
        const prodMap: Record<string, Product> = {};
        const now = new Date().toISOString();
        updatedProducts.forEach((p) => {
          prodMap[p.id] = {
            ...p,
            updatedAt: now,
          };
        });

        await set(ref(rtdb, 'products'), prodMap);
        showToast('✓ All product prices saved successfully to Firebase Storage!', 'success');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error saving prices to Firebase';
        showToast(`Failed to save prices: ${msg}`, 'error');
        return false;
      }
    },
    [showToast]
  );

  // Settings Cloud Update
  const updateSettings = useCallback(
    async (updates: Partial<RestaurantSettings>) => {
      // Optimistic local update
      setSettings((prev) => ({ ...prev, ...updates }));

      try {
        await update(ref(rtdb, 'settings'), updates);
        showToast('Restaurant settings saved to Firebase cloud!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error saving settings';
        showToast(`Cloud settings update failed: ${msg}`, 'error');
      }
    },
    [showToast]
  );

  // Gallery Cloud CRUD
  const addGalleryItem = useCallback(
    async (item: Omit<GalleryItem, 'id'>) => {
      const id = `gal-${Date.now()}`;
      const newItem: GalleryItem = { ...item, id };

      // Optimistic local update
      setGallery((prev) => [newItem, ...prev]);

      try {
        await set(ref(rtdb, `gallery/${id}`), newItem);
        showToast('Image added to gallery in cloud', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error adding image';
        showToast(`Gallery update failed: ${msg}`, 'error');
      }
    },
    [showToast]
  );

  const updateGalleryItem = useCallback(
    async (id: string, updates: Partial<GalleryItem>) => {
      // Optimistic local update
      setGallery((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));

      try {
        await updateCloudRecord('gallery', id, updates);
        showToast('Gallery image updated in cloud', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error updating gallery';
        showToast(`Gallery update failed: ${msg}`, 'error');
      }
    },
    [updateCloudRecord, showToast]
  );

  const deleteGalleryItem = useCallback(
    async (id: string) => {
      // Optimistic local update
      setGallery((prev) => prev.filter((g) => g.id !== id));

      try {
        await removeCloudRecord('gallery', id);
        showToast('Image removed from cloud gallery', 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting image';
        showToast(`Gallery deletion failed: ${msg}`, 'error');
      }
    },
    [removeCloudRecord, showToast]
  );

  // Videos Cloud CRUD
  const addVideoItem = useCallback(
    async (item: Omit<VideoItem, 'id'>) => {
      const id = `vid-${Date.now()}`;
      const newItem: VideoItem = { ...item, id };

      // Optimistic local update
      setVideos((prev) => [newItem, ...prev]);

      try {
        await set(ref(rtdb, `videos/${id}`), newItem);
        showToast('Video added to showcase in cloud', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error adding video';
        showToast(`Video update failed: ${msg}`, 'error');
      }
    },
    [showToast]
  );

  const updateVideoItem = useCallback(
    async (id: string, updates: Partial<VideoItem>) => {
      // Optimistic local update
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));

      try {
        await updateCloudRecord('videos', id, updates);
        showToast('Video updated in cloud', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error updating video';
        showToast(`Video update failed: ${msg}`, 'error');
      }
    },
    [updateCloudRecord, showToast]
  );

  const deleteVideoItem = useCallback(
    async (id: string) => {
      // Optimistic local update
      setVideos((prev) => prev.filter((v) => v.id !== id));

      try {
        await removeCloudRecord('videos', id);
        showToast('Video removed from cloud showcase', 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting video';
        showToast(`Video deletion failed: ${msg}`, 'error');
      }
    },
    [removeCloudRecord, showToast]
  );

  // Reviews Cloud CRUD
  const addReview = useCallback(
    async (customerName: string, rating: number, comment: string) => {
      const id = `review-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newReview: Review = {
        id,
        customerName: customerName.trim() || 'Valued Guest',
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment.trim(),
        isApproved: true,
        createdAt: new Date().toISOString(),
      };

      // Optimistic local update
      setReviews((prev) => [newReview, ...prev]);

      try {
        await set(ref(rtdb, `reviews/${id}`), newReview);
        showToast('Thank you! Your review has been submitted to cloud.', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error submitting review';
        showToast(`Review submission failed: ${msg}`, 'error');
      }
    },
    [showToast]
  );

  const toggleReviewApproval = useCallback(
    async (id: string) => {
      const rev = reviews.find((r) => r.id === id);
      if (!rev) return;
      const nextVal = !rev.isApproved;

      // Optimistic local update
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: nextVal } : r)));

      try {
        await updateCloudRecord('reviews', id, { isApproved: nextVal });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error updating review';
        showToast(`Review update failed: ${msg}`, 'error');
      }
    },
    [reviews, updateCloudRecord, showToast]
  );

  const deleteReview = useCallback(
    async (id: string) => {
      // Optimistic local update
      setReviews((prev) => prev.filter((r) => r.id !== id));

      try {
        await removeCloudRecord('reviews', id);
        showToast('Review removed from cloud', 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting review';
        showToast(`Review deletion failed: ${msg}`, 'error');
      }
    },
    [removeCloudRecord, showToast]
  );

  // In-session Favorites
  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((prev) => {
        const isFav = prev.includes(productId);
        if (isFav) {
          showToast('Removed from favorites', 'info');
          return prev.filter((id) => id !== productId);
        } else {
          showToast('Added to your favorites!', 'success');
          return [...prev, productId];
        }
      });
    },
    [showToast]
  );

  const isFavorite = useCallback(
    (productId: string) => {
      return favorites.includes(productId);
    },
    [favorites]
  );

  const addRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 8);
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        currentUser,
        userProfile,
        isAuthLoading,
        isAdmin,
        authorizedAdminUid: AUTHORIZED_ADMIN_UID,
        registerCustomer,
        loginCustomer,
        loginAdminWithFirebase,
        loginAdminWithPasscode,
        isPasscodeAdmin,
        logout,
        sendPasswordReset,
        updateCustomerProfile,
        isCloudDbConnected,
        cloudDbError,
        cart,
        cartCount,
        subtotal,
        deliveryFee,
        discount,
        finalTotal,
        addToCart,
        updateCartQuantity,
        updateCartItemSize,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        orders,
        myOrders,
        createOrder,
        updateOrderStatus,
        updateOrderLocation,
        updateOrderPaymentStatus,
        deleteOrder,
        activeOrder,
        setActiveOrder,
        generateWhatsAppUrl,
        generateCustomerStatusWhatsAppUrl,
        acceptOrderWithLiveLocation,
        seedDemoOrders,
        isSoundMuted,
        toggleSoundMute,
        testOrderAlertSound,
        latestAlertOrder,
        dismissOrderAlert,
        stopContinuousAlarm,
        broadcasts,
        activeBroadcast,
        dismissActiveBroadcast,
        sendBroadcastNotification,
        deleteBroadcastNotification,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        toggleProductFeatured,
        updateProductPrice,
        saveAllProductPrices,
        activeProductModal,
        setActiveProductModal,
        settings,
        updateSettings,
        gallery,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        videos,
        addVideoItem,
        updateVideoItem,
        deleteVideoItem,
        reviews,
        addReview,
        toggleReviewApproval,
        deleteReview,
        favorites,
        toggleFavorite,
        isFavorite,
        recentlyViewed,
        addRecentlyViewed,
        toasts,
        showToast,
        dismissToast,
        formatPrice,
        syncInitialDataToCloud,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
