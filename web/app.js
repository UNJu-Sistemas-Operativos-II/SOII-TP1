document.addEventListener('DOMContentLoaded', () => {
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

        const q1 = getRadio('q1');
        const q2 = getRadio('q2');
        const q3 = getRadio('q3');
        const q4 = getRadio('q4');
        const q5 = getRadio('q5');

        const dl_a1 = document.getElementById('dl_a1').value;
        const dl_a2 = document.getElementById('dl_a2').value;
        const dl_b1 = document.getElementById('dl_b1').value;
        const dl_b2 = document.getElementById('dl_b2').value;

        return {
            estudiante: {
                nombre_completo: studentName,
                legajo_lu: studentLU,
                usuario_github: studentGithub
            },
            seccion1_conceptos: {
                q1_directorio_modulos: q1,
                q2_cambio_modo_syscall: q2,
                q3_shells_estandar: q3
            },
            seccion2_senales_procesos: {
                q4_senal_ctrl_z: q4,
                q5_pseudo_fs_proc: q5
            },
            seccion3_interbloqueos: {
                escenario_a_recursos: {
                    secuencia_deadlock: dl_a1,
                    secuencia_segura: dl_a2
                },
                escenario_b_mensajes: {
                    secuencia_bloqueo_triple: dl_b1,
                    secuencia_segura: dl_b2
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
        statusMsg.textContent = '✅ Archivo respuestas_tp1.json descargado con éxito. Muévelo a la carpeta soluciones/ de tu repositorio.';
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
