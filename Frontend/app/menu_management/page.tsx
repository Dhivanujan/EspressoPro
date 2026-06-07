// app/menu_management/page.tsx

"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete, getProductImageUrl } from "../../lib/api";
import { Coffee, Search, Plus, Edit3, Trash2, X, Loader2, Upload, Link, AlertCircle } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string;
  availability_status: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function MenuManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formThreshold, setFormThreshold] = useState("10");
  const [formCategory, setFormCategory] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");

  // Cohesive Tab Navigation
  const [activeTab, setActiveTab] = useState<"products" | "coupons">("products");

  // Coupon Manager States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponFormCode, setCouponFormCode] = useState("");
  const [couponFormType, setCouponFormType] = useState("percentage");
  const [couponFormValue, setCouponFormValue] = useState("");
  const [couponFormExpiry, setCouponFormExpiry] = useState("");
  const [couponFormActive, setCouponFormActive] = useState(true);
  const [couponModalLoading, setCouponModalLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const fetchedCats = await apiGet<Category[]>("/api/v1/categories");
      setCategories(fetchedCats);
      
      const fetchedProds = await apiGet<Product[]>("/api/v1/products");
      const formattedProds = fetchedProds.map((p) => ({
        ...p,
        price: Number(p.price),
      }));
      setProducts(formattedProds);

      const fetchedCoupons = await apiGet<any[]>("/api/v1/coupons");
      setCoupons(fetchedCoupons);
    } catch (err) {
      console.error("Failed to load POS data", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormCode || !couponFormValue || !couponFormExpiry) return;
    setCouponModalLoading(true);
    try {
      const payload = {
        code: couponFormCode.toUpperCase(),
        discount_type: couponFormType,
        discount_value: parseFloat(couponFormValue),
        active: couponFormActive,
        expiry_date: new Date(couponFormExpiry).toISOString(),
      };

      await apiPost("/api/v1/coupons", payload);
      setShowCouponModal(false);
      setCouponFormCode("");
      setCouponFormValue("");
      setCouponFormExpiry("");
      setCouponFormActive(true);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create promotion coupon.");
    } finally {
      setCouponModalLoading(false);
    }
  };

  const handleCouponDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this promotional coupon?")) return;
    try {
      await apiDelete(`/api/v1/coupons/${couponId}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon.");
    }
  };

  const toggleCouponStatus = async (coupon: any) => {
    try {
      await apiPut(`/api/v1/coupons/${coupon.id}`, {
        active: !coupon.active,
      });
      setCoupons(
        coupons.map((c) =>
          c.id === coupon.id ? { ...c, active: !c.active } : c
        )
      );
    } catch (err) {
      console.error("Failed to toggle coupon status", err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormStock("");
    setFormThreshold("10");
    setFormCategory(categories[0]?.id || "");
    setFormImageUrl("");
    setFormAvailable(true);
    
    // Reset Upload States
    setUploading(false);
    setUploadError(null);
    setImageInputMode("upload");
    
    setShowModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDesc(prod.description || "");
    setFormPrice(prod.price.toString());
    setFormStock(prod.stock_quantity.toString());
    setFormThreshold(prod.low_stock_threshold.toString());
    setFormCategory(prod.category_id || "");
    setFormImageUrl(prod.image_url || "");
    setFormAvailable(prod.availability_status);
    
    // Reset Upload States
    setUploading(false);
    setUploadError(null);
    setImageInputMode("upload");
    
    setShowModal(true);
  };

  // Image Upload Action Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image file size must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiPost<{ url: string; provider: string }>(
        "/api/v1/products/upload-image",
        formData
      );
      setFormImageUrl(res.url);
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      setUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const payload = {
        name: formName,
        description: formDesc,
        price: parseFloat(formPrice),
        stock_quantity: parseInt(formStock) || 0,
        low_stock_threshold: parseInt(formThreshold) || 10,
        category_id: formCategory,
        image_url: formImageUrl || null,
        availability_status: formAvailable,
        recipe: [], // Optional
      };

      if (editingProduct) {
        await apiPut(`/api/v1/products/${editingProduct.id}`, payload);
      } else {
        await apiPost("/api/v1/products", payload);
      }
      
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu product?")) return;
    try {
      await apiDelete(`/api/v1/products/${id}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product.");
    }
  };

  const toggleAvailability = async (prod: Product) => {
    try {
      await apiPut(`/api/v1/products/${prod.id}`, {
        ...prod,
        availability_status: !prod.availability_status,
      });
      // Update local state instantly for speed
      setProducts(
        products.map((p) =>
          p.id === prod.id
            ? { ...p, availability_status: !p.availability_status }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-coffee-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 shrink-0">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-coffee-950">Catalog & Promotions</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                Barista & Store Configuration
              </p>
            </div>

            {activeTab === "products" ? (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 rounded-xl bg-coffee-950 px-5 py-2.5 font-bold text-white transition hover:opacity-90 active:scale-[0.98] text-sm shadow-sm"
              >
                <Plus size={18} />
                Add Menu Item
              </button>
            ) : (
              <button
                onClick={() => {
                  setCouponFormCode("");
                  setCouponFormValue("");
                  setCouponFormExpiry("");
                  setCouponFormActive(true);
                  setShowCouponModal(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-coffee-950 px-5 py-2.5 font-bold text-white transition hover:opacity-90 active:scale-[0.98] text-sm shadow-sm"
              >
                <Plus size={18} />
                Create Coupon
              </button>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-6 text-sm font-bold pb-1">
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "products"
                  ? "border-coffee-500 text-coffee-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Menu Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "coupons"
                  ? "border-coffee-500 text-coffee-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Discount Coupons ({coupons.length})
            </button>
          </div>
        </header>

        {/* Filters and List */}
        <div className="p-8 flex-1">
          {activeTab === "products" ? (
            <>
              <div className="mb-8 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search menu catalog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
                  />
                </div>

                {/* Category Select tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                      selectedCategory === "all"
                        ? "bg-coffee-700 border-coffee-700 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                        selectedCategory === cat.id
                          ? "bg-coffee-700 border-coffee-700 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-coffee-500" size={36} />
                  <p className="text-gray-500 font-medium">Fetching café catalog...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed rounded-2xl p-8">
                  <p className="text-gray-500 font-semibold">No menu products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col h-full"
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-100 w-full shrink-0">
                        {product.image_url ? (
                          <Image
                            src={getProductImageUrl(product.image_url)}
                            alt={product.name}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-amber-50 text-amber-800">
                            <Coffee size={36} />
                          </div>
                        )}

                        {!product.availability_status && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                            <span className="rounded-lg bg-white px-3 py-1 text-xs font-extrabold tracking-widest text-black shadow-sm">
                              SOLD OUT
                            </span>
                          </div>
                        )}

                        <div className="absolute right-3 top-3 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-sm font-bold text-coffee-500 shadow-sm">
                          Rs. {product.price.toFixed(2)}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="rounded-lg p-1.5 transition text-gray-400 hover:text-black hover:bg-gray-50"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="rounded-lg p-1.5 transition text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs font-semibold text-gray-400 uppercase mt-0.5 mb-3">
                            {categories.find((c) => c.id === product.category_id)?.name || "Brew Item"}
                          </p>

                          <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
                            {product.description || "Barista coffee crafted to perfection."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                product.availability_status ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            <span className="text-xs font-semibold text-gray-500">
                              {product.availability_status ? "In Stock" : "Inactive"}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleAvailability(product)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                              product.availability_status
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
                            }`}
                          >
                            {product.availability_status ? "Set Out" : "Set Active"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Coupons Promotions directory list
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-coffee-500" size={36} />
                  <p className="text-gray-500 font-medium">Loading promotional campaigns...</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed rounded-2xl p-8">
                  <p className="text-gray-500 font-semibold">No promotional coupon codes registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold tracking-wider bg-coffee-200/35 text-coffee-500 border border-coffee-200/40 px-3.5 py-1 rounded-xl text-sm font-mono uppercase">
                            {coupon.code}
                          </span>
                          
                          <button
                            onClick={() => handleCouponDelete(coupon.id)}
                            className="rounded-lg p-1.5 transition text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-4 space-y-1">
                          <p className="text-2xl font-black text-gray-900">
                            {coupon.discount_type === "percentage" 
                              ? `${coupon.discount_value}% OFF` 
                              : `Rs. ${Number(coupon.discount_value).toFixed(2)} OFF`}
                          </p>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                            {coupon.discount_type} discount
                          </p>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex justify-between">
                            <span>Expiry Date:</span>
                            <span className="font-bold text-gray-700">
                              {new Date(coupon.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{new Date(coupon.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              coupon.active ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                            }`}
                          />
                          <span className="text-xs font-semibold text-gray-500">
                            {coupon.active ? "Active Promo" : "Disabled"}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleCouponStatus(coupon)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                            coupon.active
                              ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200"
                          }`}
                        >
                          {coupon.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add / Edit Menu Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? `Edit '${editingProduct.name}'` : "Add New Menu Item"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black p-1 hover:bg-gray-50 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Americano"
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief recipe details or serving size..."
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="4.50"
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Physical Stock</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="250"
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    required
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="10"
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Product Image</label>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadError(null);
                        setImageInputMode(imageInputMode === "upload" ? "url" : "upload");
                      }}
                      className="text-xs font-bold text-coffee-500 hover:underline flex items-center gap-1"
                    >
                      {imageInputMode === "upload" ? (
                        <>
                          <Link size={12} />
                          Paste URL instead
                        </>
                      ) : (
                        <>
                          <Upload size={12} />
                          Upload file instead
                        </>
                      )}
                    </button>
                  </div>

                  {imageInputMode === "upload" ? (
                    <div className="space-y-3">
                      {formImageUrl ? (
                        <div className="relative group/img rounded-xl border border-gray-200 overflow-hidden bg-gray-50 h-36 flex items-center justify-center shadow-xs">
                          {/* Native img tag is resilient for direct/arbitrary URL previews */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getProductImageUrl(formImageUrl)}
                            alt="Product preview"
                            className="object-contain w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-2">
                            <span className="text-white text-xs font-bold px-3 py-1 rounded-md bg-white/10 backdrop-blur-xs border border-white/20">
                              Active Product Image
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormImageUrl("");
                                setUploadError(null);
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                            >
                              <Trash2 size={13} />
                              Remove Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all min-h-32 ${
                          uploading
                            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                            : "border-gray-300 hover:border-coffee-500 hover:bg-coffee-500/5"
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin text-coffee-500" size={24} />
                              <p className="text-sm font-semibold text-gray-700">Uploading product image...</p>
                              <p className="text-xs text-gray-400">Processing on Cloudinary/local storage</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-2 rounded-xl bg-amber-50 text-coffee-500">
                                <Upload size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-700">
                                  Drag & drop image here, or <span className="text-coffee-500 underline">browse</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Supports PNG, JPG, WEBP, GIF (Max 5MB)</p>
                              </div>
                            </div>
                          )}
                        </label>
                      )}

                      {uploadError && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 text-xs font-semibold animate-scale-up">
                          <AlertCircle size={14} className="shrink-0 text-red-600" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-coffee-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1.5 font-medium pl-1">
                        Use this to reference external CDNs or web image URLs directly.
                      </p>
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-coffee-500 focus:ring-coffee-500"
                  />
                  <label htmlFor="available" className="text-sm font-semibold text-gray-700">
                    Product is available to sell
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-500 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-2 rounded-xl bg-coffee-950 px-6 py-2.5 font-bold text-white hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {modalLoading && <Loader2 className="animate-spin" size={14} />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-base font-bold text-gray-900">Create New Coupon</h2>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-gray-400 hover:text-black p-1 hover:bg-gray-50 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LATTE50"
                  value={couponFormCode}
                  onChange={(e) => setCouponFormCode(e.target.value.toUpperCase())}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 uppercase font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                  <select
                    value={couponFormType}
                    onChange={(e) => setCouponFormType(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-coffee-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash (LKR)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.00"
                    value={couponFormValue}
                    onChange={(e) => setCouponFormValue(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={couponFormExpiry}
                  onChange={(e) => setCouponFormExpiry(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={couponFormActive}
                  onChange={(e) => setCouponFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-coffee-500 focus:ring-coffee-500"
                />
                <label htmlFor="coupon_active" className="text-sm font-semibold text-gray-700">
                  Coupon is active to use
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponModalLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-coffee-950 px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {couponModalLoading && <Loader2 className="animate-spin" size={12} />}
                  Create Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}