"use client"

type Product = {
  id: number
  name: string
  category: string
  size: string
  price: number
  description: string
  image: string
  available: boolean
}

const products: Product[] = [
  {
    id: 1,
    name: "Flat White",
    category: "Coffee",
    size: "8oz",
    price: 4.5,
    description:
      "Double shot of reserve espresso with silky microfoam and a smooth finish.",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    available: true,
  },
  {
    id: 2,
    name: "Iced Oat Latte",
    category: "Coffee",
    size: "16oz",
    price: 6.25,
    description:
      "House-made oat milk, double espresso, served over slow-melt ice.",
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=1200&auto=format&fit=crop",
    available: true,
  },
  {
    id: 3,
    name: "Almond Croissant",
    category: "Pastry",
    size: "Unit",
    price: 5.75,
    description:
      "Twice-baked butter croissant with frangipane filling and toasted almonds.",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
    available: false,
  },
]

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-52 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold tracking-widest text-black">
              OUT OF STOCK
            </span>
          </div>
        )}

        <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold shadow">
          ${product.price}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {product.name}
            </h3>

            <p className="text-xs uppercase tracking-widest text-gray-500">
              {product.category} • {product.size}
            </p>
          </div>

          <button className="rounded-lg p-2 transition hover:bg-gray-100">
            ✏️
          </button>
        </div>

        <p className="text-sm leading-6 text-gray-600">
          {product.description}
        </p>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                product.available ? "bg-green-500" : "bg-red-500"
              }`}
            />

            <span className="text-sm text-gray-500">
              {product.available ? "Available" : "Sold Out"}
            </span>
          </div>

          <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MenuManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              EspressoPro
            </h1>

            <p className="text-sm text-gray-500">
              Coffee Shop POS Dashboard
            </p>
          </div>

          <button className="rounded-2xl bg-black px-5 py-3 font-semibold text-white transition hover:opacity-90">
            + Add Product
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Heading */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">
              Menu Management
            </h2>

            <p className="mt-2 text-gray-500">
              Manage your café products, pricing, and availability.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-xl border bg-white px-5 py-3 font-medium transition hover:bg-gray-100">
              Coffee
            </button>

            <button className="rounded-xl border bg-white px-5 py-3 font-medium transition hover:bg-gray-100">
              Tea
            </button>

            <button className="rounded-xl border bg-white px-5 py-3 font-medium transition hover:bg-gray-100">
              Pastries
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-10">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 outline-none transition focus:border-black"
          />
        </div>

        {/* Product Grid */}
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  )
}