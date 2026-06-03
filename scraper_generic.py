#!/usr/bin/env python3
"""Generic Yupoo league scraper — usage: python3 scraper_generic.py <category_id> <league_name>"""

import os, re, time, sys, html as html_lib
import urllib.request, urllib.error

if len(sys.argv) < 3:
    print("Usage: scraper_generic.py <category_id> <league_name>")
    sys.exit(1)

CATEGORY_ID   = sys.argv[1]
LEAGUE        = sys.argv[2]
CATEGORY_URL  = f'https://minkang.x.yupoo.com/categories/{CATEGORY_ID}'
ALBUM_BASE    = 'https://minkang.x.yupoo.com/albums/'
PHOTO_BASE    = 'https://photo.yupoo.com/minkang/'
IMAGES_DIR    = 'images'
PRODUCTS_FILE = 'js/products.js'
MAX_PHOTOS    = 4

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer':    'https://minkang.x.yupoo.com/',
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
        url = CATEGORY_URL if page == 1 else f'{CATEGORY_URL}?page={page}'
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
    url = f'{ALBUM_BASE}{album_id}?uid=1&isSubCate=false&referrercate={CATEGORY_ID}'
    html = fetch(url)
    if not html: return None, []
    if re.search(r'type=["\']password["\']', html, re.IGNORECASE): return None, []
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    raw = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    if not raw: return None, []
    title = clean_title(raw)
    photo_ids = list(dict.fromkeys(re.findall(
        r'photo\.yupoo\.com/minkang/([a-f0-9]+)/(?:small|medium|thumb)', html
    )))
    return title, photo_ids[:MAX_PHOTOS]

def clean_title(t):
    t = html_lib.unescape(t)
    t = re.sub(r'\d{1,2}$', '', t).strip()
    return t.rstrip('-/').strip()

def detect_category(title):
    t = title.lower()
    is_retro = 'retro' in t
    is_long  = bool(re.search(r'long.?slee?ve?', t))
    if is_retro and is_long:  return 'retrolongsleeve'
    if is_retro:              return 'retro'
    if is_long:               return 'longsleeve'
    if re.search(r'\bshorts?\b|\bpant\b', t): return 'short'
    if re.search(r'\binfant\b|\bbaby\b|\bkids? kit\b|\btoddler\b|\bchildren\b', t): return 'infant'
    if 'windbreaker' in t:    return 'windbreaker'
    if re.search(r'\bjacket\b|\bcoat\b|\bparka\b', t): return 'jacket'
    if re.search(r'player version|player grade|\baaa\b|authentic', t): return 'player'
    return 'fan'

# ── Per-league team aliases ──
LEAGUE_TEAMS = {
    'Serie A': {
        r'\bJuve(ntus)?\b': 'Juventus',
        r'\bJuv\b': 'Juventus',
        r'\bAC\s?Milan\b': 'AC Milan',
        r'\bMilan\b': 'AC Milan',
        r'\bInter\s?(?:Milan|FC)?\b': 'Inter Milan',
        r'\bInter\b': 'Inter Milan',
        r'\bAS\s?Roma\b': 'Roma',
        r'\bRoma\b': 'Roma',
        r'\bNapoli\b': 'Napoli',
        r'\bLazio\b': 'Lazio',
        r'\bAtalanta\b': 'Atalanta',
        r'\bFiorentina\b': 'Fiorentina',
        r'\bTorino\b': 'Torino',
        r'\bBologna\b': 'Bologna',
        r'\bUdinese\b': 'Udinese',
        r'\bSampdoria\b': 'Sampdoria',
        r'\bSassuolo\b': 'Sassuolo',
        r'\bEmpoli\b': 'Empoli',
        r'\bVerona\b': 'Verona',
        r'\bMonza\b': 'Monza',
        r'\bLecce\b': 'Lecce',
        r'\bCremonese\b': 'Cremonese',
        r'\bSalernitana\b': 'Salernitana',
        r'\bGenoa\b': 'Genoa',
        r'\bCagliari\b': 'Cagliari',
        r'\bFrosinone\b': 'Frosinone',
        r'\bSpezia\b': 'Spezia',
        r'\bParma\b': 'Parma',
        r'\bComo\b': 'Como',
        r'\bVenezia\b': 'Venezia',
        r'\bPalermo\b': 'Palermo',
        r'\bBari\b': 'Bari',
    },
    'MLS': {
        r'\bLA\s?Galaxy\b': 'LA Galaxy',
        r'\bLAFC\b': 'LAFC',
        r'\bLA\s?FC\b': 'LAFC',
        r'\bNYCFC\b': 'New York City FC',
        r'\bNY\s?City\b': 'New York City FC',
        r'\bNew\s?York\s?City\b': 'New York City FC',
        r'\bRed\s?Bulls?\b': 'New York Red Bulls',
        r'\bNY\s?Red\s?Bulls?\b': 'New York Red Bulls',
        r'\bChicago\s?Fire\b': 'Chicago Fire',
        r'\bAtlanta\s?United\b': 'Atlanta United',
        r'\bSeattle\s?Sounders?\b': 'Seattle Sounders',
        r'\bPortland\s?Timbers?\b': 'Portland Timbers',
        r'\bFC\s?Dallas\b': 'FC Dallas',
        r'\bHouston\s?Dynamo\b': 'Houston Dynamo',
        r'\bColorado\s?Rapids?\b': 'Colorado Rapids',
        r'\bReal\s?Salt\s?Lake\b': 'Real Salt Lake',
        r'\bRSL\b': 'Real Salt Lake',
        r'\bMinnesota\s?United\b': 'Minnesota United',
        r'\bNashville\s?SC\b': 'Nashville SC',
        r'\bInter\s?Miami\b': 'Inter Miami',
        r'\bOrlando\s?City\b': 'Orlando City',
        r'\bPhiladelphia\s?Union\b': 'Philadelphia Union',
        r'\bNew\s?England\b': 'New England Revolution',
        r'\bColumbus\s?Crew\b': 'Columbus Crew',
        r'\bToronto\s?FC\b': 'Toronto FC',
        r'\bVancouver\s?Whitecaps?\b': 'Vancouver Whitecaps',
        r'\bSan\s?Jose\b': 'San Jose Earthquakes',
        r'\bD\.?C\.?\s?United\b': 'DC United',
        r'\bSporting\s?KC\b': 'Sporting KC',
        r'\bSporting\s?Kansas\b': 'Sporting KC',
        r'\bAustin\s?FC\b': 'Austin FC',
        r'\bCharlotte\s?FC\b': 'Charlotte FC',
        r'\bSt\.?\s?Louis\b': 'St. Louis City SC',
        r'\bSan\s?Diego\b': 'San Diego FC',
        r'\bCF\s?Montréal\b': 'CF Montréal',
        r'\bMontreal\b': 'CF Montréal',
        r'\bSalt\s?Lake\b': 'Real Salt Lake',
    },
    'Bundesliga': {
        r'\bBayern\b': 'Bayern Munich',
        r'\bFCB\b': 'Bayern Munich',
        r'\bDortmund\b': 'Borussia Dortmund',
        r'\bBVB\b': 'Borussia Dortmund',
        r'\bRB\s?Leipzig\b': 'RB Leipzig',
        r'\bLeipzig\b': 'RB Leipzig',
        r'\bLeverkusen\b': 'Bayer Leverkusen',
        r'\bBayer\b': 'Bayer Leverkusen',
        r'\bEintracht\b': 'Eintracht Frankfurt',
        r'\bFrankfurt\b': 'Eintracht Frankfurt',
        r'\bM[oö]nchengladbach\b': 'Borussia Mönchengladbach',
        r'\bGladbach\b': 'Borussia Mönchengladbach',
        r'\bWolfsburg\b': 'Wolfsburg',
        r'\bFreiburg\b': 'Freiburg',
        r'\bUnion\s?Berlin\b': 'Union Berlin',
        r'\bHoffenheim\b': 'Hoffenheim',
        r'\bMainz\b': 'Mainz',
        r'\bAugsburg\b': 'Augsburg',
        r'\bWerder\b': 'Werder Bremen',
        r'\bBremen\b': 'Werder Bremen',
        r'\bStuttgart\b': 'Stuttgart',
        r'\bK[oö]ln\b': 'Köln',
        r'\bSchalke\b': 'Schalke',
        r'\bHertha\b': 'Hertha Berlin',
        r'\bBochum\b': 'Bochum',
        r'\bHamburg\b': 'Hamburg',
        r'\bHSV\b': 'Hamburg',
        r'\bN[üu]rnberg\b': 'Nürnberg',
        r'\bDarmstadt\b': 'Darmstadt',
        r'\bHeidenheim\b': 'Heidenheim',
        r'\bSt\.\s?Pauli\b': 'St. Pauli',
        r'\bKiel\b': 'Holstein Kiel',
    },
    'Ligue 1': {
        r'\bPSG\b': 'Paris Saint-Germain',
        r'\bParis\s?(?:Saint.Germain|SG)?\b': 'Paris Saint-Germain',
        r'\bMarseille\b': 'Marseille',
        r'\bOM\b': 'Marseille',
        r'\bLyon\b': 'Lyon',
        r'\bOL\b': 'Lyon',
        r'\bMonaco\b': 'Monaco',
        r'\bASM\b': 'Monaco',
        r'\bLille\b': 'Lille',
        r'\bLOSC\b': 'Lille',
        r'\bRennes\b': 'Rennes',
        r'\bNice\b': 'Nice',
        r'\bLens\b': 'Lens',
        r'\bStrasbourg\b': 'Strasbourg',
        r'\bNantes\b': 'Nantes',
        r'\bMontpellier\b': 'Montpellier',
        r'\bReims\b': 'Reims',
        r'\bToulouse\b': 'Toulouse',
        r'\bBordeaux\b': 'Bordeaux',
        r'\bSaint.?[EÉ]tienne\b': 'Saint-Étienne',
        r'\bBrest\b': 'Brest',
        r'\bMetz\b': 'Metz',
        r'\bLe\s?Havre\b': 'Le Havre',
        r'\bClermont\b': 'Clermont',
        r'\bAngers\b': 'Angers',
        r'\bTroyes\b': 'Troyes',
        r'\bLorient\b': 'Lorient',
        r'\bAuxerre\b': 'Auxerre',
        r'\bAjaccio\b': 'Ajaccio',
    },
    'World Cup 2026': {
        r'\bBrazil\b': 'Brazil',
        r'\bBrasil\b': 'Brazil',
        r'\bArgentina\b': 'Argentina',
        r'\bFrance\b': 'France',
        r'\bEngland\b': 'England',
        r'\bGermany\b': 'Germany',
        r'\bSpain\b': 'Spain',
        r'\bPortugal\b': 'Portugal',
        r'\bItaly\b': 'Italy',
        r'\bNetherlands\b': 'Netherlands',
        r'\bHolland\b': 'Netherlands',
        r'\bBelgium\b': 'Belgium',
        r'\bCroatia\b': 'Croatia',
        r'\bMexico\b': 'Mexico',
        r'\bUSA\b': 'USA',
        r'\bUnited\s?States\b': 'USA',
        r'\bUruguay\b': 'Uruguay',
        r'\bColombia\b': 'Colombia',
        r'\bSenegal\b': 'Senegal',
        r'\bMorocco\b': 'Morocco',
        r'\bJapan\b': 'Japan',
        r'\bSouth\s?Korea\b': 'South Korea',
        r'\bAustralia\b': 'Australia',
        r'\bCanada\b': 'Canada',
        r'\bPoland\b': 'Poland',
        r'\bDenmark\b': 'Denmark',
        r'\bSweden\b': 'Sweden',
        r'\bSwitzerland\b': 'Switzerland',
        r'\bTurkey\b': 'Turkey',
        r'\bEcuador\b': 'Ecuador',
        r'\bGhana\b': 'Ghana',
        r'\bIvory\s?Coast\b': 'Ivory Coast',
        r'\bNigeria\b': 'Nigeria',
        r'\bSaudi\s?Arabia\b': 'Saudi Arabia',
        r'\bIran\b': 'Iran',
        r'\bJamaica\b': 'Jamaica',
        r'\bChile\b': 'Chile',
        r'\bParaguay\b': 'Paraguay',
        r'\bBolivia\b': 'Bolivia',
        r'\bVenezuela\b': 'Venezuela',
        r'\bPeru\b': 'Peru',
        r'\bCzech\b': 'Czech Republic',
        r'\bAustria\b': 'Austria',
        r'\bScotland\b': 'Scotland',
        r'\bWales\b': 'Wales',
        r'\bIreland\b': 'Ireland',
        r'\bGreece\b': 'Greece',
        r'\bRomania\b': 'Romania',
        r'\bCuratu\b': 'Curaçao',
        r'\bCura[çc]ao\b': 'Curaçao',
    },
}

def extract_team(title, league):
    aliases = LEAGUE_TEAMS.get(league, {})
    for pattern, team in aliases.items():
        if re.search(pattern, title, re.IGNORECASE):
            return team
    m = re.match(r'^([\w\s\-\.]+?)\s+(?:\d{2}[\/\-]\d{2}|\d{4}|Home|Away|Third|GK|Retro|Long|Short|Infant)', title)
    return m.group(1).strip() if m else title.split()[0]

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

# ── MAIN ──
print(f'\n=== {LEAGUE} (category {CATEGORY_ID}) ===')
print('Collecting album IDs...')
album_ids = get_all_album_ids()
print(f'\nTotal albums: {len(album_ids)}')

existing_content = open(PRODUCTS_FILE).read()
existing_names = set(re.findall(r"name:'((?:[^'\\]|\\.)*)'", existing_content))
start_id = get_next_id()
print(f'Existing products: {len(existing_names)} | Starting ID: {start_id}\n')

next_id      = start_id
new_products = []
skipped      = 0
errors       = 0

for i, aid in enumerate(album_ids, 1):
    if i % 50 == 0:
        print(f'  {i}/{len(album_ids)} — new:{len(new_products)} skipped:{skipped} errors:{errors}', flush=True)

    title, photo_ids = get_album_data(aid)
    if not title:
        errors += 1
        time.sleep(0.3)
        continue

    clean = js_escape(title)
    if clean in existing_names:
        skipped += 1
        time.sleep(0.2)
        continue

    category = detect_category(title)
    team     = extract_team(title, LEAGUE)

    downloaded = []
    for pid in photo_ids:
        f = download_photo(pid)
        if f: downloaded.append(f)
        time.sleep(0.12)

    if not downloaded:
        errors += 1
        time.sleep(0.3)
        continue

    imgs_arr = "'" + "','".join(downloaded) + "'"
    entry = (
        f"  {{id:{next_id},"
        f"name:'{clean}',"
        f"team:'{js_escape(team)}',"
        f"league:'{LEAGUE}',"
        f"category:'{category}',"
        f"conference:'',"
        f"image:'{downloaded[0]}',"
        f"images:[{imgs_arr}]}},"
    )
    new_products.append(entry)
    existing_names.add(clean)
    next_id += 1
    time.sleep(0.25)

print(f'\nFinished {LEAGUE}: {len(new_products)} new | {skipped} skipped | {errors} errors')

if not new_products:
    print('Nothing to add.')
    sys.exit(0)

# Re-read fresh (in case file changed)
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
