export type ProductCategory = 'pizza' | 'burger' | 'sandwich';

export type PizzaSize = 'Small' | 'Medium' | 'Large';

export interface SizePrice {
  size: PizzaSize | 'Standard';
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  imageUrl: string;
  // For pizzas: Small, Medium, Large. For burgers/sandwiches: Small default
  sizes: SizePrice[];
  availableAddOns?: AddOn[];
  isAvailable: boolean;
  isFeatured?: boolean;
  badge?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique item instance id
  productId: string;
  productName: string;
  category: ProductCategory;
  imageUrl: string;
  selectedSize: PizzaSize | 'Standard';
  unitPrice: number;
  quantity: number;
  selectedAddOns: AddOn[];
  specialInstructions?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Out for delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Awaiting WhatsApp submission'
  | 'Received'
  | 'Confirmed by restaurant'
  | 'Ready'
  | 'Completed'
  | 'Draft';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // accuracy in meters
  addressText?: string;
  googleMapsLink?: string;
  updatedAt: string;
  heading?: number | null;
  speed?: number | null;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: 'offer' | 'update' | 'urgent';
  link?: string;
  badge?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  sentBy?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  category: ProductCategory;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addOns: string[];
}

export interface Order {
  id: string; // e.g. SKP-20260919-482910
  userId?: string; // UID of logged in customer or 'guest'
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  city?: string;
  pinCode?: string;
  instructions?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  finalTotal: number;
  paymentMode?: string;
  paymentStatus?: 'Pending' | 'Cash on Delivery' | 'Paid Online' | 'Verified';
  status: OrderStatus;
  customerLocation?: LiveLocation;
  deliveryRiderLocation?: LiveLocation;
  deliveryRiderActive?: boolean;
  createdAt: string;
  updatedAt: string;
  whatsAppOpenedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  defaultAddress?: string;
  city?: string;
  pinCode?: string;
  createdAt?: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  caption: string;
  altText: string;
  category?: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface VideoItem {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  aspectRatio: '16:9' | '9:16';
  sortOrder: number;
  isPublished: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  validFrom: string;
  validUntil: string;
  eligibleProducts: string[];
  isActive: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  heroImageUrl: string;
  homepageMediaType?: 'video' | 'image' | 'auto';
  homepageVideoUrl?: string;
  homepageImageUrl?: string;
  homepageVideoPosterUrl?: string;
  heroOverlayDarkness?: 'subtle' | 'balanced' | 'cinematic';
  offersText?: string;
  aboutStory: string;
  speciality: string;
  address: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl?: string;
  whatsAppNumber: string;
  whatsAppDirectLink: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  openingHours: string;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  deliveryFee: number; // 0 if free or to be confirmed
  freeDeliveryThreshold?: number; // e.g. 499 for free delivery above ₹499
  deliveryFeeNote: string;
  minOrderAmount: number;
  adminPasscode: string;
}
