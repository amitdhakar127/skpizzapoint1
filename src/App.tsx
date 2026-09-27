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
import { BroadcastAlertBanner } from './components/BroadcastAlertBanner';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

const AppContent: React.FC = () => {
  const { currentPath } = useApp();

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
      <div className="min-h-screen bg-[#FDFBF7] text-[#1E1915]">
        {renderCurrentPage()}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#1E1915] font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Top navigation header */}
      <Header />

      {/* Main page view */}
      <main className="flex-1 pb-16">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Overlays & Utilities */}
      <BroadcastAlertBanner />
      <CartDrawer />
      <ProductDetailModal />
      <FloatingWhatsApp />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
