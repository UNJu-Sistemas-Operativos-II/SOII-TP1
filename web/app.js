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
            evaluateAllScenarios();
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
            evaluateAllScenarios();
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
                const parentBank = this.parentElement;
                const scenario = parentBank.id === 'bank-a' ? 'a' : 'b';
                const dropzones = scenario === 'a'
                    ? [document.getElementById('zone-deadlock-a'), document.getElementById('zone-safe-a')]
                    : [document.getElementById('zone-deadlock-b'), document.getElementById('zone-safe-b')];

                for (let dz of dropzones) {
                    const max = parseInt(dz.dataset.max) || 5;
                    const count = dz.querySelectorAll('.dnd-item').length;
                    if (count < max) {
                        const clone = createZoneItem(this.dataset.id, this.textContent.trim());
                        dz.appendChild(clone);
                        updateAllPlaceholders();
                        evaluateAllScenarios();
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

            const max = parseInt(this.dataset.max) || 5;
            const current = this.querySelectorAll('.dnd-item').length;

            if (draggedData.isFromZone) {
                if (draggedData.element.parentElement !== this && current >= max) {
                    alert(`Esta línea de tiempo admite un máximo de ${max} pasos.`);
                    return;
                }
                this.appendChild(draggedData.element);
            } else {
                if (current >= max) {
                    alert(`Esta línea de tiempo admite un máximo de ${max} pasos.`);
                    return;
                }
                const clone = createZoneItem(draggedData.id, draggedData.text);
                this.appendChild(clone);
            }
            updateAllPlaceholders();
            evaluateAllScenarios();
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
        evaluateAllScenarios();
    };

    // =========================================================================
    // 1. MOTOR DE SIMULACIÓN PARA ESCENARIO A (RECURSOS EXCLUSIVOS C e I)
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

    // =========================================================================
    // 2. MOTOR DE SIMULACIÓN PARA ESCENARIO B (BUZONES DE MENSAJES C1 y C2)
    // =========================================================================
    function simularEscenarioB(pasos) {
        let buzonC1 = 0;
        let buzonC2 = 0;

        const estados = {
            P1: 'INIT', // INIT -> SENT_AB -> BLOCKED_C2 / DONE
            P2: 'INIT', // INIT -> GOT_1 -> READY_SEND -> BLOCKED_C1 / DONE
            P3: 'INIT'  // INIT -> GOT_1 -> READY_SEND -> BLOCKED_C1 / DONE
        };

        for (let paso of pasos) {
            if (paso === 'P1_SEND_AB') {
                buzonC1 += 2;
                estados.P1 = 'SENT_AB';
            } else if (paso === 'P1_RECV_C2') {
                if (buzonC2 > 0) {
                    buzonC2 -= 1;
                    estados.P1 = 'DONE';
                } else {
                    estados.P1 = 'BLOCKED_C2';
                }
            } else if (paso === 'P2_RECV_1') {
                if (buzonC1 > 0) {
                    buzonC1 -= 1;
                    estados.P2 = 'GOT_1';
                } else {
                    estados.P2 = 'BLOCKED_C1';
                }
            } else if (paso === 'P2_RECV_2') {
                if (estados.P2 === 'GOT_1' && buzonC1 > 0) {
                    buzonC1 -= 1;
                    estados.P2 = 'READY_SEND';
                } else {
                    estados.P2 = 'BLOCKED_C1';
                }
            } else if (paso === 'P2_SEND_C2') {
                if (estados.P2 === 'READY_SEND') {
                    buzonC2 += 1;
                    estados.P2 = 'DONE';
                    if (estados.P1 === 'BLOCKED_C2') {
                        estados.P1 = 'DONE';
                    }
                }
            } else if (paso === 'P3_RECV_1') {
                if (buzonC1 > 0) {
                    buzonC1 -= 1;
                    estados.P3 = 'GOT_1';
                } else {
                    estados.P3 = 'BLOCKED_C1';
                }
            } else if (paso === 'P3_RECV_2') {
                if (estados.P3 === 'GOT_1' && buzonC1 > 0) {
                    buzonC1 -= 1;
                    estados.P3 = 'READY_SEND';
                } else {
                    estados.P3 = 'BLOCKED_C1';
                }
            } else if (paso === 'P3_SEND_C2') {
                if (estados.P3 === 'READY_SEND') {
                    buzonC2 += 1;
                    estados.P3 = 'DONE';
                }
            }
        }

        const isTripleDeadlock = (
            estados.P1 === 'BLOCKED_C2' &&
            estados.P2 === 'BLOCKED_C1' &&
            estados.P3 === 'BLOCKED_C1'
        );

        const isCoordinatedSafe = (
            estados.P2 === 'DONE' &&
            estados.P1 === 'DONE'
        );

        return {
            isTripleDeadlock,
            isCoordinatedSafe,
            estados,
            buzonC1,
            buzonC2
        };
    }

    function evaluateAllScenarios() {
        // --- Evaluar A.1 (Deadlock) ---
        const za1 = Array.from(document.getElementById('zone-deadlock-a').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_a1 = document.getElementById('feedback-dl-a');
        if (za1.length >= 4) {
            const sim = simularEscenarioA(za1);
            if (sim.isDeadlock) {
                fb_a1.className = 'sim-feedback danger';
                const recP1 = sim.recursos.C === 'P1' ? 'Cinta (C)' : 'Impresora (I)';
                const recP2 = sim.recursos.C === 'P2' ? 'Cinta (C)' : 'Impresora (I)';
                fb_a1.textContent = `⚠️ ¡DEADLOCK DETECTADO! P₁ retiene ${recP1} y espera por P₂; P₂ retiene ${recP2} y espera por P₁ (Espera Circular).`;
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
                fb_a2.textContent = '✅ SECUENCIA SEGURA: Los recursos se adquieren y liberan ordenadamente sin bloqueos mutuos.';
            } else {
                fb_a2.className = 'sim-feedback';
                fb_a2.textContent = 'Revise que los recursos solicitados sean liberados adecuadamente.';
            }
        } else {
            fb_a2.textContent = '';
        }

        // --- Evaluar B.1 (Deadlock Triple) ---
        const zb1 = Array.from(document.getElementById('zone-deadlock-b').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_b1 = document.getElementById('feedback-dl-b');
        if (zb1.length >= 4) {
            const simB1 = simularEscenarioB(zb1);
            if (simB1.isTripleDeadlock) {
                fb_b1.className = 'sim-feedback danger';
                fb_b1.textContent = '⚠️ ¡DEADLOCK TRIPLE CONFIRMADO! P₁ bloqueado esperando en C₂; P₂ y P₃ bloqueados esperando en C₁ vacío.';
            } else {
                fb_b1.className = 'sim-feedback';
                fb_b1.textContent = 'La secuencia no llega al bloqueo de los 3 procesos. Asegúrese de que P₂ y P₃ consuman C₁ antes de que P₁ reciba de C₂.';
            }
        } else {
            fb_b1.textContent = '';
        }

        // --- Evaluar B.2 (Coordinada / Segura) ---
        const zb2 = Array.from(document.getElementById('zone-safe-b').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_b2 = document.getElementById('feedback-safe-b');
        if (zb2.length >= 4) {
            const simB2 = simularEscenarioB(zb2);
            if (simB2.isCoordinatedSafe) {
                fb_b2.className = 'sim-feedback success';
                fb_b2.textContent = '✅ PROTOCOLO COORDINADO: P₂ recibió ambos mensajes, envió respuesta por C₂ y desbloqueó exitosamente a P₁.';
            } else {
                fb_b2.className = 'sim-feedback';
                fb_b2.textContent = 'Secuencia incompleta. P₂ debe recibir ambos mensajes de C₁ y enviar respuesta por C₂.';
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
        
        const sim_b1 = simularEscenarioB(seq_dl_b);
        const is_dl_b = sim_b1.isTripleDeadlock ? 'BLOQUEO_TRIPLE' : 'INCOMPLETO';

        const sim_b2 = simularEscenarioB(seq_safe_b);
        const is_safe_b = sim_b2.isCoordinatedSafe ? 'PROTOCOLO_COORDINADO' : 'INCOMPLETO';

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
        statusMsg.textContent = '✅ Archivo respuestas_tp1.json generado con éxito con TODAS las secciones validadas.';
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
