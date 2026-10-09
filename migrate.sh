
APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1
[ -f package.json ] || { echo "Run this from the project root (package.json not found)."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node is required (used to rewrite imports)."; exit 1; }

USE_GIT=0; git rev-parse --is-inside-work-tree >/dev/null 2>&1 && USE_GIT=1
TMP="$(mktemp -d)"; MAP="$TMP/map.txt"; FIXER="$TMP/fix-imports.mjs"
trap 'rm -rf "$TMP"' EXIT

cat > "$MAP" <<'MAP_EOF'
# root
middlware.ts middleware.ts

# lib/auth
lib/auth.ts lib/auth/index.ts
lib/auth-cookies.ts lib/auth/cookies.ts
lib/auth-edge.ts lib/auth/edge.ts
lib/refresh-tokens.ts lib/auth/tokens.ts
lib/permission.ts lib/auth/permissions.ts
lib/auth-routes.ts.ts lib/auth/routes.ts

# lib infrastructure
lib/paystack.ts lib/payments/paystack.ts
lib/stripe.ts lib/payments/stripe.ts
lib/pusher.ts lib/realtime/pusher.ts
lib/api-client.ts lib/http/api-client.ts
lib/fetchClient.ts lib/http/fetchClient.ts
lib/fetcher.ts lib/http/fetcher.ts
lib/request.ts lib/http/request.ts
lib/utils.ts lib/utils/index.ts
lib/format.ts lib/utils/format.ts
lib/slug.ts lib/utils/slug.ts
lib/scroll.ts lib/utils/scroll.ts
lib/ViewPort.ts lib/utils/viewport.ts

# features/catalog
lib/catalog.ts features/catalog/server/catalog.ts
lib/products.ts features/catalog/server/products.ts
lib/categories.ts features/catalog/server/categories.ts
lib/inventory.ts features/catalog/server/inventory.ts
lib/meatTypes.ts features/catalog/constants.ts
lib/filters.ts features/catalog/filters.ts
lib/hooks/useCategories.ts features/catalog/hooks/useCategories.ts
lib/hooks/useShopActions.ts features/catalog/hooks/useShopActions.ts
components/sections/shops/CategoryPills.tsx features/catalog/components/CategoryPills.tsx
components/sections/shops/FilterSidebar.tsx features/catalog/components/FilterSidebar.tsx
components/sections/shops/ProductCard.tsx features/catalog/components/ProductCard.tsx
components/sections/shops/ProductModal.tsx features/catalog/components/ProductModal.tsx
components/sections/shops/ProductSection.tsx features/catalog/components/ProductSection.tsx
components/sections/shops/Rating.tsx features/catalog/components/Rating.tsx

# features/cart, users, riders, auth
lib/hooks/useCartActions.ts features/cart/hooks/useCartActions.ts
lib/users.ts features/users/server/users.ts
lib/hooks/useLiveLocation.tsx features/riders/hooks/useLiveLocation.tsx
lib/ClientAuthInit.tsx features/auth/components/ClientAuthInit.tsx
components/auth/AuthInput.tsx features/auth/components/AuthInput.tsx

# features/admin
components/admin/AdminAuthProvider.tsx features/admin/components/AdminAuthProvider.tsx
components/admin/AdminNav.tsx features/admin/components/AdminNav.tsx
components/admin/ui.tsx features/admin/components/AdminUI.tsx
components/sections/shops/ProductForm.tsx features/admin/products/ProductForm.tsx

# features/checkout
components/checkout/DetailRow.tsx features/checkout/components/DetailRow.tsx
components/checkout/ErrorState.tsx features/checkout/components/ErrorState.tsx
components/checkout/FailedState.tsx features/checkout/components/FailedState.tsx
components/checkout/PaymentStatusCard.tsx features/checkout/components/PaymentStatusCard.tsx
components/checkout/SuccessState.tsx features/checkout/components/SuccessState.tsx
components/checkout/LoadingState.tsx features/checkout/components/CheckoutLoadingState.tsx
components/checkout/types.ts features/checkout/types.ts

# shared components
components/sections/common/Header.tsx components/layout/Header.tsx
components/sections/common/Footer.tsx components/layout/Footer.tsx
components/sections/common/LoadingState.tsx components/feedback/LoadingState.tsx
components/sections/shops/EmptyState.tsx components/feedback/EmptyState.tsx

# generic hooks, global store and types
lib/hooks/usePusher.ts hooks/usePusher.ts
lib/store store
lib/types types

# routes: rider becomes its own route group
app/rider app/(rider)/rider
MAP_EOF

cat > "$FIXER" <<'JS_EOF'
import fs from 'node:fs';
import path from 'node:path';

const [, , mapFile, mode = '--dry'] = process.argv;
const WRITE = mode === '--write';
const root = process.cwd();
const posix = (p) => p.split(path.sep).join('/');
const exists = (p) => fs.existsSync(path.join(root, p));
const isEmptyDir = (p) => { try { return fs.statSync(path.join(root, p)).isDirectory() && fs.readdirSync(path.join(root, p)).length === 0; } catch { return false; } };

// --- load map; keep only entries that are meaningful on disk right now ---
const fileMap = new Map();
const dirMap = [];
for (const raw of fs.readFileSync(mapFile, 'utf8').split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [from, to] = line.split(/\s+/);
  const pending = exists(from) && (!exists(to) || isEmptyDir(to));  // not moved yet
  const done = !exists(from) && exists(to);                         // already moved
  if (!pending && !done) continue;                                  // collision or unrelated
  if (path.posix.basename(from).includes('.')) fileMap.set(from, to);
  else dirMap.push({ from, to });
}
dirMap.sort((a, b) => b.from.length - a.from.length);

const under = (p, d) => p === d || p.startsWith(d + '/');
const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const stripExt = (p) => p.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '');
const stripIndex = (p) => p.replace(/\/index$/, '');

function mapPath(p) {
  if (fileMap.has(p)) return fileMap.get(p);
  for (const d of dirMap) if (under(p, d.from)) return d.to + p.slice(d.from.length);
  return p;
}
function reversePath(p) {
  for (const [from, to] of fileMap) if (to === p) return from;
  for (const d of dirMap) if (under(p, d.to)) return d.from + p.slice(d.to.length);
  return p;
}
// module path (no extension) -> new module path, or null if it did not move
function mapModule(M) {
  for (const d of dirMap) if (under(M, d.from)) return d.to + M.slice(d.from.length);
  if (fileMap.has(M)) return fileMap.get(M);
  for (const e of EXTS) { const c = M + e; if (fileMap.has(c)) return stripIndex(stripExt(fileMap.get(c))); }
  for (const e of EXTS) { const c = M + '/index' + e; if (fileMap.has(c)) return stripIndex(stripExt(fileMap.get(c))); }
  return null;
}
function resolves(M) {
  if (exists(M) && fs.statSync(path.join(root, M)).isFile()) return true;
  for (const e of EXTS) if (exists(M + e)) return true;
  for (const e of EXTS) if (exists(M + '/index' + e)) return true;
  return false;
}

const SKIP = new Set(['node_modules', '.next', '.git', 'public', 'dist', 'build', 'coverage', '.turbo', '.vercel']);
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name) && !e.name.endsWith('.d.ts')) yield full;
  }
}

const re = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\b(?:jest|vi)\.mock\s*\(\s*)(["'])([^"'\n]+)\2/g;
let filesChanged = 0, importsChanged = 0;
const shown = [];
const broken = [];

for (const full of walk(root)) {
  const F = posix(path.relative(root, full));
  const rev = reversePath(F);
  const alreadyMoved = rev !== F;
  const old = rev;                                   // where the file lived before the move
  const curNew = alreadyMoved ? F : mapPath(F);      // where it lives after the move
  const movedSelf = alreadyMoved || curNew !== F;

  const src = fs.readFileSync(full, 'utf8');
  let n = 0;
  const out = src.replace(re, (m, pre, q, spec) => {
    if (spec.startsWith('@/')) {
      const M = spec.slice(2);
      const nm = mapModule(M);
      if (nm === null || nm === M) return m;
      n++; if (shown.length < 40) shown.push(`${F}: ${spec} -> @/${nm}`);
      return pre + q + '@/' + nm + q;
    }
    if (spec.startsWith('.')) {
      const M = path.posix.normalize(path.posix.join(path.posix.dirname(old), spec));
      if (M.startsWith('..')) return m;
      const nm = mapModule(M);
      if (!movedSelf && nm === null) return m;
      const final = nm ?? M;
      let rel = path.posix.relative(path.posix.dirname(curNew), final);
      if (!rel.startsWith('.')) rel = './' + rel;
      if (rel === spec) return m;
      n++; if (shown.length < 40) shown.push(`${F}: ${spec} -> @/${final}`);
      return pre + q + '@/' + final + q;
    }
    return m;
  });

  if (n) { filesChanged++; importsChanged += n; if (WRITE) fs.writeFileSync(full, out); }

  if (WRITE) {   // verify every local import now resolves
    for (const mm of out.matchAll(re)) {
      const spec = mm[3];
      let M = null;
      if (spec.startsWith('@/')) M = spec.slice(2);
      else if (spec.startsWith('.')) M = path.posix.normalize(path.posix.join(path.posix.dirname(F), spec));
      if (M && !M.startsWith('..') && !resolves(M)) broken.push(`${F}: ${spec}`);
    }
  }
}

console.log(shown.join('\n'));
if (importsChanged > shown.length) console.log(`... and ${importsChanged - shown.length} more`);
console.log(`\nImports ${WRITE ? 'rewritten' : 'that would be rewritten'}: ${importsChanged} in ${filesChanged} files`);
if (WRITE) {
  if (broken.length) {
    console.log(`\nStill unresolved (${broken.length}), fix by hand:`);
    console.log(broken.slice(0, 60).join('\n'));
  } else console.log('All local imports resolve.');
}
JS_EOF
echo "== Folders =="
DIRS=(
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
)
for d in "${DIRS[@]}"; do
  if [ $APPLY -eq 1 ]; then mkdir -p "$d"; else echo "mkdir -p $d"; fi
done

do_mv() {
  if [ $USE_GIT -eq 1 ] && git ls-files --error-unmatch "$1" >/dev/null 2>&1; then
    git mv "$1" "$2"
  else
    mv "$1" "$2"
  fi
}
mv_() {
  local src="$1" dst="$2"
  if [ ! -e "$src" ]; then
    if [ -e "$dst" ]; then echo "done (already moved): $dst"; else echo "skip (missing): $src"; fi
    return
  fi
  if [ -e "$dst" ]; then
    if [ -d "$dst" ] && [ -z "$(ls -A "$dst")" ]; then
      [ $APPLY -eq 1 ] && rmdir "$dst"
    else
      echo "skip (destination exists): $dst"; return
    fi
  fi
  echo "move $src -> $dst"
  if [ $APPLY -eq 1 ]; then mkdir -p "$(dirname "$dst")"; do_mv "$src" "$dst"; fi
}
echo; echo "== Moves =="
while read -r src dst; do
  case "$src" in ''|'#'*) continue;; esac
  mv_ "$src" "$dst"
done < "$MAP"


echo; echo "== Imports =="
if [ $APPLY -eq 1 ]; then node "$FIXER" "$MAP" --write; else node "$FIXER" "$MAP" --dry; fi


echo; echo "== Tidy up =="
if [ -d "app/(rider)/rider" ] && [ ! -f "app/(rider)/rider/layout.tsx" ]; then
  echo "add app/(rider)/rider/layout.tsx (rider had no layout of its own)"
  if [ $APPLY -eq 1 ]; then
    cat > "app/(rider)/rider/layout.tsx" <<'LAYOUT_EOF'
import type { ReactNode } from "react";

// Rider portal shell. Replace with the rider header / bottom nav / auth guard.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
LAYOUT_EOF
  fi
fi
if [ $APPLY -eq 1 ]; then
  find components/sections components/checkout components/admin components/auth lib/hooks \
    -depth -type d -empty -delete 2>/dev/null
  find features -type d -empty -exec touch {}/.gitkeep \; 2>/dev/null
fi

if [ $APPLY -eq 1 ]; then
  LEFT="$(find components/sections components/checkout components/admin components/auth lib/hooks -type f 2>/dev/null)"
  if [ -n "$LEFT" ]; then echo "Files still in old folders (not in the map, move by hand):"; echo "$LEFT"
  else echo "No files left in old component/hook folders."; fi
  echo "Remaining in lib/: $(ls lib 2>/dev/null | tr '\n' ' ')"
fi

grep -q '"@/\*"' tsconfig.json 2>/dev/null || echo "WARNING: tsconfig.json has no \"@/*\" path alias; rewritten imports need it."
ls tailwind.config.* >/dev/null 2>&1 && echo "NOTE: tailwind.config found. Add './features/**/*.{ts,tsx}' to its content globs."

echo
if [ $APPLY -eq 1 ]; then
  echo "Done. Next: rm -rf .next && npx tsc --noEmit   (then restart the TS server in VS Code)"
else
  echo "Dry run only. Re-run with --apply."
fi