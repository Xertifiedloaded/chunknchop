import React from 'react';
import Image from 'next/image';
import Knife from '@/assets/knife.png';
export default function LoadingState() {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center">
      <div className="mb-4 flex items-center justify-center rounded-full">
        <Image src={Knife} width={40} height={40} alt="Loading products" className="h-auto w-8 animate-pulse object-contain" suppressHydrationWarning />
      </div>

      <p className="text-sm font-medium text-gray-700">Loading ChunkNChop...</p>

      <p className="mt-1 text-xs text-gray-500">Getting the best products for you</p>
    </div>
  );
}
