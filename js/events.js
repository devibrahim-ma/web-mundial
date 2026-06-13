import { state, saveData } from './state.js';
import { renderProfileTabs, updateActiveProfileUI, renderMatches, updateLiveCalculations } from './components/index.js';
import { checkAndFetchApiResults, fetchTeamInfo } from './api.js';

export function setupEventListeners() {
    // Compartir Quiniela (Copiar Enlace)
    const btnShare = document.getElementById('btn-share-group');
    if (btnShare) {
        btnShare.addEventListener('click', () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                showToast("¡Enlace copiado al portapapeles!");
            }).catch(err => {
                console.error("Error al copiar enlace:", err);
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                showToast("¡Enlace copiado al portapapeles!");
            });
        });
    }

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

                if (state.groupId) {
                    window.firebase.database().ref(`groups/${state.groupId}/profiles`).set(state.profiles)
                        .catch(err => console.error("Error al guardar nombres en Firebase:", err));
                }
                saveStateToLocalStorage();
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

        updateActiveProfileUI();
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
                    
                    const defaultPhoto = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0ncmdiYSgyNTUsMjU1LDI1NSwwLjE1KSc+PGNpcmNsZSBjeD0nMTInIGN5PSc4JyByPSc0Jy8+PHBhdGggZD0nTTEyIDE0Yy02LjEgMC04IDQtOCA0djJoMTZ2LTJzLTEuOS00LTgtNHonLz48L3N2Zz4=";
                    const photoSrc = p.strCutout || p.strThumb || defaultPhoto;
                    
                    // Traducir roles para una experiencia en español impecable
                    let pos = p.strPosition || 'Jugador';
                    if (pos === 'Goalkeeper') pos = 'Portero';
                    else if (pos === 'Defender') pos = 'Defensa';
                    else if (pos === 'Midfielder') pos = 'Centrocampista';
                    else if (pos === 'Forward' || pos === 'Attacker') pos = 'Delantero';

                    const jerseyHTML = p.strJersey ? `<span class="player-jersey">${p.strJersey}</span>` : '';
                    card.innerHTML = `
                        <div class="player-photo-container">
                            <img class="player-photo" src="${photoSrc}" alt="${p.strPlayer}" onerror="this.onerror=null; this.src='${defaultPhoto}';">
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
        // Reclamar perfil
        const btnClaimProfile = document.getElementById('btn-claim-profile-now');
        if (btnClaimProfile) {
            btnClaimProfile.addEventListener('click', () => {
                if (state.groupId && typeof state.activeProfileId === 'number') {
                    localStorage.setItem(`wc2026_my_profile_id_${state.groupId}`, state.activeProfileId);
                    state.myProfileId = state.activeProfileId;
                    
                    // Ocultar banner
                    const banner = document.getElementById('claim-profile-banner');
                    if (banner) banner.style.display = 'none';
                    
                    // Re-renderizar partidos e UI para desbloquear edición
                    renderMatches();
                    updateActiveProfileUI();
                }
            });
        }
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

// --- EVENTOS DE CREACIÓN DE GRUPO ---
export function setupLandingEvents() {
    const btnAddParticipant = document.getElementById('btn-add-participant');
    const participantsContainer = document.getElementById('participants-inputs-container');
    const formCreateGroup = document.getElementById('form-create-group');

    if (btnAddParticipant && participantsContainer) {
        // Clonar para evitar duplicados si se llama de nuevo
        const clone = btnAddParticipant.cloneNode(true);
        btnAddParticipant.parentNode.replaceChild(clone, btnAddParticipant);

        clone.addEventListener('click', () => {
            const count = participantsContainer.querySelectorAll('.participant-input-row').length + 1;
            
            const row = document.createElement('div');
            row.className = 'participant-input-row';
            row.innerHTML = `
                <input type="text" class="form-input participant-name-input" placeholder="Nombre Amigo ${count}" required maxlength="15">
                <span class="input-row-index">#${count}</span>
                <button type="button" class="btn-remove-participant" style="background:none; border:none; color:var(--color-danger); cursor:pointer; font-size:1.1rem; margin-left:8px;" title="Eliminar">✕</button>
            `;
            
            row.querySelector('.btn-remove-participant').addEventListener('click', () => {
                row.remove();
                participantsContainer.querySelectorAll('.participant-input-row').forEach((r, idx) => {
                    r.querySelector('.input-row-index').textContent = `#${idx + 1}`;
                    r.querySelector('.participant-name-input').placeholder = `Nombre Amigo ${idx + 1}`;
                });
            });
            
            participantsContainer.appendChild(row);
            participantsContainer.scrollTop = participantsContainer.scrollHeight;
        });
    }

    if (formCreateGroup) {
        formCreateGroup.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const groupName = document.getElementById('group-input-name').value.trim();
            const participantInputs = document.querySelectorAll('.participant-name-input');
            const participantNames = [];
            
            participantInputs.forEach(input => {
                const name = input.value.trim();
                if (name) participantNames.push(name);
            });

            if (participantNames.length < 2) {
                alert("Debes añadir al menos 2 participantes.");
                return;
            }

            const db = window.firebase.database();
            const newGroupRef = db.ref('groups').push();
            const newGroupId = newGroupRef.key;

            const profiles = participantNames.map((name, index) => ({
                id: index,
                name: name,
                predictions: {}
            }));

            newGroupRef.set({
                name: groupName,
                profiles: profiles
            }).then(() => {
                localStorage.setItem(`wc2026_my_profile_id_${newGroupId}`, 0);
                localStorage.setItem(`wc2026_active_profile_${newGroupId}`, 0);
                window.location.search = `?group=${newGroupId}`;
            }).catch(err => {
                console.error("Error al crear el grupo:", err);
                alert("Error al crear el grupo. Por favor, inténtalo de nuevo.");
            });
        });
    }
}

// Helper para mostrar un toast premium
function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: linear-gradient(135deg, var(--color-primary) 0%, #0d0f1c 100%);
            border: 1px solid rgba(93, 0, 235, 0.4);
            color: #fff;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    // Forzar reflow
    toast.offsetHeight;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
}
