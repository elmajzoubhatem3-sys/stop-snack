"use client";

import { useEffect, useRef, useState } from "react";

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  notes: string;
  total_lbp: number;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_name: string;
  quantity: number;
  price_lbp: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null);
  const seenOrderIds = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);

  async function loadOrders() {
    const res = await fetch("/api/orders", { cache: "no-store" });
    const data = await res.json();

    const newOrders = Array.isArray(data.orders) ? data.orders : [];
    const newItems = Array.isArray(data.items) ? data.items : [];

    if (firstLoad.current) {
      seenOrderIds.current = new Set(newOrders.map((o: Order) => Number(o.id)));
      firstLoad.current = false;
    } else {
      const freshOrder = newOrders.find(
        (order: Order) => !seenOrderIds.current.has(Number(order.id))
      );

      if (freshOrder) {
        setNewOrderPopup(freshOrder);
        setTimeout(() => setNewOrderPopup(null), 6000);
      }

      newOrders.forEach((order: Order) =>
        seenOrderIds.current.add(Number(order.id))
      );
    }

    setOrders(newOrders);
    setItems(newItems);
  }

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    loadOrders();
  }

  function getStatusStyle(order: Order) {
    const created = new Date(order.created_at).getTime();
    const now = Date.now();
    const diff = (now - created) / 1000;

    if (order.status === "new") {
      if (diff > 300) return "bg-red-500 text-white animate-pulse";
      return "bg-yellow-400 text-black";
    }

    if (order.status === "preparing") return "bg-blue-400 text-black";

    return "bg-green-400 text-black";
  }

  function printInvoice(order: Order, orderItems: OrderItem[]) {
    const rows = orderItems
      .map(
        (item) => `
          <tr>
            <td>${item.product_name}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">${Number(item.price_lbp * item.quantity).toLocaleString()} L.L</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 8px; }
            .meta { margin-bottom: 20px; font-size: 14px; color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px 6px; font-size: 14px; }
            th { text-align: left; }
            .total { margin-top: 20px; text-align: right; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Lamar Caffe</h1>
          <div class="meta">
            <div>Invoice #${order.id}</div>
            <div>${new Date(order.created_at).toLocaleString()}</div>
            ${order.customer_name ? `<div>Name: ${order.customer_name}</div>` : ""}
            ${order.customer_phone ? `<div>Phone: ${order.customer_phone}</div>` : ""}
            ${order.table_number ? `<div>Table: ${order.table_number}</div>` : ""}
            ${order.notes ? `<div>Notes: ${order.notes}</div>` : ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="total">Total: ${Number(order.total_lbp).toLocaleString()} L.L</div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  return (
    <main className="min-h-screen bg-[#050505] p-4 text-white">
      {newOrderPopup && (
        <div className="fixed right-4 top-4 z-50 rounded-2xl bg-red-500 px-5 py-4 font-bold text-white shadow-2xl animate-pulse">
          New order received #{newOrderPopup.id}
        </div>
      )}

      <h1 className="mb-6 text-3xl font-semibold">Orders</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {orders.map((order) => {
          const orderItems = items.filter(
            (item) => Number(item.order_id) === Number(order.id)
          );

          return (
            <div
              key={order.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold">#{order.id}</h2>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(order)}`}
                >
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div className="mt-3 text-sm text-neutral-300">
                {order.customer_name && <p>{order.customer_name}</p>}
                {order.customer_phone && <p>{order.customer_phone}</p>}
                {order.table_number && <p>Table: {order.table_number}</p>}
                {order.notes && <p>Notes: {order.notes}</p>}
              </div>

              <div className="mt-3 space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} x{item.quantity}
                    </span>
                    <span>
                      {Number(item.price_lbp * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-right font-bold text-amber-200">
                {Number(order.total_lbp).toLocaleString()} L.L
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => printInvoice(order, orderItems)}
                  className="rounded-xl bg-white py-2 text-black"
                >
                  🧾 Print Invoice
                </button>

                {order.status === "new" && (
                  <button
                    onClick={() => updateStatus(order.id, "preparing")}
                    className="rounded-xl bg-blue-400 py-2 text-black"
                  >
                    ➜ Preparing
                  </button>
                )}

                {order.status === "preparing" && (
                  <button
                    onClick={() => updateStatus(order.id, "ordered")}
                    className="rounded-xl bg-green-400 py-2 text-black"
                  >
                    ✓ Done
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}