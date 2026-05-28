// app/dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../lib/auth";
import { apiGet, apiPost } from "../../lib/api";
import {
  Coffee,
  ShoppingBag,
  Search,
  Bell,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  availability_status: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Loyalty & Discount
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [customerError, setCustomerError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedCats = await apiGet<Category[]>("/api/v1/categories");
        setCategories(fetchedCats);

        const fetchedProds = await apiGet<Product[]>("/api/v1/products");
        setProducts(fetchedProds);
      } catch (err) {
        console.error("Failed to load POS data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter products by selected category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && p.availability_status;
  });

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        alert(`Cannot add more. Only ${product.stock_quantity} items in stock.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock_quantity < 1) {
        alert("Product is out of stock!");
        return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_quantity) {
              alert(`Only ${item.product.stock_quantity} items in stock.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = subtotal * (appliedCoupon.discount_value / 100);
    } else {
      discount = appliedCoupon.discount_value;
    }
    if (discount > subtotal) discount = subtotal;
  }

  const tax = (subtotal - discount) * 0.1; // 10% tax
  const total = subtotal - discount + tax;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError("");
    try {
      const coupon = await apiGet<any>(`/api/v1/coupons/validate/${encodeURIComponent(couponCode)}`);
      setAppliedCoupon(coupon);
    } catch (err: any) {
      setCouponError(err.message || "Invalid or inactive coupon code");
    }
  };

  const handleLookupCustomer = async () => {
    if (!customerPhone) return;
    setCustomerError("");
    setCustomer(null);
    try {
      const found = await apiGet<any>(`/api/v1/customers/search?phone=${encodeURIComponent(customerPhone)}`);
      setCustomer(found);
    } catch (err: any) {
      setCustomerError(err.message || "No customer found with this phone");
    }
  };

  const handleCheckout = async (method: "cash" | "card" | "qr") => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setOrderSuccess(null);
    try {
      // 1. Create order on the backend
      const orderPayload = {
        customer_id: customer ? customer.id : null,
        customer_name: customer ? customer.name : "Guest Client",
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        order_type: "takeaway",
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const order = await apiPost<any>("/api/v1/orders", orderPayload);

      // 2. Create payment on the backend
      const paymentPayload = {
        payment_method: method,
        amount_paid: total,
      };

      await apiPost<any>(`/api/v1/payments/${order.id}`, paymentPayload);

      // Refresh stock values locally
      const fetchedProds = await apiGet<Product[]>("/api/v1/products");
      setProducts(fetchedProds);

      setOrderSuccess(order.order_number);
      clearCart();
      setCustomer(null);
      setCustomerPhone("");
    } catch (err: any) {
      alert(err.message || "Failed to process order checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 py-4.5">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search coffee or baked goods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 outline-none focus:border-[#82542a] focus:ring-4 focus:ring-[#82542a]/10"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="text-gray-500 hover:text-black">
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#82542a] flex items-center justify-center text-white font-bold uppercase text-sm">
                {user ? user.full_name.charAt(0) : "C"}
              </div>

              <div>
                <p className="font-semibold text-sm">
                  {user ? user.full_name : "Store Cashier"}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  {user ? user.role : "Cashier"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1">
          {orderSuccess && (
            <div className="mb-6 flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-100 p-4.5 rounded-2xl animate-fade-in shadow-sm">
              <CheckCircle2 size={24} className="text-emerald-600" />
              <div>
                <p className="font-bold">Checkout Successful!</p>
                <p className="text-sm">Order <span className="font-semibold">{orderSuccess}</span> has been processed and sent to the kitchen.</p>
              </div>
            </div>
          )}

          {/* Categories bar */}
          <div className="mb-8 overflow-x-auto flex gap-3 pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition shrink-0 ${
                selectedCategory === "all"
                  ? "bg-[#2d241e] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-[#2d241e] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#170f0a]">
              Menu Selection
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Select items to add to the order
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#82542a]" size={36} />
              <p className="text-gray-500 font-medium">Loading store menu...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed rounded-2xl p-8">
              <p className="text-gray-500 font-semibold">No items match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition hover:-translate-y-1 hover:shadow-xl flex flex-col h-full group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 w-full shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-50 text-amber-800">
                        <Coffee size={36} />
                      </div>
                    )}

                    <div className="absolute right-3 top-3 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-sm font-bold text-[#82542a] shadow-sm">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#170f0a] line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {product.description || "Freshly served barista product."}
                      </p>
                    </div>

                    <div className="mt-3 flex justify-between items-center border-t border-gray-50 pt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        product.stock_quantity <= 10 
                          ? "bg-amber-50 text-amber-700" 
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {product.stock_quantity} available
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart Sidebar */}
      <aside className="hidden xl:flex w-[400px] flex-col border-l border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="border-b border-gray-200 p-6 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#170f0a]">
              Current Ticket
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Dine-in or Takeaway Terminal
          </p>
        </div>

        {/* Cart items */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3">
              <ShoppingBag size={48} className="stroke-[1.5]" />
              <p className="text-sm font-medium">Ticket is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100"
              >
                <div className="relative w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-50 text-amber-700">
                      <Coffee size={16} />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {item.product.name}
                    </h3>
                    <span className="font-bold text-sm shrink-0">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-2.5">
                    ${item.product.price.toFixed(2)} each
                  </p>

                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-gray-50 active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-gray-50 active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Loyalty & Coupon Integrations */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4 shrink-0 bg-gray-50/50">
            {/* Loyalty Lookup */}
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Loyalty phone number..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#82542a]"
                />
                <button
                  onClick={handleLookupCustomer}
                  className="text-xs font-semibold px-4 py-2 border rounded-xl hover:bg-white transition"
                >
                  Lookup
                </button>
              </div>
              {customer && (
                <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-100">
                  <p className="font-bold">{customer.name}</p>
                  <p>Points: {customer.loyalty_points}</p>
                </div>
              )}
              {customerError && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">{customerError}</p>
              )}
            </div>

            {/* Coupon Application */}
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#82542a]"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="text-xs font-semibold px-4 py-2 border rounded-xl hover:bg-white transition"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 flex justify-between">
                  <span>Coupon {appliedCoupon.code} applied!</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-red-500 font-bold">X</button>
                </div>
              )}
              {couponError && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">{couponError}</p>
              )}
            </div>
          </div>
        )}

        {/* Checkout & Totalizer */}
        <div className="border-t border-gray-200 p-6 shrink-0 bg-white">
          <div className="mb-5 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-amber-600 font-medium">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold text-[#82542a]">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => handleCheckout("cash")}
              disabled={checkoutLoading || cart.length === 0}
              className="flex flex-col h-14 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition text-xs font-bold text-gray-700 disabled:opacity-50"
            >
              <Banknote size={18} className="mb-1 text-gray-400" />
              Cash
            </button>
            <button
              onClick={() => handleCheckout("card")}
              disabled={checkoutLoading || cart.length === 0}
              className="flex flex-col h-14 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition text-xs font-bold text-gray-700 disabled:opacity-50"
            >
              <CreditCard size={18} className="mb-1 text-gray-400" />
              Card
            </button>
            <button
              onClick={() => handleCheckout("qr")}
              disabled={checkoutLoading || cart.length === 0}
              className="flex flex-col h-14 items-center justify-center rounded-xl border border-[#82542a] bg-[#82542a]/5 hover:bg-[#82542a]/10 active:scale-95 transition text-xs font-bold text-[#82542a] disabled:opacity-50"
            >
              <QrCode size={18} className="mb-1 text-[#82542a]" />
              QR Pay
            </button>
          </div>

          <button
            onClick={() => handleCheckout("cash")}
            disabled={checkoutLoading || cart.length === 0}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#170f0a] text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing Ticket...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Checkout Total: ${total.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}