#!/bin/sh
set -e
cd "$(dirname "$0")"
commit=$(cat BOX_COMMIT)
if [ ! -d .box/.git ]; then
    git clone -q --no-checkout ../box .box
fi
if ! git -C .box cat-file -e "$commit^{commit}" 2>/dev/null; then
    git -C .box fetch -q origin
fi
git -C .box checkout -q --detach "$commit"
bake3 .box --local-env "$@"
