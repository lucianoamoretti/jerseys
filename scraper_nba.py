#!/usr/bin/env python3
"""
NBA Yupoo scraper — xingkong-sports.x.yupoo.com
Translates Chinese album titles to English.
Name format: Team - Player - #Number - Season Edition
"""

import os, re, time, html as html_lib
import urllib.request, urllib.error

SELLER        = 'xingkong-sports'
BASE_URL      = f'https://{SELLER}.x.yupoo.com'
ALBUM_BASE    = f'{BASE_URL}/albums/'
PHOTO_BASE    = f'https://photo.yupoo.com/{SELLER}/'
IMAGES_DIR    = 'images'
PRODUCTS_FILE = 'js/products.js'
MAX_PHOTOS    = 4

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer':    f'{BASE_URL}/',
}

# ─── NBA Teams by conference ──────────────────────────────────────────────────
# (category_id, full_team_name, short_name, conference_label)
NBA_TEAMS = {
    'NBA East': [
        (3359584, 'Boston Celtics',       'Celtics',       'Eastern Conference'),
        (3377104, 'Brooklyn Nets',         'Nets',          'Eastern Conference'),
        (3508651, 'New York Knicks',       'Knicks',        'Eastern Conference'),
        (3415878, 'Philadelphia 76ers',    '76ers',         'Eastern Conference'),
        (3491511, 'Toronto Raptors',       'Raptors',       'Eastern Conference'),
        (3389344, 'Chicago Bulls',         'Bulls',         'Eastern Conference'),
        (3516794, 'Cleveland Cavaliers',   'Cavaliers',     'Eastern Conference'),
        (3790831, 'Detroit Pistons',       'Pistons',       'Eastern Conference'),
        (4088443, 'Indiana Pacers',        'Pacers',        'Eastern Conference'),
        (3425712, 'Milwaukee Bucks',       'Bucks',         'Eastern Conference'),
        (3475056, 'Atlanta Hawks',         'Hawks',         'Eastern Conference'),
        (3452967, 'Charlotte Hornets',     'Hornets',       'Eastern Conference'),
        (3363276, 'Miami Heat',            'Heat',          'Eastern Conference'),
        (3803338, 'Orlando Magic',         'Magic',         'Eastern Conference'),
        (3800324, 'Washington Wizards',    'Wizards',       'Eastern Conference'),
    ],
    'NBA West': [
        (3362932, 'Denver Nuggets',               'Nuggets',       'Western Conference'),
        (3709634, 'Minnesota Timberwolves',        'Timberwolves',  'Western Conference'),
        (3716044, 'Oklahoma City Thunder',         'Thunder',       'Western Conference'),
        (3471106, 'Portland Trail Blazers',        'Trail Blazers', 'Western Conference'),
        (3464678, 'Utah Jazz',                     'Jazz',          'Western Conference'),
        (3398324, 'Golden State Warriors',         'Warriors',      'Western Conference'),
        (3410864, 'Los Angeles Clippers',          'Clippers',      'Western Conference'),
        (3359577, 'Los Angeles Lakers',            'Lakers',        'Western Conference'),
        (3435559, 'Phoenix Suns',                  'Suns',          'Western Conference'),
        (3743373, 'Sacramento Kings',              'Kings',         'Western Conference'),
        (3435558, 'Dallas Mavericks',              'Mavericks',     'Western Conference'),
        (3360233, 'Houston Rockets',               'Rockets',       'Western Conference'),
        (3360232, 'Memphis Grizzlies',             'Grizzlies',     'Western Conference'),
        (3872922, 'New Orleans Pelicans',          'Pelicans',      'Western Conference'),
        (3471113, 'San Antonio Spurs',             'Spurs',         'Western Conference'),
    ],
}

# ─── Season translation: 26赛季 → "25/26" ────────────────────────────────────
def translate_season(title):
    # Full retro season like "84/85赛季" or "07/08赛季"
    m = re.search(r'(\d{2}/\d{2})赛季', title)
    if m:
        return m.group(1)
    # Short format like "26赛季"
    m2 = re.search(r'(\d{2})赛季', title)
    if m2:
        yr = int(m2.group(1))
        return f"{yr-1:02d}/{yr:02d}"
    return ''

# ─── Edition / style ─────────────────────────────────────────────────────────
EDITIONS = [
    ('MN热压复古',         'M&N Hardwood Classics'),
    ('MN热压',             'M&N Hardwood Classics'),
    ('MN复古',             'M&N Retro'),
    ('Mitchell.*Ness',     'M&N'),
    ('BAPE.*M&N',          'BAPE x M&N Collab'),
    ('BAPE',               'BAPE Collab'),
    ('Blackpink.*联名',    'Blackpink Collab'),
    ('Supreme',            'Supreme Collab'),
    ('飞人限定',           'Jordan Brand'),
    ('飞人',               'Jordan Brand'),
    ('城市版',             'City Edition'),
    ('荣耀版',             'Hardwood Classics'),
    ('复古',               'Retro'),
    ('全明星',             'All-Star'),
    ('奥运会',             'Olympics'),
    ('钮扣开衫',           'Button Cardigan'),
    ('球员版',             'Player Version'),
    ('球迷版',             'Fan Version'),
    ('主场',               'Home'),
    ('客场',               'Away'),
    ('新秀',               'Rookie Edition'),
    ('涂鸦',               'Graffiti Edition'),
    ('蛇皮',               'Special Edition'),
    ('星星',               'Stars Edition'),
    ('联名',               'Collab'),
    ('V领',                'V-Neck'),
    ('圆领',               'Crew-Neck'),
]

COLORS = {
    '白色': 'White', '黄色': 'Gold', '紫色': 'Purple',
    '绿色': 'Green', '蓝色': 'Blue', '藏蓝色': 'Navy',
    '黑色': 'Black', '红色': 'Red', '金色': 'Gold',
    '橙色': 'Orange', '灰色': 'Gray', '银色': 'Silver',
    '粉色': 'Pink', '条纹紫色': 'Purple Stripe', '条纹': 'Striped',
}

def translate_edition(title):
    for cn, en in EDITIONS:
        if re.search(cn, title):
            return en
    # Color as edition fallback
    for cn, en in COLORS.items():
        if cn in title:
            return en
    return ''

# ─── Player name dictionary (Chinese → English) ──────────────────────────────
PLAYERS = {
    # Lakers
    '科比': 'Kobe', '詹姆斯': 'LeBron', '勒布朗': 'LeBron',
    '东契奇': 'Doncic', '艾顿': 'Ayton', '里弗斯': 'Rivers',
    '克内克特': 'Knecht', '戴维斯': 'A. Davis', '拉塞尔': 'D. Russell',
    '贝弗利': 'Beverley', '小萨博尼斯': 'Sabonis',
    # Celtics
    '塔图姆': 'Tatum', '布朗': 'Brown', '霍乐迪': 'Holiday',
    '波尔津吉斯': 'Porzingis', '波尔津斯尼': 'Porzingis',
    '凯塔': 'Queta', '加内特': 'Garnett', '伯德': 'Bird',
    '欧文': 'Irving', '皮尔斯': 'Pierce',
    # Bulls
    '乔丹': 'Jordan', '皮蓬': 'Pippen', '罗德曼': 'Rodman',
    '拉文': 'LaVine', '德罗赞': 'DeRozan', '韦德': 'Wade',
    '罗斯': 'Rose', '怀特': 'White', '艾弗森': 'Iverson',
    # Warriors
    '库里': 'Curry', '汤普森': 'Thompson', '格林': 'Green',
    '杜兰特': 'Durant', '威金斯': 'Wiggins', '波格特': 'Bogut',
    # Heat
    '博什': 'Bosh', '奥尼尔': "O'Neal", '阿德巴约': 'Adebayo',
    '赫罗': 'Herro', '巴特勒': 'Butler', '莱利': 'Riley',
    # Nets
    '哈登': 'Harden', '西蒙斯': 'Simmons', '布里奇斯': 'Bridges',
    # Knicks
    '布伦森': 'Brunson', '兰德尔': 'Randle', '巴雷特': 'Barrett',
    '哈特': 'Hart',
    # 76ers
    '恩比德': 'Embiid', '马克西': 'Maxey', '乔治': 'P. George',
    # Raptors
    '西亚卡姆': 'Siakam', '范弗利特': 'VanVleet', '巴恩斯': 'Barnes',
    # Hawks
    '特雷扬': 'Trae Young', '扬': 'Young',
    '博格达诺维奇': 'Bogdanovic',
    # Cavaliers
    '米切尔': 'Mitchell', '莫布里': 'Mobley', '加兰': 'Garland',
    # Bucks
    '字母哥': 'Giannis', '利拉德': 'Lillard', '波蒂斯': 'Portis',
    # Pacers
    '哈利伯顿': 'Haliburton', '内史密斯': 'Nesmith',
    # Pistons
    '格兰特': 'Grant', '坎宁安': 'Cunningham',
    # Wizards
    '比尔': 'Beal',
    # Nuggets
    '约基奇': 'Jokic', '穆雷': 'Murray', '波特': 'M. Porter Jr.',
    # Thunder
    '吉勒斯': 'SGA', '亚历山大': 'SGA', '霍尔姆格伦': 'Holmgren',
    # Timberwolves
    '唐斯': 'K. Towns', '爱德华兹': 'Edwards', '戈贝尔': 'Gobert',
    # Trail Blazers
    '麦科勒姆': 'McCollum', '纳坎巴': 'Nurkic',
    # Jazz
    '克拉克森': 'Clarkson', '马尔卡宁': 'Markkanen',
    # Suns
    '保罗': 'C. Paul', '布克': 'Booker', '努尔基奇': 'Nurkic',
    # Mavericks
    '芬尼史密斯': 'Finney-Smith',
    # Rockets
    '霍华德': 'Howard',
    # Grizzlies
    '莫兰特': 'Morant', '贝恩': 'Bane', '亚当斯': 'Adams',
    # Pelicans
    '锡安': 'Zion', '英格拉姆': 'Ingram',
    # Kings
    '福克斯': 'Fox', '沙博尼斯': 'Sabonis',
    # Spurs
    '邓肯': 'Duncan', '帕克': 'T. Parker', '吉诺比利': 'Ginobili',
    '温班亚马': 'Wembanyama',
    # Clippers
    '伦纳德': 'Leonard', '卡哈利': 'Kawhi',
    # Cross-team legends
    '魔术师': 'Magic Johnson', '约翰逊': 'Magic Johnson',
    '诺维茨基': 'Nowitzki', '德克': 'Nowitzki',
    '巴克利': 'Barkley', '佩顿': 'G. Payton',
    '马龙': 'K. Malone', '斯托克顿': 'Stockton',
    '张伯伦': 'Chamberlain', '卡特': 'V. Carter',
    '麦格雷迪': 'T-Mac', '麦迪': 'T-Mac',
    '格里芬': 'Griffin',
    '威廉姆斯': 'Williams', '威利': 'Willie',
    '拉里': 'Larry', '查尔斯': 'Charles',
    '德怀特': 'D. Howard',
    '厄文': 'Erving',
}

# ─── Product type detection ───────────────────────────────────────────────────
def detect_type(title):
    t = title
    if '球裤' in t: return 'short'
    if '童装' in t: return 'infant'
    if '短袖' in t or 'T恤' in t: return 'retro'
    if '开衫' in t: return 'retro'
    if re.search(r'MN|Mitchell|复古', t): return 'retro'
    return 'nba'

# ─── Build English product name ───────────────────────────────────────────────
def build_name(raw_title, short_name):
    title = raw_title

    is_kids = '童装' in title

    # Season
    season = translate_season(title)

    # Edition
    edition = translate_edition(title)

    # Jersey number
    m_num = re.search(r'(\d+)号', title)
    number = f"#{m_num.group(1)}" if m_num else ''

    # Player name (longest match first to avoid partial matches)
    player = ''
    for cn in sorted(PLAYERS.keys(), key=len, reverse=True):
        if cn in title:
            player = PLAYERS[cn]
            break

    # Product type suffix
    if '球裤' in title:
        ptype = 'Shorts'
    elif '童装' in title:
        ptype = 'Kids'
    elif '短袖' in title:
        ptype = 'Short Sleeve'
    elif 'T恤' in title:
        ptype = 'T-Shirt'
    elif '开衫' in title:
        ptype = 'Cardigan'
    else:
        ptype = ''

    # Assemble version string: "Season Edition" or just one of them
    version_parts = []
    if season:
        version_parts.append(season)
    if edition:
        version_parts.append(edition)
    if ptype:
        version_parts.append(ptype)
    version = ' '.join(version_parts)

    # Final name: Team - Player - #Number - Version
    # Format: Team - Player - #Number - Version
    parts = [short_name]
    if player:
        parts.append(player)
    if number:
        parts.append(number)
    if version:
        parts.append(version)

    return ' - '.join(parts) if parts else short_name

# ─── Network helpers ─────────────────────────────────────────────────────────
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

def get_album_ids(category_id):
    all_ids, page = [], 1
    while True:
        url = f'{BASE_URL}/categories/{category_id}' if page == 1 \
              else f'{BASE_URL}/categories/{category_id}?page={page}'
        html = fetch(url)
        if not html: break
        ids = list(dict.fromkeys(re.findall(r'href="/albums/(\d+)\?', html)))
        if not ids: break
        all_ids.extend(ids)
        page += 1
        time.sleep(0.5)
    return list(dict.fromkeys(all_ids))

def get_album_data(album_id, category_id):
    url = f'{ALBUM_BASE}{album_id}?uid=1&isSubCate=false&referrercate={category_id}'
    html = fetch(url)
    if not html: return None, []
    if re.search(r'type=["\']password["\']', html, re.IGNORECASE): return None, []
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    if not h1: return None, []
    raw = re.sub(r'<[^>]+>', '', h1.group(1)).strip()
    raw = html_lib.unescape(raw)
    if not raw: return None, []
    photo_ids = list(dict.fromkeys(re.findall(
        r'photo\.yupoo\.com/' + re.escape(SELLER) + r'/([a-f0-9]+)/(?:small|medium|thumb)',
        html
    )))
    return raw, photo_ids[:MAX_PHOTOS]

def download_photo(photo_id):
    fname = f'nba_{photo_id}.jpg'
    fpath = os.path.join(IMAGES_DIR, fname)
    if os.path.exists(fpath) and os.path.getsize(fpath) > 1000:
        return 'images/' + fname
    try:
        req = urllib.request.Request(f'{PHOTO_BASE}{photo_id}/small.jpg', headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        if len(data) > 1000:
            with open(fpath, 'wb') as f: f.write(data)
            return 'images/' + fname
    except:
        pass
    return None

def js_escape(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")

def get_next_id():
    content = open(PRODUCTS_FILE).read()
    ids = [int(x) for x in re.findall(r'\bid:(\d+)\b', content)]
    return max(ids) + 1 if ids else 1

# ─── MAIN ─────────────────────────────────────────────────────────────────────
os.makedirs(IMAGES_DIR, exist_ok=True)

existing_content = open(PRODUCTS_FILE).read()
existing_names = set(re.findall(r"name:'((?:[^'\\]|\\.)*)'", existing_content))
start_id = get_next_id()
print(f'Existing products: {len(existing_names)} | Starting ID: {start_id}')

total_new = total_skip = total_err = 0
all_new_lines = []

for league, teams in NBA_TEAMS.items():
    for (cat_id, full_name, short_name, conference) in teams:
        print(f'\n── {full_name} (cat {cat_id}) ──')
        album_ids = get_album_ids(cat_id)
        print(f'  Albums found: {len(album_ids)}')

        team_new = team_skip = team_err = 0

        for i, aid in enumerate(album_ids, 1):
            raw_title, photo_ids = get_album_data(aid, cat_id)
            if not raw_title:
                team_err += 1
                time.sleep(0.3)
                continue

            eng_name = build_name(raw_title, short_name)
            clean    = js_escape(eng_name)

            if clean in existing_names:
                team_skip += 1
                time.sleep(0.2)
                continue

            category = detect_type(raw_title)

            downloaded = []
            for pid in photo_ids:
                f = download_photo(pid)
                if f: downloaded.append(f)
                time.sleep(0.1)

            if not downloaded:
                team_err += 1
                time.sleep(0.3)
                continue

            cur_id = start_id + len(all_new_lines)
            imgs_arr = "'" + "','".join(downloaded) + "'"
            entry = (
                f"  {{id:{cur_id},"
                f"name:'{clean}',"
                f"team:'{js_escape(full_name)}',"
                f"league:'{league}',"
                f"category:'{category}',"
                f"conference:'{conference}',"
                f"image:'{downloaded[0]}',"
                f"images:[{imgs_arr}]}},"
            )
            all_new_lines.append(entry)
            existing_names.add(clean)
            team_new += 1

            if i % 20 == 0:
                print(f'  {i}/{len(album_ids)} — new:{team_new} skip:{team_skip} err:{team_err}', flush=True)

            time.sleep(0.25)

        print(f'  Done: {team_new} new | {team_skip} skip | {team_err} err')
        total_new += team_new; total_skip += team_skip; total_err += team_err

        # Write checkpoint after each team
        if all_new_lines:
            fresh = open(PRODUCTS_FILE).read()
            block = '\n' + '\n'.join(all_new_lines)
            if fresh.rstrip().endswith('];'):
                updated = fresh.rstrip()[:-2] + block + '\n];'
            else:
                idx = fresh.rfind('},')
                updated = fresh[:idx+2] + block + '\n' + fresh[idx+2:]
            with open(PRODUCTS_FILE, 'w') as f:
                f.write(updated)
            print(f'  Checkpoint saved ({len(all_new_lines)} total new products)')
            # Reload to get correct ID base and names
            existing_content = open(PRODUCTS_FILE).read()
            existing_names = set(re.findall(r"name:'((?:[^'\\]|\\.)*)'", existing_content))
            start_id = get_next_id()
            all_new_lines = []

        time.sleep(1)

print(f'\n=== COMPLETE: {total_new} new | {total_skip} skip | {total_err} err ===')
