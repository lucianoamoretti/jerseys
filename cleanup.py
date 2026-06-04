#!/usr/bin/env python3
"""
Comprehensive site cleanup:
1. Fix team names — re-extract from product name using canonical lists
2. Remove invalid team values (years, category words, player names)
3. Validate all photos — remove missing files, disable products with no photos
4. Add active:false to products with no valid images
"""

import os, re

PRODUCTS_FILE = 'js/products.js'
IMAGES_DIR    = 'images'

# ─── Canonical teams per league ───────────────────────────────────────────────

LEAGUE_TEAMS = {
    'Premier League': [
        'Arsenal','Aston Villa','Bournemouth','Brentford','Brighton','Burnley',
        'Chelsea','Crystal Palace','Everton','Fulham','Ipswich Town','Leicester City',
        'Liverpool','Luton Town','Manchester City','Manchester United',
        'Newcastle United','Nottingham Forest','Sheffield United','Southampton',
        'Tottenham','West Ham United','Wolves','Leeds United','West Brom',
        'Watford','Norwich City','Stoke City','Swansea City','Middlesbrough',
        'Sunderland','Birmingham City','Blackburn Rovers','Bolton Wanderers',
        'Charlton Athletic','Coventry City','Derby County','Hull City',
        'Huddersfield Town','Millwall','Portsmouth','Queens Park Rangers',
        'Reading','Rotherham','Wigan Athletic','Cardiff City','Barnsley',
        'Blackpool','Bristol City','Sheffield Wednesday','Oxford United',
        'Plymouth Argyle','Preston North End',
    ],
    'La Liga': [
        'Real Madrid','Barcelona','Atlético Madrid','Sevilla','Valencia',
        'Villarreal','Athletic Bilbao','Real Sociedad','Real Betis','Celta Vigo',
        'Getafe','Osasuna','Girona','Las Palmas','Rayo Vallecano','Almería',
        'Cádiz','Granada','Espanyol','Mallorca','Levante','Alavés','Elche',
        'Valladolid','Leganés','Deportivo Alavés','Real Oviedo','Zaragoza',
        'Sporting Gijón','Mirandés','Huesca','Eibar',
    ],
    'Serie A': [
        'Juventus','AC Milan','Inter Milan','Roma','Napoli','Lazio','Atalanta',
        'Fiorentina','Torino','Bologna','Udinese','Sampdoria','Sassuolo',
        'Empoli','Verona','Monza','Lecce','Cremonese','Salernitana','Genoa',
        'Cagliari','Frosinone','Spezia','Parma','Como','Venezia','Palermo',
        'Bari','Brescia','Pisa','Catanzaro','Cosenza',
    ],
    'Brazilian League': [
        'Flamengo','Palmeiras','São Paulo','Corinthians','Grêmio','Internacional',
        'Atlético Mineiro','Cruzeiro','Fluminense','Santos','Botafogo','Vasco',
        'Sport','Fortaleza','Ceará','Athletico Paranaense','Bahia','Goiás',
        'Coritiba','América Mineiro','Bragantino','Cuiabá','Avai','Juventude',
        'Chapecoense','Ponte Preta','Guarani','Ituano','Mirassol','Novorizontino',
        'Tombense','CSA','CRB','Sampaio Corrêa',
    ],
    'Bundesliga': [
        'Bayern Munich','Borussia Dortmund','RB Leipzig','Bayer Leverkusen',
        'Eintracht Frankfurt','Borussia Mönchengladbach','Wolfsburg','Freiburg',
        'Union Berlin','Hoffenheim','Mainz','Augsburg','Werder Bremen',
        'Stuttgart','Köln','Schalke','Hertha Berlin','Bochum','Hamburg',
        'Nürnberg','Darmstadt','Heidenheim','St. Pauli','Holstein Kiel',
        'Fortuna Düsseldorf','Paderborn','Bielefeld','Hannover',
    ],
    'Ligue 1': [
        'Paris Saint-Germain','Marseille','Lyon','Monaco','Lille','Rennes',
        'Nice','Lens','Strasbourg','Nantes','Montpellier','Reims','Toulouse',
        'Bordeaux','Saint-Étienne','Brest','Metz','Le Havre','Clermont',
        'Angers','Troyes','Lorient','Auxerre','Ajaccio',
    ],
    'MLS': [
        'LA Galaxy','LAFC','New York City FC','New York Red Bulls','Chicago Fire',
        'Atlanta United','Seattle Sounders','Portland Timbers','FC Dallas',
        'Houston Dynamo','Colorado Rapids','Real Salt Lake','Minnesota United',
        'Nashville SC','Inter Miami','Orlando City','Philadelphia Union',
        'New England Revolution','Columbus Crew','Toronto FC',
        'Vancouver Whitecaps','San Jose Earthquakes','DC United','Sporting KC',
        'Austin FC','Charlotte FC','St. Louis City SC','San Diego FC',
        'CF Montréal','FC Cincinnati',
    ],
    'National Teams': [
        'Brazil','Argentina','France','England','Germany','Spain','Portugal',
        'Italy','Netherlands','Belgium','Croatia','Mexico','USA','Uruguay',
        'Colombia','Senegal','Morocco','Japan','South Korea','Australia',
        'Canada','Poland','Denmark','Sweden','Switzerland','Turkey','Ecuador',
        'Ghana','Ivory Coast','Nigeria','Saudi Arabia','Iran','Chile','Peru',
        'Czech Republic','Austria','Scotland','Wales','Ireland','Greece',
        'Romania','Curaçao','Jamaica','Paraguay','Bolivia','Venezuela',
    ],
    'World Cup 2026': [
        'Brazil','Argentina','France','England','Germany','Spain','Portugal',
        'Italy','Netherlands','Belgium','Croatia','Mexico','USA','Uruguay',
        'Colombia','Senegal','Morocco','Japan','South Korea','Australia',
        'Canada','Poland','Denmark','Sweden','Switzerland','Turkey','Ecuador',
        'Ghana','Ivory Coast','Nigeria','Saudi Arabia','Iran','Chile','Peru',
        'Czech Republic','Austria','Scotland','Wales','Ireland','Greece',
        'Romania','Curaçao','Jamaica','Paraguay','Bolivia','Venezuela',
    ],
    'Liga Argentina': [
        'River Plate','Boca Juniors','Racing Club','Independiente','San Lorenzo',
        'Huracán','Vélez Sársfield','Estudiantes','Lanús','Talleres','Newell\'s',
        'Rosario Central','Banfield','Defensa y Justicia','Platense',
    ],
    'Liga MX': [
        'Cruz Azul','América','Chivas','Guadalajara','Tigres','Rayados',
        'Monterrey','Pumas','UNAM','Atlas','Santos Laguna','León',
        'Pachuca','Toluca','Necaxa','Xolos','Tijuana','Querétaro','Mazatlán',
        'Juárez','San Luis','Atlético San Luis',
    ],
    'Primeira Liga': [
        'Benfica','Porto','Sporting CP','Braga','Vitória Guimarães','Vitória Setúbal',
        'Famalicão','Paços de Ferreira','Moreirense','Boavista','Arouca',
        'Casa Pia','Gil Vicente','Chaves','Portimonense',
    ],
    'Scottish Premiership': [
        'Celtic','Rangers','Hearts','Hibernian','Aberdeen','Motherwell',
        'Dundee United','Kilmarnock','St Mirren','Ross County',
    ],
    'Eredivisie': [
        'Ajax','PSV','Feyenoord','AZ Alkmaar','Utrecht','Vitesse',
        'Twente','Groningen','Heerenveen','NEC Nijmegen',
    ],
}

# ─── Team aliases (abbrev → canonical) ──────────────────────────────────────

ALIASES = {
    r'\bM[-\s]?U\b|\bMUFC\b|\bMan\s?Utd?\b': 'Manchester United',
    r'\bMCFC\b|\bMan\s?City\b': 'Manchester City',
    r'\bLFC\b': 'Liverpool',
    r'\bAFC\b(?!\s*Ajax|\s*Bournemouth)': 'Arsenal',
    r'\bCFC\b': 'Chelsea',
    r'\bTHFC\b|\bSpurs\b': 'Tottenham',
    r'\bNUFC\b': 'Newcastle United',
    r'\bWHU(?:FC)?\b|\bHammers\b': 'West Ham United',
    r'\bAVFC\b': 'Aston Villa',
    r'\bNFFC\b|\bNott[mi]?\.?\s?Forest\b': 'Nottingham Forest',
    r'\bWBA\b|\bWest\s?Brom\b': 'West Brom',
    r'\bBVB\b': 'Borussia Dortmund',
    r'\bFCB\b(?!\s*Barcelona)': 'Bayern Munich',
    r'\bBayer\b(?!\s*Lever)': 'Bayer Leverkusen',
    r'\bPSG\b': 'Paris Saint-Germain',
    r'\bJuve\b|\bJuv\b': 'Juventus',
    r'\bInter\b(?!\s*Miami)': 'Inter Milan',
    r'\bAC\s?Milan\b': 'AC Milan',
    r'\bRM\b|\bRMCF\b': 'Real Madrid',
    r'\bBarca\b': 'Barcelona',
    r'\bAtl[eé]tico\b': 'Atlético Madrid',
    r'\bOM\b': 'Marseille',
    r'\bASM\b': 'Monaco',
    r'\bLOSC\b': 'Lille',
    r'\bOL\b': 'Lyon',
    r'\bBHA\b': 'Brighton',
    r'\bSt[-\.]?\s?Pauli\b': 'St. Pauli',
    r'\bKiel\b': 'Holstein Kiel',
    r'\bSporting\s?CP\b|\bSporting\b(?!\s*KC|\s*Gijón|\s*Kansas)': 'Sporting CP',
    r'\bRSL\b': 'Real Salt Lake',
    r'\bNYCFC\b': 'New York City FC',
    r'\bLAFC\b': 'LAFC',
    r'\bLA\s?Galaxy\b': 'LA Galaxy',
}

# Words that are NEVER valid team names
INVALID_TEAMS = {
    r'^\d{2}/\d{2}$',      # 25/26, 26/27
    r'^\d{4}$',             # 2024
    r'^Retro$',
    r'^Training$',
    r'^Home$', r'^Away$', r'^Third$',
    r'^GK$', r'^Goalkeeper$',
    r'^Long\s?Sleeve$',
    r'^Short[s]?$',
    r'^Infant$', r'^Baby$',
    r'^Windbreaker$', r'^Jacket$',
    r'^Fan$', r'^Player$',
    r'^Jersey$', r'^Kit$',
    # Player names that sneak in
    r'^Messi$', r'^Ronaldo$', r'^Neymar$', r'^Mbapp[eé]$',
    r'^Haaland$', r'^Vinicius$', r'^Benzema$', r'^Lewandowski$',
    r'^Salah$', r'^Kane$', r'^Bellingham$',
}

def is_invalid_team(name):
    for pattern in INVALID_TEAMS:
        if re.match(pattern, name, re.IGNORECASE):
            return True
    if re.match(r'^\d', name):   # starts with digit
        return True
    if len(name) <= 1:
        return True
    return False

def find_canonical_team(product_name, league):
    teams = LEAGUE_TEAMS.get(league, [])

    # Check aliases first
    for pattern, team in ALIASES.items():
        if re.search(pattern, product_name, re.IGNORECASE):
            # Verify team belongs to this league (or league is flexible)
            if team in teams or league in ('National Teams', 'World Cup 2026', 'Other'):
                return team
            # Still return if it's a strong match
            return team

    # Check canonical team names (longest first to avoid partial matches)
    for team in sorted(teams, key=len, reverse=True):
        if re.search(r'\b' + re.escape(team) + r'\b', product_name, re.IGNORECASE):
            return team

    return None

def image_exists(path):
    """Check image exists and is not empty."""
    full = path if os.path.isabs(path) else os.path.join(os.path.dirname(PRODUCTS_FILE), '..', path) if '/' not in PRODUCTS_FILE else path
    # path is like 'images/abc123.jpg'
    return os.path.exists(path) and os.path.getsize(path) > 500

# ─── Parse and process products ───────────────────────────────────────────────

print('Loading products.js...')
content = open(PRODUCTS_FILE).read()

# Extract CATEGORY_META and ALL_SIZES header
header_end = content.index('const products = [')
header = content[:header_end]

# Parse each product line
product_pattern = re.compile(
    r'\{id:(\d+),'
    r"name:'((?:[^'\\]|\\.)*)'"
    r",team:'((?:[^'\\]|\\.)*)'"
    r",league:'((?:[^'\\]|\\.)*)'"
    r",category:'([^']*)'"
    r",conference:'([^']*)'"
    r",image:'([^']*)'"
    r"(?:,images:\[([^\]]*)\])?"
    r"(?:,active:false)?"
    r'\}'
)

team_fixes   = 0
photo_fixes  = 0
disabled     = 0
new_lines    = []

for m in product_pattern.finditer(content):
    pid, name, team, league, category, conf, image, images_raw = (
        m.group(1), m.group(2), m.group(3), m.group(4),
        m.group(5), m.group(6), m.group(7), m.group(8) or ''
    )

    # ── 1. Fix team name ──
    canonical = find_canonical_team(name, league)
    if canonical and canonical != team:
        team = canonical
        team_fixes += 1
    elif is_invalid_team(team):
        # Try to extract from name
        fallback = find_canonical_team(name, league)
        if fallback:
            team = fallback
            team_fixes += 1
        else:
            # Last resort: extract first word(s) before year/keyword
            mm = re.match(
                r'^([\w\s\-\.]+?)\s+(?:\d{2}[\/\-]\d{2}|\d{4}|Home|Away|Third|GK|Retro|Long)',
                name
            )
            if mm:
                team = mm.group(1).strip()
                team_fixes += 1

    # ── 2. Validate photos ──
    # Parse images array
    if images_raw:
        raw_imgs = [x.strip().strip("'") for x in images_raw.split(',') if x.strip().strip("'")]
    else:
        raw_imgs = [image] if image else []

    valid_imgs = [img for img in raw_imgs if image_exists(img)]

    # Also check the main image
    if image and image not in valid_imgs and image_exists(image):
        valid_imgs.insert(0, image)

    if not valid_imgs:
        # No valid images — disable
        disabled += 1
        new_img    = ''
        imgs_part  = "images:[]"
        active_part = ',active:false'
    else:
        if len(valid_imgs) != len(raw_imgs):
            photo_fixes += 1
        new_img    = valid_imgs[0]
        imgs_arr   = ','.join(f"'{x}'" for x in valid_imgs)
        imgs_part  = f"images:[{imgs_arr}]"
        active_part = ''

    # ── 3. Rebuild product line ──
    def esc(s): return re.sub(r"(?<!\\)'", "\\'", s)

    line = (
        f"  {{id:{pid},"
        f"name:'{esc(name)}',"
        f"team:'{esc(team)}',"
        f"league:'{league}',"
        f"category:'{category}',"
        f"conference:'{conf}',"
        f"image:'{new_img}',"
        f"{imgs_part}}}{active_part}"
    )
    new_lines.append(line)

print(f'Processed: {len(new_lines)} products')
print(f'  Team fixes:   {team_fixes}')
print(f'  Photo fixes:  {photo_fixes}')
print(f'  Disabled:     {disabled} (no valid images)')

# ── Rebuild file ──
products_block = '\n'.join(new_lines)
new_content = header + 'const products = [\n' + products_block + '\n];\n'
open(PRODUCTS_FILE, 'w').write(new_content)
print('products.js saved.')

# ── Summary of team names per league ──
print('\nTeam counts per league (top leagues):')
from collections import Counter
content2 = open(PRODUCTS_FILE).read()
for league in ['Premier League','La Liga','Serie A','Brazilian League','Bundesliga','Ligue 1','MLS','World Cup 2026']:
    teams = re.findall(f"league:'{re.escape(league)}'[^}}]*?team:'([^']+)'", content2)
    tc = Counter(teams)
    print(f'\n  {league} ({len(teams)} products, {len(tc)} teams):')
    for t, c in tc.most_common(8):
        print(f'    {t}: {c}')
    if len(tc) > 8:
        print(f'    ... and {len(tc)-8} more teams')
