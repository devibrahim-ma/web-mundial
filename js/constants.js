export const TEAMS = {
    "MEX": { name: "México", flag: "mx" },
    "RSA": { name: "Sudáfrica", flag: "za" },
    "KOR": { name: "Corea del Sur", flag: "kr" },
    "CZE": { name: "República Checa", flag: "cz" },
    
    "CAN": { name: "Canadá", flag: "ca" },
    "BIH": { name: "Bosnia-Herzegovina", flag: "ba" },
    "QAT": { name: "Qatar", flag: "qa" },
    "SUI": { name: "Suiza", flag: "ch" },
    
    "BRA": { name: "Brasil", flag: "br" },
    "MAR": { name: "Marruecos", flag: "ma" },
    "SCO": { name: "Escocia", flag: "gb-sct" },
    "HAI": { name: "Haití", flag: "ht" },
    
    "USA": { name: "Estados Unidos", flag: "us" },
    "PAR": { name: "Paraguay", flag: "py" },
    "AUS": { name: "Australia", flag: "au" },
    "TUR": { name: "Turquía", flag: "tr" },
    
    "GER": { name: "Alemania", flag: "de" },
    "CUW": { name: "Curazao", flag: "cw" },
    "CIV": { name: "Costa de Marfil", flag: "ci" },
    "ECU": { name: "Ecuador", flag: "ec" },
    
    "NED": { name: "Países Bajos", flag: "nl" },
    "JPN": { name: "Japón", flag: "jp" },
    "SWE": { name: "Suecia", flag: "se" },
    "TUN": { name: "Túnez", flag: "tn" },
    
    "BEL": { name: "Bélgica", flag: "be" },
    "EGY": { name: "Egipto", flag: "eg" },
    "IRN": { name: "Irán", flag: "ir" },
    "NZL": { name: "Nueva Zelanda", flag: "nz" },
    
    "CPV": { name: "Cabo Verde", flag: "cv" },
    "KSA": { name: "Arabia Saudita", flag: "sa" },
    "ESP": { name: "España", flag: "es" },
    "URU": { name: "Uruguay", flag: "uy" },
    
    "FRA": { name: "Francia", flag: "fr" },
    "IRQ": { name: "Irak", flag: "iq" },
    "NOR": { name: "Noruega", flag: "no" },
    "SEN": { name: "Senegal", flag: "sn" },
    
    "ALG": { name: "Argelia", flag: "dz" },
    "ARG": { name: "Argentina", flag: "ar" },
    "AUT": { name: "Austria", flag: "at" },
    "JOR": { name: "Jordania", flag: "jo" },
    
    "COL": { name: "Colombia", flag: "co" },
    "COD": { name: "RD Congo", flag: "cd" },
    "POR": { name: "Portugal", flag: "pt" },
    "UZB": { name: "Uzbekistán", flag: "uz" },
    
    "ENG": { name: "Inglaterra", flag: "gb-eng" },
    "CRO": { name: "Croacia", flag: "hr" },
    "GHA": { name: "Ghana", flag: "gh" },
    "PAN": { name: "Panamá", flag: "pa" }
};

export const GROUPS = {
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

export const MATCHES = {};
export const GROUP_IDS = Object.keys(GROUPS);

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

export const PROFILE_AVATARS = {
    0: "assets/ibra.jpeg",
    1: "assets/ali.jpeg",
    2: "assets/derdabi.jpeg",
    3: "assets/chakron.jpeg",
    4: "assets/afassi.jpeg"
};

export const FRIEND_THEMES = {
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
