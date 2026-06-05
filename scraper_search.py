#!/usr/bin/env python3
"""Yupoo search-based scraper — usage: python3 scraper_search.py <search_query> <team_name> <league_name>"""

import os, re, time, sys, html as html_lib
import urllib.request, urllib.error

if len(sys.argv) < 4:
    print("Usage: scraper_search.py <search_query> <team_name> <league_name>")
    sys.exit(1)

QUERY         = sys.argv[1]
TEAM          = sys.argv[2]
LEAGUE        = sys.argv[3]
SELLER        = 'minkang'
SEARCH_URL    = f'https://{SELLER}.x.yupoo.com/search/album'
ALBUM_BASE    = f'https://{SELLER}.x.yupoo.com/albums/'
PHOTO_BASE    = f'https://photo.yupoo.com/{SELLER}/'
IMAGES_DIR    = 'images'
PRODUCTS_FILE = 'js/products.js'
MAX_PHOTOS    = 4

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer':    f'https://{SELLER}.x.yupoo.com/',
}

os.makedirs(IMAGES_DIR, exist_ok=True)

def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode('utf-8', errors='ignore')
        except urllib.error.HTTPError as e:
            if e.code in (404, 403): return None
            if i < retries - 1: time.sleep(2 * (i + 1))
        except Exception:
            if i < retries - 1: time.sleep(2 * (i + 1))
    return None

def get_all_album_ids():
    all_ids, page = [], 1
    while True:
        url = f'{SEARCH_URL}?uid=1&sort=&q={urllib.parse.quote(QUERY)}&page={page}'
        html = fetch(url)
        if not html: break
        ids = list(dict.fromkeys(re.findall(r'href="/albums/(\d+)\?', html)))
        if not ids: break
        all_ids.extend(ids)
        print(f'  Page {page}: {len(ids)} albums (total: {len(all_ids)})', flush=True)
        page += 1
        time.sleep(0.6)
    return list(dict.fromkeys(all_ids))

def get_album_data(album_id):
    url = f'{ALBUM_BASE}{album_id}?uid=1'
    html = fetch(url)
    if not html: return None, []
    if re.search(r'type=["\']password["\']', html, re.IGNORECASE): return None, []
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    raw = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    if not raw: return None, []
    title = clean_title(raw)
    photo_ids = list(dict.fromkeys(re.findall(
        r'photo\.yupoo\.com/' + SELLER + r'/([a-f0-9]+)/(?:small|medium|thumb)', html
    )))
    return title, photo_ids[:MAX_PHOTOS]

def clean_title(t):
    t = html_lib.unescape(t)
    t = re.sub(r'\d{1,2}$', '', t).strip()
    return t.rstrip('-/').strip()

def detect_category(title):
    t = title.lower()
    if re.search(r'retro.*long|long.*retro', t):  return 'retrolongsleeve'
    if 'retro' in t:                               return 'retro'
    if re.search(r'long.?slee?ve?', t):            return 'longsleeve'
    if re.search(r'\bshorts?\b|\bpant\b', t):      return 'short'
    if re.search(r'\binfant\b|\bbaby\b|\bkids?\b|\btoddler\b', t): return 'infant'
    if 'windbreaker' in t:                         return 'windbreaker'
    if re.search(r'\bjacket\b|\bcoat\b', t):       return 'jacket'
    if re.search(r'player version|player grade|\baaa\b|authentic', t): return 'player'
    return 'fan'

def download_photo(photo_id):
    fname = f'{photo_id}.jpg'
    fpath = os.path.join(IMAGES_DIR, fname)
    if os.path.exists(fpath): return 'images/' + fname
    try:
        req = urllib.request.Request(f'{PHOTO_BASE}{photo_id}/small.jpg', headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        if len(data) > 1000:
            with open(fpath, 'wb') as f: f.write(data)
            return 'images/' + fname
    except: pass
    return None

def js_escape(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")

def get_next_id():
    content = open(PRODUCTS_FILE).read()
    ids = [int(x) for x in re.findall(r'\bid:(\d+)\b', content)]
    return max(ids) + 1 if ids else 1

import urllib.parse

# ── MAIN ──
print(f'\n=== {TEAM} → {LEAGUE} (search: "{QUERY}") ===')
print('Collecting album IDs...')
album_ids = get_all_album_ids()
print(f'Total albums: {len(album_ids)}\n')

existing_content = open(PRODUCTS_FILE).read()
existing_names = set(re.findall(r"name:'((?:[^'\\]|\\.)*)'", existing_content))
start_id = get_next_id()
print(f'Existing products: {len(existing_names)} | Starting ID: {start_id}\n')

next_id      = start_id
new_products = []
skipped      = 0
errors       = 0

for i, aid in enumerate(album_ids, 1):
    title, photo_ids = get_album_data(aid)
    if not title:
        errors += 1
        time.sleep(0.3)
        continue

    clean = js_escape(title)
    if clean in existing_names:
        skipped += 1
        print(f'  [{i}/{len(album_ids)}] SKIP: {title}', flush=True)
        time.sleep(0.2)
        continue

    category = detect_category(title)

    downloaded = []
    for pid in photo_ids:
        f = download_photo(pid)
        if f: downloaded.append(f)
        time.sleep(0.12)

    if not downloaded:
        errors += 1
        print(f'  [{i}/{len(album_ids)}] ERR (no photos): {title}', flush=True)
        time.sleep(0.3)
        continue

    imgs_arr = "'" + "','".join(downloaded) + "'"
    entry = (
        f"  {{id:{next_id},"
        f"name:'{clean}',"
        f"team:'{js_escape(TEAM)}',"
        f"league:'{js_escape(LEAGUE)}',"
        f"category:'{category}',"
        f"conference:'',"
        f"image:'{downloaded[0]}',"
        f"images:[{imgs_arr}]}},"
    )
    new_products.append(entry)
    existing_names.add(clean)
    print(f'  [{i}/{len(album_ids)}] + {title} ({category}) — {len(downloaded)} photos', flush=True)
    next_id += 1
    time.sleep(0.25)

print(f'\nFinished: {len(new_products)} new | {skipped} skipped | {errors} errors')

if not new_products:
    print('Nothing to add.')
    sys.exit(0)

existing_content = open(PRODUCTS_FILE).read()
block = '\n' + '\n'.join(new_products)
updated = existing_content.rstrip()
if updated.endswith('];'):
    updated = updated[:-2] + block + '\n];'
else:
    idx = updated.rfind('},')
    updated = updated[:idx+2] + block + '\n' + updated[idx+2:]

with open(PRODUCTS_FILE, 'w') as f:
    f.write(updated)

print(f'products.js updated — IDs {start_id}–{next_id-1}')
