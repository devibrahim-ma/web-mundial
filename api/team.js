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

const playerPhotosCache = {};

async function fetchWikipediaPageImage(title) {
  if (!title) return "";
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&redirects=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mundial2026QuinielaApp/1.0 (https://web-mundial-2026.vercel.app; contact@example.com)"
      }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const pages = data?.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId && pageId !== "-1") {
        return pages[pageId].thumbnail?.source || "";
      }
    }
  } catch (e) {
    console.error("Error fetching Wikipedia page image for:", title, e);
  }
  return "";
}

const PLAYER_NAME_OVERRIDES = {
    // España
    "Rodri": "Rodrigo Hernández Cascante",
    "Pedri": "Pedro González López",
    "Gavi": "Pablo Martín Páez Gavira",
    // Portugal
    "Vitinha": "Vítor Machado Ferreira",
    "Jota": "Diogo Jota",
    "Beto": "Beto Norberto",
    // Brasil
    "Neymar": "Neymar da Silva Santos Júnior",
    "Raphinha": "Raphael Dias Belloli"
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
  const upperTla = tla ? tla.toUpperCase() : "";
  const countryName = WIKIPEDIA_MAPPING[upperTla];
  if (!countryName) return [];

  try {
    // Obtener la página completa en una sola petición con User-Agent
    const url = "https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=text";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mundial2026QuinielaApp/1.0 (https://web-mundial-2026.vercel.app; contact@example.com)"
      }
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!data || !data.parse || !data.parse.text) return [];

    const html = data.parse.text['*'];
    const anchorId = countryName.replace(/ /g, "_");
    
    // Buscar la cabecera correspondiente al país en el HTML completo
    const regexAnchor = new RegExp(`id="${anchorId}"`, "i");
    const anchorMatch = html.match(regexAnchor);
    if (!anchorMatch) return [];

    const startIdx = anchorMatch.index;
    
    // Buscar la siguiente tabla a partir del id de la cabecera
    const tableIdx = html.indexOf('<table', startIdx);
    if (tableIdx === -1) return [];

    const endTableIdx = html.indexOf('</table>', tableIdx);
    if (endTableIdx === -1) return [];

    const tableHtml = html.substring(tableIdx, endTableIdx);
    
    // Parsear las filas de los jugadores (<tr class="nat-fs-player">)
    const segments = tableHtml.split(/<tr[^>]*class=["']nat-fs-player["'][^>]*>/);
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
    // MyMemory tiene un límite estricto de 500 caracteres por consulta gratuita, por lo que tomamos los primeros 450
    const cleanText = text.substring(0, 450);
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|es`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        let result = data.responseData.translatedText;
        // Si MyMemory devolvió un error de límite en su JSON, caemos en fallback
        if (result.toUpperCase().includes("LIMIT EXCEEDED") || result.toUpperCase().includes("MAX ALLOWED QUERY")) {
          return text; // Devolver texto original en inglés
        }
        if (text.length > 450) {
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
      const playersToSearch = [];

      for (const wp of wikiPlayers) {
        const photo = findMatchingPhoto(wp.strPlayer, sportsDbPlayers);
        if (photo) {
          finalPlayersList.push({
            strPlayer: wp.strPlayer,
            strPosition: wp.strPosition,
            strJersey: wp.strJersey || "",
            strCutout: photo
          });
        } else {
          // No está en la lista de 10. ¿Está en el cache del servidor?
          const cleanWikiName = cleanName(wp.strPlayer);
          if (playerPhotosCache[cleanWikiName] !== undefined) {
             finalPlayersList.push({
               strPlayer: wp.strPlayer,
               strPosition: wp.strPosition,
               strJersey: wp.strJersey || "",
               strCutout: playerPhotosCache[cleanWikiName]
             });
          } else {
             // Marcar para buscar en TheSportsDB
             playersToSearch.push(wp);
          }
        }
      }

      // Buscar en paralelo los jugadores restantes
      if (playersToSearch.length > 0) {
          const searchPromises = playersToSearch.map(async wp => {
              const searchQuery = PLAYER_NAME_OVERRIDES[wp.strPlayer] || wp.strPlayer;
              try {
                  const res = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(searchQuery)}`);
                  if (!res.ok) return { wp, photo: "" };
                  const data = await res.json();
                  if (data && data.player && data.player.length > 0) {
                      // Filtrar jugadores retirados (para evitar falsos positivos con ex-jugadores históricos)
                      const activePlayers = data.player.filter(p => {
                          const team = p.strTeam || "";
                          const isRetired = team.startsWith('_') || team.toLowerCase().includes('retired');
                          return !isRetired;
                      });

                      if (activePlayers.length > 0) {
                          const matchedPlayer = activePlayers.find(p => {
                              const cleanDb = cleanName(p.strPlayer);
                              const cleanWiki = cleanName(wp.strPlayer);
                              const cleanOverride = PLAYER_NAME_OVERRIDES[wp.strPlayer] ? cleanName(PLAYER_NAME_OVERRIDES[wp.strPlayer]) : "";
                              return cleanWiki.includes(cleanDb) || cleanDb.includes(cleanWiki) || (cleanOverride && (cleanOverride.includes(cleanDb) || cleanOverride.includes(cleanWiki)));
                          });
                          const p = matchedPlayer || activePlayers[0];
                          const photoUrl = p.strCutout || p.strThumb || "";
                          return { wp, photo: photoUrl };
                      }
                  }
                  return { wp, photo: "" };
              } catch (err) {
                  return { wp, photo: "" };
              }
          });

          const searchResults = await Promise.all(searchPromises);
          for (const res of searchResults) {
              const cleanWikiName = cleanName(res.wp.strPlayer);
              playerPhotosCache[cleanWikiName] = res.photo; // Guardar en cache del servidor
              
              finalPlayersList.push({
                 strPlayer: res.wp.strPlayer,
                 strPosition: res.wp.strPosition,
                 strJersey: res.wp.strJersey || "",
                 strCutout: res.photo
              });
          }
      }

      // Ordenar por número de dorsal
      finalPlayersList.sort((a, b) => parseInt(a.strJersey || 99) - parseInt(b.strJersey || 99));

    } else {
      // Fallback si Wikipedia falla: usar la lista limitada de 10 de TheSportsDB
      finalPlayersList = sportsDbPlayers.map(p => ({
        strPlayer: p.strPlayer,
        strPosition: "Jugador", // TheSportsDB no da posición simple aquí
        strJersey: "",
        strCutout: p.strCutout
      }));
    }

    // Obtener imagen del estadio desde Wikipedia si está vacía
    let stadiumThumb = team.strStadiumThumb || "";
    if ((!stadiumThumb || stadiumThumb.trim() === "") && team.strStadium) {
      stadiumThumb = await fetchWikipediaPageImage(team.strStadium);
    }

    // Consolidar la respuesta
    const consolidatedData = {
      idTeam: team.idTeam,
      strTeam: team.strTeam,
      strTeamBadge: team.strBadge || team.strTeamBadge || "",
      strDescriptionES: description,
      strDescriptionEN: team.strDescriptionEN || "",
      strStadium: team.strStadium || "",
      strStadiumThumb: stadiumThumb,
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
