// pages/Admin.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin panel for managing products in the marketplace.
// Only accessible to users with role="admin".
//
// PROTECTED ROUTE: App.jsx wraps this in <ProtectedRoute> with admin check.
//
// FEATURES:
// - View all products
// - Add new product
// - Edit existing product
// - Delete product
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list"); // "list" or "add"
  const [editingId, setEditingId] = useState(null);

  // Form state for adding/editing products
  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    price: 0,
    stock: 100,
    category: "chemical",
    nutrients: { nitrogen: 0, phosphorus: 0, potassium: 0 },
    suitableCrops: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  // Check admin access
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Load all products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data.products);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load products" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("nutrients.")) {
      const nutrient = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        nutrients: { ...prev.nutrients, [nutrient]: parseFloat(value) || 0 },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.name || !form.brand || !form.price) {
      setMessage({ type: "error", text: "Name, brand, and price are required" });
      return;
    }

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        suitableCrops: form.suitableCrops
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c),
      };

      if (editingId) {
        // Update existing product
        await api.put(`/products/${editingId}`, payload);
        setMessage({ type: "success", text: "Product updated successfully" });
      } else {
        // Create new product
        await api.post("/products", payload);
        setMessage({ type: "success", text: "Product created successfully" });
      }

      // Reset form and reload
      setForm({
        name: "",
        brand: "",
        description: "",
        price: 0,
        stock: 100,
        category: "chemical",
        nutrients: { nitrogen: 0, phosphorus: 0, potassium: 0 },
        suitableCrops: "",
      });
      setEditingId(null);
      setTab("list");
      loadProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      brand: product.brand,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category: product.category,
      nutrients: product.nutrients,
      suitableCrops: product.suitableCrops?.join(", ") || "",
    });
    setEditingId(product._id);
    setTab("add");
    setMessage({ type: "", text: "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await api.delete(`/products/${id}`);
      setMessage({ type: "success", text: "Product deleted successfully" });
      loadProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Delete failed",
      });
    }
  };

  const handleCancel = () => {
    setForm({
      name: "",
      brand: "",
      description: "",
      price: 0,
      stock: 100,
      category: "chemical",
      nutrients: { nitrogen: 0, phosphorus: 0, potassium: 0 },
      suitableCrops: "",
    });
    setEditingId(null);
    setTab("list");
    setMessage({ type: "", text: "" });
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-20 text-red-600">Access Denied</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700">⚙️ Admin Panel</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage fertilizer products</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === "list"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📦 Products List ({products.length})
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === "add"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {editingId ? "✏️ Edit Product" : "➕ Add Product"}
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* TAB: Products List */}
      {tab === "list" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 text-lg">No products yet</p>
              <button
                onClick={() => setTab("add")}
                className="mt-4 text-green-600 font-semibold hover:underline"
              >
                Add your first product →
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        ₹{product.price}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Stock: {product.stock}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <p>N: {product.nutrients.nitrogen} | P: {product.nutrients.phosphorus} | K: {product.nutrients.potassium}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Add/Edit Product Form */}
      {tab === "add" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-6">
            {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="chemical">Chemical</option>
                  <option value="organic">Organic</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Nutrient Content (%)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Nitrogen (N)
                  </label>
                  <input
                    type="number"
                    name="nutrients.nitrogen"
                    value={form.nutrients.nitrogen}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phosphorus (P)
                  </label>
                  <input
                    type="number"
                    name="nutrients.phosphorus"
                    value={form.nutrients.phosphorus}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Potassium (K)
                  </label>
                  <input
                    type="number"
                    name="nutrients.potassium"
                    value={form.nutrients.potassium}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Suitable Crops (comma-separated)
              </label>
              <input
                type="text"
                name="suitableCrops"
                value={form.suitableCrops}
                onChange={handleInputChange}
                placeholder="e.g. wheat, rice, maize"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
