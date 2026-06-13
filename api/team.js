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
  if (!id) {
    return res.status(400).json({ error: 'ID de equipo no proporcionado' });
  }

  try {
    // Realizar consultas en paralelo para Detalles y Plantilla
    const [teamRes, playersRes] = await Promise.all([
      fetch(`https://www.thesportsdb.com/api/v1/json/123/lookupteam.php?id=${id}`),
      fetch(`https://www.thesportsdb.com/api/v1/json/123/lookup_all_players.php?id=${id}`)
    ]);

    if (!teamRes.ok) {
      return res.status(teamRes.status).json({ error: `La API de TheSportsDB respondió con código: ${teamRes.status} para los detalles` });
    }

    const teamData = await teamRes.json();
    let playersData = { player: [] };

    if (playersRes.ok) {
      try {
        playersData = await playersRes.json();
      } catch (err) {
        console.error("Error parseando plantilla:", err);
      }
    }

    if (!teamData || !teamData.teams || teamData.teams.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado en TheSportsDB' });
    }

    const team = teamData.teams[0];

    // Consolidar la respuesta
    const consolidatedData = {
      idTeam: team.idTeam,
      strTeam: team.strTeam,
      strTeamBadge: team.strBadge || team.strTeamBadge || "",
      strDescriptionES: team.strDescriptionES || team.strDescriptionEN || "No hay una descripción disponible en español para esta selección.",
      strDescriptionEN: team.strDescriptionEN || "",
      strStadium: team.strStadium || "",
      strStadiumThumb: team.strStadiumThumb || "",
      intStadiumCapacity: team.intStadiumCapacity || "",
      strLocation: team.strLocation || "",
      strEquipment: team.strEquipment || "",
      players: (playersData.player || []).map(p => ({
        idPlayer: p.idPlayer,
        strPlayer: p.strPlayer,
        strPosition: p.strPosition,
        strCutout: p.strCutout || p.strThumb || ""
      }))
    };

    return res.status(200).json(consolidatedData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
