document.addEventListener('DOMContentLoaded', () => {
    let draggedItem = null;

    // Inicializar Drag and Drop en todos los items
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
        // Si está en un banco, mover a la primera dropzone con espacio
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
            // Si está en dropzone, devolver al banco
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

    function evaluateDeadlocks() {
        // Evaluar A.1
        const za1 = Array.from(document.getElementById('zone-deadlock-a').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_a1 = document.getElementById('feedback-dl-a');
        if (za1.length === 4) {
            if (za1[0] === 'P1_REQ_C' && za1[1] === 'P2_REQ_I' && za1[2] === 'P1_REQ_I' && za1[3] === 'P2_REQ_C') {
                fb_a1.className = 'sim-feedback danger';
                fb_a1.textContent = '⚠️ ¡DEADLOCK DETECTADO! P1 retiene C y espera I; P2 retiene I y espera C (Espera Circular).';
            } else {
                fb_a1.className = 'sim-feedback';
                fb_a1.textContent = 'Secuencia incompleta o no genera interbloqueo cruzado.';
            }
        } else {
            fb_a1.textContent = '';
        }

        // Evaluar A.2
        const za2 = Array.from(document.getElementById('zone-safe-a').querySelectorAll('.dnd-item')).map(i => i.dataset.id);
        const fb_a2 = document.getElementById('feedback-safe-a');
        if (za2.length === 4) {
            if (za2[0] === 'P1_REQ_C' && za2[1] === 'P1_REQ_I' && za2[2] === 'P1_REL_I' && za2[3] === 'P1_REL_C') {
                fb_a2.className = 'sim-feedback success';
                fb_a2.textContent = '✅ SECUENCIA SEGURA: P1 adquiere, utiliza y libera ambos recursos sin bloquear a P2.';
            } else {
                fb_a2.className = 'sim-feedback';
                fb_a2.textContent = 'Revise el orden de solicitudes y liberaciones.';
            }
        } else {
            fb_a2.textContent = '';
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

        // Mapeo canónico
        const is_deadlock_a = (seq_dl_a.length === 4 && seq_dl_a[0] === 'P1_REQ_C' && seq_dl_a[1] === 'P2_REQ_I' && seq_dl_a[2] === 'P1_REQ_I' && seq_dl_a[3] === 'P2_REQ_C') ? 'DEADLOCK_CRUZADO' : 'INCOMPLETO';
        const is_safe_a = (seq_safe_a.length === 4 && seq_safe_a[0] === 'P1_REQ_C' && seq_safe_a[1] === 'P1_REQ_I' && seq_safe_a[2] === 'P1_REL_I' && seq_safe_a[3] === 'P1_REL_C') ? 'SECUENCIAL_ORDENADA' : 'INCOMPLETO';
        const is_dl_b = (seq_dl_b.includes('P1_RECV_EMPTY') || seq_dl_b.includes('P2_P3_CONSUME_ALL')) ? 'BLOQUEO_TRIPLE' : 'INCOMPLETO';
        const is_safe_b = (seq_safe_b.includes('P1_SEND_C1') && seq_safe_b.includes('P2_RECV_C1') && seq_safe_b.includes('P2_SEND_C2')) ? 'PROTOCOLO_COORDINADO' : 'INCOMPLETO';

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
