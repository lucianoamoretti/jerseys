/* =====================================================
   PRODUCT CATALOG — Your Jersey Store
   Replace image: null with real image paths once
   you download photos from Yupoo.
   ===================================================== */

const CATEGORY_META = {
  'fan':           { label: 'Fan Jersey',      icon: '⚽', price: 10,  color: '#0a1628' },
  'nba':           { label: 'NBA Jersey',       icon: '🏀', price: 19,  color: '#1a0a0a' },
  'retro':         { label: 'Retro',            icon: '👔', price: 16,  color: '#1a1000' },
  'nike-player':   { label: 'Nike Player',      icon: '👕', price: 16,  color: '#0a0a1a' },
  'adidas-player': { label: 'Adidas Player',    icon: '👕', price: 16,  color: '#0d0d0d' },
  'infant':        { label: 'Infant Kit',       icon: '👶', price: 14,  color: '#0a1a1a' },
  'short':         { label: 'Shorts',           icon: '🩳', price: 9,   color: '#0a1a0a' },
  'longsleeve':    { label: 'Long Sleeve',      icon: '🥼', price: 15,  color: '#0a1020' },
  'windbreaker':   { label: 'Windbreaker',      icon: '🧥', price: 30,  color: '#111118' },
  'jacket':        { label: 'Jacket',           icon: '🧥', price: 35,  maxPrice: 45, color: '#100a0a' },
};

const ALL_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const products = [

  /* ——— FAN JERSEYS ——— */
  { id: 1,  name: 'Manchester City Home 24/25',     team: 'Manchester City',     league: 'Premier League', category: 'fan',           image: null, season: '24/25' },
  { id: 2,  name: 'Manchester City Away 24/25',     team: 'Manchester City',     league: 'Premier League', category: 'fan',           image: null, season: '24/25' },
  { id: 3,  name: 'Real Madrid Home 24/25',         team: 'Real Madrid',         league: 'La Liga',        category: 'fan',           image: null, season: '24/25' },
  { id: 4,  name: 'Real Madrid Away 24/25',         team: 'Real Madrid',         league: 'La Liga',        category: 'fan',           image: null, season: '24/25' },
  { id: 5,  name: 'Barcelona Home 24/25',           team: 'Barcelona',           league: 'La Liga',        category: 'fan',           image: null, season: '24/25' },
  { id: 6,  name: 'Barcelona Away 24/25',           team: 'Barcelona',           league: 'La Liga',        category: 'fan',           image: null, season: '24/25' },
  { id: 7,  name: 'Brazil Home 24/25',              team: 'Brazil',              league: 'National Team',  category: 'fan',           image: null, season: '24/25' },
  { id: 8,  name: 'Argentina Home 24/25',           team: 'Argentina',           league: 'National Team',  category: 'fan',           image: null, season: '24/25' },
  { id: 9,  name: 'Bayern Munich Home 24/25',       team: 'Bayern Munich',       league: 'Bundesliga',     category: 'fan',           image: null, season: '24/25' },
  { id: 10, name: 'PSG Home 24/25',                 team: 'PSG',                 league: 'Ligue 1',        category: 'fan',           image: null, season: '24/25' },
  { id: 11, name: 'Chelsea Home 24/25',             team: 'Chelsea',             league: 'Premier League', category: 'fan',           image: null, season: '24/25' },
  { id: 12, name: 'Inter Milan Home 24/25',         team: 'Inter Milan',         league: 'Serie A',        category: 'fan',           image: null, season: '24/25' },
  { id: 13, name: 'Juventus Home 24/25',            team: 'Juventus',            league: 'Serie A',        category: 'fan',           image: null, season: '24/25' },
  { id: 14, name: 'Arsenal Home 24/25',             team: 'Arsenal',             league: 'Premier League', category: 'fan',           image: null, season: '24/25' },
  { id: 15, name: 'Liverpool Home 24/25',           team: 'Liverpool',           league: 'Premier League', category: 'fan',           image: null, season: '24/25' },
  { id: 16, name: 'Atletico Madrid Home 24/25',     team: 'Atletico Madrid',     league: 'La Liga',        category: 'fan',           image: null, season: '24/25' },
  { id: 17, name: 'Borussia Dortmund Home 24/25',   team: 'Borussia Dortmund',   league: 'Bundesliga',     category: 'fan',           image: null, season: '24/25' },
  { id: 18, name: 'AC Milan Home 24/25',            team: 'AC Milan',            league: 'Serie A',        category: 'fan',           image: null, season: '24/25' },
  { id: 19, name: 'Portugal Home 24/25',            team: 'Portugal',            league: 'National Team',  category: 'fan',           image: null, season: '24/25' },
  { id: 20, name: 'France Home 24/25',              team: 'France',              league: 'National Team',  category: 'fan',           image: null, season: '24/25' },

  /* ——— NBA ——— */
  { id: 30, name: 'Los Angeles Lakers — LeBron #23',      team: 'LA Lakers',       league: 'NBA', category: 'nba', image: null },
  { id: 31, name: 'Chicago Bulls — Jordan #23',           team: 'Chicago Bulls',   league: 'NBA', category: 'nba', image: null },
  { id: 32, name: 'Golden State Warriors — Curry #30',    team: 'GSW',             league: 'NBA', category: 'nba', image: null },
  { id: 33, name: 'Boston Celtics — Tatum #0',            team: 'Boston Celtics',  league: 'NBA', category: 'nba', image: null },
  { id: 34, name: 'Miami Heat — Wade #3',                 team: 'Miami Heat',      league: 'NBA', category: 'nba', image: null },
  { id: 35, name: 'Brooklyn Nets — Durant #35',           team: 'Brooklyn Nets',   league: 'NBA', category: 'nba', image: null },

  /* ——— RETRO ——— */
  { id: 50, name: 'Brazil 1970 Retro',              team: 'Brazil',              league: 'Retro Classic', category: 'retro', image: null },
  { id: 51, name: 'Argentina 1986 Retro',           team: 'Argentina',           league: 'Retro Classic', category: 'retro', image: null },
  { id: 52, name: 'AC Milan 2002/03 Retro',         team: 'AC Milan',            league: 'Retro Classic', category: 'retro', image: null },
  { id: 53, name: 'Real Madrid 2001/02 Retro',      team: 'Real Madrid',         league: 'Retro Classic', category: 'retro', image: null },
  { id: 54, name: 'France 1998 World Cup Retro',    team: 'France',              league: 'Retro Classic', category: 'retro', image: null },
  { id: 55, name: 'Barcelona 2008/09 Retro',        team: 'Barcelona',           league: 'Retro Classic', category: 'retro', image: null },
  { id: 56, name: 'Italy 2006 World Cup Retro',     team: 'Italy',               league: 'Retro Classic', category: 'retro', image: null },

  /* ——— NIKE PLAYER ——— */
  { id: 70, name: 'Chelsea Home Player 24/25',      team: 'Chelsea',             league: 'Premier League', category: 'nike-player', image: null },
  { id: 71, name: 'PSG Home Player 24/25',          team: 'PSG',                 league: 'Ligue 1',        category: 'nike-player', image: null },
  { id: 72, name: 'Inter Milan Home Player 24/25',  team: 'Inter Milan',         league: 'Serie A',        category: 'nike-player', image: null },
  { id: 73, name: 'Liverpool Home Player 24/25',    team: 'Liverpool',           league: 'Premier League', category: 'nike-player', image: null },
  { id: 74, name: 'Brazil Home Player 24/25',       team: 'Brazil',              league: 'National Team',  category: 'nike-player', image: null },

  /* ——— ADIDAS PLAYER ——— */
  { id: 80, name: 'Arsenal Home Player 24/25',      team: 'Arsenal',             league: 'Premier League', category: 'adidas-player', image: null },
  { id: 81, name: 'Barcelona Home Player 24/25',    team: 'Barcelona',           league: 'La Liga',        category: 'adidas-player', image: null },
  { id: 82, name: 'Juventus Home Player 24/25',     team: 'Juventus',            league: 'Serie A',        category: 'adidas-player', image: null },
  { id: 83, name: 'Argentina Home Player 24/25',    team: 'Argentina',           league: 'National Team',  category: 'adidas-player', image: null },
  { id: 84, name: 'Real Madrid Home Player 24/25',  team: 'Real Madrid',         league: 'La Liga',        category: 'adidas-player', image: null },

  /* ——— INFANT KITS ——— */
  { id: 90, name: 'Brazil Infant Kit 24/25',         team: 'Brazil',         league: 'National Team',  category: 'infant', image: null },
  { id: 91, name: 'Argentina Infant Kit 24/25',      team: 'Argentina',      league: 'National Team',  category: 'infant', image: null },
  { id: 92, name: 'Barcelona Infant Kit 24/25',      team: 'Barcelona',      league: 'La Liga',        category: 'infant', image: null },
  { id: 93, name: 'Manchester City Infant Kit 24/25',team: 'Manchester City',league: 'Premier League', category: 'infant', image: null },

  /* ——— SHORTS ——— */
  { id: 100, name: 'Brazil Training Shorts',        team: 'Brazil',              league: 'National Team',  category: 'short', image: null },
  { id: 101, name: 'Real Madrid Training Shorts',   team: 'Real Madrid',         league: 'La Liga',        category: 'short', image: null },
  { id: 102, name: 'Manchester City Training Shorts',team:'Manchester City',     league: 'Premier League', category: 'short', image: null },
  { id: 103, name: 'Barcelona Training Shorts',     team: 'Barcelona',           league: 'La Liga',        category: 'short', image: null },

  /* ——— LONG SLEEVE ——— */
  { id: 110, name: 'Chelsea Long Sleeve 24/25',     team: 'Chelsea',             league: 'Premier League', category: 'longsleeve', image: null },
  { id: 111, name: 'Real Madrid Long Sleeve 24/25', team: 'Real Madrid',         league: 'La Liga',        category: 'longsleeve', image: null },
  { id: 112, name: 'Arsenal Long Sleeve 24/25',     team: 'Arsenal',             league: 'Premier League', category: 'longsleeve', image: null },

  /* ——— WINDBREAKERS ——— */
  { id: 120, name: 'Pro Club Windbreaker — Black',  team: 'Generic',             league: 'Training Gear',  category: 'windbreaker', image: null },
  { id: 121, name: 'Pro Club Windbreaker — Navy',   team: 'Generic',             league: 'Training Gear',  category: 'windbreaker', image: null },
  { id: 122, name: 'Brazil Training Windbreaker',   team: 'Brazil',              league: 'National Team',  category: 'windbreaker', image: null },

  /* ——— JACKETS ——— */
  { id: 130, name: 'Pro Puffer Jacket — Black',     team: 'Generic',             league: 'Training Gear',  category: 'jacket', image: null, priceNote: '$35–45' },
  { id: 131, name: 'Team Track Jacket — White',     team: 'Generic',             league: 'Training Gear',  category: 'jacket', image: null, priceNote: '$35–45' },
];
