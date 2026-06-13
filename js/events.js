import { state, saveData } from './state.js';
import { renderProfileTabs, updateActiveProfileUI, renderMatches, updateLiveCalculations } from './components/index.js';
import { checkAndFetchApiResults } from './api.js';

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
