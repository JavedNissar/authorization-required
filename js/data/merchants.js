// The cast. ~40 businesses, one industry (the fish plant + the ferry).
// cat = merchant category for floor limits. Some are only newspaper names.
export const MERCHANTS = {
  harbor:    { name: "Harbour General Store",  cat: "grocery",   owner: "Ray Crocker" },
  marquee:   { name: "Marquee Hardware",       cat: "hardware",  owner: "Elliot Marche" },
  tideway:   { name: "Tideway Drugs",          cat: "pharmacy",  owner: "Marge Pelley" },
  saltbox:   { name: "The Salt Box Café",      cat: "restaurant",owner: "Dorcas Loder" },
  crown:     { name: "Crown & Anchor Tavern",  cat: "restaurant",owner: "Vic Barbour" },
  beacon:    { name: "Beacon Motel",           cat: "lodging",   owner: "Stanley Oake" },
  lighthouse:{ name: "Lighthouse Service Station", cat: "gas",   owner: "Gerry Pumphrey" },
  northside: { name: "Northside Garage",       cat: "auto",      owner: "Alonzo Freake" },
  twine:     { name: "Twine Loft Marine Supply", cat: "marine",  owner: "Hedley Button" },
  coop:      { name: "Fishermen's Co-op Store", cat: "grocery",  owner: "Aubrey Gosse" },
  dory:      { name: "Dory Bookstore",         cat: "retail",    owner: "Phyllis Carnell" },
  spar:      { name: "Spar & Sail Clothiers",  cat: "clothing",  owner: "Norma Drodge" },
  legion:    { name: "Royal Canadian Legion",  cat: "restaurant",owner: "Cecil Wareham" },
  dairy:     { name: "Bayview Dairy Bar",      cat: "restaurant",owner: "Flossie Chaytor" },
  radio:     { name: "Breakwater Radio & TV", cat: "appliance", owner: "Windsor Chubb" },
  roper:     { name: "The Roper Men's Wear",   cat: "clothing",  owner: "Otto Higgins" },
  emporium:  { name: "Doyle's Emporium",       cat: "department",owner: "Gordon Doyle" },
  chemist:   { name: "Snow's Chemist Shop",    cat: "pharmacy",  owner: "Harold Snow" },
  bakery:    { name: "Golden Crust Bakery",    cat: "grocery",   owner: "Ivy Noseworthy" },
  barber:    { name: "Modern Barber Shop",     cat: "service",   owner: "Leander Patey" },
  jeweler:   { name: "Trask & Son Jewellers",  cat: "jewelry",   owner: "Milton Trask" },
  furniture: { name: "Holloway Furniture",     cat: "furniture", owner: "Baxter Holloway" },
  florist:   { name: "Peggy's Flower Cart",    cat: "retail",    owner: "Peggy Minors" },
  feed:      { name: "Grandin Feed & Seed",    cat: "farm",      owner: "Eli Grandin" },
  pool:      { name: "Rex Pool Room",          cat: "restaurant",owner: "Rex Strickland" },
  laundry:   { name: "Superior Laundry",       cat: "service",   owner: "Mabel Kelloway" },
  printer:   { name: "The Weekly Compass (job printing)", cat: "service", owner: "Horace Tilley" },
  taxi:      { name: "Breakwater Taxi",        cat: "service",   owner: "Dolf Rendell" },
  liquor:    { name: "Liquor Store",           cat: "liquor",    owner: "—" },
  theatre:   { name: "Capitol Theatre",        cat: "lodging",   owner: "Mrs. Decker" },
  boat:      { name: "Quirk's Boat Building",  cat: "marine",    owner: "Absalom Quirk" },
  fishplant: { name: "Ocean Belle Fish Plant (office)", cat: "industrial", owner: "Plant office" },
  ferry:     { name: "Ferry Terminal Kiosk",   cat: "retail",    owner: "Terminus staff" },
  church:    { name: "United Church Manse",    cat: "service",   owner: "Rev. Pelley" },
  school:    { name: "Regional High (cafeteria)", cat: "grocery", owner: "School board" },
  clinic:    { name: "Dr. Pritchett's Clinic", cat: "pharmacy",  owner: "Clinic" },
  funeral:   { name: "Stacey's Funeral Home",  cat: "service",   owner: "Warrick Stacey" },
  laundro:   { name: "Seaside Laundromat",     cat: "service",   owner: "June Clouter" },
  five:      { name: "Five & Dime",            cat: "department",owner: "Cornelius Vatcher" },
  cream:     { name: "Creamery (ice)",         cat: "industrial",owner: "Creamery office" },
};

export const FLOOR_LIMITS = {
  grocery: 50, hardware: 50, pharmacy: 30, restaurant: 25, lodging: 75,
  gas: 20, auto: 50, marine: 75, retail: 40, clothing: 40, appliance: 100,
  department: 60, jewelry: 75, furniture: 100, farm: 50, service: 25,
  liquor: 20, industrial: 200,
};

export const SURNAMES = ["Crocker","Marche","Pelley","Loder","Barbour","Oake","Pumphrey","Freake","Button","Gosse","Carnell","Drodge","Wareham","Chaytor","Chubb","Higgins","Doyle","Snow","Noseworthy","Patey","Trask","Holloway","Minors","Grandin","Strickland","Kelloway","Tilley","Rendell","Quirk","Clouter","Vatcher","Decker","Pritchett","Stacey","Fudge","Barnes","Hulan","Squibb","Munden"];
export const FIRSTS = ["A.","B.","C.","D.","E.","F.","G.","H.","J.","K.","L.","M.","N.","P.","R.","S.","T.","W."];

export function merchantName(id) {
  return MERCHANTS[id]?.name ?? id;
}
