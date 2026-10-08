// Google Analytics 4 (GA4) Conversion & Pageview Tracking Helper
// Set up to count pizza order submissions as a 'Purchase' / 'Lead' conversion event

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    GA_MEASUREMENT_ID?: string;
  }
}

/**
 * Tracks a screen/page view in GA4
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });
    }
  } catch (err) {
    // Silent fallback so analytics never breaks user flow
    console.warn('[GA4] trackPageView error:', err);
  }
};

/**
 * Tracks a completed pizza order as a key conversion in GA4 (Purchase & Lead event)
 * Fires standard e-commerce 'purchase' and custom 'pizza_order_placed' event
 */
export const trackPizzaOrderConversion = (order: {
  id: string;
  finalTotal: number;
  items?: Array<{
    productName: string;
    size?: string;
    quantity: number;
    totalPrice: number;
  }>;
  orderType?: string;
}) => {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const itemsList = (order.items || []).map((item, index) => ({
        item_id: `item-${index + 1}`,
        item_name: item.productName || 'Pizza',
        item_variant: item.size || 'Standard',
        price: item.totalPrice && item.quantity ? Math.round(item.totalPrice / item.quantity) : 0,
        quantity: item.quantity || 1,
      }));

      // 1. Standard GA4 e-commerce purchase event
      window.gtag('event', 'purchase', {
        transaction_id: order.id,
        value: order.finalTotal,
        currency: 'INR',
        shipping: 0,
        items: itemsList,
        order_type: order.orderType || 'delivery',
      });

      // 2. Custom lead/order event for easy goal conversion setup
      window.gtag('event', 'generate_lead', {
        currency: 'INR',
        value: order.finalTotal,
        lead_type: 'pizza_order',
        order_id: order.id,
      });

      console.info(`[GA4] Successfully tracked Order Conversion for Order #${order.id} (₹${order.finalTotal})`);
    }
  } catch (err) {
    console.warn('[GA4] trackPizzaOrderConversion error:', err);
  }
};
