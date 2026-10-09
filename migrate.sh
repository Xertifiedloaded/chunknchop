#!/usr/bin/env bash
# ChunkNChop folder migration. Run from the PROJECT ROOT (where package.json is).
#   ./migrate.sh           -> dry run (prints what it would do)
#   ./migrate.sh --apply   -> performs the moves
# Skips any source that doesn't exist. Uses `git mv` when inside a git repo.
# Creates the new folders AND moves files, so no need to copy the skeleton first.
# After applying: fix imports, then run `npx tsc --noEmit`.

APPLY=0; [ "$1" = "--apply" ] && APPLY=1
USE_GIT=0; git rev-parse --is-inside-work-tree >/dev/null 2>&1 && USE_GIT=1

mv_() {
  local src="$1" dst="$2"
  [ -e "$src" ] || { echo "skip (missing): $src"; return; }
  [ -e "$dst" ] && { echo "skip (exists):  $dst"; return; }
  echo "$src -> $dst"
  if [ $APPLY -eq 1 ]; then
    mkdir -p "$(dirname "$dst")"
    if [ $USE_GIT -eq 1 ]; then git mv "$src" "$dst"; else mv "$src" "$dst"; fi
  fi
}


# --- create folders ---
DIRS=(
  "app/(rider)"
  features/catalog/{components,hooks,server}
  features/cart/hooks
  features/checkout/components
  features/auth/components
  features/admin/{components,products}
  features/orders/{components,server}
  features/riders/{components,hooks}
  features/users/server
  components/{ui,layout,feedback}
  hooks
  lib/{auth,http,payments,realtime,utils}
  types
)
for d in "${DIRS[@]}"; do
  if [ $APPLY -eq 1 ]; then mkdir -p "$d"; else echo "mkdir -p $d"; fi
done
echo
# --- root fixes ---
mv_ middlware.ts middleware.ts

# --- lib/auth ---
mv_ lib/auth.ts              lib/auth/index.ts
mv_ lib/auth-cookies.ts      lib/auth/cookies.ts
mv_ lib/auth-edge.ts         lib/auth/edge.ts
mv_ lib/refresh-tokens.ts    lib/auth/tokens.ts
mv_ lib/permission.ts        lib/auth/permissions.ts
mv_ lib/auth-routes.ts.ts    lib/auth/routes.ts

# --- lib infra ---
mv_ lib/paystack.ts          lib/payments/paystack.ts
mv_ lib/stripe.ts            lib/payments/stripe.ts
mv_ lib/pusher.ts            lib/realtime/pusher.ts
# HTTP helpers moved side by side; merge into one module by hand afterwards
mv_ lib/api-client.ts        lib/http/api-client.ts
mv_ lib/fetchClient.ts       lib/http/fetchClient.ts
mv_ lib/fetcher.ts           lib/http/fetcher.ts
mv_ lib/request.ts           lib/http/request.ts
# utils.ts -> utils/index.ts keeps the "@/lib/utils" import (shadcn cn) working
mv_ lib/utils.ts             lib/utils/index.ts
mv_ lib/format.ts            lib/utils/format.ts
mv_ lib/slug.ts              lib/utils/slug.ts
mv_ lib/scroll.ts            lib/utils/scroll.ts
mv_ lib/ViewPort.ts          lib/utils/viewport.ts
# email.ts, db.ts, storage.ts, index.ts stay in lib/ for now

# --- features: catalog ---
mv_ lib/catalog.ts           features/catalog/server/catalog.ts
mv_ lib/products.ts          features/catalog/server/products.ts
mv_ lib/categories.ts        features/catalog/server/categories.ts
mv_ lib/inventory.ts         features/catalog/server/inventory.ts
mv_ lib/meatTypes.ts         features/catalog/constants.ts
mv_ lib/filters.ts           features/catalog/filters.ts
mv_ lib/hooks/useCategories.ts   features/catalog/hooks/useCategories.ts
mv_ lib/hooks/useShopActions.ts  features/catalog/hooks/useShopActions.ts
for f in CategoryPills FilterSidebar ProductCard ProductModal ProductSection Rating; do
  mv_ components/sections/shops/$f.tsx features/catalog/components/$f.tsx
done

# --- features: cart / users / riders / auth ---
mv_ lib/hooks/useCartActions.ts   features/cart/hooks/useCartActions.ts
mv_ lib/users.ts                  features/users/server/users.ts
mv_ lib/hooks/useLiveLocation.tsx features/riders/hooks/useLiveLocation.tsx
mv_ lib/ClientAuthInit.tsx        features/auth/components/ClientAuthInit.tsx
mv_ components/auth/AuthInput.tsx features/auth/components/AuthInput.tsx

# --- features: admin ---
mv_ components/admin/AdminAuthProvider.tsx features/admin/components/AdminAuthProvider.tsx
mv_ components/admin/AdminNav.tsx          features/admin/components/AdminNav.tsx
mv_ components/admin/ui.tsx                features/admin/components/AdminUI.tsx
mv_ components/sections/shops/ProductForm.tsx features/admin/products/ProductForm.tsx

# --- features: checkout ---
for f in DetailRow ErrorState FailedState PaymentStatusCard SuccessState; do
  mv_ components/checkout/$f.tsx features/checkout/components/$f.tsx
done
mv_ components/checkout/LoadingState.tsx features/checkout/components/CheckoutLoadingState.tsx
mv_ components/checkout/types.ts         features/checkout/types.ts

# --- shared components ---
mv_ components/sections/common/Header.tsx       components/layout/Header.tsx
mv_ components/sections/common/Footer.tsx       components/layout/Footer.tsx
mv_ components/sections/common/LoadingState.tsx components/feedback/LoadingState.tsx
mv_ components/sections/shops/EmptyState.tsx    components/feedback/EmptyState.tsx

# --- generic hooks ---
mv_ lib/hooks/usePusher.ts   hooks/usePusher.ts

# --- routes ---
mv_ app/rider "app/(rider)/rider"

echo
if [ $APPLY -eq 1 ]; then echo "Done. Now fix imports and run: npx tsc --noEmit"
else echo "Dry run only. Re-run with --apply to move files."; fi
echo "Manual follow-ups: lib/store, lib/types, lib/index.ts, merge lib/http/*, remove empty dirs."