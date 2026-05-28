// app/menu_management/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";
import { Coffee, Search, Plus, Edit3, Trash2, X, Loader2 } from "lucide-react";
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

  async function loadData() {
    setLoading(true);
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
    setShowModal(true);
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
      alert(err.message || "Failed to save product.");
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
      alert(err.message || "Failed to delete product.");
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
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 py-5">
          <div>
            <h1 className="text-xl font-bold text-[#170f0a]">Menu Editor</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Barista Config
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-[#170f0a] px-5 py-2.5 font-bold text-white transition hover:opacity-90 active:scale-[0.98] text-sm shadow-sm"
          >
            <Plus size={18} />
            Add Menu Item
          </button>
        </header>

        {/* Filters and List */}
        <div className="p-8 flex-1">
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
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[#82542a] focus:ring-4 focus:ring-[#82542a]/10"
              />
            </div>

            {/* Category Select tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                  selectedCategory === "all"
                    ? "bg-[#2d241e] border-[#2d241e] text-white"
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
                      ? "bg-[#2d241e] border-[#2d241e] text-white"
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
              <Loader2 className="animate-spin text-[#82542a]" size={36} />
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
                        src={product.image_url}
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

                    <div className="absolute right-3 top-3 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-sm font-bold text-[#82542a] shadow-sm">
                      ${product.price.toFixed(2)}
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
        </div>
      </main>

      {/* Add / Edit Modal */}
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
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief recipe details or serving size..."
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="4.50"
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
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
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    required
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Product Image URL</label>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#82542a] focus:ring-[#82542a]"
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
                  className="flex items-center gap-2 rounded-xl bg-[#170f0a] px-6 py-2.5 font-bold text-white hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {modalLoading && <Loader2 className="animate-spin" size={14} />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}