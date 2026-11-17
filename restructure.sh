#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)"

SRC=components
APP=app
[ -d src/components ] && SRC=src/components
[ -d src/app ] && APP=src/app

mv_route() {
  [ -e "$APP/$1" ] || return 0
  mkdir -p "$APP/$2"
  git mv "$APP/$1" "$APP/$2/$(basename "$1")"
}

mkdir -p "$APP/(store)" "$APP/(checkout)"
mv_route page.tsx "(store)"
mv_route shop "(store)"
mv_route products "(store)"
mv_route account "(store)"
mv_route cart "(checkout)"
mv_route checkout "(checkout)"

MAP=/tmp/component-map.txt
: > "$MAP"

while read -r dir name; do
  [ -z "$dir" ] && continue
  file="$SRC/$name.tsx"
  [ -f "$file" ] || continue
  newname=$(echo "$name" | tr '[:upper:]' '[:lower:]')
  mkdir -p "$SRC/$dir"
  git mv "$file" "$SRC/$dir/$newname.tsx"
  echo "$name $dir/$newname" >> "$MAP"
done <<LIST
admin admin-orders
admin admin-products
auth auth-code-form
auth auth-form
auth auth-provider
auth auth-shell
cart cart-page
cart cart-provider
catalog catalog-page
checkout checkout-page
home storefront
home about-section
layout header
layout Footer
orders live-order-map-view
orders live-order-map
orders order-conversation
LIST

while read -r name target; do
  find "$APP" "$SRC" lib -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null -print0 |
    xargs -0 env OLD="$name" NEW="$target" perl -pi -e \
      's#(["\x27])\@/components/\Q$ENV{OLD}\E\1#$1\@/components/$ENV{NEW}$1#g'
  find "$SRC" -type f -name '*.tsx' -print0 |
    xargs -0 env OLD="$name" NEW="$target" perl -pi -e \
      's#(["\x27])\./\Q$ENV{OLD}\E\1#$1\@/components/$ENV{NEW}$1#g'
done < "$MAP"

echo "Done. Moved components:"
cat "$MAP"