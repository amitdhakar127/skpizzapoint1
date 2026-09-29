import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Utensils,
  DollarSign,
  ShoppingBag,
  Image as ImageIcon,
  Video as VideoIcon,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  Eye,
  Sparkles,
  Save,
  RotateCcw,
  Pizza,
  Sandwich,
  UtensilsCrossed,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Volume2,
  VolumeX,
  Bell,
  Send,
  Compass,
  Phone,
  Table as TableIcon,
  List as ListIcon,
  MapPin as MapPinIcon,
  MoreHorizontal,
  BellRing,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminLoginPage } from './AdminLoginPage';
import { Product, OrderStatus, GalleryItem, VideoItem, PizzaSize, ProductCategory, AddOn, LiveLocation, Order } from '../types';
import { LiveOrderTracker } from '../components/LiveOrderTracker';
import { AdminOrderDetailModal } from '../components/AdminOrderDetailModal';
import { AdminRingingAlarmOverlay } from '../components/AdminRingingAlarmOverlay';
import { ErrorBoundary } from '../components/ErrorBoundary';

const AdminPageInternal: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isAuthLoading,
    logout,
    navigate,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    toggleProductFeatured,
    updateProductPrice,
    orders,
    updateOrderStatus,
    updateOrderPaymentStatus,
    updateOrderLocation,
    deleteOrder,
    isSoundMuted,
    toggleSoundMute,
    testOrderAlertSound,
    latestAlertOrder,
    dismissOrderAlert,
    broadcasts,
    sendBroadcastNotification,
    deleteBroadcastNotification,
    gallery,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    videos,
    addVideoItem,
    updateVideoItem,
    deleteVideoItem,
    reviews,
    toggleReviewApproval,
    deleteReview,
    settings,
    updateSettings,
    formatPrice,
    syncInitialDataToCloud,
    isCloudDbConnected,
    cloudDbError,
    showToast,
  } = useApp();

  // If auth is verifying
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E1915] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-neutral-300">Checking Firebase Admin Credentials...</p>
        </div>
      </div>
    );
  }

  // If not logged in as authorized admin, show dedicated Admin Login page
  if (!currentUser || !isAdmin) {
    return <AdminLoginPage />;
  }

  type AdminTab =
    | 'dashboard'
    | 'products'
    | 'prices'
    | 'orders'
    | 'broadcasts'
    | 'gallery'
    | 'videos'
    | 'reviews'
    | 'settings';

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Broadcast Compose State
  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastMessage, setNewBroadcastMessage] = useState('');
  const [newBroadcastType, setNewBroadcastType] = useState<'offer' | 'update' | 'urgent'>('offer');
  const [newBroadcastLink, setNewBroadcastLink] = useState('/menu');
  const [newBroadcastBadge, setNewBroadcastBadge] = useState('HOT DEAL');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [ordersViewMode, setOrdersViewMode] = useState<'sheet' | 'cards'>('cards');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);

  // High list sorting: Newest placed orders are ALWAYS at the top!
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingOrdersCount = orders.filter((o) => {
    const s = (o.status || '').toLowerCase().trim();
    return s.includes('pending') || s.includes('received') || s.includes('whatsapp') || s === 'draft';
  }).length;

  const isOrderMatchingFilter = (ord: Order, filter: string) => {
    if (filter === 'all') return true;
    const s = (ord.status || '').toLowerCase().trim();
    const f = filter.toLowerCase().trim();
    if (f === 'pending') {
      return s.includes('pending') || s.includes('received') || s.includes('whatsapp') || s === 'draft';
    }
    if (f === 'preparing') {
      return s.includes('prep') || s.includes('confirm') || s.includes('ready');
    }
    if (f === 'out for delivery') {
      return (s.includes('out') || s.includes('delivery')) && !s.includes('delivered');
    }
    if (f === 'delivered') {
      return s.includes('deliver') || s.includes('completed');
    }
    return s === f;
  };

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<ProductCategory>('pizza');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdImg, setEditProdImg] = useState('');
  const [editProdSmallPrice, setEditProdSmallPrice] = useState<number>(99);
  const [editProdMedPrice, setEditProdMedPrice] = useState<number>(159);
  const [editProdLargePrice, setEditProdLargePrice] = useState<number>(259);
  const [editProdBadge, setEditProdBadge] = useState('');
  const [editProdAvailable, setEditProdAvailable] = useState(true);
  const [editProdFeatured, setEditProdFeatured] = useState(false);

  // Safe Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    name: string;
    type: 'product' | 'gallery' | 'video' | 'order' | 'review' | 'broadcast';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('pizza');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdSmallPrice, setNewProdSmallPrice] = useState(99);
  const [newProdMedPrice, setNewProdMedPrice] = useState(159);
  const [newProdLargePrice, setNewProdLargePrice] = useState(259);
  const [newProdBadge, setNewProdBadge] = useState('');

  // Gallery Editing State
  const [newGalleryImgUrl, setNewGalleryImgUrl] = useState('');
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState('restaurant');

  // Video Editing State
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoAspect, setNewVideoAspect] = useState<'16:9' | '9:16'>('16:9');

  // Settings Temp State
  const [tempSettings, setTempSettings] = useState(settings);
  const [copiedRules, setCopiedRules] = useState(false);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const rtdbRulesCode = `{
  "rules": {
    "settings": {
      ".read": true,
      ".write": "auth != null && (auth.uid === 'vxIlz4pYZgM646mXmp2BQuXtYz32' || auth.token.email === 'zyvoraofficial3@gmail.com' || auth.token.email === 'skpizzapoint@gmail.com')"
    },
    "products": {
      ".read": true,
      ".write": "auth != null && (auth.uid === 'vxIlz4pYZgM646mXmp2BQuXtYz32' || auth.token.email === 'zyvoraofficial3@gmail.com' || auth.token.email === 'skpizzapoint@gmail.com')"
    },
    "gallery": {
      ".read": true,
      ".write": "auth != null && (auth.uid === 'vxIlz4pYZgM646mXmp2BQuXtYz32' || auth.token.email === 'zyvoraofficial3@gmail.com' || auth.token.email === 'skpizzapoint@gmail.com')"
    },
    "videos": {
      ".read": true,
      ".write": "auth != null && (auth.uid === 'vxIlz4pYZgM646mXmp2BQuXtYz32' || auth.token.email === 'zyvoraofficial3@gmail.com' || auth.token.email === 'skpizzapoint@gmail.com')"
    },
    "reviews": {
      ".read": true,
      ".write": true
    },
    "orders": {
      ".read": true,
      ".write": true
    },
    "userOrders": {
      ".read": true,
      ".write": true
    },
    "users": {
      ".read": true,
      "$uid": {
        ".read": true,
        ".write": "auth != null && (auth.uid === $uid || auth.uid === 'vxIlz4pYZgM646mXmp2BQuXtYz32') || true"
      }
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(rtdbRulesCode);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  // Helper to extract YouTube video ID from various URL formats
  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url.trim();
  };

  // Metrics for dashboard
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === 'Awaiting WhatsApp submission').length;
  const confirmedOrders = orders.filter((o) => o.status === 'Confirmed by restaurant').length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const outOfStockCount = products.filter((p) => !p.isAvailable).length;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const sizes =
      newProdCategory === 'pizza'
        ? [
            { size: 'Small' as PizzaSize, price: Number(newProdSmallPrice) },
            { size: 'Medium' as PizzaSize, price: Number(newProdMedPrice) },
            { size: 'Large' as PizzaSize, price: Number(newProdLargePrice) },
          ]
        : [{ size: 'Small' as PizzaSize, price: Number(newProdSmallPrice) }];

    addProduct({
      name: newProdName.trim(),
      category: newProdCategory,
      description: newProdDesc.trim(),
      imageUrl:
        newProdImg.trim() ||
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      sizes,
      isAvailable: true,
      isFeatured: false,
      badge: newProdBadge.trim() || undefined,
    });

    setNewProdName('');
    setNewProdDesc('');
    setNewProdImg('');
    setNewProdBadge('');
    setIsNewProductModalOpen(false);
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdDesc(p.description);
    setEditProdImg(p.imageUrl);
    setEditProdSmallPrice(p.sizes[0]?.price ?? 99);
    setEditProdMedPrice(p.sizes[1]?.price ?? 159);
    setEditProdLargePrice(p.sizes[2]?.price ?? 259);
    setEditProdBadge(p.badge || '');
    setEditProdAvailable(p.isAvailable);
    setEditProdFeatured(p.isFeatured ?? false);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProdName.trim()) return;

    const sizes =
      editProdCategory === 'pizza'
        ? [
            { size: 'Small' as PizzaSize, price: Number(editProdSmallPrice) },
            { size: 'Medium' as PizzaSize, price: Number(editProdMedPrice) },
            { size: 'Large' as PizzaSize, price: Number(editProdLargePrice) },
          ]
        : [{ size: 'Small' as PizzaSize, price: Number(editProdSmallPrice) }];

    await updateProduct(editingProduct.id, {
      name: editProdName.trim(),
      category: editProdCategory,
      description: editProdDesc.trim(),
      imageUrl: editProdImg.trim() || editingProduct.imageUrl,
      sizes,
      badge: editProdBadge.trim() || undefined,
      isAvailable: editProdAvailable,
      isFeatured: editProdFeatured,
    });

    setEditingProduct(null);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    const { id, type } = deleteConfirmTarget;
    try {
      if (type === 'product') {
        await deleteProduct(id);
      } else if (type === 'gallery') {
        await deleteGalleryItem(id);
      } else if (type === 'video') {
        await deleteVideoItem(id);
      } else if (type === 'order') {
        await deleteOrder(id);
      } else if (type === 'review') {
        await deleteReview(id);
      } else if (type === 'broadcast') {
        await deleteBroadcastNotification(id);
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle.trim() || !newBroadcastMessage.trim()) {
      showToast('Please enter both title and message for the broadcast notification', 'error');
      return;
    }
    await sendBroadcastNotification({
      title: newBroadcastTitle.trim(),
      message: newBroadcastMessage.trim(),
      type: newBroadcastType,
      link: newBroadcastLink.trim() || '/menu',
      badge: newBroadcastBadge.trim() || undefined,
    });
    setNewBroadcastTitle('');
    setNewBroadcastMessage('');
  };

  const handleAddGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryImgUrl.trim()) return;

    addGalleryItem({
      imageUrl: newGalleryImgUrl.trim(),
      title: newGalleryTitle.trim() || 'SK Pizza Point Special',
      caption: newGalleryCaption.trim() || 'Freshly prepared at SK Pizza Point.',
      altText: newGalleryTitle.trim() || 'Restaurant photo',
      category: newGalleryCategory,
      sortOrder: gallery.length + 1,
      isPublished: true,
    });

    setNewGalleryImgUrl('');
    setNewGalleryTitle('');
    setNewGalleryCaption('');
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    const extractedId = extractYouTubeId(newVideoUrl);

    addVideoItem({
      youtubeId: extractedId,
      youtubeUrl: newVideoUrl.trim(),
      title: newVideoTitle.trim() || 'SK Pizza Point Kitchen Tour',
      description: newVideoDesc.trim() || 'Watch our chef prepare signature recipes.',
      thumbnailUrl: `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
      aspectRatio: newVideoAspect,
      sortOrder: videos.length + 1,
      isPublished: true,
    });

    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDesc('');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* High Priority Repeating Siren Order Alarm for Mobile & Desktop */}
      <AdminRingingAlarmOverlay
        onOpenOrder={(orderId) => {
          const ord = orders.find((o) => o.id === orderId);
          if (ord) setSelectedOrderForModal(ord);
          setActiveTab('orders');
        }}
      />

      {/* Admin Top Navigation */}
      <header className="bg-[#181411] text-white border-b border-neutral-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
            SK
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>SK Pizza Point — Admin Studio</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firebase Realtime DB
              </span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono">
              Admin: {currentUser?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* High Priority Siren Test Button */}
          <button
            type="button"
            onClick={() => testOrderAlertSound()}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ring-2 ring-amber-400/50"
            title="Test Loud Repeating Order Siren (सायरन टेस्ट करें)"
          >
            <BellRing className="w-3.5 h-3.5 text-yellow-300 animate-wiggle" />
            <span>🚨 सायरन टेस्ट (Test Siren)</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSoundMute()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isSoundMuted
                ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
            title={isSoundMuted ? 'Unmute Loud Voice Alert' : 'Voice Alert is Active'}
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            <span className="hidden sm:inline">{isSoundMuted ? 'Voice Muted' : 'Voice Alarm On'}</span>
          </button>

          <button
            onClick={() => syncInitialDataToCloud()}
            className="hidden lg:flex px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold transition-colors items-center gap-1.5 cursor-pointer"
            title="Seed initial official menu items to Firebase Realtime Database"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync to Cloud</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Website</span>
          </button>

          <button
            onClick={() => logout()}
            className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Real-time Order Alert Banner for Admin */}
      {latestAlertOrder && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg sticky top-14 z-20 animate-fade-in border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>
              🚨 <strong>NEW ORDER ALERT:</strong> Order #{latestAlertOrder.id} from{' '}
              {latestAlertOrder.customerName} for {formatPrice(latestAlertOrder.finalTotal)}!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('orders');
                dismissOrderAlert();
              }}
              className="px-3 py-1 rounded-lg bg-slate-950 text-amber-300 font-extrabold text-xs cursor-pointer hover:bg-neutral-900"
            >
              Open Order
            </button>
            <button
              onClick={() => dismissOrderAlert()}
              className="p-1 text-slate-950 hover:text-neutral-800 cursor-pointer"
              title="Acknowledge Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Sidebar (Hidden on mobile / Android APK to provide native app experience) */}
        <aside className="hidden md:block w-64 bg-white border-r border-amber-200/80 p-4 space-y-1.5 shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'products', label: `Products (${products.length})`, icon: Utensils },
            { id: 'prices', label: 'Price Manager', icon: DollarSign },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'broadcasts', label: `Push Alerts (${broadcasts.length})`, icon: Bell },
            { id: 'gallery', label: `Gallery (${gallery.length})`, icon: ImageIcon },
            { id: 'videos', label: `Videos (${videos.length})`, icon: VideoIcon },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
            { id: 'settings', label: 'Restaurant Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-[#55473E] hover:bg-amber-50 hover:text-[#1E1915]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-slate-950' : 'text-amber-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-6 border-t border-amber-100 mt-6">
            <button
              onClick={() => {
                if (window.confirm('Sync & seed all products, gallery, videos, and settings to Firebase Realtime Database?')) {
                  syncInitialDataToCloud();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Seed / Reset to Cloud</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area (pb-28 on mobile ensures bottom bar never obscures content) */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28 md:pb-8">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-[#1E1915]">Admin Overview Dashboard</h2>
                <p className="text-xs sm:text-sm text-[#6B5B4F]">
                  Real-time status of orders, menu items, and customer activity.
                </p>
              </div>

              {/* Metric Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-[#6B5B4F] uppercase">Total Orders</span>
                  <p className="text-3xl font-black text-[#1E1915]">{totalOrders}</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-amber-700 uppercase">Awaiting Submission</span>
                  <p className="text-3xl font-black text-amber-600">{newOrders}</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Confirmed / Preparing</span>
                  <p className="text-3xl font-black text-emerald-600">{confirmedOrders}</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-[#6B5B4F] uppercase">Products Active</span>
                  <p className="text-3xl font-black text-[#1E1915]">{products.length - outOfStockCount}</p>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#1E1915]">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6B5B4F]">
                    No orders submitted yet. When customers order on WhatsApp, their records appear here!
                  </div>
                ) : (
                  <div className="divide-y divide-amber-100">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#1E1915] font-mono">{order.id}</p>
                          <p className="text-[#6B5B4F]">{order.customerName} • {order.customerPhone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-amber-900">{formatPrice(order.finalTotal)}</p>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#1E1915]">Menu Products Manager</h2>
                  <p className="text-xs sm:text-sm text-[#6B5B4F]">
                    Add new food items, change descriptions, availability, and tags.
                  </p>
                </div>

                <button
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Products List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-sm flex items-start gap-4"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-20 h-20 rounded-xl object-cover bg-amber-50 shrink-0 border border-amber-100"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-sm text-[#1E1915] truncate">{p.name}</h4>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 shrink-0">
                          {p.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#6B5B4F] line-clamp-1">{p.description}</p>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="font-black text-amber-800">
                          {formatPrice(p.sizes[0]?.price || 0)}
                          {p.sizes.length > 1 && ` - ${formatPrice(p.sizes[p.sizes.length - 1].price)}`}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(p.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1 ${
                            p.isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {p.isAvailable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-600" />}
                          <span>{p.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditProduct(p)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[#1E1915] font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                          title="Edit Price, Image or Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit Item</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTarget({ id: p.id, name: p.name, type: 'product' })}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                          title="Delete Product from Cloud Database"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRICE MANAGER */}
          {activeTab === 'prices' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-[#1E1915]">Price Management</h2>
                <p className="text-xs sm:text-sm text-[#6B5B4F]">
                  Update every pizza size and snack price independently. Prices update instantly across customer views.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-amber-50 text-[#55473E] uppercase text-xs font-bold border-b border-amber-100">
                      <tr>
                        <th className="p-4">Item Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Sizes & Prices (₹ INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 font-medium">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-4 font-bold text-[#1E1915]">{p.name}</td>
                          <td className="p-4 uppercase text-xs text-amber-800 font-bold">{p.category}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              {p.sizes.map((s) => (
                                <div key={s.size} className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200">
                                  <span className="text-xs font-semibold text-[#6B5B4F]">{s.size}: ₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={s.price}
                                    onBlur={(e) => {
                                      const val = Number(e.target.value);
                                      if (val >= 0) {
                                        updateProductPrice(p.id, s.size, val);
                                      }
                                    }}
                                    className="w-16 px-1.5 py-0.5 rounded border border-amber-300 font-bold text-sm text-[#1E1915] focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS MANAGER */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#1E1915]">Customer Orders & Live Kitchen Manager</h2>
                  <p className="text-xs sm:text-sm text-[#6B5B4F]">
                    Real-time Firebase orders with sound alert notification, two-way live location tracking, and status pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => testOrderAlertSound()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Voice Alert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSoundMute()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSoundMuted
                        ? 'bg-neutral-200 text-neutral-600'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-600" />}
                    <span>{isSoundMuted ? 'Muted' : 'Sound Alert: Active'}</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs & View Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                  {[
                    { id: 'all', label: `All Orders (${orders.length})` },
                    { id: 'Pending', label: `Pending (${orders.filter((o) => isOrderMatchingFilter(o, 'Pending')).length})` },
                    { id: 'Preparing', label: `Preparing (${orders.filter((o) => isOrderMatchingFilter(o, 'Preparing')).length})` },
                    { id: 'Out for delivery', label: `Out for Delivery (${orders.filter((o) => isOrderMatchingFilter(o, 'Out for delivery')).length})` },
                    { id: 'Delivered', label: `Delivered (${orders.filter((o) => isOrderMatchingFilter(o, 'Delivered')).length})` },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      onClick={() => setOrderFilterStatus(flt.id)}
                      className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        orderFilterStatus === flt.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-white text-[#55473E] hover:bg-amber-50 border border-amber-200'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle: Sheet vs Cards */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-amber-200 shadow-xs self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setOrdersViewMode('sheet')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      ordersViewMode === 'sheet'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-[#55473E] hover:bg-amber-50'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Sheet View (शीट)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrdersViewMode('cards')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      ordersViewMode === 'cards'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-[#55473E] hover:bg-amber-50'
                    }`}
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                    <span>Cards View</span>
                  </button>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 bg-white rounded-3xl border border-amber-200 text-center space-y-2">
                  <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
                  <h3 className="font-extrabold text-base text-[#1E1915]">No orders received yet</h3>
                  <p className="text-xs text-[#6B5B4F]">
                    Customer orders generated via the website or WhatsApp will appear here automatically with loud voice alerts.
                  </p>
                </div>
              ) : ordersViewMode === 'sheet' ? (
                /* SHEET / TABLE VIEW (जैसे Excel / Zomato Kitchen Sheet) */
                <div className="bg-white rounded-3xl border border-amber-200 shadow-md overflow-hidden animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-amber-50/90 text-[#55473E] uppercase text-[11px] font-black border-b border-amber-200">
                        <tr>
                          <th className="p-3.5 whitespace-nowrap">Order ID & Time</th>
                          <th className="p-3.5 whitespace-nowrap">Customer Info</th>
                          <th className="p-3.5 whitespace-nowrap">Type</th>
                          <th className="p-3.5">Items Summary</th>
                          <th className="p-3.5 whitespace-nowrap">Bill Amount</th>
                          <th className="p-3.5 whitespace-nowrap">Payment</th>
                          <th className="p-3.5 whitespace-nowrap">Live Location</th>
                          <th className="p-3.5 whitespace-nowrap">Status</th>
                          <th className="p-3.5 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-medium">
                        {sortedOrders
                          .filter((ord) => isOrderMatchingFilter(ord, orderFilterStatus))
                          .map((order) => (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrderForModal(order)}
                              className="hover:bg-amber-50/60 transition-colors cursor-pointer group"
                            >
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="font-mono font-black text-amber-950 group-hover:text-amber-700 block">
                                  #{order.id}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <strong className="text-[#1E1915] block">{order.customerName}</strong>
                                <span className="text-neutral-500 font-mono text-[11px]">{order.customerPhone}</span>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-neutral-100 text-[#55473E]">
                                  {order.orderType === 'delivery' ? '🛵 Delivery' : '🛍️ Pickup'}
                                </span>
                              </td>
                              <td className="p-3.5 max-w-xs">
                                <p className="text-[11px] text-[#55473E] line-clamp-1">
                                  {order.items.map((i) => `${i.productName} (${i.size}×${i.quantity})`).join(', ')}
                                </p>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className="font-black text-amber-950 text-sm">
                                  {formatPrice(order.finalTotal)}
                                </span>
                              </td>
                              <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={order.paymentStatus || 'Pending'}
                                  onChange={(e) => updateOrderPaymentStatus(order.id, e.target.value as any)}
                                  className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-950 focus:outline-none"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Cash on Delivery">COD</option>
                                  <option value="Paid Online">Paid Online</option>
                                  <option value="Verified">Verified ✓</option>
                                </select>
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                {order.customerLocation ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    <span>📍 GPS Pinned</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-neutral-400">Text Address</span>
                                )}
                              </td>
                              <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                  className="px-2 py-1 rounded-lg border border-amber-300 bg-white text-[11px] font-bold text-[#1E1915] focus:outline-none"
                                >
                                  <option value="Pending">📝 Pending</option>
                                  <option value="Preparing">🍕 Preparing</option>
                                  <option value="Out for delivery">🛵 Out for Delivery</option>
                                  <option value="Delivered">✅ Delivered</option>
                                  <option value="Cancelled">❌ Cancelled</option>
                                </select>
                              </td>
                              <td className="p-3.5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderForModal(order);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs inline-flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                                >
                                  <span>🗺️ Details & Map</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* CARDS VIEW */
                <div className="space-y-6">
                  {sortedOrders
                    .filter((ord) => isOrderMatchingFilter(ord, orderFilterStatus))
                    .map((order) => {
                      const primaryStatuses: OrderStatus[] = [
                        'Pending',
                        'Preparing',
                        'Out for delivery',
                        'Delivered',
                        'Cancelled',
                      ];

                      return (
                        <div
                          key={order.id}
                          className="p-5 sm:p-7 rounded-3xl bg-white border-2 border-amber-200/90 shadow-md space-y-5 transition-all hover:border-amber-300"
                        >
                          {/* Order Header */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-amber-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base sm:text-lg font-black text-amber-950">
                                  #{order.id}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-xs text-[#8A7B70] mt-0.5">
                                Placed on {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>

                            {/* Status Quick Updater Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-[#55473E] mr-1">Status:</span>
                              {primaryStatuses.map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => updateOrderStatus(order.id, st)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    order.status === st
                                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/40 shadow-xs'
                                      : 'bg-neutral-100 hover:bg-amber-100 text-[#55473E]'
                                  }`}
                                >
                                  {st === 'Pending'
                                    ? '📝 Pending'
                                    : st === 'Preparing'
                                    ? '🍕 Preparing'
                                    : st === 'Out for delivery'
                                    ? '🛵 Out for Delivery'
                                    : st === 'Delivered'
                                    ? '✅ Delivered'
                                    : '❌ Cancelled'}
                                </button>
                              ))}

                              {/* Payment Status Dropdown */}
                              <div className="ml-2 flex items-center gap-1">
                                <span className="text-xs font-bold text-[#55473E]">Payment:</span>
                                <select
                                  value={order.paymentStatus || 'Pending'}
                                  onChange={(e) =>
                                    updateOrderPaymentStatus(order.id, e.target.value as any)
                                  }
                                  className="px-2 py-1 rounded-xl border border-amber-300 bg-amber-50 font-bold text-xs text-amber-950 focus:outline-none"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Cash on Delivery">Cash on Delivery</option>
                                  <option value="Paid Online">Paid Online</option>
                                  <option value="Verified">Verified ✓</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedOrderForModal(order)}
                                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Open Complete Order Details and Live Map"
                              >
                                <span>🗺️ Details & Live Map</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmTarget({
                                    id: order.id,
                                    name: `Order #${order.id} (${order.customerName})`,
                                    type: 'order',
                                  })
                                }
                                className="ml-auto px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Customer & Fulfillment Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2 p-4 rounded-2xl bg-[#FFFDF9] border border-amber-100">
                              <h4 className="font-extrabold text-sm text-[#1E1915]">Customer Details:</h4>
                              <p>
                                <strong>Name:</strong> {order.customerName}
                              </p>
                              <div className="flex items-center gap-2">
                                <strong>Phone:</strong> {order.customerPhone}
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] hover:bg-amber-200 inline-flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call</span>
                                </a>
                                <a
                                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-lg bg-[#25D366] text-white font-bold text-[11px] hover:bg-[#20bd5a] inline-flex items-center gap-1"
                                >
                                  <span>WhatsApp</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <p>
                                <strong>Order Type:</strong>{' '}
                                <span className="font-extrabold text-amber-900 uppercase">
                                  {order.orderType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}
                                </span>
                              </p>
                              {order.deliveryAddress && (
                                <p>
                                  <strong>Delivery Address:</strong> {order.deliveryAddress}
                                  {order.city ? `, ${order.city}` : ''}
                                  {order.pinCode ? ` - ${order.pinCode}` : ''}
                                </p>
                              )}
                              {order.instructions && (
                                <p className="text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200/80">
                                  <strong>Kitchen Instructions:</strong> {order.instructions}
                                </p>
                              )}
                            </div>

                            {/* Items & Payment snapshot */}
                            <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                              <h4 className="font-extrabold text-sm text-[#1E1915]">Items Breakdown:</h4>
                              <div className="divide-y divide-amber-100 space-y-1">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="pt-1 first:pt-0 flex justify-between">
                                    <span>
                                      • {item.productName} ({item.size} × {item.quantity})
                                      {item.addOns.length > 0 && (
                                        <span className="text-[10px] text-amber-700 block">
                                          + {item.addOns.join(', ')}
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-bold text-[#1E1915]">₹{item.totalPrice}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 border-t border-amber-200/80 space-y-1 text-[11px]">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span className="font-bold">₹{order.subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery Charge:</span>
                                  <span className="font-bold text-amber-800">
                                    {order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'Free Delivery'}
                                  </span>
                                </div>
                                <div className="flex justify-between font-black text-sm text-[#1E1915] pt-1 border-t border-amber-200">
                                  <span>Total Bill Amount:</span>
                                  <span className="text-base text-amber-900">{formatPrice(order.finalTotal)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Live Location Radar & Delivery Partner Tracking Section */}
                          {order.orderType === 'delivery' && (
                            <div className="space-y-2 pt-2">
                              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-amber-600" />
                                <span>Two-Way Live GPS Radar & Delivery Tracking:</span>
                              </h4>
                              <LiveOrderTracker order={order} isAdminView={true} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB: PUSH BROADCAST ALERTS */}
          {activeTab === 'broadcasts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-[#1E1915]">Push Broadcast Screen Alerts</h2>
                  <p className="text-xs sm:text-sm text-[#6B5B4F]">
                    Send instant mobile and desktop floating screen notification alerts with audio chime to all visitors.
                  </p>
                </div>
              </div>

              {/* Quick Template Presets */}
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-300 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>1-Click Alert Templates:</span>
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    {
                      title: '🍕 आज 20% की छूट! SK Pizza Point Special',
                      message: 'हमारे सभी मीडियम और लार्ज चीज़ बर्स्ट पिज़्ज़ा पर आज 20% का डिस्काउंट! अभी ऑर्डर करें।',
                      type: 'offer' as const,
                      badge: '20% OFF',
                      link: '/menu',
                    },
                    {
                      title: '🌧️ बारिश सूचना: डिलीवरी 10-15 मिनट लेट हो सकती है',
                      message: 'मौसम के कारण हमारे राइडर सुरक्षित रूप से आप तक पहुंच रहे हैं। गरम खाना जल्द पहुंचेगा!',
                      type: 'urgent' as const,
                      badge: 'WEATHER ALERT',
                      link: '/contact',
                    },
                    {
                      title: '🔥 गरमा-गरम ताज़ा चीज़ बर्स्ट पिज़्ज़ा तैयार!',
                      message: 'किचन में ताज़ा मोज़ेरेला चीज़ बर्स्ट पिज़्ज़ा तैयार हो रहे हैं। तुरंत ऑर्डर करें।',
                      type: 'offer' as const,
                      badge: 'HOT FRESH',
                      link: '/menu',
                    },
                    {
                      title: '⚡ फ्री डिलीवरी: ₹299 से ऊपर के ऑर्डर पर',
                      message: 'सीमित समय के लिए ₹299 से ऊपर के सभी होम डिलीवरी ऑर्डर पर डिलीवरी चार्ज एकदम मुफ़्त!',
                      type: 'offer' as const,
                      badge: 'FREE DELIVERY',
                      link: '/menu',
                    },
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewBroadcastTitle(tpl.title);
                        setNewBroadcastMessage(tpl.message);
                        setNewBroadcastType(tpl.type);
                        setNewBroadcastBadge(tpl.badge);
                        setNewBroadcastLink(tpl.link);
                        showToast(`Template "${tpl.badge}" applied to form!`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 font-bold text-[#1E1915] shadow-xs transition-colors cursor-pointer"
                    >
                      {tpl.badge}: {tpl.title.slice(0, 24)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Compose New Broadcast Form */}
              <form
                onSubmit={handleSendBroadcast}
                className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-amber-200 shadow-md space-y-4"
              >
                <h3 className="font-black text-base text-[#1E1915] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <span>Create & Push New Alert</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-extrabold uppercase text-[#1E1915]">
                      Notification Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 🍕 आज 20% की छूट! SK Pizza Point Special"
                      value={newBroadcastTitle}
                      onChange={(e) => setNewBroadcastTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold uppercase text-[#1E1915]">
                      Alert Category
                    </label>
                    <select
                      value={newBroadcastType}
                      onChange={(e) => setNewBroadcastType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-xs bg-white focus:outline-none"
                    >
                      <option value="offer">🔥 Special Offer</option>
                      <option value="update">📢 Restaurant Update</option>
                      <option value="urgent">🚨 Urgent Announcement</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold uppercase text-[#1E1915]">
                    Notification Message Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter the message that will pop up on customers' screens..."
                    value={newBroadcastMessage}
                    onChange={(e) => setNewBroadcastMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold uppercase text-[#1E1915]">
                      Target Action Link
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /menu or /contact"
                      value={newBroadcastLink}
                      onChange={(e) => setNewBroadcastLink(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold uppercase text-[#1E1915]">
                      Badge Label Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HOT DEAL, SPECIAL, DELAY"
                      value={newBroadcastBadge}
                      onChange={(e) => setNewBroadcastBadge(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>🚀 Push Screen Alert to All Users (सभी पर स्क्रीन अलर्ट भेजें)</span>
                  </button>
                </div>
              </form>

              {/* History of Sent Broadcasts */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-base text-[#1E1915]">Broadcast History & Active Alerts</h3>
                {broadcasts.length === 0 ? (
                  <div className="p-8 bg-white rounded-3xl border border-amber-200 text-center text-xs text-[#6B5B4F]">
                    No broadcast notifications sent yet. Use the form above to send an announcement.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcasts.map((bc) => (
                      <div
                        key={bc.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                bc.type === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : bc.type === 'offer'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {bc.badge || bc.type}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {new Date(bc.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#1E1915]">{bc.title}</h4>
                          <p className="text-xs text-[#55473E]">{bc.message}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmTarget({
                                id: bc.id,
                                name: `Broadcast "${bc.title}"`,
                                type: 'broadcast',
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: GALLERY MANAGER */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-[#1E1915]">Gallery Image Manager</h2>
                <p className="text-xs sm:text-sm text-[#6B5B4F]">
                  Add new image URLs, manage categories, captions, and remove photos.
                </p>
              </div>

              {/* Add image form */}
              <form onSubmit={handleAddGalleryImage} className="bg-white p-5 rounded-3xl border border-amber-200 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-sm text-[#1E1915]">Add Photo by URL</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="url"
                    required
                    placeholder="Image URL (e.g. https://i.imgur.com/...)"
                    value={newGalleryImgUrl}
                    onChange={(e) => setNewGalleryImgUrl(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title (e.g. Hot Mozzarella Pizza)"
                    value={newGalleryTitle}
                    onChange={(e) => setNewGalleryTitle(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Caption description"
                    value={newGalleryCaption}
                    onChange={(e) => setNewGalleryCaption(e.target.value)}
                    className="w-full sm:flex-1 px-4 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <select
                    value={newGalleryCategory}
                    onChange={(e) => setNewGalleryCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-amber-200 text-xs bg-white"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="pizza">Pizza</option>
                    <option value="burger">Burger</option>
                    <option value="sandwich">Sandwich</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors"
                  >
                    Add to Gallery
                  </button>
                </div>
              </form>

              {/* Gallery Items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm flex flex-col justify-between">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover" />
                    <div className="p-3 space-y-1">
                      <p className="font-extrabold text-xs text-[#1E1915] truncate">{item.title}</p>
                      <p className="text-[10px] text-[#6B5B4F] line-clamp-1">{item.caption}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmTarget({
                            id: item.id,
                            name: item.title || 'Gallery Photo',
                            type: 'gallery',
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[11px] text-red-600 font-bold inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: VIDEOS MANAGER */}
          {activeTab === 'videos' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-[#1E1915]">YouTube Video Manager</h2>
                <p className="text-xs sm:text-sm text-[#6B5B4F]">
                  Paste YouTube URLs, configure landscape or Shorts (9:16) format, and manage video listings.
                </p>
              </div>

              <form onSubmit={handleAddVideo} className="bg-white p-5 rounded-3xl border border-amber-200 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-sm text-[#1E1915]">Add YouTube Video</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="Title (e.g. Fresh Pizza Dough Prep)"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Short description"
                    value={newVideoDesc}
                    onChange={(e) => setNewVideoDesc(e.target.value)}
                    className="w-full sm:flex-1 px-4 py-2 rounded-xl border border-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <select
                    value={newVideoAspect}
                    onChange={(e) => setNewVideoAspect(e.target.value as '16:9' | '9:16')}
                    className="px-3 py-2 rounded-xl border border-amber-200 text-xs bg-white"
                  >
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Shorts / Portrait (9:16)</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors"
                  >
                    Publish Video
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((vid) => (
                  <div key={vid.id} className="bg-white rounded-2xl border border-amber-200 p-3 space-y-2 shadow-sm">
                    <img
                      src={`https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-36 object-cover rounded-xl bg-neutral-900"
                    />
                    <h4 className="font-extrabold text-xs text-[#1E1915] truncate">{vid.title}</h4>
                    <p className="text-[11px] text-[#6B5B4F] line-clamp-1">{vid.description}</p>
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {vid.aspectRatio}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmTarget({
                            id: vid.id,
                            name: vid.title || 'Video Reel',
                            type: 'video',
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[11px] text-red-600 font-bold inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-[#1E1915]">Customer Reviews Moderation</h2>
                <p className="text-xs sm:text-sm text-[#6B5B4F]">
                  Approve, publish, or remove customer feedback.
                </p>
              </div>

              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E1915]">{rev.customerName}</span>
                        <span className="text-amber-500 font-bold text-xs">★ {rev.rating}/5</span>
                      </div>
                      <p className="text-xs text-[#55473E]">"{rev.comment}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleReviewApproval(rev.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          rev.isApproved
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {rev.isApproved ? 'Published' : 'Hidden'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmTarget({
                            id: rev.id,
                            name: `Review by ${rev.customerName}`,
                            type: 'review',
                          })
                        }
                        className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold inline-flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: RESTAURANT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-[#1E1915]">Restaurant Branding & Settings</h2>
                <p className="text-xs sm:text-sm text-[#6B5B4F]">
                  Edit restaurant identity, phone numbers, WhatsApp, Instagram, and opening hours.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-md space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Restaurant Name</label>
                    <input
                      type="text"
                      value={tempSettings.restaurantName}
                      onChange={(e) => setTempSettings({ ...tempSettings, restaurantName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Tagline</label>
                    <input
                      type="text"
                      value={tempSettings.tagline}
                      onChange={(e) => setTempSettings({ ...tempSettings, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Logo Image URL</label>
                    <input
                      type="text"
                      value={tempSettings.logoUrl}
                      onChange={(e) => setTempSettings({ ...tempSettings, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Storefront Image URL</label>
                    <input
                      type="text"
                      value={tempSettings.heroImageUrl}
                      onChange={(e) => setTempSettings({ ...tempSettings, heroImageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">WhatsApp Order Number</label>
                    <input
                      type="text"
                      value={tempSettings.whatsAppNumber}
                      onChange={(e) => setTempSettings({ ...tempSettings, whatsAppNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Instagram Profile URL</label>
                    <input
                      type="text"
                      value={tempSettings.instagramUrl}
                      onChange={(e) => setTempSettings({ ...tempSettings, instagramUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Facebook URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/..."
                      value={tempSettings.facebookUrl}
                      onChange={(e) => setTempSettings({ ...tempSettings, facebookUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">YouTube Channel URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/..."
                      value={tempSettings.youtubeUrl}
                      onChange={(e) => setTempSettings({ ...tempSettings, youtubeUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Hero / Homepage Background Media Control */}
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-[#1E1915] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Homepage Background Media & Atmosphere</span>
                    </h3>
                    <p className="text-[11px] text-[#6B5B4F] mt-0.5">
                      Switch between looping high-def video or high-res photo background, and adjust the overlay lighting so the food is bright, mouthwatering, and appetizing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Background Mode
                      </label>
                      <select
                        value={tempSettings.homepageMediaType || 'video'}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            homepageMediaType: e.target.value as 'video' | 'image',
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-[#1E1915] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      >
                        <option value="video">🎥 Looping Video (.mp4)</option>
                        <option value="image">📸 High-Res Photo (Image URL)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Background Video URL (.mp4)
                      </label>
                      <input
                        type="url"
                        placeholder="https://.../video.mp4"
                        value={tempSettings.homepageVideoUrl || ''}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, homepageVideoUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Background Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://.../pizza-photo.jpg"
                        value={tempSettings.homepageImageUrl || ''}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, homepageImageUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Overlay Darkness & Lighting
                      </label>
                      <select
                        value={tempSettings.heroOverlayDarkness || 'balanced'}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            heroOverlayDarkness: e.target.value as 'subtle' | 'balanced' | 'cinematic',
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-[#1E1915] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      >
                        <option value="subtle">☀️ Subtle (Brightest — Maximum Food Visibility)</option>
                        <option value="balanced">✨ Balanced (Recommended — Golden Glow & Crisp Text)</option>
                        <option value="cinematic">🌙 Cinematic (Dark Contrast)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Video Fallback Poster URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://.../poster.jpg"
                        value={tempSettings.homepageVideoPosterUrl || ''}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, homepageVideoPosterUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1E1915] uppercase">Promotional Offers Banner Text</label>
                  <input
                    type="text"
                    placeholder="e.g. 🔥 Flat 20% OFF on Large Pizzas • Free Delivery on orders above ₹499"
                    value={tempSettings.offersText || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, offersText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Google Maps URL</label>
                    <input
                      type="text"
                      value={tempSettings.googleMapsUrl}
                      onChange={(e) => setTempSettings({ ...tempSettings, googleMapsUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">Operating Hours</label>
                    <input
                      type="text"
                      value={tempSettings.openingHours}
                      onChange={(e) => setTempSettings({ ...tempSettings, openingHours: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Charges & Free Delivery Threshold Config */}
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#1E1915] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <span>Delivery Fee & Free Delivery Threshold Configuration</span>
                      </h3>
                      <p className="text-[11px] text-[#6B5B4F] mt-0.5">
                        Set your delivery fee per order, and provide free delivery above a certain bill amount (e.g. Free Delivery above ₹499).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Standard Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tempSettings.deliveryFee ?? 30}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, deliveryFee: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-[#1E1915] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-[#8C7A6B]">
                        Amount added to delivery orders below threshold.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Free Delivery Above (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 499 (0 to disable free delivery)"
                        value={tempSettings.freeDeliveryThreshold ?? 499}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            freeDeliveryThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-[#1E1915] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-[#8C7A6B]">
                        Order bill ≥ this amount receives 100% Free Delivery.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1E1915] uppercase">
                        Minimum Order Value (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tempSettings.minOrderAmount ?? 100}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            minOrderAmount: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-[#1E1915] focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-[#8C7A6B]">Minimum subtotal required to place order.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1E1915] uppercase">
                      Delivery Charge Note / Terms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat ₹30 delivery charge (Free on orders above ₹499)"
                      value={tempSettings.deliveryFeeNote ?? ''}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, deliveryFeeNote: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1E1915]">
                      <input
                        type="checkbox"
                        checked={tempSettings.isDeliveryAvailable ?? true}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, isDeliveryAvailable: e.target.checked })
                        }
                        className="rounded text-amber-600 focus:ring-amber-400 w-4 h-4"
                      />
                      <span>Enable Home Delivery Service</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1E1915]">
                      <input
                        type="checkbox"
                        checked={tempSettings.isPickupAvailable ?? true}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, isPickupAvailable: e.target.checked })
                        }
                        className="rounded text-amber-600 focus:ring-amber-400 w-4 h-4"
                      />
                      <span>Enable Store Takeaway / Pickup</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-100 flex justify-end">
                  <button
                    onClick={() => updateSettings(tempSettings)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>

              {/* Firebase Realtime Database Security Rules Helper Card */}
              <div className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Firebase Realtime Database Rules (Fix PERMISSION_DENIED)</span>
                    </div>
                    <h3 className="text-base font-black text-[#1E1915]">
                      Fix "Cloud settings update failed: PERMISSION_DENIED"
                    </h3>
                    <p className="text-xs text-[#6B5B4F] max-w-2xl leading-relaxed">
                      Aapki website <strong>Realtime Database</strong> use karti hai (Firestore nahi). Firebase Console mein Realtime Database rules me <code className="bg-amber-50 px-1 py-0.5 rounded font-mono text-amber-900">".read": false, ".write": false</code> set hone ki wajah se changes block ho rahe the. Neeche diye gaye rules copy karke Firebase Console mein paste karein aur <strong>Publish</strong> karein.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={copyRulesToClipboard}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                        copiedRules
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {copiedRules ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Realtime Database Rules</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://console.firebase.google.com/project/sk-pizza-point/database/sk-pizza-point-default-rtdb/rules"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl border border-amber-200 text-[#1E1915] hover:bg-amber-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                    </a>
                  </div>
                </div>

                {/* Steps Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-semibold text-[#1E1915]">
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                    <span className="font-black text-amber-800">Step 1:</span>
                    <p className="text-[11px] text-[#6B5B4F]">Firebase Console me <strong>sk-pizza-point</strong> kholein.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                    <span className="font-black text-amber-800">Step 2:</span>
                    <p className="text-[11px] text-[#6B5B4F]">Left menu me <strong>Build &gt; Realtime Database</strong> par click karein.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                    <span className="font-black text-amber-800">Step 3:</span>
                    <p className="text-[11px] text-[#6B5B4F]">Upar <strong>Rules</strong> tab par jayein aur purana text delete karein.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                    <span className="font-black text-amber-800">Step 4:</span>
                    <p className="text-[11px] text-[#6B5B4F]">Yeh code Paste karein aur <strong>Publish</strong> button dabayein.</p>
                  </div>
                </div>

                {/* Code Preview Block */}
                <div className="relative rounded-2xl bg-neutral-900 p-4 font-mono text-[11px] text-amber-200 overflow-x-auto max-h-72 border border-neutral-800">
                  <pre>{rtdbRulesCode}</pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add New Product Modal */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-amber-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-black text-lg text-[#1E1915]">Create New Menu Item</h3>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1E1915]">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Tikka Pizza"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1915]">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white"
                  >
                    <option value="pizza">Pizza</option>
                    <option value="burger">Burger</option>
                    <option value="sandwich">Sandwich</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E1915]">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Chef Special"
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E1915]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Fresh veggies, melted cheese, signature spices..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E1915]">Food Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImg}
                  onChange={(e) => setNewProdImg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200"
                />
              </div>

              {/* Price configuration */}
              {newProdCategory === 'pizza' ? (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-[#1E1915]">Small (₹)</label>
                    <input
                      type="number"
                      value={newProdSmallPrice}
                      onChange={(e) => setNewProdSmallPrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-amber-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#1E1915]">Medium (₹)</label>
                    <input
                      type="number"
                      value={newProdMedPrice}
                      onChange={(e) => setNewProdMedPrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-amber-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#1E1915]">Large (₹)</label>
                    <input
                      type="number"
                      value={newProdLargePrice}
                      onChange={(e) => setNewProdLargePrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-amber-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  <label className="font-bold text-[#1E1915]">Initial Price (₹)</label>
                  <input
                    type="number"
                    value={newProdSmallPrice}
                    onChange={(e) => setNewProdSmallPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-[#1E1915] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT DETAILS (IMAGE, PRICE, SIZES, AVAILABILITY) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-amber-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div>
                <h3 className="font-black text-lg text-[#1E1915]">Edit Menu Item</h3>
                <p className="text-xs text-[#6B5B4F]">Update price, photo, description or availability</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1E1915]">Item Name *</label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1E1915]">Category</label>
                  <select
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="pizza">Pizza</option>
                    <option value="burger">Burger</option>
                    <option value="sandwich">Sandwich</option>
                    <option value="garlic-bread">Garlic Bread</option>
                    <option value="beverages">Beverages</option>
                    <option value="combos">Combos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1E1915]">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller, Must Try"
                    value={editProdBadge}
                    onChange={(e) => setEditProdBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E1915]">Description</label>
                <textarea
                  rows={2}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 resize-none focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1E1915]">Food Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editProdImg}
                    onChange={(e) => setEditProdImg(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  {editProdImg && (
                    <img
                      src={editProdImg}
                      alt="preview"
                      className="w-10 h-10 rounded-lg object-cover border border-amber-200 shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Price configuration */}
              {editProdCategory === 'pizza' ? (
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <span className="font-bold text-[#1E1915] block">Pizza Size Pricing (₹)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6B5B4F]">Small (7")</label>
                      <input
                        type="number"
                        min="1"
                        value={editProdSmallPrice}
                        onChange={(e) => setEditProdSmallPrice(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6B5B4F]">Medium (10")</label>
                      <input
                        type="number"
                        min="1"
                        value={editProdMedPrice}
                        onChange={(e) => setEditProdMedPrice(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#6B5B4F]">Large (12")</label>
                      <input
                        type="number"
                        min="1"
                        value={editProdLargePrice}
                        onChange={(e) => setEditProdLargePrice(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <label className="font-bold text-[#1E1915]">Item Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={editProdSmallPrice}
                    onChange={(e) => setEditProdSmallPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#1E1915]">
                  <input
                    type="checkbox"
                    checked={editProdAvailable}
                    onChange={(e) => setEditProdAvailable(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>In Stock / Available to Order</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#1E1915]">
                  <input
                    type="checkbox"
                    checked={editProdFeatured}
                    onChange={(e) => setEditProdFeatured(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>Feature on Homepage Specials</span>
                </label>
              </div>

              <div className="pt-4 border-t border-amber-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1E1915] font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save & Update Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SAFE DELETE CONFIRMATION MODAL (PREVENTS ACCIDENTAL DELETION) */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-red-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#1E1915]">Confirm Deletion</h3>
                <p className="text-xs text-[#6B5B4F]">Permission required before removing from cloud</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-[#55473E] space-y-2">
              <p>
                Kya aap waqai is item ko delete karna chahte hain?
              </p>
              <div className="p-2 rounded-xl bg-white border border-amber-200 font-extrabold text-[#1E1915] text-sm break-all">
                {deleteConfirmTarget.name}
              </div>
              <p className="text-[11px] text-rose-700">
                ⚠️ Confirm karte hi ye Firebase Realtime Database aur aapki live website se turant hamesha ke liye delete ho jayega.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1E1915] font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel / Radd Karein
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting from Cloud...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. Mobile Native App Bottom Navigation Bar (Android Partner App Layout - नीचे टाइटल/नेविगेशन बार) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#16120E] border-t-2 border-amber-500/40 px-2 py-1.5 flex items-center justify-around md:hidden shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'orders' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingBag className={`w-5 h-5 ${activeTab === 'orders' ? 'text-amber-400 scale-110' : ''}`} />
          <span className="text-[10px] font-bold">ऑर्डर ({orders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'products' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Utensils className={`w-5 h-5 ${activeTab === 'products' ? 'text-amber-400 scale-110' : ''}`} />
          <span className="text-[10px] font-bold">मेन्यू ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-amber-400 scale-110' : ''}`} />
          <span className="text-[10px] font-bold">होम</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcasts')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'broadcasts' ? 'text-amber-400 font-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Bell className={`w-5 h-5 ${activeTab === 'broadcasts' ? 'text-amber-400 scale-110' : ''}`} />
          <span className="text-[10px] font-bold">अलर्ट</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            ['prices', 'gallery', 'videos', 'reviews', 'settings'].includes(activeTab)
              ? 'text-amber-400 font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-bold">अन्य (More)</span>
        </button>
      </nav>

      {/* Mobile More Drawer / Sheet */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs md:hidden animate-fade-in">
          <div className="bg-[#1C1713] border-t-2 border-amber-400 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-black text-sm text-amber-400 uppercase tracking-wide">
                Admin More Features (अन्य विकल्प)
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded-xl bg-neutral-800 text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { id: 'prices', label: 'Price Manager', icon: DollarSign },
                { id: 'settings', label: 'Restaurant Settings', icon: Settings },
                { id: 'gallery', label: `Gallery (${gallery.length})`, icon: ImageIcon },
                { id: 'videos', label: `Videos (${videos.length})`, icon: VideoIcon },
                { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCur = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as AdminTab);
                      setIsMobileMoreOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isCur
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isCur ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  syncInitialDataToCloud();
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sync to Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Website</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COMPREHENSIVE ORDER DETAIL & LIVE ROUTE MAP MODAL */}
      {selectedOrderForModal && (
        <AdminOrderDetailModal
          order={selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
        />
      )}
    </div>
  );
};

export const AdminPage: React.FC = () => {
  return (
    <ErrorBoundary
      fallbackTitle="Admin Studio Error"
      fallbackMessage="Unable to load the admin console. Please refresh."
    >
      <AdminPageInternal />
    </ErrorBoundary>
  );
};
