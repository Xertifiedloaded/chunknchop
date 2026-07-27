'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customerName: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/admin/orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-600">Manage all customer orders</p>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Payment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-sm text-slate-900">{order.orderNumber}</td>
                <td className="px-6 py-3 text-sm text-slate-600">{order.customerName}</td>
                <td className="px-6 py-3 text-sm font-semibold text-slate-900">${order.total.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-3 text-sm">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-blue-600 hover:text-blue-800">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800';
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PENDING':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function getPaymentColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}
