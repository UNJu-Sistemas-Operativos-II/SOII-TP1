document.addEventListener('DOMContentLoaded', () => {
    let draggedItem = null;

    function initDraggables() {
        const items = document.querySelectorAll('.dnd-item');
        items.forEach(item => {
            item.removeEventListener('dragstart', handleDragStart);
            item.removeEventListener('dragend', handleDragEnd);
            item.removeEventListener('click', handleClickMove);

            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('click', handleClickMove);
        });
    }

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.id);
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedItem = null;
        updateAllPlaceholders();
        evaluateDeadlocks();
    }

    function handleClickMove(e) {
        const parent = this.parentElement;
        if (parent.classList.contains('action-bank')) {
            const scenario = parent.id === 'bank-a' ? 'a' : 'b';
            const dropzones = scenario === 'a' 
                ? [document.getElementById('zone-deadlock-a'), document.getElementById('zone-safe-a')]
                : [document.getElementById('zone-deadlock-b'), document.getElementById('zone-safe-b')];
            
            for (let dz of dropzones) {
                const max = parseInt(dz.dataset.max) || 4;
                const currentCount = dz.querySelectorAll('.dnd-item').length;
                if (currentCount < max) {
                    dz.appendChild(this);
                    break;
                }
            }
        } else if (parent.classList.contains('dropzone')) {
            const bankId = parent.id.includes('-a') ? 'bank-a' : 'bank-b';
            document.getElementById(bankId).appendChild(this);
        }
        updateAllPlaceholders();
        evaluateDeadlocks();
    }

    // Configurar Dropzones
    const dropzones = document.querySelectorAll('.dropzone, .action-bank');
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            if (!draggedItem) return;

            if (this.classList.contains('dropzone')) {
                const max = parseInt(this.dataset.max) || 4;
                const current = this.querySelectorAll('.dnd-item').length;
                if (current >= max && draggedItem.parentElement !== this) {
                    alert(`Esta línea de tiempo admite un máximo de ${max} pasos.`);
                    return;
                }
            }
            this.appendChild(draggedItem);
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

    window.resetZone = function(zoneId, bankId) {
        const zone = document.getElementById(zoneId);
        const bank = document.getElementById(bankId);
        const items = zone.querySelectorAll('.dnd-item');
        items.forEach(item => bank.appendChild(item));
        updateAllPlaceholders();
        evaluateDeadlocks();
    };

    // =========================================================================
    // MOTOR DE SIMULACIÓN DE GRAFO DE ASIGNACIÓN DE RECURSOS (STATE MACHINE)
    // =========================================================================
    function simularEscenarioA(pasos) {
        const estado = {
            recursos: { C: null, I: null }, // Quién posee el recurso
            bloqueados: { P1: null, P2: null } // Qué recurso está esperando
        };

        for (let paso of pasos) {
            const [proceso, accion, recurso] = paso.split('_'); // ej: P1, REQ, C

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

        // Detección de Espera Circular (Coffman)
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
            const hasReqRel = (za2.includes('P1_REQ_C') || za2.includes('P1_REQ_I')) && (za2.includes('P1_REL_C') || za2.includes('P1_REL_I'));
            
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
            if (zb2.includes('P1_SEND_C1') && zb2.includes('P2_RECV_C1') && zb2.includes('P2_SEND_C2')) {
                fb_b2.className = 'sim-feedback success';
                fb_b2.textContent = '✅ PROTOCOLO COORDINADO: Envío y recepción sincronizados sin interbloqueos.';
            }
        } else {
            fb_b2.textContent = '';
        }
    }

    initDraggables();
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
        const is_safe_b = (seq_safe_b.includes('P1_SEND_C1') && seq_safe_b.includes('P2_RECV_C1')) ? 'PROTOCOLO_COORDINADO' : 'INCOMPLETO';

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
        statusMsg.textContent = '✅ Archivo respuestas_tp1.json generado. Muévelo a la carpeta soluciones/ de tu repositorio.';
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
