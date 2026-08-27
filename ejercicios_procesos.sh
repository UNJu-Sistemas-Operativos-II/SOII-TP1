#!/usr/bin/env bash
# ==============================================================================
# UNIVERSIDAD NACIONAL DE JUJUY (UNJu) - FACULTAD DE INGENIERÍA
# SISTEMAS OPERATIVOS II - 2026
# TRABAJO PRÁCTICO N° 1: Introducción, Procesos e Interbloqueos (Deadlocks)
# ==============================================================================
# Nombre del Alumno: 
# Legajo (L.U.): 
# Usuario de GitHub: 
# ==============================================================================

# ------------------------------------------------------------------------------
# EJERCICIO 1: Inspección del Kernel y Métricas de Hardware (20 Pts)
# ------------------------------------------------------------------------------
# Consigna:
# 1. Obtenga la versión exacta del kernel Linux en ejecución usando 'uname -r'
#    y guárdela en el archivo 'soluciones/version_kernel.txt'.
# 2. Extraiga el nombre del modelo de CPU (campo 'model name') desde '/proc/cpuinfo'
#    y guarde únicamente los nombres de los procesadores en 'soluciones/info_cpu.txt'.
# ------------------------------------------------------------------------------
ejercicio1_kernel_hardware() {
    echo "Ejecutando Ejercicio 1: Kernel y Hardware..."
    # TODO: Escriba sus comandos aquí debajo
    
}

# ------------------------------------------------------------------------------
# EJERCICIO 2: Monitoreo y Top de Procesos por Consumo de Memoria (20 Pts)
# ------------------------------------------------------------------------------
# Consigna:
# 1. Utilice el comando 'ps aux' ordenado de mayor a menor consumo de memoria
#    (--sort=-%mem o usando sort).
# 2. Extraiga los 5 procesos que mayor porcentaje de memoria (%MEM) consumen
#    (excluyendo la línea de encabezado) mostrando las columnas: PID, %CPU, %MEM, COMMAND.
# 3. Guarde la lista en 'soluciones/top5_memoria.txt'.
# ------------------------------------------------------------------------------
ejercicio2_top_memoria() {
    echo "Ejecutando Ejercicio 2: Top 5 Procesos en Memoria..."
    # TODO: Escriba sus comandos aquí debajo
    
}

# ------------------------------------------------------------------------------
# EJERCICIO 3: Procesos en Segundo Plano y Gestión de Señales (20 Pts)
# ------------------------------------------------------------------------------
# Consigna:
# 1. Lance un proceso en segundo plano que ejecute 'sleep 30 &'.
# 2. Capture el PID del proceso recién creado utilizando la variable '$!'.
# 3. Lea el archivo '/proc/$PID/status', filtre la línea que indica el estado
#    ('State:') y guárdela en 'soluciones/estado_proceso.txt'.
# 4. Envíe la señal de terminación SIGTERM (kill -15 o kill) al proceso para
#    finalizarlo limpiamente sin dejar procesos huérfanos.
# ------------------------------------------------------------------------------
ejercicio3_background_signals() {
    echo "Ejecutando Ejercicio 3: Background y Señales..."
    # TODO: Escriba sus comandos aquí debajo
    
}

# ------------------------------------------------------------------------------
# EJERCICIO 4: Métricas del Proceso Actual desde /proc/$$/ (20 Pts)
# ------------------------------------------------------------------------------
# Consigna:
# 1. A partir del pseudo-filesystem '/proc/$$/status' (donde '$$' es el PID del script):
# 2. Extraiga las líneas que contengan 'Pid:', 'PPid:' y 'Name:'.
# 3. Guarde estas métricas en 'soluciones/metricas_script.txt'.
# ------------------------------------------------------------------------------
ejercicio4_monitoreo_propio() {
    echo "Ejecutando Ejercicio 4: Métricas de /proc/$$/..."
    # TODO: Escriba sus comandos aquí debajo
    
}

# ------------------------------------------------------------------------------
# EJERCICIO 5: Verificación del Módulo Teórico e Interbloqueos (20 Pts)
# ------------------------------------------------------------------------------
# Consigna:
# 1. Abra el archivo 'web/index.html' en su navegador web (doble clic).
# 2. Complete sus datos personales, las preguntas conceptuales y el análisis
#    de las secuencias de Deadlocks (Escenarios A y B).
# 3. Haga clic en '📥 Descargar respuestas_tp1.json' y mueva el archivo descargado
#    a la carpeta 'soluciones/respuestas_tp1.json' de este repositorio.
# ------------------------------------------------------------------------------
ejercicio5_modulo_teorico() {
    echo "Verificando respuestas del módulo teórico..."
    if [ -f "soluciones/respuestas_tp1.json" ]; then
        echo "Archivo soluciones/respuestas_tp1.json encontrado."
    else
        echo "AVISO: Falta exportar soluciones/respuestas_tp1.json desde la web/index.html"
    fi
}

main() {
    echo "=============================================="
    echo "  Iniciando resolución de TP 1 - SO II (UNJu) "
    echo "=============================================="
    mkdir -p soluciones
    ejercicio1_kernel_hardware
    ejercicio2_top_memoria
    ejercicio3_background_signals
    ejercicio4_monitoreo_propio
    ejercicio5_modulo_teorico
    echo "=============================================="
    echo "  Ejecución finalizada. Corra ./test.sh para  "
    echo "  evaluar su calificación.                    "
    echo "=============================================="
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
