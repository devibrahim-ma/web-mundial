const WIKIPEDIA_MAPPING = {
    "MEX": "Mexico",
    "RSA": "South Africa",
    "KOR": "South Korea",
    "CZE": "Czech Republic",
    "CAN": "Canada",
    "BIH": "Bosnia and Herzegovina",
    "QAT": "Qatar",
    "SUI": "Switzerland",
    "BRA": "Brazil",
    "MAR": "Morocco",
    "SCO": "Scotland",
    "HAI": "Haiti",
    "USA": "United States",
    "PAR": "Paraguay",
    "AUS": "Australia",
    "TUR": "Turkey",
    "GER": "Germany",
    "CUW": "Curaçao",
    "CIV": "Ivory Coast",
    "ECU": "Ecuador",
    "NED": "Netherlands",
    "JPN": "Japan",
    "SWE": "Sweden",
    "TUN": "Tunisia",
    "BEL": "Belgium",
    "EGY": "Egypt",
    "IRN": "Iran",
    "NZL": "New Zealand",
    "CPV": "Cape Verde",
    "KSA": "Saudi Arabia",
    "ESP": "Spain",
    "URU": "Uruguay",
    "FRA": "France",
    "IRQ": "Iraq",
    "NOR": "Norway",
    "SEN": "Senegal",
    "ALG": "Algeria",
    "ARG": "Argentina",
    "AUT": "Austria",
    "JOR": "Jordan",
    "COL": "Colombia",
    "COD": "DR Congo",
    "POR": "Portugal",
    "UZB": "Uzbekistan",
    "ENG": "England",
    "CRO": "Croatia",
    "GHA": "Ghana",
    "PAN": "Panama"
};

function cleanName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9 ]/g, "")      // Quitar caracteres especiales
    .trim();
}

function findMatchingPhoto(wikiName, sportsDbPlayers) {
  const cleanWiki = cleanName(wikiName);
  if (!cleanWiki) return "";
  
  // Buscar coincidencia en la que un nombre contenga al otro (ej. "Edson Álvarez" y "Edson Álvarez (captain)")
  const matched = sportsDbPlayers.find(p => {
    const cleanDb = cleanName(p.strPlayer);
    return cleanWiki.includes(cleanDb) || cleanDb.includes(cleanWiki);
  });
  
  return matched ? (matched.strCutout || matched.strThumb || "") : "";
}

async function fetchWikipediaSquad(tla) {
  const countryName = WIKIPEDIA_MAPPING[tla];
  if (!countryName) return [];

  try {
    // 1. Obtener la lista de secciones de la página de Wikipedia
    const sectionsRes = await fetch("https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=sections");
    if (!sectionsRes.ok) return [];
    
    const sectionsData = await sectionsRes.json();
    if (!sectionsData || !sectionsData.parse || !sectionsData.parse.sections) return [];

    // Buscar la sección correspondiente al país
    const section = sectionsData.parse.sections.find(s => 
      s.line.toLowerCase() === countryName.toLowerCase()
    );
    if (!section) return [];

    // 2. Obtener el contenido parseado de esa sección específica
    const contentRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&format=json&section=${section.index}&prop=text`);
    if (!contentRes.ok) return [];

    const contentData = await contentRes.json();
    if (!contentData || !contentData.parse || !contentData.parse.text) return [];

    const html = contentData.parse.text['*'];
    
    // 3. Parsear las filas de los jugadores (<tr class="nat-fs-player">)
    const segments = html.split(/<tr[^>]*class=["']nat-fs-player["'][^>]*>/);
    const players = [];

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      const thMatch = seg.match(/<th[^>]*>([\s\S]*?)<\/th>/);
      const tdMatches = [...seg.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];

      if (thMatch && tdMatches.length >= 2) {
        // Limpiar el nombre quitando etiquetas y el texto "(captain)"
        let name = thMatch[1].replace(/<[^>]+>/g, '').replace(/\(captain\)/i, '').trim();
        
        // Limpiar la posición extrayendo las letras (GK, DF, MF, FW)
        const rawPos = tdMatches[1][1].replace(/<[^>]+>/g, '').trim();
        const posMatch = rawPos.match(/[A-Z]+/i);
        let pos = posMatch ? posMatch[0].toUpperCase() : 'GK';
        
        // Traducir posiciones al formato estándar
        if (pos === 'GK') pos = 'Goalkeeper';
        else if (pos === 'DF') pos = 'Defender';
        else if (pos === 'MF') pos = 'Midfielder';
        else if (pos === 'FW') pos = 'Forward';

        // Extraer el número de camiseta
        const num = tdMatches[0][1].replace(/<[^>]+>/g, '').trim();

        players.push({
          strPlayer: name,
          strPosition: pos,
          strJersey: num
        });
      }
    }
    return players;
  } catch (err) {
    console.error(`Error al obtener plantilla de Wikipedia para ${tla}:`, err);
    return [];
  }
}

async function translateToSpanish(text) {
  if (!text) return "No hay una descripción disponible para esta selección.";
  try {
    // MyMemory tiene un límite razonable por petición, por lo que tomamos los primeros 1000 caracteres
    const cleanText = text.substring(0, 1000);
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|es`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        let result = data.responseData.translatedText;
        if (text.length > 1000) {
          result += "... (Ver descripción completa en inglés en TheSportsDB)";
        }
        return result;
      }
    }
  } catch (err) {
    console.error("Error al traducir descripción:", err);
  }
  return text; // Fallback al texto original en inglés
}

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const id = req.query.id;
  const tla = req.query.tla;
  if (!id) {
    return res.status(400).json({ error: 'ID de equipo no proporcionado' });
  }

  try {
    // Realizar consultas en paralelo para Detalles de TheSportsDB, Plantilla de TheSportsDB y Plantilla de Wikipedia
    const [teamRes, playersRes, wikiPlayers] = await Promise.all([
      fetch(`https://www.thesportsdb.com/api/v1/json/123/lookupteam.php?id=${id}`),
      fetch(`https://www.thesportsdb.com/api/v1/json/123/lookup_all_players.php?id=${id}`),
      tla ? fetchWikipediaSquad(tla) : Promise.resolve([])
    ]);

    if (!teamRes.ok) {
      return res.status(teamRes.status).json({ error: `La API de TheSportsDB respondió con código: ${teamRes.status} para los detalles` });
    }

    const teamData = await teamRes.json();
    let sportsDbPlayers = [];

    if (playersRes.ok) {
      try {
        const pData = await playersRes.json();
        if (pData && pData.player) {
          sportsDbPlayers = pData.player.map(p => ({
            strPlayer: p.strPlayer,
            strCutout: p.strCutout || p.strThumb || ""
          }));
        }
      } catch (err) {
        console.error("Error parseando plantilla de TheSportsDB:", err);
      }
    }

    if (!teamData || !teamData.teams || teamData.teams.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado en TheSportsDB' });
    }

    const team = teamData.teams[0];

    // Obtener y traducir descripción si es necesario
    let description = team.strDescriptionES;
    if (!description || description.trim() === "" || description.trim() === "No hay una descripción disponible en español para esta selección.") {
      if (team.strDescriptionEN && team.strDescriptionEN.trim() !== "") {
        description = await translateToSpanish(team.strDescriptionEN);
      } else {
        description = "No hay una descripción disponible para esta selección.";
      }
    }

    // Unir la plantilla completa de Wikipedia con las fotos oficiales de TheSportsDB
    let finalPlayersList = [];
    if (wikiPlayers && wikiPlayers.length > 0) {
      finalPlayersList = wikiPlayers.map(wp => {
        const photo = findMatchingPhoto(wp.strPlayer, sportsDbPlayers);
        return {
          strPlayer: wp.strPlayer,
          strPosition: wp.strPosition,
          strCutout: photo
        };
      });
    } else {
      // Fallback si Wikipedia falla: usar la lista limitada de 10 de TheSportsDB
      finalPlayersList = sportsDbPlayers.map(p => ({
        strPlayer: p.strPlayer,
        strPosition: "Jugador", // TheSportsDB no da posición simple aquí
        strCutout: p.strCutout
      }));
    }

    // Consolidar la respuesta
    const consolidatedData = {
      idTeam: team.idTeam,
      strTeam: team.strTeam,
      strTeamBadge: team.strBadge || team.strTeamBadge || "",
      strDescriptionES: description,
      strDescriptionEN: team.strDescriptionEN || "",
      strStadium: team.strStadium || "",
      strStadiumThumb: team.strStadiumThumb || "",
      intStadiumCapacity: team.intStadiumCapacity || "",
      strLocation: team.strLocation || "",
      strEquipment: team.strEquipment || "",
      players: finalPlayersList
    };

    return res.status(200).json(consolidatedData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

