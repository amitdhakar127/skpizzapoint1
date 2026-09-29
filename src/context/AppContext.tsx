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
} from '../types';
import { soundAlerts } from '../lib/soundAlerts';
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_GALLERY,
  INITIAL_VIDEOS,
  INITIAL_REVIEWS,
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
} from 'firebase/database';

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

  // Cloud Orders
  orders: Order[];
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Routing state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash;
    return window.location.pathname || '/';
  });

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setCurrentPath(hash || '/');
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Authoritative admin verification: User's UID must match authorized ID or owner email
  const isAdmin = useMemo(() => {
    return isUserAdmin(currentUser?.uid, currentUser?.email);
  }, [currentUser]);

  // Cloud Database States (Realtime Database)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<RestaurantSettings>(INITIAL_SETTINGS);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('sk_pizza_local_orders');
      return saved ? JSON.parse(saved) : [];
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
          if (snapshot.exists()) {
            setUserProfile(snapshot.val());
          } else {
            const initialProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
              createdAt: new Date().toISOString(),
            };
            set(userRef, initialProfile).catch(() => {});
            setUserProfile(initialProfile);
          }
        });

        // Real-time listener for Customer's specific Orders in userOrders/{uid}
        const userOrdersRef = ref(rtdb, `userOrders/${user.uid}`);
        unsubUserOrders = onValue(userOrdersRef, (snapshot) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const personalOrders: Order[] = Array.isArray(val)
              ? val.filter(Boolean)
              : Object.keys(val).map((k) => val[k]);
            setOrders((prev) => {
              const map = new Map<string, Order>();
              prev.forEach((o) => map.set(o.id, o));
              personalOrders.forEach((o) => map.set(o.id, o));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
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
          const items: Product[] = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.keys(val).map((k) => val[k]);
          setProducts(items);
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
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings((prev) => ({ ...prev, ...snapshot.val() }));
      } else {
        set(settingsRef, INITIAL_SETTINGS).catch(() => {});
      }
    });

    // Subscribe to gallery
    const unsubGallery = onValue(galleryRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const items: GalleryItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => val[k]);
        setGallery(items.sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        const galMap: Record<string, GalleryItem> = {};
        INITIAL_GALLERY.forEach((g) => {
          galMap[g.id] = g;
        });
        set(galleryRef, galMap).catch(() => {});
      }
    });

    // Subscribe to videos
    const unsubVideos = onValue(videosRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const items: VideoItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => val[k]);
        setVideos(items.sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        const vidMap: Record<string, VideoItem> = {};
        INITIAL_VIDEOS.forEach((v) => {
          vidMap[v.id] = v;
        });
        set(videosRef, vidMap).catch(() => {});
      }
    });

    // Subscribe to reviews
    const unsubReviews = onValue(reviewsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const items: Review[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => val[k]);
        setReviews(items);
      } else {
        const revMap: Record<string, Review> = {};
        INITIAL_REVIEWS.forEach((r) => {
          revMap[r.id] = r;
        });
        set(reviewsRef, revMap).catch(() => {});
      }
    });

    // Subscribe to orders
    const unsubOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const items: Order[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.keys(val).map((k) => val[k]);
        const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Detect newly arrived orders for voice & audio alerts
        if (!initialOrdersLoadedRef.current) {
          initialOrdersLoadedRef.current = true;
          previousOrderIdsRef.current = new Set(sorted.map((o) => o.id));
        } else {
          const freshOrders = sorted.filter((o) => !previousOrderIdsRef.current.has(o.id));
          if (freshOrders.length > 0) {
            freshOrders.forEach((o) => previousOrderIdsRef.current.add(o.id));
            const newest = freshOrders[0];
            setLatestAlertOrder(newest);
            // Start continuous repeating loud restaurant siren & vocal announcement in Hindi/English
            soundAlerts.startContinuousOrderAlarm({
              id: newest.id,
              customerName: newest.customerName,
              amount: newest.finalTotal,
            });
            showToast(`🔔 New Order! #${newest.id} from ${newest.customerName} (₹${newest.finalTotal})`, 'success');

            // Browser Web Notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('🍕 New SK Pizza Point Order!', {
                  body: `Order #${newest.id} from ${newest.customerName} for ₹${newest.finalTotal}`,
                  icon: '/favicon.ico',
                });
              } catch {
                // Ignore web notification error
              }
            }
          }
        }

        setOrders(sorted);
      } else {
        setOrders([]);
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

    return () => {
      unsubProducts();
      unsubSettings();
      unsubGallery();
      unsubVideos();
      unsubReviews();
      unsubOrders();
      unsubBroadcasts();
    };
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

  // Logout
  const logout = useCallback(async () => {
    try {
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
        setUserProfile((prev) => (prev ? { ...prev, ...data } : { uid: currentUser.uid, email: currentUser.email || '', ...data }));
        if (data.displayName && auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.displayName }).catch(() => {});
        }
        showToast('Profile details saved to Firebase cloud!', 'success');
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
        deliveryAddress: customer.deliveryAddress,
        city: customer.city,
        pinCode: customer.pinCode,
        instructions: customer.instructions,
        items: itemsSnapshot,
        subtotal: orderSubtotal,
        deliveryFee: orderFee,
        discount: 0,
        finalTotal: orderFinal,
        paymentMode: 'Pay on Delivery / WhatsApp Confirmation',
        paymentStatus: customer.paymentStatus || 'Pending',
        status: 'Pending',
        customerLocation: customer.customerLocation,
        createdAt: now,
        updatedAt: now,
      };

      // Immediate responsive state update
      setActiveOrder(newOrder);
      setOrders((prev) => {
        const next = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
        try {
          localStorage.setItem('sk_pizza_local_orders', JSON.stringify(next.slice(0, 50)));
        } catch {}
        return next;
      });
      clearCart();

      // Write to Firebase Realtime Database
      try {
        await set(ref(rtdb, `orders/${newOrder.id}`), newOrder);

        // If authenticated, also index full order object under user's order history
        if (currentUser) {
          await set(ref(rtdb, `userOrders/${currentUser.uid}/${newOrder.id}`), newOrder);

          // Save address / phone into customer profile if provided
          if (customer.customerPhone || customer.deliveryAddress) {
            await update(ref(rtdb, `users/${currentUser.uid}`), {
              phone: customer.customerPhone || undefined,
              defaultAddress: customer.deliveryAddress || undefined,
              city: customer.city || undefined,
              pinCode: customer.pinCode || undefined,
            }).catch(() => {});
          }
        }
      } catch (err: unknown) {
        console.error('Failed to write order to cloud database:', err);
        showToast('Order saved locally, awaiting cloud sync confirmation.', 'info');
      }

      return newOrder;
    },
    [cart, generateOrderId, products, settings.deliveryFee, clearCart, currentUser, showToast]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      // Optimistic local state update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
      );
      try {
        await updateCloudRecord('orders', orderId, {
          status,
          updatedAt: new Date().toISOString(),
        });
        const currentOrd = orders.find((o) => o.id === orderId);
        if (currentOrd?.userId && currentOrd.userId !== 'guest') {
          await updateCloudRecord(`userOrders/${currentOrd.userId}`, orderId, {
            status,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }
        showToast(`Order ${orderId} status updated to "${status}"`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        showToast(`Failed to update order in cloud: ${msg}`, 'error');
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

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));

      try {
        await updateCloudRecord('orders', orderId, updates);
        const currentOrd = orders.find((o) => o.id === orderId);
        if (currentOrd?.userId && currentOrd.userId !== 'guest') {
          await updateCloudRecord(`userOrders/${currentOrd.userId}`, orderId, updates).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to update live location in cloud:', err);
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
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
      const currentOrd = orders.find((o) => o.id === orderId);
      // Optimistic local state update
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      try {
        await removeCloudRecord('orders', orderId);
        if (currentOrd?.userId && currentOrd.userId !== 'guest') {
          await removeCloudRecord(`userOrders/${currentOrd.userId}`, orderId).catch(() => {});
        }
        showToast(`Order ${orderId} deleted from cloud`, 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Delete failed';
        showToast(`Failed to delete order: ${msg}`, 'error');
      }
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
    showToast('🚨 सायरन टेस्ट शुरू! (Testing Continuous Loud Siren & Vibration)', 'info');
  }, [showToast]);

  const dismissOrderAlert = useCallback(() => {
    soundAlerts.stopContinuousAlarm();
    setLatestAlertOrder(null);
  }, []);

  const stopContinuousAlarm = useCallback(() => {
    soundAlerts.stopContinuousAlarm();
  }, []);

  // WhatsApp pre-filled message generator with Live GPS Link and Live Tracker Link
  const generateWhatsAppUrl = useCallback(
    (order: Order): string => {
      const itemsList = order.items
        .map((item) => {
          const addOnText = item.addOns.length > 0 ? ` (+${item.addOns.join(', ')})` : '';
          return `• ${item.productName} — ${item.size} × ${item.quantity} — ₹${item.totalPrice}${addOnText}`;
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
          ? `\nAddress: ${order.deliveryAddress}${order.city ? ', ' + order.city : ''}${order.pinCode ? ' - ' + order.pinCode : ''}`
          : '';

      const locationSection =
        order.customerLocation?.latitude && order.customerLocation?.longitude
          ? `\n📍 *Customer Live GPS Location:* https://maps.google.com/?q=${order.customerLocation.latitude},${order.customerLocation.longitude} (Accuracy: ±${Math.round(order.customerLocation.accuracy || 10)}m)`
          : '';

      const trackerSection =
        typeof window !== 'undefined'
          ? `\n🗺️ *Live Order & Rider Tracker:* ${window.location.origin}/#track-${order.id}`
          : '';

      const instructionsSection = order.instructions ? `\nInstructions: ${order.instructions}` : '';

      const rawMessage = `*SK PIZZA POINT — NEW ORDER*

*Order ID:* ${order.id}
*Customer Name:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Order Type:* ${order.orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}${addressSection}${locationSection}

*Items:*
${itemsList}

*Subtotal:* ₹${order.subtotal}
*Delivery:* ${deliveryText}
*Discount:* ₹${order.discount}
*Total:* ₹${order.finalTotal}${instructionsSection}${trackerSection}

_Please confirm this order and its preparation status._`;

      const cleanPhone = settings.whatsAppNumber.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;
    },
    [settings.whatsAppNumber, settings.deliveryFeeNote]
  );

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
      const id = `rev-${Date.now()}`;
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
        createOrder,
        updateOrderStatus,
        updateOrderLocation,
        updateOrderPaymentStatus,
        deleteOrder,
        activeOrder,
        setActiveOrder,
        generateWhatsAppUrl,
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
