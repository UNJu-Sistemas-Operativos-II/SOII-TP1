document.addEventListener('DOMContentLoaded', () => {
    let draggedData = null;

    // Crear un chip clonado listo para ser colocado en una dropzone
    function createZoneItem(id, text) {
        const item = document.createElement('div');
        item.className = 'dnd-item in-zone';
        item.dataset.id = id;
        item.draggable = true;
        item.innerHTML = `<span>${text}</span> <span class="btn-del-item" title="Eliminar paso">✕</span>`;

        item.addEventListener('click', function(e) {
            this.parentElement.removeChild(this);
            updateAllPlaceholders();
            evaluateDeadlocks();
        });

        item.addEventListener('dragstart', function(e) {
            draggedData = { id: this.dataset.id, text: this.querySelector('span').textContent, isFromZone: true, element: this };
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.id);
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedData = null;
            updateAllPlaceholders();
            evaluateDeadlocks();
        });

        return item;
    }

    // Inicializar items del Banco (como paleta inagotable)
    function initBankItems() {
        const bankItems = document.querySelectorAll('.action-bank .dnd-item');
        bankItems.forEach(item => {
            item.addEventListener('dragstart', function(e) {
                draggedData = { id: this.dataset.id, text: this.textContent.trim(), isFromZone: false };
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', this.dataset.id);
            });

            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                draggedData = null;
            });

            item.addEventListener('click', function() {
                // Clic en el banco añade una copia al primer destino disponible
                const parentBank = this.parentElement;
                const scenario = parentBank.id === 'bank-a' ? 'a' : 'b';
                const dropzones = scenario === 'a'
                    ? [document.getElementById('zone-deadlock-a'), document.getElementById('zone-safe-a')]
                    : [document.getElementById('zone-deadlock-b'), document.getElementById('zone-safe-b')];

                for (let dz of dropzones) {
                    const max = parseInt(dz.dataset.max) || 4;
                    const count = dz.querySelectorAll('.dnd-item').length;
                    if (count < max) {
                        const clone = createZoneItem(this.dataset.id, this.textContent.trim());
                        dz.appendChild(clone);
                        updateAllPlaceholders();
                        evaluateDeadlocks();
                        break;
                    }
                }
            });
        });
    }

    // Configurar Dropzones
    const dropzones = document.querySelectorAll('.dropzone');
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            if (!draggedData) return;

            const max = parseInt(this.dataset.max) || 4;
            const current = this.querySelectorAll('.dnd-item').length;

            if (draggedData.isFromZone) {
                // Mover dentro de zonas
                if (draggedData.element.parentElement !== this && current >= max) {
                    alert(`Esta línea de tiempo admite un máximo de ${max} pasos.`);
                    return;
                }
                this.appendChild(draggedData.element);
            } else {
                // Clonar desde el banco
                if (current >= max) {
                    alert(`Esta línea de tiempo admite un máximo de ${max} pasos.`);
                    return;
                }
                const clone = createZoneItem(draggedData.id, draggedData.text);
                this.appendChild(clone);
            }
            updateAllPlaceholders();
            evaluateDeadlocks();
        });
    });

    function updateAllPlaceholders() {
        document.querySelectorAll('.dropzone').forEach(zone => {
            const hasItems = zone.querySelectorAll('.dnd-item').length > 0;
            const placeholder = zone.querySelector('.drop-placeholder');
            if (placeholder) {
                placeholder.style.display = hasItems ? 'none' : 'block';
            }
        });
    }

    window.resetZone = function(zoneId) {
        const zone = document.getElementById(zoneId);
        const items = zone.querySelectorAll('.dnd-item');
        items.forEach(item => zone.removeChild(item));
        updateAllPlaceholders();
        evaluateDeadlocks();
    };

    // =========================================================================
    // MOTOR DE SIMULACIÓN DINÁMICO DE ASIGNACIÓN DE RECURSOS (STATE MACHINE)
    // =========================================================================
    function simularEscenarioA(pasos) {
        const estado = {
            recursos: { C: null, I: null },
            bloqueados: { P1: null, P2: null }
        };

        for (let paso of pasos) {
            const [proceso, accion, recurso] = paso.split('_');

            if (accion === 'REQ') {
                if (estado.recursos[recurso] === null) {
                    estado.recursos[recurso] = proceso;
                } else if (estado.recursos[recurso] !== proceso) {
                    estado.bloqueados[proceso] = recurso;
                }
            } else if (accion === 'REL') {
                if (estado.recursos[recurso] === proceso) {
                    estado.recursos[recurso] = null;
                }
            }
        }

        const isDeadlock = (
            estado.bloqueados.P1 !== null &&
            estado.bloqueados.P2 !== null &&
            estado.recursos[estado.bloqueados.P1] === 'P2' &&
            estado.recursos[estado.bloqueados.P2] === 'P1'
        );

        return {
            isDeadlock,
            bloqueados: estado.bloqueados,
            recursos: estado.recursos
        };
    }

    function evaluateDeadlocks() {
        // --- Evaluar A.1 (Deadlock) ---
        const za1 = Array.from(document.getElementById('zone-deadlock-a').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_a1 = document.getElementById('feedback-dl-a');
        
        if (za1.length >= 4) {
            const sim = simularEscenarioA(za1);
            if (sim.isDeadlock) {
                fb_a1.className = 'sim-feedback danger';
                const recP1 = sim.recursos.C === 'P1' ? 'Cinta (C)' : 'Impresora (I)';
                const recP2 = sim.recursos.C === 'P2' ? 'Cinta (C)' : 'Impresora (I)';
                fb_a1.textContent = `⚠️ ¡DEADLOCK DETECTADO! P1 retiene ${recP1} y espera por P2; P2 retiene ${recP2} y espera por P1 (Espera Circular de Coffman).`;
            } else {
                fb_a1.className = 'sim-feedback';
                fb_a1.textContent = 'La secuencia no produce interbloqueo mutuo. Ambos procesos deben retener 1 recurso y solicitar el del otro.';
            }
        } else {
            fb_a1.textContent = '';
        }

        // --- Evaluar A.2 (Segura) ---
        const za2 = Array.from(document.getElementById('zone-safe-a').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_a2 = document.getElementById('feedback-safe-a');
        
        if (za2.length >= 4) {
            const sim = simularEscenarioA(za2);
            const hasReqRel = (za2.includes('P1_REQ_C') || za2.includes('P1_REQ_I') || za2.includes('P2_REQ_C') || za2.includes('P2_REQ_I')) && 
                             (za2.includes('P1_REL_C') || za2.includes('P1_REL_I') || za2.includes('P2_REL_C') || za2.includes('P2_REL_I'));
            
            if (!sim.isDeadlock && hasReqRel) {
                fb_a2.className = 'sim-feedback success';
                fb_a2.textContent = '✅ SECUENCIA SEGURA: Los recursos se adquieren y liberan ordenadamente sin provocar bloqueos mutuos.';
            } else {
                fb_a2.className = 'sim-feedback';
                fb_a2.textContent = 'Revise que los recursos solicitados sean liberados adecuadamente.';
            }
        } else {
            fb_a2.textContent = '';
        }

        // --- Evaluar B.1 y B.2 ---
        const zb1 = Array.from(document.getElementById('zone-deadlock-b').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_b1 = document.getElementById('feedback-dl-b');
        if (zb1.length >= 1) {
            if (zb1.includes('P1_RECV_EMPTY') || zb1.includes('P2_P3_CONSUME_ALL')) {
                fb_b1.className = 'sim-feedback danger';
                fb_b1.textContent = '⚠️ ¡BLOQUEO TRIPLE DETECTADO! Procesos bloqueados en espera de mensajes en buzones vacíos.';
            }
        } else {
            fb_b1.textContent = '';
        }

        const zb2 = Array.from(document.getElementById('zone-safe-b').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_b2 = document.getElementById('feedback-safe-b');
        if (zb2.length >= 3) {
            if (zb2.includes('P1_SEND_C1') && (zb2.includes('P2_RECV_C1') || zb2.includes('P3_RECV_C1'))) {
                fb_b2.className = 'sim-feedback success';
                fb_b2.textContent = '✅ PROTOCOLO COORDINADO: Envío y recepción sincronizados sin interbloqueos.';
            }
        } else {
            fb_b2.textContent = '';
        }
    }

    initBankItems();
    updateAllPlaceholders();

    // Exportador JSON
    const btnExport = document.getElementById('btn-export');
    const btnCopy = document.getElementById('btn-copy');
    const statusMsg = document.getElementById('status-msg');

    function recopilarDatos() {
        const studentName = document.getElementById('student-name').value.trim();
        const studentLU = document.getElementById('student-lu').value.trim();
        const studentGithub = document.getElementById('student-github').value.trim();

        const getRadio = (name) => {
            const el = document.querySelector(`input[name="${name}"]:checked`);
            return el ? el.value : "";
        };

        const getItems = (id) => Array.from(document.getElementById(id).querySelectorAll('.dnd-item')).map(i => i.dataset.id);

        const seq_dl_a = getItems('zone-deadlock-a');
        const seq_safe_a = getItems('zone-safe-a');
        const seq_dl_b = getItems('zone-deadlock-b');
        const seq_safe_b = getItems('zone-safe-b');

        const sim_a1 = simularEscenarioA(seq_dl_a);
        const is_deadlock_a = sim_a1.isDeadlock ? 'DEADLOCK_CRUZADO' : 'INCOMPLETO';
        
        const sim_a2 = simularEscenarioA(seq_safe_a);
        const is_safe_a = (!sim_a2.isDeadlock && seq_safe_a.length >= 4) ? 'SECUENCIAL_ORDENADA' : 'INCOMPLETO';
        
        const is_dl_b = (seq_dl_b.includes('P1_RECV_EMPTY') || seq_dl_b.includes('P2_P3_CONSUME_ALL')) ? 'BLOQUEO_TRIPLE' : 'INCOMPLETO';
        const is_safe_b = (seq_safe_b.includes('P1_SEND_C1') && (seq_safe_b.includes('P2_RECV_C1') || seq_safe_b.includes('P3_RECV_C1'))) ? 'PROTOCOLO_COORDINADO' : 'INCOMPLETO';

        return {
            estudiante: {
                nombre_completo: studentName,
                legajo_lu: studentLU,
                usuario_github: studentGithub
            },
            seccion1_conceptos: {
                q1_directorio_modulos: getRadio('q1'),
                q2_cambio_modo_syscall: getRadio('q2'),
                q3_shells_estandar: getRadio('q3')
            },
            seccion2_senales_procesos: {
                q4_senal_ctrl_z: getRadio('q4'),
                q5_pseudo_fs_proc: getRadio('q5')
            },
            seccion3_interbloqueos: {
                escenario_a_recursos: {
                    secuencia_deadlock: is_deadlock_a,
                    secuencia_segura: is_safe_a,
                    pasos_deadlock: seq_dl_a,
                    pasos_segura: seq_safe_a
                },
                escenario_b_mensajes: {
                    secuencia_bloqueo_triple: is_dl_b,
                    secuencia_segura: is_safe_b,
                    pasos_bloqueo: seq_dl_b,
                    pasos_segura: seq_safe_b
                }
            },
            timestamp_generacion: new Date().toISOString()
        };
    }

    function validar(datos) {
        if (!datos.estudiante.nombre_completo || !datos.estudiante.legajo_lu) {
            alert('Por favor complete su Nombre, Apellido y Legajo antes de exportar.');
            return false;
        }
        return true;
    }

    btnExport.addEventListener('click', () => {
        const datos = recopilarDatos();
        if (!validar(datos)) return;

        const jsonStr = JSON.stringify(datos, null, 4);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'respuestas_tp1.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        statusMsg.style.color = '#4ade80';
        statusMsg.textContent = '✅ Archivo respuestas_tp1.json generado con éxito con TODAS las secciones resueltas.';
    });

    btnCopy.addEventListener('click', () => {
        const datos = recopilarDatos();
        if (!validar(datos)) return;

        const jsonStr = JSON.stringify(datos, null, 4);
        navigator.clipboard.writeText(jsonStr).then(() => {
            statusMsg.style.color = '#38bdf8';
            statusMsg.textContent = '📋 ¡JSON copiado al portapapeles! Puedes pegarlo en soluciones/respuestas_tp1.json';
        });
    });
});
