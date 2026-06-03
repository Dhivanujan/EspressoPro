// app/dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../lib/auth";
import { apiGet, apiPost, getProductImageUrl } from "../../lib/api";
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
  X,
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

  // Responsive Drawer & Receipt Modal States
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Loyalty & Discount
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Record<string, any> | null>(null);
  const [couponError, setCouponError] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customer, setCustomer] = useState<Record<string, any> | null>(null);
  const [customerError, setCustomerError] = useState("");

  // Simulated QR Code Scanner States
  const [scanning, setScanning] = useState(false);

  // Split Payments
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");
  const [splitQR, setSplitQR] = useState("");
  const [splitPoints, setSplitPoints] = useState("");

  // Celebratory Upgrade Popup Data
  const [celebrationData, setCelebrationData] = useState<{
    pointsEarned: number;
    pointsRedeemed: number;
    tierUpgraded: boolean;
    oldTier: string;
    newTier: string;
    customerName: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedCats = await apiGet<Category[]>("/api/v1/categories");
        setCategories(fetchedCats);

        const fetchedProds = await apiGet<Product[]>("/api/v1/products");
        const formattedProds = fetchedProds.map((p) => ({
          ...p,
          price: Number(p.price),
        }));
        setProducts(formattedProds);
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

  // Real-time dynamic points calculations
  const calculatePointsToEarn = () => {
    if (!customer) return 0;
    const ptsRedeemedVal = parseFloat(splitPoints) || 0;
    const grossPaid = Math.max(0, total - ptsRedeemedVal);
    
    // Tier multipliers Bronze: 1.0x, Silver: 1.1x, Gold: 1.25x, Platinum: 1.5x
    const multipliers: Record<string, number> = {
      Bronze: 1.0,
      Silver: 1.1,
      Gold: 1.25,
      Platinum: 1.5
    };
    
    const tierMultiplier = multipliers[customer.tier] || 1.0;
    
    // Check if there is an active double points multiplier (seasonal or holiday)
    const activeCampaignMultiplier = 1.0; 
    const pointsCalculated = (grossPaid / 100) * tierMultiplier * activeCampaignMultiplier;
    return Math.floor(pointsCalculated);
  };

  const pointsToEarn = calculatePointsToEarn();

  // Play audio beep for visually simulated scan
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(1300, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep suppressed by browser policies");
    }
  };

  // Simulate Member visual QR Scanning Mockup
  const handleSimulateScan = () => {
    setScanning(true);
    setCustomerError("");
    setCustomer(null);
    setTimeout(async () => {
      setScanning(false);
      playScanBeep();
      // Auto-targets Bob Jones (+15550288) or fallback Alice Smith (+15550199)
      const scannedPhone = "+15550288";
      setCustomerPhone(scannedPhone);
      try {
        const found = await apiGet<any>(`/api/v1/customers/search?phone=${encodeURIComponent(scannedPhone)}`);
        setCustomer(found);
      } catch (err: any) {
        setCustomerError(err.message || "Simulated scan customer phone lookup failed");
      }
    }, 1200);
  };

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

  const handleCheckout = async (method: "cash" | "card" | "qr" | "split") => {
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

      // 2. Formulate payment splits or single settlement
      let paymentPayload: Record<string, any> = {};
      let splitsArray = [];

      if (method === "split") {
        const cashVal = parseFloat(splitCash) || 0;
        const cardVal = parseFloat(splitCard) || 0;
        const qrVal = parseFloat(splitQR) || 0;
        const pointsVal = parseFloat(splitPoints) || 0;
        
        if (cashVal > 0) splitsArray.push({ payment_method: "cash", amount_paid: cashVal });
        if (cardVal > 0) splitsArray.push({ payment_method: "card", amount_paid: cardVal });
        if (qrVal > 0) splitsArray.push({ payment_method: "qr", amount_paid: qrVal });
        if (pointsVal > 0) splitsArray.push({ payment_method: "points", amount_paid: pointsVal });

        // Sum split balances
        const sumSplitsPaid = cashVal + cardVal + qrVal + pointsVal;
        if (sumSplitsPaid < total) {
          alert(`Split payments sum of $${sumSplitsPaid.toFixed(2)} is less than total $${total.toFixed(2)}`);
          setCheckoutLoading(false);
          return;
        }

        paymentPayload = {
          payment_method: "split",
          amount_paid: sumSplitsPaid,
          splits: splitsArray
        };
      } else {
        paymentPayload = {
          payment_method: method,
          amount_paid: total,
        };
      }

      // 3. Process payment
      const paymentResponse = await apiPost<any>(`/api/v1/payments/${order.id}`, paymentPayload);

      // Calculate amount paid and change for cash
      let amountPaid = total;
      let changeAmount = 0;
      
      if (method === "split") {
        const cashVal = parseFloat(splitCash) || 0;
        const nonCash = (parseFloat(splitCard) || 0) + (parseFloat(splitQR) || 0) + (parseFloat(splitPoints) || 0);
        const cashNeeded = Math.max(0, total - nonCash);
        if (cashVal > cashNeeded) {
          changeAmount = cashVal - cashNeeded;
        }
        amountPaid = cashVal + nonCash;
      } else if (method === "cash") {
        const rounded = Math.ceil(total / 5) * 5;
        amountPaid = rounded;
        changeAmount = rounded - total;
      }

      // Check points details for celebratory popup
      const earned = paymentResponse.points_earned || 0;
      const redeemed = paymentResponse.points_redeemed || 0;
      const upgraded = paymentResponse.tier_upgraded || false;
      const oldT = paymentResponse.old_tier || "Bronze";
      const newT = paymentResponse.new_tier || "Bronze";

      if (customer && (earned > 0 || redeemed > 0 || upgraded)) {
        setCelebrationData({
          pointsEarned: earned,
          pointsRedeemed: redeemed,
          tierUpgraded: upgraded,
          oldTier: oldT,
          newTier: newT,
          customerName: customer.name
        });
      }

      setReceiptData({
        orderNumber: order.order_number,
        items: [...cart],
        subtotal: subtotal,
        discount: discount,
        couponCode: appliedCoupon ? appliedCoupon.code : "NONE",
        tax: tax,
        total: total,
        paymentMethod: method === "split" ? "SPLIT TRANSACTION" : method,
        amountPaid: amountPaid,
        changeAmount: changeAmount,
        timestamp: new Date().toLocaleString(),
      });

      // Refresh stock values locally
      const fetchedProds = await apiGet<Product[]>("/api/v1/products");
      const formattedProds = fetchedProds.map((p) => ({
        ...p,
        price: Number(p.price),
      }));
      setProducts(formattedProds);

      setOrderSuccess(order.order_number);
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setOrderSuccess(null), 5000);
      clearCart();
      setCustomer(null);
      setCustomerPhone("");
      setIsSplitMode(false);
      setSplitCash("");
      setSplitCard("");
      setSplitQR("");
      setSplitPoints("");
      setCartDrawerOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to process order checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderCart = (isDrawer = false) => {
    // Check if splits cover the total
    const cashVal = parseFloat(splitCash) || 0;
    const cardVal = parseFloat(splitCard) || 0;
    const qrVal = parseFloat(splitQR) || 0;
    const pointsVal = parseFloat(splitPoints) || 0;
    const totalSplits = cashVal + cardVal + qrVal + pointsVal;
    const remainingSplit = Math.max(0, total - totalSplits);

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Only show header inside aside if it is NOT the drawer */}
        {!isDrawer && (
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
        )}

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
                      src={getProductImageUrl(item.product.image_url)}
                      alt={item.product.name}
                      fill
                      className="object-contain"
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-gray-50 active:scale-95 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-gray-50 active:scale-95 transition"
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
                  className="flex-1 text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
                />
                <button
                  onClick={handleLookupCustomer}
                  className="text-xs font-bold px-3 py-2 border rounded-xl hover:bg-white transition bg-gray-50 hover:shadow-xs active:scale-95 shrink-0"
                >
                  Lookup
                </button>
                <button
                  onClick={handleSimulateScan}
                  className="text-xs font-bold px-3 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-coffee-500 rounded-xl transition hover:shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <QrCode size={13} />
                  Scan QR
                </button>
              </div>
              
              {customer && (
                <div className="mt-2 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 animate-scale-up flex justify-between items-center shadow-xs">
                  <div>
                    <p className="font-bold flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        customer.tier === "Platinum" ? "bg-purple-500 animate-pulse" :
                        customer.tier === "Gold" ? "bg-amber-500" :
                        customer.tier === "Silver" ? "bg-gray-400" : "bg-orange-400"
                      }`} />
                      {customer.name}
                    </p>
                    <p className="mt-0.5 text-emerald-600">Points: <span className="font-bold">{customer.loyalty_points}</span> • Tier: <span className="font-semibold uppercase text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">{customer.tier || "Bronze"}</span></p>
                  </div>
                  {pointsToEarn > 0 && (
                    <div className="text-right shrink-0 bg-amber-500 text-white rounded-lg px-2 py-1 font-bold animate-pulse text-[10px] shadow-xs">
                      +{pointsToEarn} pts to earn!
                    </div>
                  )}
                </div>
              )}
              {customerError && (
                <p className="text-[10px] text-red-500 mt-1 font-semibold">{customerError}</p>
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
                  className="flex-1 text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="text-xs font-bold px-4 py-2 border rounded-xl hover:bg-white transition bg-gray-50 hover:shadow-xs active:scale-95"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-100 flex justify-between items-center animate-scale-up">
                  <span className="font-medium">Coupon {appliedCoupon.code} applied!</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-red-500 font-bold hover:bg-red-100 rounded p-0.5 px-1.5 transition">X</button>
                </div>
              )}
              {couponError && (
                <p className="text-[10px] text-red-500 mt-1 font-semibold">{couponError}</p>
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
              <div className="flex justify-between text-sm text-amber-600 font-bold animate-scale-up">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-base font-extrabold text-coffee-950">Total</span>
              <span className="text-xl font-extrabold text-coffee-500">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Split Payment Section Toggle */}
          {cart.length > 0 && (
            <div className="mb-3.5 border border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
              <button
                onClick={() => setIsSplitMode(!isSplitMode)}
                className="w-full flex justify-between items-center p-3 text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                <span>{isSplitMode ? "🔒 Use Single Payment Method" : "💸 Configure Split Payment"}</span>
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                  {isSplitMode ? "Splits Active" : "Click to Split"}
                </span>
              </button>

              {isSplitMode && (
                <div className="p-3 border-t border-dashed border-gray-200 bg-white space-y-2.5 animate-scale-up">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Cash Amount ($)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Card Amount ($)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitCard}
                        onChange={(e) => setSplitCard(e.target.value)}
                        className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">QR Amount ($)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitQR}
                        onChange={(e) => setSplitQR(e.target.value)}
                        className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Points Value ($)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        disabled={!customer}
                        value={splitPoints}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (customer && val > customer.loyalty_points) {
                            setSplitPoints(customer.loyalty_points.toString());
                          } else {
                            setSplitPoints(e.target.value);
                          }
                        }}
                        className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed font-bold"
                      />
                      {!customer && (
                        <span className="text-[8px] text-amber-600 block mt-0.5 font-medium">Scan member to pay with points</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-gray-100">
                    <span className="font-semibold text-gray-400">Total Configured:</span>
                    <span className="font-bold text-gray-700">${totalSplits.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-400">Remaining to Cover:</span>
                    <span className={`font-bold ${remainingSplit > 0 ? "text-red-500 animate-pulse" : "text-emerald-600 font-extrabold"}`}>
                      ${remainingSplit.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isSplitMode ? (
            <>
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
                  className="flex flex-col h-14 items-center justify-center rounded-xl border border-coffee-500 bg-coffee-500/5 hover:bg-coffee-500/10 active:scale-95 transition text-xs font-bold text-coffee-500 disabled:opacity-50"
                >
                  <QrCode size={18} className="mb-1 text-coffee-500" />
                  QR Pay
                </button>
              </div>

              <button
                onClick={() => handleCheckout("cash")}
                disabled={checkoutLoading || cart.length === 0}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#170f0a] text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 font-sans"
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
            </>
          ) : (
            <button
              onClick={() => handleCheckout("split")}
              disabled={checkoutLoading || cart.length === 0 || remainingSplit > 0.01}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-coffee-500 hover:bg-coffee-600 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-50 font-sans shadow-md"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing Splits...
                </>
              ) : remainingSplit > 0.01 ? (
                <>Configure Remaining (${remainingSplit.toFixed(2)})</>
              ) : (
                <>
                  <CheckCircle2 size={18} className="text-white" />
                  Complete Split Checkout
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-coffee-50">
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
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="text-gray-500 hover:text-black">
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-coffee-500 flex items-center justify-center text-white font-bold uppercase text-sm">
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
                  ? "bg-coffee-700 text-white"
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
                    ? "bg-coffee-700 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-coffee-950">
              Menu Selection
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Select items to add to the order
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-coffee-500" size={36} />
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
                        src={getProductImageUrl(product.image_url)}
                        alt={product.name}
                        fill
                        className="object-contain transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-50 text-amber-800">
                        <Coffee size={36} />
                      </div>
                    )}

                    <div className="absolute right-3 top-3 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-sm font-bold text-coffee-500 shadow-sm">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-coffee-950 line-clamp-1">
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
      <aside className="hidden xl:flex w-[400px] flex-col border-l border-gray-200 bg-white/80 backdrop-blur-xl shrink-0">
        {renderCart()}
      </aside>

      {/* Floating Ticket Indicator for Mobile/Tablets */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="xl:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-coffee-950 px-6 py-4 font-bold text-white shadow-xl hover:opacity-90 active:scale-95 transition-all shadow-coffee-700/30"
        >
          <ShoppingBag size={20} className="text-coffee-200" />
          <span>View Ticket</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coffee-500 text-[10px] text-white">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
          <span className="border-l border-white/20 pl-2.5 text-coffee-200">
            ${total.toFixed(2)}
          </span>
        </button>
      )}

      {/* Mobile Cart Drawer Overlay */}
      {cartDrawerOpen && (
        <div
          className="xl:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setCartDrawerOpen(false)}
        />
      )}

      {/* Mobile Cart Drawer Panel */}
      <div
        className={`xl:hidden fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 transform ${
          cartDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-coffee-950">Current Ticket</h2>
            <p className="text-xs text-gray-400">Mobile Checkout Terminal</p>
          </div>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="rounded-lg p-1.5 hover:bg-gray-50 text-gray-400 hover:text-black transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderCart(true)}
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center border max-h-[90vh] overflow-y-auto animate-scale-up">
            {/* Realistic Thermal Paper Styling */}
            <div className="w-full bg-coffee-50 border border-gray-200 shadow-inner p-5 font-mono text-xs text-gray-800 rounded-lg relative overflow-hidden select-none">
              {/* Paper Top Jagged Edge Mockup */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_top,_#e2e8f0_2px,_transparent_0)] bg-[length:8px_8px] bg-repeat-x"></div>
              
              <div className="text-center space-y-1 mt-2">
                <Coffee className="mx-auto text-coffee-500 mb-1" size={24} />
                <h3 className="font-extrabold text-sm tracking-widest text-black">ESPRESSOPRO CAFE</h3>
                <p className="text-[10px] text-gray-500">128 Barista Ave, Brew Town</p>
                <p className="text-[10px] text-gray-500">Tel: +1 (555) 987-6543</p>
              </div>

              <div className="border-b border-dashed border-gray-300 my-4"></div>

              <div className="space-y-1 text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span className="font-bold text-black">{receiptData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{receiptData.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span className="capitalize">{user ? user.full_name : "Store Cashier"}</span>
                </div>
                <div className="flex justify-between">
                  <span>MODE:</span>
                  <span className="uppercase font-bold text-black">{receiptData.paymentMethod}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 my-4"></div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-black text-[10px]">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                {receiptData.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="truncate max-w-[200px]">
                      <span>{item.quantity}x {item.product.name}</span>
                      <p className="text-[9px] text-gray-500 pl-4">${item.product.price.toFixed(2)} each</p>
                    </div>
                    <span className="font-semibold text-black">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-gray-300 my-4"></div>

              {/* Calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${receiptData.subtotal.toFixed(2)}</span>
                </div>
                
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Discount ({receiptData.couponCode})</span>
                    <span>-${receiptData.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>VAT/Tax (10%)</span>
                  <span>${receiptData.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-extrabold text-black text-sm pt-1 border-t border-dotted">
                  <span>TOTAL</span>
                  <span>${receiptData.total.toFixed(2)}</span>
                </div>
              </div>

              {receiptData.paymentMethod === "cash" && (
                <div className="space-y-1 text-[10px] text-gray-600 pt-3 mt-2 border-t border-dashed">
                  <div className="flex justify-between">
                    <span>CASH TENDERED:</span>
                    <span>${receiptData.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-black font-bold">
                    <span>CHANGE DUE:</span>
                    <span>${receiptData.changeAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="border-b border-dashed border-gray-300 my-4"></div>

              {/* Barcode Mockup & Greeting */}
              <div className="text-center space-y-2 mt-2">
                <p className="text-[10px] font-bold text-black italic">&quot;Brewed with love! See you soon!&quot;</p>
                
                {/* Barcode Mockup */}
                <div className="flex justify-center items-center h-8 gap-[1px] opacity-75 mt-3 select-none">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <p className="text-[8px] text-gray-400 tracking-[0.25em]">{receiptData.orderNumber}</p>
              </div>

              {/* Paper Bottom Jagged Edge Mockup */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_bottom,_#e2e8f0_2px,_transparent_0)] bg-[length:8px_8px] bg-repeat-y transform rotate-180"></div>
            </div>

            {/* Print/Dismiss Actions */}
            <div className="w-full flex gap-3 mt-5">
              <button
                onClick={() => {
                  alert("Receipt successfully sent to Barista Thermal Printer!");
                }}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition active:scale-95"
              >
                Print Ticket
              </button>
              <button
                  onClick={() => setReceiptData(null)}
                  className="flex-1 rounded-xl bg-coffee-950 py-3 text-xs font-bold text-white hover:opacity-90 transition active:scale-95"
                >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Visual QR Scanner Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4">
          <div className="relative border-4 border-dashed border-amber-500 rounded-3xl p-8 max-w-sm w-full bg-black/40 flex flex-col items-center text-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            {/* Pulsing red scan line */}
            <div className="absolute left-0 right-0 h-1.5 bg-red-500/80 shadow-[0_0_15px_#ef4444] animate-bounce top-1/2" style={{ animationDuration: "1.8s" }} />
            
            <QrCode className="text-amber-500 animate-pulse mb-6 stroke-[1.2]" size={96} />
            <h3 className="text-xl font-bold text-white mb-2 tracking-wide font-sans">Simulating Member Scan</h3>
            <p className="text-xs text-gray-400 max-w-xs font-sans">Aligning POS terminal optical reader to customer loyalty pass QR...</p>
            <div className="mt-6 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
              <Loader2 className="animate-spin text-amber-500" size={14} />
              <span className="text-xs text-white font-semibold font-mono">OPTICAL FEED ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Points & Tier Status Upgrade Popup */}
      {celebrationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative bg-gradient-to-br from-coffee-950 to-coffee-700 border border-amber-500/30 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Decorative sparkles */}
            <div className="absolute top-4 left-6 text-amber-400/40 animate-pulse text-lg">✦</div>
            <div className="absolute top-12 right-10 text-amber-400/60 animate-pulse delay-500 text-xl">✦</div>
            <div className="absolute bottom-10 left-10 text-amber-400/30 animate-pulse delay-1000 text-lg">✦</div>
            
            {/* Falling Confetti Particles Mockup */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
              <div className="absolute bg-amber-400 w-1.5 h-1.5 rounded-full top-4 left-1/4 animate-bounce" style={{ animationDelay: "0.1s", animationDuration: "3s" }} />
              <div className="absolute bg-emerald-400 w-2 h-2 rounded-sm top-8 left-2/3 animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "4s" }} />
              <div className="absolute bg-purple-400 w-1 h-3 top-16 left-1/2 animate-bounce" style={{ animationDelay: "0.7s", animationDuration: "2.5s" }} />
              <div className="absolute bg-pink-400 w-2 h-1 top-24 left-1/10 animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "3.5s" }} />
              <div className="absolute bg-blue-400 w-1.5 h-1.5 rounded-full top-32 left-4/5 animate-bounce" style={{ animationDelay: "0.9s", animationDuration: "2s" }} />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <span className="text-4xl">🏆</span>
            </div>

            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 tracking-wide font-sans mb-1">
              {celebrationData.tierUpgraded ? "Tier Promotion!" : "Points Awarded!"}
            </h3>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-widest font-sans mb-4">
              LOYALTY UPDATE
            </p>

            <p className="text-sm text-gray-300 font-sans max-w-sm mx-auto mb-6 leading-relaxed">
              Congratulations! <span className="font-bold text-white">{celebrationData.customerName}</span> earned <span className="font-extrabold text-amber-400">+{celebrationData.pointsEarned} points</span> on this purchase!
            </p>

            {celebrationData.tierUpgraded && (
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 p-4.5 rounded-2xl mb-6 animate-pulse">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">VIP TIER PROMOTION</p>
                <div className="flex items-center justify-center gap-3 mt-1.5">
                  <span className="text-gray-400 font-bold uppercase line-through text-xs">{celebrationData.oldTier}</span>
                  <span className="text-white text-base">➜</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 font-black uppercase text-base tracking-widest">{celebrationData.newTier}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">New Tier multipliers and bonus campaigns are now active on this account!</p>
              </div>
            )}

            <button
              onClick={() => setCelebrationData(null)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-xs font-black text-black tracking-widest uppercase transition active:scale-95 shadow-md shadow-amber-500/20"
            >
              Continue Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}