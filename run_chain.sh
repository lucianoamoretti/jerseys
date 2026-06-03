#!/bin/bash
# Chain: wait for La Liga → Serie A → MLS → Bundesliga → commit each
set -e
cd /Users/lucianoamoretti/jerseys-store

log() { echo "[$(date '+%H:%M:%S')] $*"; }

commit_push() {
    local league="$1"
    local count="$2"
    git add js/products.js
    git commit -m "Add ${league}: ${count} new products from Yupoo

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    git push origin main
    log "Pushed ${league}"
}

# ── Wait for La Liga to finish ──
log "Waiting for La Liga scraper (PID check)..."
while pgrep -f "scraper_laliga.py" > /dev/null; do sleep 10; done
log "La Liga done."

# Fix apostrophes in La Liga products then commit
python3 - <<'PYEOF'
import re
content = open('js/products.js').read()
def fix(m):
    inner = m.group(1)
    fixed = re.sub(r"(?<!\\)'", "\\'", inner)
    return f"name:'{fixed}'"
content = re.sub(r"name:'(.*?)'(?=,team:)", fix, content)
open('js/products.js','w').write(content)
total = content.count("league:'La Liga'")
print(f"La Liga products: {total}")
PYEOF

LA_COUNT=$(grep -c "league:'La Liga'" js/products.js)
commit_push "La Liga" "$LA_COUNT"

# ── Serie A ──
log "Starting Serie A..."
python3 scraper_generic.py 708736 "Serie A" >> /tmp/seriea_scraper.log 2>&1
python3 - <<'PYEOF'
import re
content = open('js/products.js').read()
def fix(m):
    inner = m.group(1)
    fixed = re.sub(r"(?<!\\)'", "\\'", inner)
    return f"name:'{fixed}'"
content = re.sub(r"name:'(.*?)'(?=,team:)", fix, content)
open('js/products.js','w').write(content)
print(f"Serie A products: {content.count(\"league:'Serie A'\")}")
PYEOF
SA_COUNT=$(grep -c "league:'Serie A'" js/products.js)
commit_push "Serie A" "$SA_COUNT"
log "Serie A done."

# ── MLS ──
log "Starting MLS..."
python3 scraper_generic.py 3247384 "MLS" >> /tmp/mls_scraper.log 2>&1
python3 - <<'PYEOF'
import re
content = open('js/products.js').read()
def fix(m):
    inner = m.group(1)
    fixed = re.sub(r"(?<!\\)'", "\\'", inner)
    return f"name:'{fixed}'"
content = re.sub(r"name:'(.*?)'(?=,team:)", fix, content)
open('js/products.js','w').write(content)
print(f"MLS products: {content.count(\"league:'MLS'\")}")
PYEOF
MLS_COUNT=$(grep -c "league:'MLS'" js/products.js)
commit_push "MLS" "$MLS_COUNT"
log "MLS done."

# ── Bundesliga ──
log "Starting Bundesliga..."
python3 scraper_generic.py 680725 "Bundesliga" >> /tmp/bundesliga_scraper.log 2>&1
python3 - <<'PYEOF'
import re
content = open('js/products.js').read()
def fix(m):
    inner = m.group(1)
    fixed = re.sub(r"(?<!\\)'", "\\'", inner)
    return f"name:'{fixed}'"
content = re.sub(r"name:'(.*?)'(?=,team:)", fix, content)
open('js/products.js','w').write(content)
print(f"Bundesliga products: {content.count(\"league:'Bundesliga'\")}")
PYEOF
BL_COUNT=$(grep -c "league:'Bundesliga'" js/products.js)
commit_push "Bundesliga" "$BL_COUNT"
log "Bundesliga done."

# ── Ligue 1 ──
log "Starting Ligue 1..."
python3 scraper_generic.py 2897018 "Ligue 1" >> /tmp/ligue1_scraper.log 2>&1
python3 - <<'PYEOF'
import re
content = open('js/products.js').read()
def fix(m):
    inner = m.group(1)
    fixed = re.sub(r"(?<!\\)'", "\\'", inner)
    return f"name:'{fixed}'"
content = re.sub(r"name:'(.*?)'(?=,team:)", fix, content)
open('js/products.js','w').write(content)
print(f"Ligue 1 products: {content.count(\"league:'Ligue 1'\")}")
PYEOF
L1_COUNT=$(grep -c "league:'Ligue 1'" js/products.js)
commit_push "Ligue 1" "$L1_COUNT"
log "Ligue 1 done."

# ── World Cup 2026 ──
log "Starting World Cup 2026..."
python3 scraper_generic.py 5062328 "World Cup 2026" >> /tmp/wc2026_scraper.log 2>&1
python3 - <<'PYEOF'
import re
content = open('js/products.js').read()
def fix(m):
    inner = m.group(1)
    fixed = re.sub(r"(?<!\\)'", "\\'", inner)
    return f"name:'{fixed}'"
content = re.sub(r"name:'(.*?)'(?=,team:)", fix, content)
open('js/products.js','w').write(content)
print(f"World Cup 2026 products: {content.count(\"league:'World Cup 2026'\")}")
PYEOF
WC_COUNT=$(grep -c "league:'World Cup 2026'" js/products.js)
commit_push "World Cup 2026" "$WC_COUNT"
log "World Cup 2026 done."

log "ALL LEAGUES COMPLETE."
