import { state, saveData } from './state.js';
import { renderProfileTabs, updateActiveProfileUI, renderMatches, updateLiveCalculations } from './components/index.js';
import { checkAndFetchApiResults, fetchTeamInfo } from './api.js';

export function setupEventListeners() {
    // Dropdown de Datos/Copia de Seguridad
    const btnBackup = document.getElementById('btn-backup');
    if (btnBackup) {
        const dropdown = btnBackup.parentElement;
        btnBackup.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
        });
    }

    // Exportar JSON
    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const dataStr = JSON.stringify({ profiles: state.profiles, realResults: state.realResults }, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'predicciones_mundial2026.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        });
    }

    // Importar JSON
    const inputImport = document.getElementById('input-import');
    if (inputImport) {
        inputImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validación básica de estructura
                    if (importedData.profiles && Array.isArray(importedData.profiles)) {
                        state.profiles = importedData.profiles;
                        state.realResults = importedData.realResults || {};
                        saveData();
                        
                        // Re-inicializar vistas
                        renderProfileTabs();
                        updateActiveProfileUI();
                        alert("¡Datos importados con éxito!");
                    } else {
                        alert("El archivo JSON no tiene el formato correcto.");
                    }
                } catch (err) {
                    alert("Error al leer el archivo JSON.");
                }
            };
            reader.readAsText(file);
            // Reset del input file
            e.target.value = "";
        });
    }

    // Reiniciar Todo
    const btnResetAll = document.getElementById('btn-reset-all');
    if (btnResetAll) {
        btnResetAll.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que quieres borrar TODOS los pronósticos y nombres? Esta acción no se puede deshacer.")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // Modal de Edición de Perfiles
    const btnEditProfiles = document.getElementById('btn-edit-profiles');
    const modal = document.getElementById('modal-edit-profiles');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelProfiles = document.getElementById('btn-cancel-profiles');
    const formEditProfiles = document.getElementById('form-edit-profiles');

    if (btnEditProfiles && modal) {
        btnEditProfiles.addEventListener('click', () => {
            // Rellenar campos de texto con nombres actuales
            state.profiles.forEach(p => {
                const inputName = document.getElementById(`profile-name-${p.id}`);
                if (inputName) inputName.value = p.name;
            });
            modal.classList.add('open');
        });

        const closeModal = () => {
            modal.classList.remove('open');
        };

        if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
        if (btnCancelProfiles) btnCancelProfiles.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        if (formEditProfiles) {
            formEditProfiles.addEventListener('submit', (e) => {
                e.preventDefault();
                
                state.profiles.forEach(p => {
                    const inputName = document.getElementById(`profile-name-${p.id}`);
                    if (inputName && inputName.value.trim() !== "") {
                        p.name = inputName.value.trim();
                    }
                });

                saveData();
                renderProfileTabs();
                updateLiveCalculations();
                closeModal();
            });
        }
    }

    // Cambio de Fase (Grupos / Eliminatorias)
    const btnGroups = document.getElementById('btn-phase-groups');
    const btnKnockouts = document.getElementById('btn-phase-knockouts');
    const groupSel = document.getElementById('group-selector-container');
    const koSel = document.getElementById('knockout-selector-container');

    const setPhase = (phase) => {
        state.activePhase = phase;
        saveData();

        if (phase === 'groups') {
            if (btnGroups) btnGroups.classList.add('active');
            if (btnKnockouts) btnKnockouts.classList.remove('active');
            if (groupSel) groupSel.style.display = 'block';
            if (koSel) koSel.style.display = 'none';
        } else {
            if (btnGroups) btnGroups.classList.remove('active');
            if (btnKnockouts) btnKnockouts.classList.add('active');
            if (groupSel) groupSel.style.display = 'none';
            if (koSel) koSel.style.display = 'block';
        }

        renderMatches();
        updateLiveCalculations();
    };

    if (btnGroups) btnGroups.addEventListener('click', () => setPhase('groups'));
    if (btnKnockouts) btnKnockouts.addEventListener('click', () => setPhase('knockouts'));

    // Pestañas de Eliminatorias (Dieciseisavos a Final)
    const koTabs = document.querySelectorAll('#knockout-tabs-container .group-tab');
    koTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            koTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeKnockoutRound = tab.getAttribute('data-round');
            saveData();
            renderMatches();
            updateLiveCalculations();
        });
    });

    // Inicializar reproductor de música de fondo
    setupMusicPlayer();

    // Modal de Información de Selecciones (TheSportsDB)
    document.body.addEventListener('click', async (e) => {
        const btn = e.target.closest('.team-info-btn');
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const teamId = btn.getAttribute('data-team-id');
        const teamTla = btn.getAttribute('data-team-tla');
        if (!teamId) return;

        // Abrir el modal y mostrar estado de carga
        const teamModal = document.getElementById('modal-team-info');
        const loadingContainer = document.getElementById('team-info-loading');
        const errorContainer = document.getElementById('team-info-error');
        const dataContainer = document.getElementById('team-info-data');

        if (teamModal) {
            // Resetear pestañas del modal a estado inicial
            const tabButtons = teamModal.querySelectorAll('.modal-tab-btn');
            const tabContents = teamModal.querySelectorAll('.team-tab-content');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activar la pestaña 1 por defecto
            const defaultTabBtn = teamModal.querySelector('.modal-tab-btn[data-tab="team-tab-info"]');
            const defaultTabContent = document.getElementById('team-tab-info');
            if (defaultTabBtn) defaultTabBtn.classList.add('active');
            if (defaultTabContent) defaultTabContent.classList.add('active');

            // Mostrar spinner de carga
            if (loadingContainer) loadingContainer.style.display = 'flex';
            if (errorContainer) errorContainer.style.display = 'none';
            if (dataContainer) dataContainer.style.display = 'none';

            teamModal.classList.add('open');
        }

        // Descargar datos de la selección
        const data = await fetchTeamInfo(teamId, teamTla);

        if (!data) {
            if (loadingContainer) loadingContainer.style.display = 'none';
            if (errorContainer) errorContainer.style.display = 'block';
            return;
        }

        // Rellenar cabecera e info general
        const badgeImg = document.getElementById('team-info-badge');
        const teamName = document.getElementById('team-info-name');
        const teamDesc = document.getElementById('team-info-desc');
        const stadiumName = document.getElementById('team-info-stadium-name');
        const stadiumImg = document.getElementById('team-info-stadium-img');
        const stadiumLoc = document.getElementById('team-info-stadium-loc');
        const stadiumCap = document.getElementById('team-info-stadium-cap');
        
        const kitContainer = document.getElementById('team-kit-container');
        const kitImg = document.getElementById('team-info-kit');

        if (badgeImg) badgeImg.src = data.strTeamBadge || '';
        if (teamName) teamName.textContent = data.strTeam || 'Selección';
        
        // Limpiar descripciones con posibles saltos o textos duplicados
        let description = data.strDescriptionES || data.strDescriptionEN || 'No hay una descripción disponible.';
        if (teamDesc) teamDesc.textContent = description;
        
        if (stadiumName) stadiumName.textContent = data.strStadium || 'Estadio';
        if (stadiumLoc) stadiumLoc.textContent = data.strLocation || 'No disponible';
        if (stadiumCap) {
            stadiumCap.textContent = data.intStadiumCapacity 
                ? parseInt(data.intStadiumCapacity).toLocaleString('es-ES') 
                : 'No disponible';
        }

        if (stadiumImg) {
            if (data.strStadiumThumb) {
                stadiumImg.src = data.strStadiumThumb;
                stadiumImg.style.display = 'block';
            } else {
                stadiumImg.style.display = 'none';
            }
        }

        // Mostrar equipación oficial
        if (kitContainer && kitImg) {
            if (data.strEquipment) {
                kitImg.src = data.strEquipment;
                kitContainer.style.display = 'block';
            } else {
                kitContainer.style.display = 'none';
            }
        }

        // Renderizar plantilla de jugadores convocados
        const playersGrid = document.getElementById('team-players-grid');
        if (playersGrid) {
            playersGrid.innerHTML = '';
            if (data.players && data.players.length > 0) {
                data.players.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'player-card';
                    
                    const photoSrc = p.strCutout || p.strThumb || 'https://www.thesportsdb.com/images/media/player/cutout/default.png';
                    
                    // Traducir roles para una experiencia en español impecable
                    let pos = p.strPosition || 'Jugador';
                    if (pos === 'Goalkeeper') pos = 'Portero';
                    else if (pos === 'Defender') pos = 'Defensa';
                    else if (pos === 'Midfielder') pos = 'Centrocampista';
                    else if (pos === 'Forward' || pos === 'Attacker') pos = 'Delantero';

                    const jerseyHTML = p.strJersey ? `<span class="player-jersey">${p.strJersey}</span>` : '';
                    card.innerHTML = `
                        <div class="player-photo-container">
                            <img class="player-photo" src="${photoSrc}" alt="${p.strPlayer}" onerror="this.src='https://www.thesportsdb.com/images/media/player/cutout/default.png'">
                            ${jerseyHTML}
                        </div>
                        <div class="player-name" title="${p.strPlayer}">${p.strPlayer}</div>
                        <div class="player-pos">${pos}</div>
                    `;
                    playersGrid.appendChild(card);
                });
            } else {
                playersGrid.innerHTML = '<p class="team-error-container" style="grid-column: 1/-1;">Plantilla no disponible para esta selección en TheSportsDB.</p>';
            }
        }

        // Ocultar spinner y mostrar panel de datos
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (dataContainer) dataContainer.style.display = 'block';
    });

    // Eventos para cerrar el modal de selecciones
    const teamModal = document.getElementById('modal-team-info');
    const btnCloseTeamModal = document.getElementById('btn-close-team-modal');
    if (teamModal) {
        const closeTeamModal = () => {
            teamModal.classList.remove('open');
        };
        if (btnCloseTeamModal) btnCloseTeamModal.addEventListener('click', closeTeamModal);
        teamModal.addEventListener('click', (e) => {
            if (e.target === teamModal) closeTeamModal();
        });

        // Cambiar entre pestañas (Información / Plantilla)
        const tabButtons = teamModal.querySelectorAll('.modal-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTabId = btn.getAttribute('data-tab');
                
                // Desactivar botones y secciones activas
                tabButtons.forEach(b => b.classList.remove('active'));
                teamModal.querySelectorAll('.team-tab-content').forEach(c => c.classList.remove('active'));
                
                // Activar seleccionados
                btn.classList.add('active');
                const targetTabContent = document.getElementById(targetTabId);
                if (targetTabContent) targetTabContent.classList.add('active');
            });
        });
    }
}

// --- REPRODUCTOR DE MÚSICA ---
export function setupMusicPlayer() {
    const music = document.getElementById('bg-music');
    const toggleBtn = document.getElementById('btn-music-toggle');
    const volumeSlider = document.getElementById('slider-music-volume');

    if (!music || !toggleBtn || !volumeSlider) return;

    // Configurar volumen inicial
    music.volume = volumeSlider.value;

    // Activar / Mutear
    toggleBtn.addEventListener('click', () => {
        if (music.paused) {
            music.play().then(() => {
                toggleBtn.innerHTML = '<span>🔊</span>';
            }).catch(err => {
                console.log("El navegador bloqueó el inicio rápido: ", err);
            });
        } else {
            music.pause();
            toggleBtn.innerHTML = '<span>🔇</span>';
        }
    });

    // Cambiar volumen
    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        music.volume = val;
        
        // Si el volumen se baja a cero, cambiar icono a muteado
        if (parseFloat(val) === 0) {
            toggleBtn.innerHTML = '<span>🔇</span>';
        } else if (music.paused === false) {
            toggleBtn.innerHTML = '<span>🔊</span>';
        }
    });
}
