"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Category = {
  id: number;
  name: string;
  name_en?: string;
  sort_order: number;
};

type Product = {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price_lbp: number;
  image_url: string;
  category_id: number;
  category_name?: string;
  sort_order: number;
};

type Settings = {
  header_type: "text" | "banner";
  header_title: string;
  header_subtitle: string;
  header_subtitle_en?: string;
  header_banner_url: string;
  header_banner_urls?: string;
  offers_enabled?: boolean;
  offers_text?: string;
  offers_text_en?: string;
  ordering_enabled?: boolean;
};

function SortableItem({
  id,
  children,
}: {
  id: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-xl bg-white/10 px-3 text-lg active:cursor-grabbing"
          title="Drag"
        >
          ≡
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryNameEn, setCategoryNameEn] = useState("");

  const [productName, setProductName] = useState("");
  const [productNameEn, setProductNameEn] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productDescriptionEn, setProductDescriptionEn] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const [headerType, setHeaderType] = useState<"text" | "banner">("text");
  const [headerTitle, setHeaderTitle] = useState("Stop Snack");
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [headerSubtitleEn, setHeaderSubtitleEn] = useState("");
  const [headerBannerFiles, setHeaderBannerFiles] = useState<File[]>([]);
  const [headerBannerUrls, setHeaderBannerUrls] = useState<string[]>([]);

  const [offersEnabled, setOffersEnabled] = useState(true);
  const [offersText, setOffersText] = useState("استفد من عروضاتنا");
  const [offersTextEn, setOffersTextEn] = useState("Get our latest offers");

  const [orderingEnabled, setOrderingEnabled] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryNameEn, setEditingCategoryNameEn] = useState("");

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [editingProductNameEn, setEditingProductNameEn] = useState("");
  const [editingProductDescription, setEditingProductDescription] = useState("");
  const [editingProductDescriptionEn, setEditingProductDescriptionEn] = useState("");
  const [editingProductPrice, setEditingProductPrice] = useState("");
  const [editingProductCategory, setEditingProductCategory] = useState("");
  const [editingProductImageFile, setEditingProductImageFile] =
    useState<File | null>(null);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData.error || "Upload failed");
    }

    return uploadData.url || "";
  }

  async function loadData() {
    const [settingsRes, catRes, prodRes] = await Promise.all([
      fetch("/api/settings", { cache: "no-store" }),
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/products", { cache: "no-store" }),
    ]);

    const settingsData: Settings | null = await settingsRes.json();
    const catData = await catRes.json();
    const prodData = await prodRes.json();

    const safeCategories = Array.isArray(catData) ? catData : [];
    const safeProducts = Array.isArray(prodData) ? prodData : [];

    const sortedCategories = [...safeCategories].sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order)
    );

    const sortedProducts = [...safeProducts].sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order)
    );

    setCategories(sortedCategories);
    setProducts(sortedProducts);

    if (sortedCategories.length > 0) {
      setSelectedCategoryId((current) => current ?? Number(sortedCategories[0].id));
    }

    if (settingsData) {
      setHeaderType(settingsData.header_type || "text");
      setHeaderTitle(settingsData.header_title || "Stop Snack");
      setHeaderSubtitle(settingsData.header_subtitle || "");
      setHeaderSubtitleEn(settingsData.header_subtitle_en || "");

      setOffersEnabled(settingsData.offers_enabled !== false);
      setOffersText(settingsData.offers_text || "استفد من عروضاتنا");
      setOffersTextEn(settingsData.offers_text_en || "Get our latest offers");

      setOrderingEnabled(settingsData.ordering_enabled === true);

      try {
        setHeaderBannerUrls(
          settingsData.header_banner_urls
            ? JSON.parse(settingsData.header_banner_urls)
            : settingsData.header_banner_url
            ? [settingsData.header_banner_url]
            : []
        );
      } catch {
        setHeaderBannerUrls([]);
      }
    }

    if (sortedCategories.length > 0 && !productCategory) {
      setProductCategory(String(sortedCategories[0].id));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCategoryProducts = selectedCategoryId
    ? products.filter(
        (product) => Number(product.category_id) === Number(selectedCategoryId)
      )
    : [];

  const selectedCategory = selectedCategoryId
    ? categories.find((cat) => Number(cat.id) === Number(selectedCategoryId))
    : null;

  const filteredCategories = categories.filter((cat) => {
    const search = categorySearch.trim().toLowerCase();

    if (!search) return true;

    return (
      cat.name.toLowerCase().includes(search) ||
      (cat.name_en || "").toLowerCase().includes(search)
    );
  });

  const filteredSelectedCategoryProducts = selectedCategoryProducts.filter(
    (product) => {
      const search = productSearch.trim().toLowerCase();

      if (!search) return true;

      return (
        product.name.toLowerCase().includes(search) ||
        (product.name_en || "").toLowerCase().includes(search) ||
        (product.description || "").toLowerCase().includes(search) ||
        (product.description_en || "").toLowerCase().includes(search)
      );
    }
  );

  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || String(active.id) === String(over.id)) return;

    const oldIndex = categories.findIndex(
      (cat) => String(cat.id) === String(active.id)
    );
    const newIndex = categories.findIndex(
      (cat) => String(cat.id) === String(over.id)
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const newCategories = arrayMove(categories, oldIndex, newIndex).map(
      (cat, index) => ({ ...cat, sort_order: index })
    );

    setCategories(newCategories);

    const res = await fetch("/api/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: newCategories }),
    });

    if (!res.ok) {
      alert("Failed to save category order");
      await loadData();
      return;
    }

    await loadData();
  }

  async function handleProductDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || String(active.id) === String(over.id)) return;

    const oldIndex = selectedCategoryProducts.findIndex(
      (product) => String(product.id) === String(active.id)
    );
    const newIndex = selectedCategoryProducts.findIndex(
      (product) => String(product.id) === String(over.id)
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSelectedProducts = arrayMove(
      selectedCategoryProducts,
      oldIndex,
      newIndex
    ).map((product, index) => ({ ...product, sort_order: index }));

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const updatedProduct = reorderedSelectedProducts.find(
          (item) => Number(item.id) === Number(product.id)
        );

        return updatedProduct || product;
      })
    );

    const res = await fetch("/api/products/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reorderedSelectedProducts }),
    });

    if (!res.ok) {
      alert("Failed to save product order");
      await loadData();
      return;
    }

    await loadData();
  }

  async function saveSettings() {
    try {
      let urls = [...headerBannerUrls];

      if (headerBannerFiles.length > 0) {
        const uploadedUrls: string[] = [];

        for (const file of headerBannerFiles) {
          const uploadedUrl = await uploadFile(file);
          uploadedUrls.push(uploadedUrl);
        }

        urls = [...urls, ...uploadedUrls];
      }

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          header_type: headerType,
          header_title: headerTitle,
          header_subtitle: headerSubtitle,
          header_subtitle_en: headerSubtitleEn,
          header_banner_url: urls[0] || "",
          header_banner_urls: JSON.stringify(urls),
          offers_enabled: offersEnabled,
          offers_text: offersText,
          offers_text_en: offersTextEn,
          ordering_enabled: orderingEnabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to save settings");
        return;
      }

      setHeaderBannerFiles([]);
      await loadData();
      alert("Settings saved");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save settings");
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: categoryName,
        name_en: categoryNameEn,
        sort_order: categories.length,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add category");
      return;
    }

    setCategoryName("");
    setCategoryNameEn("");
    setCategorySearch("");
    await loadData();
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();

    try {
      let image_url = "";

      if (productImageFile) {
        image_url = await uploadFile(productImageFile);
      }

      const categoryIdForProduct = Number(selectedCategoryId || productCategory);

      if (!categoryIdForProduct) {
        alert("Choose a category first");
        return;
      }

      const productCountInCategory = products.filter(
        (product) => Number(product.category_id) === Number(categoryIdForProduct)
      ).length;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryIdForProduct,
          name: productName,
          name_en: productNameEn,
          description: productDescription,
          description_en: productDescriptionEn,
          price_lbp: Number(productPrice),
          image_url,
          sort_order: productCountInCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to add product");
        return;
      }

      setProductName("");
      setProductNameEn("");
      setProductDescription("");
      setProductDescriptionEn("");
      setProductPrice("");
      setProductImageFile(null);
      setProductSearch("");
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add product");
    }
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryNameEn(category.name_en || "");
  }

  async function saveEditCategory() {
    if (!editingCategoryId) return;

    const currentCategory = categories.find(
      (cat) => cat.id === editingCategoryId
    );

    const res = await fetch(`/api/categories/${editingCategoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingCategoryName,
        name_en: editingCategoryNameEn,
        sort_order: currentCategory?.sort_order ?? 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update category");
      return;
    }

    setEditingCategoryId(null);
    await loadData();
  }

  async function deleteCategory(id: number) {
    if (!confirm("Delete this category?")) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to delete category");
      return;
    }

    if (Number(selectedCategoryId) === Number(id)) {
      setSelectedCategoryId(null);
    }

    await loadData();
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setEditingProductName(product.name);
    setEditingProductNameEn(product.name_en || "");
    setEditingProductDescription(product.description || "");
    setEditingProductDescriptionEn(product.description_en || "");
    setEditingProductPrice(String(product.price_lbp));
    setEditingProductCategory(String(product.category_id));
    setEditingProductImageFile(null);
  }

  async function saveEditProduct() {
    if (!editingProductId) return;

    try {
      let image_url: string | undefined = undefined;

      if (editingProductImageFile) {
        image_url = await uploadFile(editingProductImageFile);
      }

      const currentProduct = products.find(
        (product) => product.id === editingProductId
      );

      const res = await fetch(`/api/products/${editingProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProductName,
          name_en: editingProductNameEn,
          description: editingProductDescription,
          description_en: editingProductDescriptionEn,
          price_lbp: Number(editingProductPrice),
          category_id: Number(editingProductCategory),
          sort_order: currentProduct?.sort_order ?? 0,
          image_url,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update product");
        return;
      }

      setEditingProductId(null);
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update product");
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to delete product");
      return;
    }

    await loadData();
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
          <h1 className="text-3xl font-semibold">Stop Snack Admin</h1>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
          <h2 className="text-xl font-semibold">Header Settings</h2>

          <div className="mt-4 space-y-3">
            <select
              value={headerType}
              onChange={(e) => setHeaderType(e.target.value as "text" | "banner")}
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            >
              <option value="text">Text</option>
              <option value="banner">Banner</option>
            </select>

            <input
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <input
              value={headerSubtitle}
              onChange={(e) => setHeaderSubtitle(e.target.value)}
              placeholder="Arabic subtitle"
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <input
              value={headerSubtitleEn}
              onChange={(e) => setHeaderSubtitleEn(e.target.value)}
              placeholder="English subtitle"
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <input
              type="file"
              multiple
              onChange={(e) =>
                setHeaderBannerFiles(Array.from(e.target.files || []))
              }
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            {headerBannerUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {headerBannerUrls.map((url, index) => (
                  <div key={url} className="relative">
                    <img
                      src={url}
                      alt="Header banner"
                      className="h-28 w-full rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setHeaderBannerUrls(
                          headerBannerUrls.filter((_, i) => i !== index)
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={saveSettings}
              className="w-full rounded-2xl bg-white px-4 py-3 text-black"
            >
              Save Header
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
          <h2 className="text-xl font-semibold">Offers Popup</h2>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={offersEnabled}
                onChange={(e) => setOffersEnabled(e.target.checked)}
              />
              Enable Offers Popup
            </label>

            <input
              value={offersText}
              onChange={(e) => setOffersText(e.target.value)}
              placeholder="Arabic text"
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <input
              value={offersTextEn}
              onChange={(e) => setOffersTextEn(e.target.value)}
              placeholder="English text"
              className="w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <button
              type="button"
              onClick={saveSettings}
              className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-black"
            >
              Save Offers Settings
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
          <h2 className="text-xl font-semibold">Ordering Menu</h2>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={orderingEnabled}
                onChange={(e) => setOrderingEnabled(e.target.checked)}
              />
              Enable ordering from menu
            </label>

            <button
              type="button"
              onClick={saveSettings}
              className="w-full rounded-2xl bg-green-400 px-4 py-3 text-black"
            >
              Save Ordering Settings
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleAddCategory}
            className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl"
          >
            <h2 className="text-xl font-semibold">Add Category</h2>

            <div className="mt-4 space-y-3">
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Arabic category name"
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <input
                value={categoryNameEn}
                onChange={(e) => setCategoryNameEn(e.target.value)}
                placeholder="English category name"
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <button className="w-full rounded-2xl bg-white px-4 py-3 text-black">
                Add Category
              </button>
            </div>
          </form>

          <form
            onSubmit={handleAddProduct}
            className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl"
          >
            <h2 className="text-xl font-semibold">
              Add Product {selectedCategory ? `to ${selectedCategory.name}` : ""}
            </h2>

            <div className="mt-4 space-y-3">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Arabic product name"
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <input
                value={productNameEn}
                onChange={(e) => setProductNameEn(e.target.value)}
                placeholder="English product name"
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Arabic product description"
                rows={3}
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <textarea
                value={productDescriptionEn}
                onChange={(e) => setProductDescriptionEn(e.target.value)}
                placeholder="English product description"
                rows={3}
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <input
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                type="number"
                placeholder="Price in LBP"
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <select
                value={String(selectedCategoryId || productCategory)}
                onChange={(e) => {
                  setProductCategory(e.target.value);
                  setSelectedCategoryId(Number(e.target.value));
                }}
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              >
                <option value="">Choose category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl bg-black/30 px-4 py-3"
              />

              <button className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-black">
                Add Product
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
            <h2 className="text-xl font-semibold">Categories</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Click a category to show its products. Drag the ≡ button to reorder.
            </p>

            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories..."
              className="mt-4 w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <div className="mt-4">
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={filteredCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {filteredCategories.length === 0 ? (
                      <div className="rounded-xl bg-black/30 p-5 text-center text-sm text-neutral-300">
                        No categories found
                      </div>
                    ) : (
                      filteredCategories.map((cat) => (
                        <SortableItem key={cat.id} id={cat.id}>
                          <div className="rounded-xl bg-white/10 p-4">
                            {editingCategoryId === cat.id ? (
                              <div className="space-y-3">
                                <input
                                  value={editingCategoryName}
                                  onChange={(e) =>
                                    setEditingCategoryName(e.target.value)
                                  }
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <input
                                  value={editingCategoryNameEn}
                                  onChange={(e) =>
                                    setEditingCategoryNameEn(e.target.value)
                                  }
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={saveEditCategory}
                                    className="rounded-xl bg-amber-300 px-4 py-2 text-black"
                                  >
                                    Save
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingCategoryId(null)}
                                    className="rounded-xl bg-white/10 px-4 py-2"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setSelectedCategoryId(Number(cat.id));
                                  setProductCategory(String(cat.id));
                                  setProductSearch("");
                                }}
                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 transition ${
                                  selectedCategoryId === Number(cat.id)
                                    ? "border border-[#D4A017]/40 bg-[#D4A017]/20"
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <div>
                                  <p className="font-medium">{cat.name}</p>
                                  <p className="text-sm text-neutral-300">
                                    {cat.name_en || "No English name"}
                                  </p>
                                  <p className="text-xs text-[#D4A017]">
                                    {
                                      products.filter(
                                        (product) =>
                                          Number(product.category_id) ===
                                          Number(cat.id)
                                      ).length
                                    }{" "}
                                    products
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditCategory(cat);
                                    }}
                                    className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCategory(cat.id);
                                    }}
                                    className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </SortableItem>
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
            <h2 className="text-xl font-semibold">
              Products {selectedCategory ? `— ${selectedCategory.name}` : ""}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Only products from the selected category are shown here.
            </p>

            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="mt-4 w-full rounded-2xl bg-black/30 px-4 py-3"
            />

            <div className="mt-4">
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleProductDragEnd}
              >
                <SortableContext
                  items={filteredSelectedCategoryProducts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {filteredSelectedCategoryProducts.length === 0 ? (
                      <div className="rounded-xl bg-black/30 p-5 text-center text-sm text-neutral-300">
                        No products found
                      </div>
                    ) : (
                      filteredSelectedCategoryProducts.map((product) => (
                        <SortableItem key={product.id} id={product.id}>
                          <div className="rounded-xl bg-white/10 p-4">
                            {editingProductId === product.id ? (
                              <div className="space-y-3">
                                <input
                                  value={editingProductName}
                                  onChange={(e) =>
                                    setEditingProductName(e.target.value)
                                  }
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <input
                                  value={editingProductNameEn}
                                  onChange={(e) =>
                                    setEditingProductNameEn(e.target.value)
                                  }
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <textarea
                                  value={editingProductDescription}
                                  onChange={(e) =>
                                    setEditingProductDescription(e.target.value)
                                  }
                                  rows={3}
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <textarea
                                  value={editingProductDescriptionEn}
                                  onChange={(e) =>
                                    setEditingProductDescriptionEn(e.target.value)
                                  }
                                  rows={3}
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <input
                                  value={editingProductPrice}
                                  onChange={(e) =>
                                    setEditingProductPrice(e.target.value)
                                  }
                                  type="number"
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <select
                                  value={editingProductCategory}
                                  onChange={(e) =>
                                    setEditingProductCategory(e.target.value)
                                  }
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                >
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    setEditingProductImageFile(
                                      e.target.files?.[0] || null
                                    )
                                  }
                                  className="w-full rounded-2xl bg-black/30 px-4 py-3"
                                />

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={saveEditProduct}
                                    className="rounded-xl bg-amber-300 px-4 py-2 text-black"
                                  >
                                    Save
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingProductId(null)}
                                    className="rounded-xl bg-white/10 px-4 py-2"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-16 w-16 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-xs text-neutral-400">
                                    No Image
                                  </div>
                                )}

                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-neutral-300">
                                    {product.name_en || "No English name"}
                                  </p>

                                  {product.description && (
                                    <p className="text-xs text-neutral-400">
                                      {product.description}
                                    </p>
                                  )}

                                  {product.description_en && (
                                    <p className="text-xs text-neutral-500">
                                      {product.description_en}
                                    </p>
                                  )}

                                  <p className="text-sm text-amber-200">
                                    {Number(product.price_lbp).toLocaleString(
                                      "en-US"
                                    )}{" "}
                                    L.L
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditProduct(product)}
                                    className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => deleteProduct(product.id)}
                                    className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </SortableItem>
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}