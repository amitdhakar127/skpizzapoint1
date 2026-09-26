import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Pizza,
  Sandwich,
  UtensilsCrossed,
  Sparkles,
  Table,
  LayoutGrid,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { ProductCategory, Product } from '../types';

interface MenuPageProps {
  initialCategory?: ProductCategory | 'all';
}

export const MenuPage: React.FC<MenuPageProps> = ({ initialCategory = 'all' }) => {
  const { products, formatPrice, currentPath, navigate, addToCart } = useApp();

  // Determine active category from path e.g. /menu/pizza
  const activeCatFromUrl = useMemo<ProductCategory | 'all'>(() => {
    if (currentPath.includes('/menu/pizza')) return 'pizza';
    if (currentPath.includes('/menu/burger')) return 'burger';
    if (currentPath.includes('/menu/sandwich')) return 'sandwich';
    return initialCategory;
  }, [currentPath, initialCategory]);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>(activeCatFromUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Sync category if URL changes
  React.useEffect(() => {
    setSelectedCategory(activeCatFromUrl);
  }, [activeCatFromUrl]);

  const categories: { id: ProductCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All Items', icon: Sparkles },
    { id: 'pizza', label: 'Pizzas (6)', icon: Pizza },
    { id: 'burger', label: 'Burgers (3)', icon: UtensilsCrossed },
    { id: 'sandwich', label: 'Sandwiches (4)', icon: Sandwich },
  ];

  const handleCategoryChange = (catId: ProductCategory | 'all') => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      navigate('/menu');
    } else {
      navigate(`/menu/${catId}`);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        // Availability
        if (onlyAvailable && !p.isAvailable) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const getBasePrice = (prod: Product) => prod.sizes[0]?.price || 0;
        if (sortBy === 'price-asc') return getBasePrice(a) - getBasePrice(b);
        if (sortBy === 'price-desc') return getBasePrice(b) - getBasePrice(a);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, selectedCategory, onlyAvailable, searchQuery, sortBy]);

  const pizzaProducts = useMemo(() => products.filter((p) => p.category === 'pizza'), [products]);
  const burgerProducts = useMemo(() => products.filter((p) => p.category === 'burger'), [products]);
  const sandwichProducts = useMemo(() => products.filter((p) => p.category === 'sandwich'), [products]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Complete Restaurant Menu</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1E1915] tracking-tight">
            Handcrafted with Passion & Fresh Mozzarella
          </h1>
          <p className="text-sm sm:text-base text-[#6B5B4F]">
            Pizzas hand-stretched and stone-baked, burgers stacked with fresh patties, and crispy golden sandwiches.
            Select your portion and order straight to your doorstep on WhatsApp.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-200/80 shadow-md space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 border-b border-amber-100 pb-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`btn-menu-tab-${cat.id}`}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-400 scale-[1.02]'
                      : 'bg-neutral-50 text-[#55473E] hover:bg-amber-50 border border-neutral-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-amber-600'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search, Sort & View Mode controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search pizzas, paneer, sandwiches, burgers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Right filter toggles */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto text-xs">
              {/* Only in stock */}
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#55473E]">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                />
                <span>In-Stock Only</span>
              </label>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-amber-200 bg-white font-semibold text-xs text-[#1E1915] focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="default">Sort by: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>

              {/* View Toggle (Cards vs Table) */}
              <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'cards' ? 'bg-white shadow text-amber-700 font-bold' : 'text-neutral-500'
                  }`}
                  title="Card view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-white shadow text-amber-700 font-bold' : 'text-neutral-500'
                  }`}
                  title="Table view"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode 1: Responsive Product Cards */}
        {viewMode === 'cards' ? (
          <div>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-amber-200/80 space-y-3">
                <p className="text-3xl">🔍</p>
                <h3 className="font-extrabold text-lg text-[#1E1915]">No food items match your criteria</h3>
                <p className="text-xs text-[#6B5B4F]">Try adjusting your search query or removing the filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setOnlyAvailable(false);
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Professional Menu Price Tables */
          <div className="space-y-8">
            {/* Pizza Table */}
            {(selectedCategory === 'all' || selectedCategory === 'pizza') && (
              <div className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-md">
                <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pizza className="w-5 h-5 text-slate-950" />
                    <h3 className="font-black text-lg">A. PIZZA MENU (Small, Medium, Large)</h3>
                  </div>
                  <span className="text-xs font-extrabold bg-white/25 px-3 py-1 rounded-full">
                    6 Signature Pizzas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-50/70 border-b border-amber-100 text-xs uppercase font-extrabold text-[#55473E]">
                      <tr>
                        <th className="p-4">Pizza Type</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-center">Small</th>
                        <th className="p-4 text-center">Medium</th>
                        <th className="p-4 text-center">Large</th>
                        <th className="p-4 text-right">Quick Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 font-medium">
                      {pizzaProducts.map((p) => {
                        const smallPrice = p.sizes.find((s) => s.size === 'Small')?.price || 0;
                        const medPrice = p.sizes.find((s) => s.size === 'Medium')?.price || 0;
                        const largePrice = p.sizes.find((s) => s.size === 'Large')?.price || 0;

                        return (
                          <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-4 font-bold text-[#1E1915] flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.badge && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                                  {p.badge}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-xs text-[#6B5B4F] max-w-xs">{p.description}</td>
                            <td className="p-4 text-center font-bold text-amber-800">{formatPrice(smallPrice)}</td>
                            <td className="p-4 text-center font-bold text-amber-800">{formatPrice(medPrice)}</td>
                            <td className="p-4 text-center font-bold text-amber-800">{formatPrice(largePrice)}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => addToCart(p, 'Small', 1)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                              >
                                Order Small
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Burger Table */}
            {(selectedCategory === 'all' || selectedCategory === 'burger') && (
              <div className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-md">
                <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                    <h3 className="font-black text-lg">B. BURGER MENU</h3>
                  </div>
                  <span className="text-xs font-extrabold bg-white/20 px-3 py-1 rounded-full">
                    Crispy & Juicy
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-50/70 border-b border-amber-100 text-xs uppercase font-extrabold text-[#55473E]">
                      <tr>
                        <th className="p-4">Burger Type</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-center">Initial Price (Small)</th>
                        <th className="p-4 text-right">Quick Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 font-medium">
                      {burgerProducts.map((p) => {
                        const price = p.sizes[0]?.price || 0;
                        return (
                          <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-4 font-bold text-[#1E1915]">{p.name}</td>
                            <td className="p-4 text-xs text-[#6B5B4F]">{p.description}</td>
                            <td className="p-4 text-center font-bold text-amber-800">{formatPrice(price)}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => addToCart(p, 'Small', 1)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
                              >
                                Add to Cart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sandwich Table */}
            {(selectedCategory === 'all' || selectedCategory === 'sandwich') && (
              <div className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-md">
                <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sandwich className="w-5 h-5 text-white" />
                    <h3 className="font-black text-lg">C. SANDWICH MENU</h3>
                  </div>
                  <span className="text-xs font-extrabold bg-white/20 px-3 py-1 rounded-full">
                    Butter-Grilled Toast
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-50/70 border-b border-amber-100 text-xs uppercase font-extrabold text-[#55473E]">
                      <tr>
                        <th className="p-4">Sandwich Type</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-center">Initial Price (Small)</th>
                        <th className="p-4 text-right">Quick Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 font-medium">
                      {sandwichProducts.map((p) => {
                        const price = p.sizes[0]?.price || 0;
                        return (
                          <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-4 font-bold text-[#1E1915]">{p.name}</td>
                            <td className="p-4 text-xs text-[#6B5B4F]">{p.description}</td>
                            <td className="p-4 text-center font-bold text-amber-800">{formatPrice(price)}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => addToCart(p, 'Small', 1)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
                              >
                                Add to Cart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
