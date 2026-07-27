'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import useSWR from 'swr';

interface BoxItem {
  productId: string;
  quantity: number;
  meatType: string;
  preparation: string;
}

const MEAT_TYPES = ['BEEF', 'CHICKEN', 'SEAFOOD', 'GOAT', 'PORK', 'TURKEY', 'BBQ', 'SAUSAGE', 'SPICE'];
const PREPARATIONS = ['minced', 'cubbed', 'boneless', 'sliced', 'whole'];

export default function BuildMeatBoxPage() {
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [selectedMeatType, setSelectedMeatType] = useState('BEEF');
  const [selectedPrep, setSelectedPrep] = useState('whole');
  const [quantity, setQuantity] = useState(1);
  const [customBoxName, setCustomBoxName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: products } = useSWR(`/api/products?meatType=${selectedMeatType}`);

  const handleAddItem = async (productId: string) => {
    const newItem: BoxItem = {
      productId,
      quantity,
      meatType: selectedMeatType,
      preparation: selectedPrep,
    };

    setBoxItems([...boxItems, newItem]);
    toast.success('Added to meat box!');
  };

  const handleRemoveItem = (index: number) => {
    setBoxItems(boxItems.filter((_, i) => i !== index));
    toast.success('Removed from meat box');
  };

  const handleCreateBox = async () => {
    if (boxItems.length === 0) {
      toast.error('Add at least one item to your meat box');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/customer/meat-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: boxItems,
          name: customBoxName || 'My Custom Meat Box',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Meat box created! Adding to cart...');
        // Redirect to cart
        window.location.href = '/cart';
      } else {
        toast.error('Failed to create meat box');
      }
    } catch (error) {
      toast.error('Error creating meat box');
    } finally {
      setIsCreating(false);
    }
  };

  const totalItems = boxItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-foreground mb-2 text-3xl font-bold">Build Your Meat Box</h1>
        <p className="text-muted-foreground mb-8">Create a custom selection of premium meats delivered to your door</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Builder Section */}
          <div className="space-y-6 lg:col-span-2">
            {/* Meat Type Selection */}
            <div className="bg-card border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 font-semibold">Select Meat Type</h2>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                {MEAT_TYPES.map((type) => (
                  <button key={type} onClick={() => setSelectedMeatType(type)} className={`rounded-lg p-3 transition-colors ${selectedMeatType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Preparation Selection */}
            <div className="bg-card border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 font-semibold">Preparation Style</h2>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {PREPARATIONS.map((prep) => (
                  <button key={prep} onClick={() => setSelectedPrep(prep)} className={`rounded-lg p-3 capitalize transition-colors ${selectedPrep === prep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {prep}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Products */}
            <div className="bg-card border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 font-semibold">Available Products</h2>
              {products && products.length > 0 ? (
                <div className="space-y-3">
                  {products.map((product: any) => (
                    <div key={product.id} className="border-border flex items-center justify-between rounded border p-3">
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-sm">${product.basePrice}</p>
                      </div>
                      <Button onClick={() => handleAddItem(product.id)} size="sm" disabled={!product.inStock}>
                        {product.inStock ? 'Add' : 'Out of Stock'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No products available for this type</p>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-1">
            <div className="bg-card border-border sticky top-4 rounded-lg border p-6">
              <h2 className="text-foreground mb-4 font-semibold">Box Summary</h2>

              {/* Custom Name */}
              <div className="mb-4">
                <label className="text-foreground mb-2 block text-sm font-medium">Box Name (Optional)</label>
                <input type="text" value={customBoxName} onChange={(e) => setCustomBoxName(e.target.value)} placeholder="e.g., Grilling Essentials" className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
              </div>

              {/* Items List */}
              <div className="mb-4 max-h-64 overflow-y-auto">
                {boxItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Add items to get started</p>
                ) : (
                  <div className="space-y-2">
                    {boxItems.map((item, index) => (
                      <div key={index} className="bg-muted flex items-center justify-between rounded p-2 text-sm">
                        <div>
                          <p className="text-foreground font-medium">{item.meatType}</p>
                          <p className="text-muted-foreground text-xs capitalize">{item.preparation}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">×{item.quantity}</span>
                          <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-border border-t pt-4">
                <p className="text-muted-foreground mb-4 text-sm">
                  Total Items: <span className="text-foreground font-bold">{totalItems}</span>
                </p>
                <Button onClick={handleCreateBox} disabled={isCreating || boxItems.length === 0} className="w-full">
                  {isCreating ? 'Creating...' : 'Create Box & Add to Cart'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
