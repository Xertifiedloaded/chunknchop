'use client';

import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch('/api/admin/customers');
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-600">Manage all registered customers</p>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Orders</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total Spent</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-6 py-3 text-sm font-medium text-slate-900">{customer.name || 'N/A'}</td>
                <td className="px-6 py-3 text-sm text-slate-600">{customer.email}</td>
                <td className="px-6 py-3 text-sm text-slate-900">{customer.orderCount}</td>
                <td className="px-6 py-3 text-sm font-semibold text-slate-900">${customer.totalSpent.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm text-slate-600">{new Date(customer.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
