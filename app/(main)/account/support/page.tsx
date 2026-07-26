'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'GENERAL',
    priority: 'NORMAL',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/account/support');
      return;
    }

    fetchTickets();
  }, [user, router]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/customer/support-tickets', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/customer/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create ticket');

      const newTicket = await response.json();
      setTickets([newTicket, ...tickets]);
      setFormData({
        subject: '',
        description: '',
        category: 'GENERAL',
        priority: 'NORMAL',
      });
      setShowForm(false);
      toast.success('Support ticket created');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    }
  };

  if (!user) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600';
      case 'NORMAL':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Support Center</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-card border-border mb-8 space-y-4 rounded-lg border p-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">Subject *</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide as much detail as possible..."
                className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
                >
                  <option value="GENERAL">General</option>
                  <option value="ORDER">Order Issue</option>
                  <option value="PRODUCT">Product Question</option>
                  <option value="SHIPPING">Shipping</option>
                  <option value="BILLING">Billing</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Submit Ticket
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-card border-border rounded-lg border py-12 text-center">
            <p className="text-muted-foreground mb-4">No support tickets yet</p>
            <Button onClick={() => setShowForm(true)}>Create First Ticket</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/account/support/${ticket.id}`} className="block">
                <div className="bg-card border-border hover:bg-muted rounded-lg border p-4 transition">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">{ticket.ticketNumber}</p>
                      <p className="font-medium">{ticket.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </p>
                      <p className="text-muted-foreground text-sm">{ticket.status}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
