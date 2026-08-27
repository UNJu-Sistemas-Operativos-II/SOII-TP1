#!/usr/bin/env bash
# ==============================================================================
# UNIVERSIDAD NACIONAL DE JUJUY (UNJu) - FACULTAD DE INGENIERÍA
# SISTEMAS OPERATIVOS II - 2026
# SUITE DE EVALUACIÓN AUTOMATIZADA — TRABAJO PRÁCTICO N° 1
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PUNTAJE_TOTAL=0
MAX_PUNTAJE=100
FALLOS=0

imprimir_banner() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BOLD}     UNJu — SISTEMAS OPERATIVOS II — EVALUACIÓN AUTOMÁTICA TP 1   ${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

if [ ! -f "ejercicios_procesos.sh" ]; then
    echo -e "${RED}[ERROR CRÍTICO] No se encontró el archivo 'ejercicios_procesos.sh'.${NC}"
    exit 1
fi

source ./ejercicios_procesos.sh
mkdir -p soluciones

# ------------------------------------------------------------------------------
# Test Ejercicio 1 (20 pts)
# ------------------------------------------------------------------------------
test_ejercicio1() {
    echo -e "\n${BOLD}Verificando Ejercicio 1: Kernel y Hardware...${NC}"
    ejercicio1_kernel_hardware > /dev/null 2>&1
    local error=0

    if [ ! -f "soluciones/version_kernel.txt" ]; then
        echo -e "  ${RED}✗ Falta el archivo 'soluciones/version_kernel.txt'${NC}"
        error=1
    else
        local v
        v=$(cat soluciones/version_kernel.txt | tr -d ' \r\n')
        if [ -z "$v" ]; then
            echo -e "  ${RED}✗ 'soluciones/version_kernel.txt' está vacío.${NC}"
            error=1
        fi
    fi

    if [ ! -f "soluciones/info_cpu.txt" ]; then
        echo -e "  ${RED}✗ Falta el archivo 'soluciones/info_cpu.txt'${NC}"
        error=1
    else
        local cpu
        cpu=$(cat soluciones/info_cpu.txt | tr -d ' \r\n')
        if [ -z "$cpu" ]; then
            echo -e "  ${RED}✗ 'soluciones/info_cpu.txt' está vacío.${NC}"
            error=1
        fi
    fi

    if [ $error -eq 0 ]; then
        echo -e "  ${GREEN}✓ [PASS] Ejercicio 1 completado correctamente (+20 Pts)${NC}"
        PUNTAJE_TOTAL=$((PUNTAJE_TOTAL + 20))
    else
        echo -e "  ${RED}✗ [FAIL] Ejercicio 1 falló (+0 Pts)${NC}"
        FALLOS=$((FALLOS + 1))
    fi
}

# ------------------------------------------------------------------------------
# Test Ejercicio 2 (20 pts)
# ------------------------------------------------------------------------------
test_ejercicio2() {
    echo -e "\n${BOLD}Verificando Ejercicio 2: Top 5 Procesos por Memoria...${NC}"
    ejercicio2_top_memoria > /dev/null 2>&1
    local error=0

    if [ ! -f "soluciones/top5_memoria.txt" ]; then
        echo -e "  ${RED}✗ Falta el archivo 'soluciones/top5_memoria.txt'${NC}"
        error=1
    else
        local n_lineas
        n_lineas=$(grep -c '[^[:space:]]' soluciones/top5_memoria.txt)
        if [ "$n_lineas" -ne 5 ]; then
            echo -e "  ${RED}✗ 'soluciones/top5_memoria.txt' contiene $n_lineas líneas (se esperaban exactamente 5 líneas de procesos).${NC}"
            error=1
        fi
    fi

    if [ $error -eq 0 ]; then
        echo -e "  ${GREEN}✓ [PASS] Ejercicio 2 completado correctamente (+20 Pts)${NC}"
        PUNTAJE_TOTAL=$((PUNTAJE_TOTAL + 20))
    else
        echo -e "  ${RED}✗ [FAIL] Ejercicio 2 falló (+0 Pts)${NC}"
        FALLOS=$((FALLOS + 1))
    fi
}

# ------------------------------------------------------------------------------
# Test Ejercicio 3 (20 pts)
# ------------------------------------------------------------------------------
test_ejercicio3() {
    echo -e "\n${BOLD}Verificando Ejercicio 3: Procesos en Segundo Plano y Señales...${NC}"
    ejercicio3_background_signals > /dev/null 2>&1
    local error=0

    if [ ! -f "soluciones/estado_proceso.txt" ]; then
        echo -e "  ${RED}✗ Falta el archivo 'soluciones/estado_proceso.txt'${NC}"
        error=1
    else
        local state
        state=$(cat soluciones/estado_proceso.txt | tr -d '\r')
        if [[ "$state" != *"State:"* ]]; then
            echo -e "  ${RED}✗ 'soluciones/estado_proceso.txt' no contiene la etiqueta 'State:' de /proc/${NC}"
            error=1
        fi
    fi

    if [ $error -eq 0 ]; then
        echo -e "  ${GREEN}✓ [PASS] Ejercicio 3 completado correctamente (+20 Pts)${NC}"
        PUNTAJE_TOTAL=$((PUNTAJE_TOTAL + 20))
    else
        echo -e "  ${RED}✗ [FAIL] Ejercicio 3 falló (+0 Pts)${NC}"
        FALLOS=$((FALLOS + 1))
    fi
}

# ------------------------------------------------------------------------------
# Test Ejercicio 4 (20 pts)
# ------------------------------------------------------------------------------
test_ejercicio4() {
    echo -e "\n${BOLD}Verificando Ejercicio 4: Métricas Propias desde /proc/$$/...${NC}"
    ejercicio4_monitoreo_propio > /dev/null 2>&1
    local error=0

    if [ ! -f "soluciones/metricas_script.txt" ]; then
        echo -e "  ${RED}✗ Falta el archivo 'soluciones/metricas_script.txt'${NC}"
        error=1
    else
        local content
        content=$(cat soluciones/metricas_script.txt | tr -d '\r')
        if [[ "$content" != *"Pid:"* ]] || [[ "$content" != *"PPid:"* ]]; then
            echo -e "  ${RED}✗ 'soluciones/metricas_script.txt' debe contener los campos 'Pid:' y 'PPid:'${NC}"
            error=1
        fi
    fi

    if [ $error -eq 0 ]; then
        echo -e "  ${GREEN}✓ [PASS] Ejercicio 4 completado correctamente (+20 Pts)${NC}"
        PUNTAJE_TOTAL=$((PUNTAJE_TOTAL + 20))
    else
        echo -e "  ${RED}✗ [FAIL] Ejercicio 4 falló (+0 Pts)${NC}"
        FALLOS=$((FALLOS + 1))
    fi
}

# ------------------------------------------------------------------------------
# Test Ejercicio 5 (20 pts) - Validación de respuestas_tp1.json
# ------------------------------------------------------------------------------
test_ejercicio5() {
    echo -e "\n${BOLD}Verificando Ejercicio 5: Respuestas Teóricas e Interbloqueos (JSON)...${NC}"
    local error=0
    local json_file="soluciones/respuestas_tp1.json"

    if [ ! -f "$json_file" ]; then
        echo -e "  ${RED}✗ Falta el archivo '$json_file'. Ábralo y expórtelo desde 'web/index.html'.${NC}"
        error=1
    else
        python3 -c "
import json, sys
try:
    with open('$json_file', 'r', encoding='utf-8') as f:
        d = json.load(f)
    
    # 1. Datos
    est = d.get('estudiante', {})
    if not est.get('nombre_completo') or not est.get('legajo_lu'):
        print('Faltan datos del estudiante (nombre o legajo)', file=sys.stderr)
        sys.exit(1)
        
    # 2. Conceptos
    s1 = d.get('seccion1_conceptos', {})
    if s1.get('q1_directorio_modulos') != 'B':
        print('Q1 incorrecta', file=sys.stderr); sys.exit(1)
    if s1.get('q2_cambio_modo_syscall') != 'B':
        print('Q2 incorrecta', file=sys.stderr); sys.exit(1)
    if s1.get('q3_shells_estandar') != 'A':
        print('Q3 incorrecta', file=sys.stderr); sys.exit(1)

    s2 = d.get('seccion2_senales_procesos', {})
    if s2.get('q4_senal_ctrl_z') != 'C':
        print('Q4 incorrecta', file=sys.stderr); sys.exit(1)
    if s2.get('q5_pseudo_fs_proc') != 'B':
        print('Q5 incorrecta', file=sys.stderr); sys.exit(1)

    # 3. Deadlocks
    s3 = d.get('seccion3_interbloqueos', {})
    ea = s3.get('escenario_a_recursos', {})
    if ea.get('secuencia_deadlock') != 'DEADLOCK_CRUZADO' or ea.get('secuencia_segura') != 'SECUENCIAL_ORDENADA':
        print('Escenario A de Deadlocks incorrecto', file=sys.stderr); sys.exit(1)

    eb = s3.get('escenario_b_mensajes', {})
    if eb.get('secuencia_bloqueo_triple') != 'BLOQUEO_TRIPLE' or eb.get('secuencia_segura') != 'PROTOCOLO_COORDINADO':
        print('Escenario B de Deadlocks incorrecto', file=sys.stderr); sys.exit(1)

    sys.exit(0)
except Exception as e:
    print('Error en estructura JSON:', e, file=sys.stderr)
    sys.exit(1)
" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo -e "  ${RED}✗ Las respuestas en '$json_file' no coinciden o tienen campos incompletos.${NC}"
            error=1
        fi
    fi

    if [ $error -eq 0 ]; then
        echo -e "  ${GREEN}✓ [PASS] Ejercicio 5 completado correctamente (+20 Pts)${NC}"
        PUNTAJE_TOTAL=$((PUNTAJE_TOTAL + 20))
    else
        echo -e "  ${RED}✗ [FAIL] Ejercicio 5 falló (+0 Pts)${NC}"
        FALLOS=$((FALLOS + 1))
    fi
}

imprimir_banner
test_ejercicio1
test_ejercicio2
test_ejercicio3
test_ejercicio4
test_ejercicio5

echo -e "\n${BLUE}================================================================${NC}"
if [ $PUNTAJE_TOTAL -eq 100 ]; then
    echo -e "${GREEN}${BOLD}  RESULTADO TP 1: EXCELENTE! PUNTAJE FINAL: ${PUNTAJE_TOTAL} / ${MAX_PUNTAJE} PTS  ${NC}"
    echo -e "${GREEN}  Todos los tests pasaron exitosamente. ¡Listo para git push!  ${NC}"
    echo -e "${BLUE}================================================================${NC}"
    exit 0
else
    echo -e "${YELLOW}${BOLD}  RESULTADO TP 1: PUNTAJE: ${PUNTAJE_TOTAL} / ${MAX_PUNTAJE} PTS (${FALLOS} fallos)  ${NC}"
    echo -e "${YELLOW}  Revise los errores indicados, ajuste su código/JSON y reintente.${NC}"
    echo -e "${BLUE}================================================================${NC}"
    exit 1
fi
