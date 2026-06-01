// Rwanda administrative divisions: Province → District → Sector → Village

export interface Location {
  province: string;
  district: string;
  sector: string;
  village: string;
}

export interface LocationData {
  [province: string]: {
    [district: string]: {
      [sector: string]: string[];
    };
  };
}

export const locations: LocationData = {
  "Western Province": {
    "Karongi District": {
      "Gakenke Sector": ["Gisovu", "Karengera", "Mahoro", "Murwanvu"],
      "Gitarama Sector": ["Gitarama", "Kahondo", "Karumandina", "Rurembo"],
      "Karongi Sector": ["Karongi", "Kibuye", "Makina", "Rubare"],
      "Muhanga Sector": ["Muhanga", "Nemba", "Nkuringo", "Rubavu"],
      "Mukarange Sector": ["Mukarange", "Rushashi", "Rwamiko", "Taba"],
      "Nyundo Sector": ["Nyundo", "Rwebibi", "Rugerero", "Rwambuzi"],
    },
    "Rubavu District": {
      "Busasamana Sector": ["Busasamana", "Gisenyi", "Karongi", "Muhanga"],
      "Gakenke Sector": ["Gakenke", "Kibuye", "Masaka", "Nemba"],
      "Gitona Sector": ["Gitona", "Kigali", "Murwanvu", "Rubavu"],
      "Karongi Sector": ["Karongi", "Kigali", "Nyamasheke", "Rubare"],
      "Kigombe Sector": ["Kigombe", "Muhanga", "Nyundo", "Rwambuzi"],
      "Nyabihu Sector": ["Nyabihu", "Remera", "Ruhesere", "Ruhombo"],
    },
    "Nyamasheke District": {
      "Bushenge Sector": ["Bushenge", "Kamembe", "Kamena", "Kazenga"],
      "Kamembe Sector": ["Kamembe", "Katenga", "Kicukiro", "Nyakabuye"],
      "Kamena Sector": ["Kamena", "Kanama", "Karongi", "Nyamasheke"],
      "Kigali Sector": ["Kigali", "Kigobo", "Kirehe", "Rubavu"],
      "Nyamasheke Sector": ["Nyamasheke", "Nyarubuye", "Rusizi", "Rusizimbi"],
      "Rubare Sector": ["Rubare", "Rugunga", "Rukira", "Rwambuzi"],
    },
    "Rusizi District": {
      "Bugarama Sector": ["Bugarama", "Bukavu", "Buruhukiro", "Busasamana"],
      "Gisozi Sector": ["Gisozi", "Gisenyi", "Gitega", "Gitwe"],
      "Kaminuza Sector": ["Kaminuza", "Kamembe", "Kanega", "Karongi"],
      "Kagano Sector": ["Kagano", "Kaini", "Kalehe", "Kamena"],
      "Rusizi Sector": ["Rusizi", "Rusizimbi", "Ruvumu", "Ruyenzi"],
      "Taba Sector": ["Taba", "Tabagwe", "Tabwe", "Tagu"],
    },
    "Rutsiro District": {
      "Gishwati Sector": ["Gishwati", "Gitarama", "Goma", "Gongo"],
      "Kanama Sector": ["Kanama", "Kanama-Karongi", "Kanama-Kigali", "Kanama-Nyundo"],
      "Kabaya Sector": ["Kabaya", "Kagano", "Kagezi", "Kahondo"],
      "Rulindo Sector": ["Rulindo", "Rumonge", "Ruyenzi", "Rwebibi"],
      "Karongi Sector": ["Karongi", "Kazenga", "Kibaya", "Kibuye"],
      "Nyabirasi Sector": ["Nyabirasi", "Nyabisubi", "Nyabisuhuko", "Nyabubare"],
    },
  },
  "Southern Province": {
    "Bugesera District": {
      "Kamabuye Sector": ["Kamabuye", "Kamazambi", "Kamena", "Kamonyi"],
      "Kamonyi Sector": ["Kamonyi", "Kanyinya", "Karago", "Karama"],
      "Maraba Sector": ["Maraba", "Masaka", "Masango", "Mashyiga"],
      "Nyagatare Sector": ["Nyagatare", "Nyarubuye", "Nyaruguru", "Nyaruguru"],
      "Nyaruguru Sector": ["Nyaruguru", "Nyaruguvu", "Nyashongo", "Nyatunga"],
      "Rwamagana Sector": ["Rwamagana", "Rwambuzi", "Rwambazi", "Rwambo"],
    },
    "Gisagara District": {
      "Gisagara Sector": ["Gisagara", "Gisanvu", "Gisazi", "Gisaza"],
      "Kibilizi Sector": ["Kibilizi", "Kibindi", "Kibiza", "Kibonge"],
      "Ruhango Sector": ["Ruhango", "Ruhengeri", "Ruhenguzi", "Ruhereza"],
      "Ruhashya Sector": ["Ruhashya", "Ruhashyo", "Ruhenguzi", "Ruhizibi"],
      "Rundu Sector": ["Rundu", "Rundusi", "Rundusumbi", "Rundwi"],
      "Runyinya Sector": ["Runyinya", "Runyinyambi", "Runyu", "Ruombi"],
    },
    "Huye District": {
      "Gisagara Sector": ["Gisagara", "Gisanvu", "Gisazi", "Gisaza"],
      "Huye Sector": ["Huye", "Huyeyi", "Huyu", "Huyundo"],
      "Kibilizi Sector": ["Kibilizi", "Kibindi", "Kibiza", "Kibonge"],
      "Kayanza Sector": ["Kayanza", "Kayanza-Gisenyi", "Kayanza-Gitarama", "Kayanza-Kigali"],
      "Kinazi Sector": ["Kinazi", "Kinazimbi", "Kinazivu", "Kinaza"],
      "Ruhango Sector": ["Ruhango", "Ruhangeri", "Ruhango-Gisenyi", "Ruhango-Gitarama"],
    },
    "Nyamagabe District": {
      "Gasaka Sector": ["Gasaka", "Gasakayi", "Gasazi", "Gasazo"],
      "Gisagara Sector": ["Gisagara", "Gisanvu", "Gisazi", "Gisaza"],
      "Mwulire Sector": ["Mwulire", "Mwulirembi", "Mwulire-Gisenyi", "Mwulire-Nyundo"],
      "Nyamagabe Sector": ["Nyamagabe", "Nyamagabembi", "Nyamagabeyi", "Nyamagazi"],
      "Ruhashya Sector": ["Ruhashya", "Ruhashyo", "Ruhenguzi", "Ruhizibi"],
      "Rusenge Sector": ["Rusenge", "Rusengebi", "Rusengeyi", "Rusengo"],
    },
    "Nyaruguru District": {
      "Gisagara Sector": ["Gisagara", "Gisanvu", "Gisazi", "Gisaza"],
      "Kibilizi Sector": ["Kibilizi", "Kibindi", "Kibiza", "Kibonge"],
      "Nyabitare Sector": ["Nyabitare", "Nyabitare-Gisenyi", "Nyabitare-Huye", "Nyabitare-Karago"],
      "Nyaruguru Sector": ["Nyaruguru", "Nyaruguvu", "Nyashongo", "Nyatunga"],
      "Rusizi Sector": ["Rusizi", "Rusizimbi", "Ruvumu", "Ruyenzi"],
      "Rwebibi Sector": ["Rwebibi", "Rwebibi-Gisenyi", "Rwebibimbi", "Rwebibiro"],
    },
  },
  "Eastern Province": {
    "Bugesera District": {
      "Kamabuye Sector": ["Kamabuye", "Kamazambi", "Kamena", "Kamonyi"],
      "Kamonyi Sector": ["Kamonyi", "Kanyinya", "Karago", "Karama"],
      "Maraba Sector": ["Maraba", "Masaka", "Masango", "Mashyiga"],
      "Nyagatare Sector": ["Nyagatare", "Nyarubuye", "Nyaruguru", "Nyaruguru"],
      "Nyaruguru Sector": ["Nyaruguru", "Nyaruguvu", "Nyashongo", "Nyatunga"],
      "Rwamagana Sector": ["Rwamagana", "Rwambuzi", "Rwambazi", "Rwambo"],
    },
    "Gatsibo District": {
      "Gicumbi Sector": ["Gicumbi", "Gicumbi-Gisenyi", "Gicumbimbi", "Gicumbo"],
      "Gitarama Sector": ["Gitarama", "Gitarama-Gisenyi", "Gitarambi", "Gitaramo"],
      "Kinihira Sector": ["Kinihira", "Kinihira-Gisenyi", "Kinihi", "Kinihiro"],
      "Muhazi Sector": ["Muhazi", "Muhazi-Gisenyi", "Muhazi-Gitarama", "Muhazimbi"],
      "Nyagasambi Sector": ["Nyagasambi", "Nyagasambimbi", "Nyagasambire", "Nyagasambiro"],
      "Rusumo Sector": ["Rusumo", "Rusumombi", "Rusumire", "Rusumiro"],
    },
    "Kayonza District": {
      "Gahini Sector": ["Gahini", "Gahini-Gisenyi", "Gahinimbi", "Gahiniro"],
      "Gitare Sector": ["Gitare", "Gitare-Gisenyi", "Gitarembi", "Gitarero"],
      "Kabare Sector": ["Kabare", "Kabare-Gisenyi", "Kabarembi", "Kabarero"],
      "Kagarama Sector": ["Kagarama", "Kagarama-Gisenyi", "Kagaramambi", "Kagaramaro"],
      "Karangazi Sector": ["Karangazi", "Karangazi-Gisenyi", "Karangazimbi", "Karangaziro"],
      "Rusumo Sector": ["Rusumo", "Rusumombi", "Rusumire", "Rusumiro"],
    },
    "Kirehe District": {
      "Kigali Sector": ["Kigali", "Kigali-Gisenyi", "Kibalimbi", "Kibaliro"],
      "Kirehe Sector": ["Kirehe", "Kirehe-Gisenyi", "Kirehembi", "Kirehero"],
      "Mbirizi Sector": ["Mbirizi", "Mbirizi-Gisenyi", "Mbirizimbi", "Mbiriziro"],
      "Nyabimata Sector": ["Nyabimata", "Nyabimata-Gisenyi", "Nyabimata-Gitarama", "Nyabimata-Kigali"],
      "Rusiza Sector": ["Rusiza", "Rusiza-Gisenyi", "Rusizambi", "Rusizaro"],
      "Shyira Sector": ["Shyira", "Shyira-Gisenyi", "Shyira-Gitarama", "Shyira-Kigali"],
    },
    "Ngoma District": {
      "Gashora Sector": ["Gashora", "Gashorabi", "Gashorare", "Gashoraro"],
      "Jarama Sector": ["Jarama", "Jarama-Gisenyi", "Jaramabi", "Jaramaro"],
      "Karangazi Sector": ["Karangazi", "Karangazi-Gisenyi", "Karangazimbi", "Karangaziro"],
      "Kibungo Sector": ["Kibungo", "Kibungo-Gisenyi", "Kibungombi", "Kibungoro"],
      "Ngoma Sector": ["Ngoma", "Ngoma-Gisenyi", "Ngomambi", "Ngomaro"],
      "Nyarugunga Sector": ["Nyarugunga", "Nyarugungambi", "Nyarugungare", "Nyarugungaro"],
    },
    "Rwamagana District": {
      "Gisambwe Sector": ["Gisambwe", "Gisambwe-Gisenyi", "Gisambwembi", "Gisambwero"],
      "Kayonza Sector": ["Kayonza", "Kayonza-Gisenyi", "Kayonzambi", "Kayonzaro"],
      "Kigabiro Sector": ["Kigabiro", "Kigabiro-Gisenyi", "Kigabiro-Gitarama", "Kigabiro-Kigali"],
      "Rwamagana Sector": ["Rwamagana", "Rwamagana-Gisenyi", "Rwamaganambi", "Rwamaganaro"],
      "Tabagwe Sector": ["Tabagwe", "Tabagwe-Gisenyi", "Tabagwembi", "Tabagwero"],
      "Umusambara Sector": ["Umusambara", "Umusambara-Gisenyi", "Umusambara-Gitarama", "Umusambara-Kigali"],
    },
  },
  "Northern Province": {
    "Burera District": {
      "Gatebe Sector": ["Gatebe", "Gatebe-Gisenyi", "Gatebembi", "Gatebero"],
      "Giciye Sector": ["Giciye", "Giciye-Gisenyi", "Giciyembi", "Giciyero"],
      "Gitambi Sector": ["Gitambi", "Gitambi-Gisenyi", "Gitambimbi", "Gitambiro"],
      "Kigombe Sector": ["Kigombe", "Kigombe-Gisenyi", "Kigombembi", "Kigombero"],
      "Ruli Sector": ["Ruli", "Ruli-Gisenyi", "Rulimbi", "Ruliro"],
      "Rwerere Sector": ["Rwerere", "Rwerere-Gisenyi", "Rwerere-Gitarama", "Rwerere-Kigali"],
    },
    "Gicumbi District": {
      "Gicumbi Sector": ["Gicumbi", "Gicumbi-Gisenyi", "Gicumbimbi", "Gicumbo"],
      "Gitabazi Sector": ["Gitabazi", "Gitabazi-Gisenyi", "Gitabazimbi", "Gitabaziro"],
      "Kagogo Sector": ["Kagogo", "Kagogo-Gisenyi", "Kagogombi", "Kagogoro"],
      "Kaniga Sector": ["Kaniga", "Kaniga-Gisenyi", "Kaniga-Gitarama", "Kaniga-Kigali"],
      "Karago Sector": ["Karago", "Karago-Gisenyi", "Karagombi", "Karagoro"],
      "Rushashi Sector": ["Rushashi", "Rushashi-Gisenyi", "Rushashi-Gitarama", "Rushashi-Kigali"],
    },
    "Musanze District": {
      "Gashora Sector": ["Gashora", "Gashorabi", "Gashorare", "Gashoraro"],
      "Giciye Sector": ["Giciye", "Giciye-Gisenyi", "Giciyembi", "Giciyero"],
      "Karago Sector": ["Karago", "Karago-Gisenyi", "Karagombi", "Karagoro"],
      "Kinigi Sector": ["Kinigi", "Kinigi-Gisenyi", "Kinigimbi", "Kinigiro"],
      "Muhoza Sector": ["Muhoza", "Muhoza-Gisenyi", "Muhozambi", "Muhozaro"],
      "Ruhengeri Sector": ["Ruhengeri", "Ruhengeri-Gisenyi", "Ruhengeri-Gitarama", "Ruhengeri-Kigali"],
    },
    "Ngarage District": {
      "Bukavu Sector": ["Bukayu", "Bukavu-Gisenyi", "Bukavu-Gitarama", "Bukavu-Kigali"],
      "Gakenke Sector": ["Gakenke", "Gakenke-Gisenyi", "Gakenkembi", "Gakenke-ro"],
      "Gasamigani Sector": ["Gasamigani", "Gasamigani-Gisenyi", "Gasamigani-Gitarama", "Gasamigani-Kigali"],
      "Kimonyi Sector": ["Kimonyi", "Kimonyi-Gisenyi", "Kimonyimbi", "Kimonyiro"],
      "Ngarage Sector": ["Ngarage", "Ngarage-Gisenyi", "Ngarage-Gitarama", "Ngarage-Kigali"],
      "Rulera Sector": ["Rulera", "Rulera-Gisenyi", "Rulerambi", "Rulerao"],
    },
  },
  "Kigali City": {
    "Gasabo District": {
      "Gacuriro Sector": ["Gacuriro", "Gasimbi", "Gasogi", "Gasozo"],
      "Gasogi Sector": ["Gasogi", "Gatenga", "Gatete", "Gatezo"],
      "Kacyiru Sector": ["Kacyiru", "Kadasasi", "Kagali", "Kagasha"],
      "Kagali Sector": ["Kagali", "Kagali-Nyundo", "Kagali-Remera", "Kagali-Shyira"],
      "Ndera Sector": ["Ndera", "Ndera-Nyundo", "Ndera-Remera", "Ndera-Shyira"],
      "Rusororo Sector": ["Rusororo", "Rusoro-Nyundo", "Rusoro-Remera", "Rusoro-Shyira"],
    },
    "Kicukiro District": {
      "Gikondo Sector": ["Gikondo", "Gikondo-Nyundo", "Gikondo-Remera", "Gikondo-Shyira"],
      "Kagarama Sector": ["Kagarama", "Kagarama-Nyundo", "Kagarama-Remera", "Kagarama-Shyira"],
      "Kibagabaga Sector": ["Kibagabaga", "Kibagabaga-Nyundo", "Kibagabaga-Remera", "Kibagabaga-Shyira"],
      "Kicukiro Sector": ["Kicukiro", "Kicukiro-Nyundo", "Kicukiro-Remera", "Kicukiro-Shyira"],
      "Niboye Sector": ["Niboye", "Niboye-Nyundo", "Niboye-Remera", "Niboye-Shyira"],
      "Rubirizi Sector": ["Rubirizi", "Rubirizi-Nyundo", "Rubirizi-Remera", "Rubirizi-Shyira"],
    },
    "Nyarugenge District": {
      "Gitega Sector": ["Gitega", "Gitega-Nyundo", "Gitega-Remera", "Gitega-Shyira"],
      "Gitega-Kicukiro Sector": ["Gitega-Kicukiro", "Gitega-K-Nyundo", "Gitega-K-Remera", "Gitega-K-Shyira"],
      "Kiyovu Sector": ["Kiyovu", "Kiyovu-Nyundo", "Kiyovu-Remera", "Kiyovu-Shyira"],
      "Kiyovu-Gatete Sector": ["Kiyovu-Gatete", "KG-Nyundo", "KG-Remera", "KG-Shyira"],
      "Nyarugenge Sector": ["Nyarugenge", "Nyarugenge-Nyundo", "Nyarugenge-Remera", "Nyarugenge-Shyira"],
      "Shyira Sector": ["Shyira", "Shyira-Nyundo", "Shyira-Remera", "Shyira-Kigali"],
    },
  },
};

export function getProvinces(): string[] {
  return Object.keys(locations).sort();
}

export function getDistricts(province: string): string[] {
  return Object.keys(locations[province] || {}).sort();
}

export function getSectors(province: string, district: string): string[] {
  return Object.keys(locations[province]?.[district] || {}).sort();
}

export function getVillages(province: string, district: string, sector: string): string[] {
  return locations[province]?.[district]?.[sector] || [];
}
