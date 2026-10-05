import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { ToastContainer } from './components/Toast';

// Pages
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { GalleryPage } from './pages/GalleryPage';
import { VideosPage } from './pages/VideosPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ContactPage } from './pages/ContactPage';
import { CustomerAuthPage } from './pages/CustomerAuthPage';
import { AccountPage } from './pages/AccountPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { BroadcastAlertBanner } from './components/BroadcastAlertBanner';
import { GlobalSirenAlertBanner } from './components/GlobalSirenAlertBanner';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { currentPath, isAdmin } = useApp();

  const isAdminRoute = currentPath === '/admin';
  const isAdminLoginRoute = currentPath === '/admin/login';

  // Render current view
  const renderCurrentPage = () => {
    if (isAdminLoginRoute) {
      return <AdminLoginPage />;
    }

    if (isAdminRoute) {
      return <AdminPage />;
    }

    if (currentPath === '/login' || currentPath === '/register') {
      return <CustomerAuthPage />;
    }

    if (currentPath === '/account') {
      return <AccountPage />;
    }

    if (currentPath === '/my-orders' || currentPath === '/orders') {
      return <MyOrdersPage />;
    }

    if (
      currentPath.startsWith('/track') ||
      currentPath.startsWith('track-') ||
      currentPath.includes('track-')
    ) {
      const cleanParam = currentPath.replace(/^\/?track[\/-]?/, '').replace(/^#/, '');
      return <OrderTrackingPage orderIdParam={cleanParam} />;
    }

    if (currentPath.startsWith('/menu')) {
      return <MenuPage />;
    }

    if (currentPath === '/cart') {
      return <CartPage />;
    }

    if (currentPath === '/checkout') {
      return <CheckoutPage />;
    }

    if (currentPath === '/gallery') {
      return <GalleryPage />;
    }

    if (currentPath === '/videos') {
      return <VideosPage />;
    }

    if (currentPath === '/reviews') {
      return <ReviewsPage />;
    }

    if (currentPath === '/contact') {
      return <ContactPage />;
    }

    // Default: Home Page
    return <HomePage />;
  };

  if (isAdminRoute || isAdminLoginRoute) {
    return (
      <ErrorBoundary
        key={currentPath}
        resetKey={currentPath}
        fallbackTitle="Admin Section Safe Mode"
        fallbackMessage="Admin panel view protected. Your orders and menu settings are securely saved."
      >
        <div className="min-h-screen bg-[#FDFBF7] text-[#1E1915]">
          <GlobalSirenAlertBanner />
          {renderCurrentPage()}
          <ToastContainer />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#1E1915] font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Global Repeating Siren Alert Banner across all screens: ONLY for verified Admin */}
      {isAdmin && <GlobalSirenAlertBanner />}

      {/* Top navigation header */}
      <Header />

      {/* Main page view protected by ErrorBoundary with auto-recovery per route */}
      <main className="flex-1 pb-16">
        <ErrorBoundary
          key={currentPath}
          resetKey={currentPath}
          fallbackTitle="Page Content Safe Mode"
          fallbackMessage="The page layout and navigation remain fully intact. Your session and orders are safe."
        >
          {renderCurrentPage()}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Overlays & Utilities */}
      <ErrorBoundary fallbackTitle="Notification Alert Protected">
        <BroadcastAlertBanner />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Cart Drawer Protected">
        <CartDrawer />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Product Modal Protected">
        <ProductDetailModal />
      </ErrorBoundary>
      <FloatingWhatsApp />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary isRoot={true} fallbackTitle="SK Pizza Point Safe Mode" fallbackMessage="Website protected by resilient error boundary. Your data and layout remain active.">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
