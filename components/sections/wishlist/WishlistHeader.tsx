import { Button } from '@/components/ui/button';

interface WishlistHeaderProps {
  count: number;
  onMoveAll: () => void;
  isMovingAll: boolean;
}

export default function WishlistHeader({ count, onMoveAll, isMovingAll }: WishlistHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-worksans text-brand text-xs font-semibold tracking-[0.25em] uppercase">Saved for later</p>
        <h1 className="font-sora text-charcoal mt-1 text-5xl font-bold">My Wishlist</h1>
        <p className="text-ink mt-3 text-xs">
          {count} {count === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      <Button onClick={onMoveAll} disabled={isMovingAll} className="bg-brand rounded-xl px-6 py-6 font-semibold text-white hover:bg-orange-600">
        {isMovingAll ? 'Moving...' : 'Move all in-stock to cart'}
      </Button>
    </div>
  );
}
