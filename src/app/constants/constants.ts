import { Team, Match, FriendTheme } from '../models/types';

export const TEAMS: Record<string, Team> = {
  "MEX": { name: "México", flag: "mx", sportsDbId: 134497 },
  "RSA": { name: "Sudáfrica", flag: "za", sportsDbId: 136482 },
  "KOR": { name: "Corea del Sur", flag: "kr", sportsDbId: 134517 },
  "CZE": { name: "República Checa", flag: "cz", sportsDbId: 133904 },
  
  "CAN": { name: "Canadá", flag: "ca", sportsDbId: 140073 },
  "BIH": { name: "Bosnia-Herzegovina", flag: "ba", sportsDbId: 134510 },
  "QAT": { name: "Qatar", flag: "qa", sportsDbId: 136472 },
  "SUI": { name: "Suiza", flag: "ch", sportsDbId: 134506 },
  
  "BRA": { name: "Brasil", flag: "br", sportsDbId: 134496 },
  "MAR": { name: "Marruecos", flag: "ma", sportsDbId: 136139 },
  "SCO": { name: "Escocia", flag: "gb-sct", sportsDbId: 136450 },
  "HAI": { name: "Haití", flag: "ht", sportsDbId: 140175 },
  
  "USA": { name: "Estados Unidos", flag: "us", sportsDbId: 134514 },
  "PAR": { name: "Paraguay", flag: "py", sportsDbId: 136471 },
  "AUS": { name: "Australia", flag: "au", sportsDbId: 134500 },
  "TUR": { name: "Turquía", flag: "tr", sportsDbId: 135985 },
  
  "GER": { name: "Alemania", flag: "de", sportsDbId: 133907 },
  "CUW": { name: "Curazao", flag: "cw", sportsDbId: 140271 },
  "CIV": { name: "Costa de Marfil", flag: "ci", sportsDbId: 134502 },
  "ECU": { name: "Ecuador", flag: "ec", sportsDbId: 134507 },
  
  "NED": { name: "Países Bajos", flag: "nl", sportsDbId: 133905 },
  "JPN": { name: "Japón", flag: "jp", sportsDbId: 134503 },
  "SWE": { name: "Suecia", flag: "se", sportsDbId: 133916 },
  "TUN": { name: "Túnez", flag: "tn", sportsDbId: 136142 },
  
  "BEL": { name: "Bélgica", flag: "be", sportsDbId: 134515 },
  "EGY": { name: "Egipto", flag: "eg", sportsDbId: 136138 },
  "IRN": { name: "Irán", flag: "ir", sportsDbId: 134511 },
  "NZL": { name: "Nueva Zelanda", flag: "nz", sportsDbId: 137449 },
  
  "CPV": { name: "Cabo Verde", flag: "cv", sportsDbId: 136477 },
  "KSA": { name: "Arabia Saudita", flag: "sa", sportsDbId: 136137 },
  "ESP": { name: "España", flag: "es", sportsDbId: 133909 },
  "URU": { name: "Uruguay", flag: "uy", sportsDbId: 134504 },
  
  "FRA": { name: "Francia", flag: "fr", sportsDbId: 133913 },
  "IRQ": { name: "Irak", flag: "iq", sportsDbId: 140148 },
  "NOR": { name: "Noruega", flag: "no", sportsDbId: 136516 },
  "SEN": { name: "Senegal", flag: "sn", sportsDbId: 136143 },
  
  "ALG": { name: "Argelia", flag: "dz", sportsDbId: 134516 },
  "ARG": { name: "Argentina", flag: "ar", sportsDbId: 134509 },
  "AUT": { name: "Austria", flag: "at", sportsDbId: 135986 },
  "JOR": { name: "Jordania", flag: "jo", sportsDbId: 140145 },
  
  "COL": { name: "Colombia", flag: "co", sportsDbId: 134501 },
  "COD": { name: "RD Congo", flag: "cd", sportsDbId: 136480 },
  "POR": { name: "Portugal", flag: "pt", sportsDbId: 133908 },
  "UZB": { name: "Uzbekistán", flag: "uz", sportsDbId: 140151 },
  
  "ENG": { name: "Inglaterra", flag: "gb-eng", sportsDbId: 133914 },
  "CRO": { name: "Croacia", flag: "hr", sportsDbId: 133912 },
  "GHA": { name: "Ghana", flag: "gh", sportsDbId: 134513 },
  "PAN": { name: "Panamá", flag: "pa", sportsDbId: 136141 }
};

export const GROUPS: Record<string, string[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "SCO", "HAI"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["CPV", "KSA", "ESP", "URU"],
  I: ["FRA", "IRQ", "NOR", "SEN"],
  J: ["ALG", "ARG", "AUT", "JOR"],
  K: ["COL", "COD", "POR", "UZB"],
  L: ["ENG", "CRO", "GHA", "PAN"]
};

export const GROUP_IDS = Object.keys(GROUPS);

export const MATCHES: Record<string, Match[]> = {};

GROUP_IDS.forEach(groupId => {
  const teams = GROUPS[groupId];
  MATCHES[groupId] = [
    { id: `${groupId}-1`, home: teams[0], away: teams[1] },
    { id: `${groupId}-2`, home: teams[2], away: teams[3] },
    { id: `${groupId}-3`, home: teams[0], away: teams[2] },
    { id: `${groupId}-4`, home: teams[1], away: teams[3] },
    { id: `${groupId}-5`, home: teams[3], away: teams[0] },
    { id: `${groupId}-6`, home: teams[1], away: teams[2] }
  ];
});

export const firebaseConfig = {
  apiKey: "AIzaSyDQw_ch8DPslkeH07G0V4yf5_IflUyy408",
  authDomain: "web-mundial-2026.firebaseapp.com",
  databaseURL: "https://web-mundial-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "web-mundial-2026",
  storageBucket: "web-mundial-2026.firebasestorage.app",
  messagingSenderId: "931472206945",
  appId: "1:931472206945:web:0816e89360fe4e3a968e20",
  measurementId: "G-29HD6KQ14S"
};

export const PROFILE_AVATARS: Record<number, string> = {
  0: "assets/ibra.jpeg",
  1: "assets/ali.jpeg",
  2: "assets/derdabi.jpeg",
  3: "assets/chakron.jpeg",
  4: "assets/afassi.jpeg"
};

export const FRIEND_THEMES: Record<number, FriendTheme> = {
  0: { // Ibra
    flags: ["es", "jp"],
    bgImage: "assets/theme_es.png",
    gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
  },
  1: { // Ali
    flags: ["es", "pt"],
    bgImage: "assets/theme_es.png",
    gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
  },
  2: { // Derdabi
    flags: ["ma", "pt"],
    bgImage: "assets/theme_ma.png",
    gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(0, 200, 83, 0.12) 0%, transparent 50%), #06070c"
  },
  3: { // Chakron
    flags: ["es", "cw"],
    bgImage: "assets/theme_es.png",
    gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
  },
  4: { // Afassi
    flags: ["es", "ar"],
    bgImage: "assets/theme_es.png",
    gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
  }
};
