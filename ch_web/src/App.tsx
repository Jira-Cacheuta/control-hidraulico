import { Box, Container, Heading, Text, useToast, Flex, Divider, useBreakpointValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, SimpleGrid, Badge, HStack, FormControl, FormLabel, Select, Input, Textarea, Stack, Spinner } from '@chakra-ui/react'
import ReactFlow, { Background, useNodesState, useEdgesState } from 'reactflow'
import { nodeTypes } from './nodes/CustomNodes'
import type { Connection, Edge, Node } from 'reactflow'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'reactflow/dist/style.css'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
const ISSUE_POLL_MS = 10000
const VIEW_BOUNDS: [[number, number], [number, number]] = [[-80, -80], [860, 1100]]
const WATER_FIELD_ID = 'customfield_11815'
const WATER_FIELD_LABEL = 'Alimentación de agua'
const WATER_FIELD_ISSUE_KEYS = ['CH-997', 'CH-1022', 'CH-1038', 'CH-1062']
const SYSTEMS = [
  { id: 'gruta1', label: 'Sistema Gruta N°1', group: 'gruta' },
  { id: 'hidro', label: 'Sistema Hidro', group: 'gruta' },
  { id: 'gruta2', label: 'Sistema Gruta N°2', group: 'gruta' },
  { id: 'gruta3', label: 'Sistema Gruta N°3', group: 'gruta' },
  { id: 'gruta4', label: 'Sistema Gruta N°4', group: 'gruta' },
  { id: 'fangoEste', label: 'Sistema Ducha Fango Este', group: 'gruta' },
  { id: 'fangoOeste', label: 'Sistema Ducha Fango Oeste', group: 'gruta' },
  { id: 'aljibeFango', label: 'Sistema Aljibe Fango', group: 'gruta' },
  { id: 'ascensor', label: 'Sistema Ascensor', group: 'gruta' },
  { id: 'cacheutina', label: 'Sistema Cacheutina', group: 'gruta' },
  { id: 'chorroCacheutina', label: 'Sistema Chorro Cacheutina', group: 'gruta' },
  { id: 'cascada', label: 'Sistema Cascada', group: 'gruta' },
  { id: 'aguaFria', label: 'Sistema Agua Fría', group: 'gruta' },
  { id: 'parqueArriba1', label: 'Sistema 1-Arriba', group: 'parque' },
  { id: 'parqueBtv2', label: 'Sistema 2-BTV', group: 'parque' },
  { id: 'parqueJfv3', label: 'Sistema 3-JFV', group: 'parque' },
  { id: 'parqueDuchas4', label: 'Sistema 4-Duchas', group: 'parque' },
  { id: 'parqueAguaTibia', label: 'Sistema Agua Tibia', group: 'parque' },
  { id: 'parqueInteractivo', label: 'Sistema Interactivo', group: 'parque' },
  { id: 'parqueBurbuja', label: 'Sistema Burbuja principal', group: 'parque' },
  { id: 'parqueBurbujaBanos', label: 'Sistema Burbuja baños', group: 'parque' },
  { id: 'parqueBurbujaExt', label: 'Sistema Burbuja ext', group: 'parque', subgroup: 'sala5' },
  { id: 'parqueMedialunaExt', label: 'Sistema Medialuna ext', group: 'parque', subgroup: 'sala5' },
  { id: 'parqueCascada', label: 'Sistema Cascada', group: 'parque', subgroup: 'sala5' },
  { id: 'parqueSala1', label: 'Sistema Sala 1', group: 'parque' },
  { id: 'parqueSala2', label: 'Sistema Sala 2', group: 'parque' },
  { id: 'parqueSala3', label: 'Sistema Sala 3', group: 'parque' },
  { id: 'parqueSala4', label: 'Sistema Sala 4', group: 'parque', subgroup: 'sala4' },
  { id: 'parqueTobogan3', label: 'Sistema Tobogán', group: 'parque', subgroup: 'sala4' },
  { id: 'parqueCascadaOlas', label: 'Sistema Cascada Olas', group: 'parque', subgroup: 'sala4' },
  { id: 'parqueChorrosOlas', label: 'Sistema Chorros Olas', group: 'parque', subgroup: 'sala4' },
  { id: 'parqueAguaFriaParque', label: 'Sistema Agua Fría Parque', group: 'parque' },
  { id: 'pozo19', label: 'Pozo 19', group: 'pozos' },
  { id: 'pozoLalo', label: 'Pozo Lalo', group: 'pozos' },
  { id: 'pozoLuisa', label: 'Pozo Luisa', group: 'pozos' }
]

const SYSTEM_GROUPS = [
  { id: 'gruta', label: 'Gruta' },
  { id: 'parque', label: 'Parque' },
  { id: 'pozos', label: 'Pozos' },
  { id: 'control', label: 'Control' }
]

/** Mapeo nodo bomba/soplador -> issueKey del puesto. Si el puesto no tiene activeKey, se oculta el ícono. */
const PUMP_NODE_TO_PUESTO_KEY: Record<string, string> = {
  'bomba': 'CH-5',
  'gruta2-bomba': 'CH-641',
  'gruta3-soplador': 'CH-694',
  'gruta4-bomba': 'CH-974',
  'fango-bomba': 'CH-918',
  'fango-oeste-bomba': 'CH-921',
  'aljibe-fango-bomba': 'CH-922',
  'ascensor-soplador': 'CH-891',
  'cacheutina-bomba': 'CH-898',
  'chorro-cacheutina-bomba': 'CH-925',
  'cascada-bomba': 'CH-927',
  'agua-fria-bomba': 'CH-914',
  'parque-aguatibia-bomba': 'CH-1048',
  'parque-interactivo-bomba': 'CH-1082',
  'parque-burbuja-soplador': 'CH-1088',
  'parque-burbujabanos-soplador': 'CH-1094',
  'parque-burbujaext-soplador': 'CH-1100',
  'parque-medialunaext-soplador': 'CH-1106',
  'parque-cascada-bomba': 'CH-1113',
  'parque-sala1-bomba': 'CH-1121',
  'parque-sala2-lanchon': 'CH-1127',
  'parque-sala3-lanchon': 'CH-1134',
  'parque-sala4-lanchon': 'CH-1140',
  'parque-tobogan3-bomba': 'CH-1146',
  'parque-cascadaolas-bomba': 'CH-1153',
  'parque-chorrosolas-bomba': 'CH-1160',
  'parque-agua-fria-parque-bomba': 'CH-1072',
  'pozo19-bomba': 'CH-981',
  'pozoLalo-bomba': 'CH-987',
  'pozoLuisa-bomba': 'CH-993'
}
const PUESTO_KEYS_WITH_PUMPS = Object.values(PUMP_NODE_TO_PUESTO_KEY)

/** Dado un nodo de equipo (bomba/soplador), devuelve el id del nodo puesto al que se conecta. */
function getPuestoNodeIdFromEquipment(equipmentNodeId: string): string {
  if (equipmentNodeId === 'bomba') return 'puesto'
  const match = equipmentNodeId.match(/^(.+)-(?:bomba|soplador|lanchon)$/)
  return match ? `${match[1]}-puesto` : ''
}

const grutaNodesInitial: Node[] = [
  // Cañería de succión (círculo verde)
  { 
    id: 'succion', 
    type: 'suction',
    position: { x: 340, y: 80 }, 
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-3' }
  },
  // Tablero eléctrico (rayo amarillo)
  { 
    id: 'electrico', 
    type: 'electric',
    position: { x: 120, y: 260 }, 
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-4' }
  },
  // Bomba (estrella negra)
  { 
    id: 'bomba', 
    type: 'pump',
    position: { x: 140, y: 120 }, 
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-2' }
  },
  // Puesto (círculo violeta)
  { 
    id: 'puesto', 
    type: 'station',
    position: { x: 340, y: 260 }, 
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-5' }
  },
  // Llave (rombo verde)
  { 
    id: 'valvula', 
    type: 'valve',
    position: { x: 340, y: 480 }, 
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-561' }
  },
  // Colector horizontal
  {
    id: 'manifold',
    type: 'pipe',
    position: { x: 220, y: 580 },
    draggable: false,
    data: { label: '' }
  },
  // Servicios (gotita azul)
  { 
    id: 'servicio1', 
    type: 'service',
    position: { x: 247, y: 760 }, 
    draggable: false,
    data: { label: 'Aquarelax', issueKey: 'CH-605' }
  },
  { 
    id: 'ramal1', 
    type: 'pipeSegment',
    position: { x: 272, y: 660 }, 
    draggable: false,
    data: { issueKey: 'CH-604' }
  },
  { 
    id: 'servicio2', 
    type: 'service',
    position: { x: 319, y: 760 }, 
    draggable: false,
    data: { label: 'Camino\nde\nsensaciones', issueKey: 'CH-600', statusBottom: 2 }
  },
  { 
    id: 'ramal2', 
    type: 'pipeSegment',
    position: { x: 344, y: 660 }, 
    draggable: false,
    data: { issueKey: 'CH-599' }
  },
  { 
    id: 'servicio3', 
    type: 'service',
    position: { x: 391, y: 760 }, 
    draggable: false,
    data: { label: 'Palo\nCaliente', issueKey: 'CH-9' }
  },
  { 
    id: 'ramal3', 
    type: 'pipeSegment',
    position: { x: 416, y: 660 }, 
    draggable: false,
    data: { issueKey: 'CH-6' }
  },
  { 
    id: 'servicio4', 
    type: 'service',
    position: { x: 463, y: 760 }, 
    draggable: false,
    data: { label: 'Pileta\nburbujas', issueKey: 'CH-11' }
  },
  { 
    id: 'ramal4', 
    type: 'pipeSegment',
    position: { x: 488, y: 660 }, 
    draggable: false,
    data: { issueKey: 'CH-8' }
  },
  { 
    id: 'servicio5', 
    type: 'service',
    position: { x: 535, y: 760 }, 
    draggable: false,
    data: { label: 'Pecera', issueKey: 'CH-10' }
  },
  { 
    id: 'ramal5', 
    type: 'pipeSegment',
    position: { x: 560, y: 660 }, 
    draggable: false,
    data: { issueKey: 'CH-7' }
  },
  {
    id: 'hidro',
    type: 'hydroSystem',
    position: { x: 150, y: 760 },
    draggable: false,
    data: { label: 'Sist. Hidro', issueKey: 'CH-741' }
  },
]

const grutaEdgesInitial: Edge[] = [
  // Succión → Puesto
  { 
    id: 'succion-puesto', 
    source: 'succion', 
    target: 'puesto', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 },
    data: { 
      name: 'Cañería Succión a gruta 1',
      type: 'succion',
      diameter: 'DN100',
      material: 'PVC',
      pressure: '0.5 bar',
      flow: '15 m³/h'
    }
  },
  // Comp. Eléctrico → Puesto
  { 
    id: 'electrico-puesto', 
    source: 'electrico', 
    target: 'puesto', 
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' },
    data: { 
      name: 'Conexión Eléctrica',
      type: 'electrica',
      voltage: '380V',
      power: '5.5 kW'
    }
  },
  // Bomba → Puesto
  { 
    id: 'bomba-puesto', 
    source: 'bomba', 
    sourceHandle: 'out-diag',
    target: 'puesto', 
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 },
    data: { 
      name: 'Cañería Bomba a Puesto',
      type: 'impulsion',
      diameter: 'DN80',
      material: 'PVC',
      pressure: '2.5 bar',
      flow: '15 m³/h'
    }
  },
  // Puesto → Llave
  { 
    id: 'puesto-valvula', 
    source: 'puesto', 
    sourceHandle: 'out-bottom',
    target: 'valvula', 
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 },
    data: { 
      name: 'Cañería Principal',
      type: 'impulsion',
      diameter: 'DN80',
      material: 'PVC',
      pressure: '2.5 bar',
      flow: '15 m³/h'
    }
  },
  // Llave → Colector
  { 
    id: 'valvula-manifold', 
    source: 'valvula', 
    sourceHandle: 'out-main',
    target: 'manifold',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Colector Principal',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '15 m³/h'
    }
  },
  // Colector → Servicios
  { 
    id: 'manifold-hidro', 
    source: 'manifold', 
    sourceHandle: 'out0', 
    target: 'hidro', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Sist. Hidro',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'manifold-ramal1', 
    source: 'manifold', 
    sourceHandle: 'out1', 
    target: 'ramal1', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Aquarelax',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'ramal1-servicio1', 
    source: 'ramal1', 
    target: 'servicio1', 
    sourceHandle: 'out-bottom',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Aquarelax',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'manifold-ramal2', 
    source: 'manifold', 
    sourceHandle: 'out2', 
    target: 'ramal2', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Camino de sensaciones',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'ramal2-servicio2', 
    source: 'ramal2', 
    target: 'servicio2', 
    sourceHandle: 'out-bottom',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Camino de sensaciones',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'manifold-ramal3', 
    source: 'manifold', 
    sourceHandle: 'out3', 
    target: 'ramal3', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Palo Caliente',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'ramal3-servicio3', 
    source: 'ramal3', 
    target: 'servicio3', 
    sourceHandle: 'out-bottom',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Palo Caliente',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'manifold-ramal4', 
    source: 'manifold', 
    sourceHandle: 'out4', 
    target: 'ramal4', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Burbujas',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'ramal4-servicio4', 
    source: 'ramal4', 
    target: 'servicio4', 
    sourceHandle: 'out-bottom',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Burbujas',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'manifold-ramal5', 
    source: 'manifold', 
    sourceHandle: 'out5', 
    target: 'ramal5', 
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Pecera',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
  { 
    id: 'ramal5-servicio5', 
    source: 'ramal5', 
    target: 'servicio5', 
    sourceHandle: 'out-bottom',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' },
    data: { 
      name: 'Cañería Sala Gruta a Pecera',
      type: 'distribucion',
      diameter: 'DN50',
      material: 'PVC',
      pressure: '2.0 bar',
      flow: '3 m³/h'
    }
  },
]

const hidroNodesInitial: Node[] = [
  {
    id: 'hidro-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Sala Gruta a Hidro', issueKey: 'CH-740' }
  },
  {
    id: 'hidro-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-744' }
  },
  {
    id: 'hidro-valvula',
    type: 'valveTriangle',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Válvula principal', issueKey: 'CH-743' }
  },
  {
    id: 'hidro-manifold',
    type: 'pipe',
    position: { x: 220, y: 360 },
    draggable: false,
    data: { label: '' }
  },
  {
    id: 'hidro-ramal1',
    type: 'pipeSegment',
    position: { x: 200, y: 440 },
    draggable: false,
    data: { issueKey: 'CH-745' }
  },
  {
    id: 'hidro-ramal2',
    type: 'pipeSegment',
    position: { x: 416, y: 440 },
    draggable: false,
    data: { issueKey: 'CH-746' }
  },
  {
    id: 'hidro-ramal3',
    type: 'pipeSegment',
    position: { x: 560, y: 440 },
    draggable: false,
    data: { issueKey: 'CH-747' }
  },
  {
    id: 'hidro-valvula1',
    type: 'valveTriangle',
    position: { x: 160, y: 520 },
    draggable: false,
    data: { label: 'Válvula', issueKey: 'CH-748' }
  },
  {
    id: 'hidro-valvula2',
    type: 'valveTriangle',
    position: { x: 376, y: 520 },
    draggable: false,
    data: { label: 'Válvula', issueKey: 'CH-749' }
  },
  {
    id: 'hidro-pulsador1',
    type: 'pulsador',
    position: { x: 160, y: 620 },
    draggable: false,
    data: { label: 'Pulsador', issueKey: 'CH-750' }
  },
  {
    id: 'hidro-pulsador2',
    type: 'pulsador',
    position: { x: 376, y: 620 },
    draggable: false,
    data: { label: 'Pulsador', issueKey: 'CH-751' }
  },
  {
    id: 'hidro-servicio1',
    type: 'service',
    position: { x: 160, y: 720 },
    draggable: false,
    data: { label: 'Ducha Escocesa', issueKey: 'CH-754' }
  },
  {
    id: 'hidro-servicio2',
    type: 'service',
    position: { x: 376, y: 720 },
    draggable: false,
    data: { label: 'Dos chorros', issueKey: 'CH-757' }
  },
  {
    id: 'hidro-servicio3',
    type: 'service',
    position: { x: 520, y: 720 },
    draggable: false,
    data: { label: 'Ducha de mano', issueKey: 'CH-760' }
  }
]

const hidroEdgesInitial: Edge[] = [
  {
    id: 'hidro-succion-valvula',
    source: 'hidro-succion',
    target: 'hidro-valvula',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'hidro-electrico-valvula',
    source: 'hidro-electrico',
    target: 'hidro-valvula',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'hidro-valvula-manifold',
    source: 'hidro-valvula',
    sourceHandle: 'out-bottom',
    target: 'hidro-manifold',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-manifold-ramal1',
    source: 'hidro-manifold',
    sourceHandle: 'out0',
    target: 'hidro-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-manifold-ramal2',
    source: 'hidro-manifold',
    sourceHandle: 'out3',
    target: 'hidro-ramal2',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-manifold-ramal3',
    source: 'hidro-manifold',
    sourceHandle: 'out5',
    target: 'hidro-ramal3',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-ramal1-valvula1',
    source: 'hidro-ramal1',
    sourceHandle: 'out-bottom',
    target: 'hidro-valvula1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-ramal2-valvula2',
    source: 'hidro-ramal2',
    sourceHandle: 'out-bottom',
    target: 'hidro-valvula2',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-valvula1-pulsador1',
    source: 'hidro-valvula1',
    sourceHandle: 'out-bottom',
    target: 'hidro-pulsador1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-valvula2-pulsador2',
    source: 'hidro-valvula2',
    sourceHandle: 'out-bottom',
    target: 'hidro-pulsador2',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-pulsador1-servicio1',
    source: 'hidro-pulsador1',
    sourceHandle: 'out-bottom',
    target: 'hidro-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-pulsador2-servicio2',
    source: 'hidro-pulsador2',
    sourceHandle: 'out-bottom',
    target: 'hidro-servicio2',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'hidro-ramal3-servicio3',
    source: 'hidro-ramal3',
    sourceHandle: 'out-bottom',
    target: 'hidro-servicio3',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const gruta2NodesInitial: Node[] = [
  {
    id: 'gruta2-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-638' }
  },
  {
    id: 'gruta2-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-639' }
  },
  {
    id: 'gruta2-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-640' }
  },
  {
    id: 'gruta2-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-641' }
  },
  {
    id: 'gruta2-valvula',
    type: 'valve',
    position: { x: 340, y: 480 },
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-642' }
  },
  {
    id: 'gruta2-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 620 },
    draggable: false,
    data: { issueKey: 'CH-646' }
  },
  {
    id: 'gruta2-servicio1',
    type: 'service',
    position: { x: 295, y: 720 },
    draggable: false,
    data: { label: 'Parque', issueKey: 'CH-643' }
  }
]

const gruta2EdgesInitial: Edge[] = [
  {
    id: 'gruta2-succion-puesto',
    source: 'gruta2-succion',
    target: 'gruta2-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta2-electrico-puesto',
    source: 'gruta2-electrico',
    target: 'gruta2-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'gruta2-bomba-puesto',
    source: 'gruta2-bomba',
    sourceHandle: 'out-diag',
    target: 'gruta2-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta2-puesto-valvula',
    source: 'gruta2-puesto',
    sourceHandle: 'out-bottom',
    target: 'gruta2-valvula',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta2-valvula-ramal1',
    source: 'gruta2-valvula',
    sourceHandle: 'out-main',
    target: 'gruta2-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'gruta2-ramal1-servicio1',
    source: 'gruta2-ramal1',
    sourceHandle: 'out-bottom',
    target: 'gruta2-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const gruta3NodesInitial: Node[] = [
  {
    id: 'gruta3-soplador',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Soplador', issueKey: 'CH-693' }
  },
  {
    id: 'gruta3-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-703' }
  },
  {
    id: 'gruta3-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-694' }
  },
  {
    id: 'gruta3-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-929' }
  },
  {
    id: 'gruta3-servicio1',
    type: 'cloudService',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Abanico', issueKey: 'CH-930' }
  }
]

const gruta3EdgesInitial: Edge[] = [
  {
    id: 'gruta3-soplador-puesto',
    source: 'gruta3-soplador',
    sourceHandle: 'out-diag',
    target: 'gruta3-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta3-electrico-puesto',
    source: 'gruta3-electrico',
    target: 'gruta3-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'gruta3-puesto-ramal1',
    source: 'gruta3-puesto',
    sourceHandle: 'out-bottom',
    target: 'gruta3-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta3-ramal1-servicio1',
    source: 'gruta3-ramal1',
    sourceHandle: 'out-bottom',
    target: 'gruta3-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const gruta4NodesInitial: Node[] = [
  {
    id: 'gruta4-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-971' }
  },
  {
    id: 'gruta4-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-972' }
  },
  {
    id: 'gruta4-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba sumergible', issueKey: 'CH-973', labelPosition: 'top' }
  },
  {
    id: 'gruta4-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-974' }
  },
  {
    id: 'gruta4-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-975' }
  },
  {
    id: 'gruta4-servicio1',
    type: 'service',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Volcán', issueKey: 'CH-977' }
  }
]

const gruta4EdgesInitial: Edge[] = [
  {
    id: 'gruta4-succion-puesto',
    source: 'gruta4-succion',
    target: 'gruta4-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta4-electrico-puesto',
    source: 'gruta4-electrico',
    target: 'gruta4-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'gruta4-bomba-puesto',
    source: 'gruta4-bomba',
    sourceHandle: 'out-diag',
    target: 'gruta4-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta4-puesto-ramal1',
    source: 'gruta4-puesto',
    sourceHandle: 'out-bottom',
    target: 'gruta4-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'gruta4-ramal1-servicio1',
    source: 'gruta4-ramal1',
    sourceHandle: 'out-bottom',
    target: 'gruta4-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const fangoEsteNodesInitial: Node[] = [
  {
    id: 'fango-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-872' }
  },
  {
    id: 'fango-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-875' }
  },
  {
    id: 'fango-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-873' }
  },
  {
    id: 'fango-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-918' }
  },
  {
    id: 'fango-ramal1',
    type: 'pipeSegment',
    position: { x: 380, y: 460 },
    draggable: false,
    data: { issueKey: 'CH-876' }
  },
  {
    id: 'fango-pulsador1',
    type: 'pulsador',
    position: { x: 380, y: 560 },
    draggable: false,
    data: { label: 'Pulsador', issueKey: 'CH-878' }
  },
  {
    id: 'fango-servicio1',
    type: 'service',
    position: { x: 380, y: 660 },
    draggable: false,
    data: { label: 'Ducha fango este', issueKey: 'CH-880' }
  }
]

const fangoEsteEdgesInitial: Edge[] = [
  {
    id: 'fango-succion-puesto',
    source: 'fango-succion',
    target: 'fango-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'fango-electrico-puesto',
    source: 'fango-electrico',
    target: 'fango-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'fango-bomba-puesto',
    source: 'fango-bomba',
    sourceHandle: 'out-diag',
    target: 'fango-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'fango-puesto-ramal1',
    source: 'fango-puesto',
    sourceHandle: 'out-bottom',
    target: 'fango-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'fango-ramal1-pulsador1',
    source: 'fango-ramal1',
    sourceHandle: 'out-bottom',
    target: 'fango-pulsador1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'fango-pulsador1-servicio1',
    source: 'fango-pulsador1',
    sourceHandle: 'out-bottom',
    target: 'fango-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const fangoOesteNodesInitial: Node[] = [
  {
    id: 'fango-oeste-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-919' }
  },
  {
    id: 'fango-oeste-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-920' }
  },
  {
    id: 'fango-oeste-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-874' }
  },
  {
    id: 'fango-oeste-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-921' }
  },
  {
    id: 'fango-oeste-ramal1',
    type: 'pipeSegment',
    position: { x: 380, y: 460 },
    draggable: false,
    data: { issueKey: 'CH-877' }
  },
  {
    id: 'fango-oeste-pulsador1',
    type: 'pulsador',
    position: { x: 380, y: 560 },
    draggable: false,
    data: { label: 'Pulsador', issueKey: 'CH-879' }
  },
  {
    id: 'fango-oeste-servicio1',
    type: 'service',
    position: { x: 380, y: 660 },
    draggable: false,
    data: { label: 'Ducha fango oeste', issueKey: 'CH-881' }
  }
]

const fangoOesteEdgesInitial: Edge[] = [
  {
    id: 'fango-oeste-succion-puesto',
    source: 'fango-oeste-succion',
    target: 'fango-oeste-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'fango-oeste-electrico-puesto',
    source: 'fango-oeste-electrico',
    target: 'fango-oeste-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'fango-oeste-bomba-puesto',
    source: 'fango-oeste-bomba',
    sourceHandle: 'out-diag',
    target: 'fango-oeste-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'fango-oeste-puesto-ramal1',
    source: 'fango-oeste-puesto',
    sourceHandle: 'out-bottom',
    target: 'fango-oeste-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'fango-oeste-ramal1-pulsador1',
    source: 'fango-oeste-ramal1',
    sourceHandle: 'out-bottom',
    target: 'fango-oeste-pulsador1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'fango-oeste-pulsador1-servicio1',
    source: 'fango-oeste-pulsador1',
    sourceHandle: 'out-bottom',
    target: 'fango-oeste-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const aljibeFangoNodesInitial: Node[] = [
  {
    id: 'aljibe-fango-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-883' }
  },
  {
    id: 'aljibe-fango-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-885' }
  },
  {
    id: 'aljibe-fango-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-884' }
  },
  {
    id: 'aljibe-fango-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-922' }
  },
  {
    id: 'aljibe-fango-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-886' }
  },
  {
    id: 'aljibe-fango-servicio1',
    type: 'service',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Fango aljibe', issueKey: 'CH-887' }
  }
]

const aljibeFangoEdgesInitial: Edge[] = [
  {
    id: 'aljibe-fango-succion-puesto',
    source: 'aljibe-fango-succion',
    target: 'aljibe-fango-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'aljibe-fango-electrico-puesto',
    source: 'aljibe-fango-electrico',
    target: 'aljibe-fango-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'aljibe-fango-bomba-puesto',
    source: 'aljibe-fango-bomba',
    sourceHandle: 'out-diag',
    target: 'aljibe-fango-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'aljibe-fango-puesto-ramal1',
    source: 'aljibe-fango-puesto',
    sourceHandle: 'out-bottom',
    target: 'aljibe-fango-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'aljibe-fango-ramal1-servicio1',
    source: 'aljibe-fango-ramal1',
    sourceHandle: 'out-bottom',
    target: 'aljibe-fango-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const ascensorNodesInitial: Node[] = [
  {
    id: 'ascensor-soplador',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Soplador', issueKey: 'CH-889' }
  },
  {
    id: 'ascensor-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-890' }
  },
  {
    id: 'ascensor-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-891' }
  },
  {
    id: 'ascensor-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-892' }
  },
  {
    id: 'ascensor-servicio1',
    type: 'service',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Burbujas en pileta', issueKey: 'CH-893' }
  }
]

const ascensorEdgesInitial: Edge[] = [
  {
    id: 'ascensor-soplador-puesto',
    source: 'ascensor-soplador',
    sourceHandle: 'out-diag',
    target: 'ascensor-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'ascensor-electrico-puesto',
    source: 'ascensor-electrico',
    target: 'ascensor-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'ascensor-puesto-ramal1',
    source: 'ascensor-puesto',
    sourceHandle: 'out-bottom',
    target: 'ascensor-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'ascensor-ramal1-servicio1',
    source: 'ascensor-ramal1',
    sourceHandle: 'out-bottom',
    target: 'ascensor-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const cacheutinaNodesInitial: Node[] = [
  {
    id: 'cacheutina-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-895' }
  },
  {
    id: 'cacheutina-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-896' }
  },
  {
    id: 'cacheutina-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-897' }
  },
  {
    id: 'cacheutina-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-898' }
  },
  {
    id: 'cacheutina-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-899' }
  },
  {
    id: 'cacheutina-servicio1',
    type: 'service',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Cacheutina', issueKey: 'CH-900' }
  }
]

const cacheutinaEdgesInitial: Edge[] = [
  {
    id: 'cacheutina-succion-puesto',
    source: 'cacheutina-succion',
    target: 'cacheutina-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'cacheutina-electrico-puesto',
    source: 'cacheutina-electrico',
    target: 'cacheutina-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'cacheutina-bomba-puesto',
    source: 'cacheutina-bomba',
    sourceHandle: 'out-diag',
    target: 'cacheutina-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'cacheutina-puesto-ramal1',
    source: 'cacheutina-puesto',
    sourceHandle: 'out-bottom',
    target: 'cacheutina-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'cacheutina-ramal1-servicio1',
    source: 'cacheutina-ramal1',
    sourceHandle: 'out-bottom',
    target: 'cacheutina-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const chorroCacheutinaNodesInitial: Node[] = [
  {
    id: 'chorro-cacheutina-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-901' }
  },
  {
    id: 'chorro-cacheutina-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-926' }
  },
  {
    id: 'chorro-cacheutina-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-903' }
  },
  {
    id: 'chorro-cacheutina-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-925' }
  },
  {
    id: 'chorro-cacheutina-ramal1',
    type: 'pipeSegment',
    position: { x: 380, y: 460 },
    draggable: false,
    data: { issueKey: 'CH-905' }
  },
  {
    id: 'chorro-cacheutina-pulsador1',
    type: 'pulsador',
    position: { x: 380, y: 560 },
    draggable: false,
    data: { label: 'Pulsador', issueKey: 'CH-907' }
  },
  {
    id: 'chorro-cacheutina-servicio1',
    type: 'service',
    position: { x: 380, y: 660 },
    draggable: false,
    data: { label: 'Chorro cacheutina', issueKey: 'CH-908' }
  }
]

const chorroCacheutinaEdgesInitial: Edge[] = [
  {
    id: 'chorro-cacheutina-succion-puesto',
    source: 'chorro-cacheutina-succion',
    target: 'chorro-cacheutina-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'chorro-cacheutina-electrico-puesto',
    source: 'chorro-cacheutina-electrico',
    target: 'chorro-cacheutina-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'chorro-cacheutina-bomba-puesto',
    source: 'chorro-cacheutina-bomba',
    sourceHandle: 'out-diag',
    target: 'chorro-cacheutina-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'chorro-cacheutina-puesto-ramal1',
    source: 'chorro-cacheutina-puesto',
    sourceHandle: 'out-bottom',
    target: 'chorro-cacheutina-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'chorro-cacheutina-ramal1-pulsador1',
    source: 'chorro-cacheutina-ramal1',
    sourceHandle: 'out-bottom',
    target: 'chorro-cacheutina-pulsador1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'chorro-cacheutina-pulsador1-servicio1',
    source: 'chorro-cacheutina-pulsador1',
    sourceHandle: 'out-bottom',
    target: 'chorro-cacheutina-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const cascadaNodesInitial: Node[] = [
  {
    id: 'cascada-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-902' }
  },
  {
    id: 'cascada-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-928' }
  },
  {
    id: 'cascada-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba sumergible', issueKey: 'CH-904' }
  },
  {
    id: 'cascada-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-927' }
  },
  {
    id: 'cascada-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-906' }
  },
  {
    id: 'cascada-servicio1',
    type: 'service',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Cascada', issueKey: 'CH-909' }
  }
]

const cascadaEdgesInitial: Edge[] = [
  {
    id: 'cascada-succion-puesto',
    source: 'cascada-succion',
    target: 'cascada-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'cascada-electrico-puesto',
    source: 'cascada-electrico',
    target: 'cascada-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'cascada-bomba-puesto',
    source: 'cascada-bomba',
    sourceHandle: 'out-diag',
    target: 'cascada-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'cascada-puesto-ramal1',
    source: 'cascada-puesto',
    sourceHandle: 'out-bottom',
    target: 'cascada-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'cascada-ramal1-servicio1',
    source: 'cascada-ramal1',
    sourceHandle: 'out-bottom',
    target: 'cascada-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const aguaFriaNodesInitial: Node[] = [
  {
    id: 'agua-fria-succion',
    type: 'suction',
    position: { x: 340, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-911' }
  },
  {
    id: 'agua-fria-electrico',
    type: 'electric',
    position: { x: 120, y: 260 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-912' }
  },
  {
    id: 'agua-fria-bomba',
    type: 'pump',
    position: { x: 140, y: 120 },
    draggable: false,
    data: { label: 'Bomba sumergible', issueKey: 'CH-913' }
  },
  {
    id: 'agua-fria-puesto',
    type: 'station',
    position: { x: 340, y: 260 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-914' }
  },
  {
    id: 'agua-fria-ramal1',
    type: 'pipeSegment',
    position: { x: 320, y: 420 },
    draggable: false,
    data: { issueKey: 'CH-915' }
  },
  {
    id: 'agua-fria-servicio1',
    type: 'service',
    position: { x: 295, y: 520 },
    draggable: false,
    data: { label: 'Palo Frío', issueKey: 'CH-916' }
  }
]

const aguaFriaEdgesInitial: Edge[] = [
  {
    id: 'agua-fria-succion-puesto',
    source: 'agua-fria-succion',
    target: 'agua-fria-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'agua-fria-electrico-puesto',
    source: 'agua-fria-electrico',
    target: 'agua-fria-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'agua-fria-bomba-puesto',
    source: 'agua-fria-bomba',
    sourceHandle: 'out-diag',
    target: 'agua-fria-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'agua-fria-puesto-ramal1',
    source: 'agua-fria-puesto',
    sourceHandle: 'out-bottom',
    target: 'agua-fria-ramal1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'agua-fria-ramal1-servicio1',
    source: 'agua-fria-ramal1',
    sourceHandle: 'out-bottom',
    target: 'agua-fria-servicio1',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueArriba1NodesInitial: Node[] = [
  {
    id: 'parque-arriba1-valvula',
    type: 'valveRed',
    position: { x: 320, y: 90 },
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-997' }
  },
  {
    id: 'parque-arriba1-ramal998',
    type: 'pipeSegment',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { issueKey: 'CH-998' }
  },
  {
    id: 'parque-arriba1-line-998',
    type: 'pipe',
    position: { x: 160, y: 265 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 288 }
  },
  {
    id: 'parque-arriba1-ramal999',
    type: 'pipeSegment',
    position: { x: 212, y: 310 },
    draggable: false,
    data: { issueKey: 'CH-999' }
  },
  {
    id: 'parque-arriba1-servicio1001',
    type: 'service',
    position: { x: 172, y: 400 },
    draggable: false,
    data: { label: 'Pileta 45', issueKey: 'CH-1001' }
  },
  {
    id: 'parque-arriba1-ramal1000',
    type: 'pipeSegment',
    position: { x: 428, y: 310 },
    draggable: false,
    data: { issueKey: 'CH-1000' }
  },
  {
    id: 'parque-arriba1-servicio1002',
    type: 'service',
    position: { x: 388, y: 400 },
    draggable: false,
    data: { label: 'Pileta grande', issueKey: 'CH-1002' }
  },
  {
    id: 'parque-arriba1-ramal1003',
    type: 'pipeSegment',
    position: { x: 356, y: 470 },
    draggable: false,
    data: { issueKey: 'CH-1003' }
  },
  {
    id: 'parque-arriba1-line-1003',
    type: 'pipe',
    position: { x: 196, y: 515 },
    draggable: false,
    data: { label: '' }
  },
  {
    id: 'parque-arriba1-ramal1004',
    type: 'pipeSegment',
    position: { x: 176, y: 570 },
    draggable: false,
    data: { issueKey: 'CH-1004' }
  },
  {
    id: 'parque-arriba1-servicio1010',
    type: 'service',
    position: { x: 136, y: 660 },
    draggable: false,
    data: { label: 'Isla A1', issueKey: 'CH-1010' }
  },
  {
    id: 'parque-arriba1-ramal1005',
    type: 'pipeSegment',
    position: { x: 248, y: 570 },
    draggable: false,
    data: { issueKey: 'CH-1005' }
  },
  {
    id: 'parque-arriba1-servicio1011',
    type: 'service',
    position: { x: 208, y: 660 },
    draggable: false,
    data: { label: 'Isla A2', issueKey: 'CH-1011' }
  },
  {
    id: 'parque-arriba1-ramal1006',
    type: 'pipeSegment',
    position: { x: 320, y: 570 },
    draggable: false,
    data: { issueKey: 'CH-1006' }
  },
  {
    id: 'parque-arriba1-servicio1012',
    type: 'service',
    position: { x: 280, y: 660 },
    draggable: false,
    data: { label: 'Isla B1', issueKey: 'CH-1012' }
  },
  {
    id: 'parque-arriba1-ramal1007',
    type: 'pipeSegment',
    position: { x: 392, y: 570 },
    draggable: false,
    data: { issueKey: 'CH-1007' }
  },
  {
    id: 'parque-arriba1-servicio1013',
    type: 'service',
    position: { x: 352, y: 660 },
    draggable: false,
    data: { label: 'Isla B2', issueKey: 'CH-1013' }
  },
  {
    id: 'parque-arriba1-ramal1008',
    type: 'pipeSegment',
    position: { x: 464, y: 570 },
    draggable: false,
    data: { issueKey: 'CH-1008' }
  },
  {
    id: 'parque-arriba1-servicio1014',
    type: 'service',
    position: { x: 424, y: 660 },
    draggable: false,
    data: { label: 'Isla B3', issueKey: 'CH-1014' }
  },
  {
    id: 'parque-arriba1-ramal1009',
    type: 'pipeSegment',
    position: { x: 536, y: 570 },
    draggable: false,
    data: { issueKey: 'CH-1009' }
  },
  {
    id: 'parque-arriba1-servicio1015',
    type: 'service',
    position: { x: 496, y: 660 },
    draggable: false,
    data: { label: 'Isla B4', issueKey: 'CH-1015' }
  },
  {
    id: 'parque-arriba1-ramal1016',
    type: 'pipeSegment',
    position: { x: 356, y: 740 },
    draggable: false,
    data: { issueKey: 'CH-1016' }
  },
  {
    id: 'parque-arriba1-line-1016',
    type: 'pipe',
    position: { x: 196, y: 785 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 288 }
  },
  {
    id: 'parque-arriba1-ramal1017',
    type: 'pipeSegment',
    position: { x: 248, y: 820 },
    draggable: false,
    data: { issueKey: 'CH-1017' }
  },
  {
    id: 'parque-arriba1-servicio1019',
    type: 'service',
    position: { x: 208, y: 910 },
    draggable: false,
    data: { label: 'Pileta T1', issueKey: 'CH-1019' }
  },
  {
    id: 'parque-arriba1-ramal1018',
    type: 'pipeSegment',
    position: { x: 464, y: 820 },
    draggable: false,
    data: { issueKey: 'CH-1018' }
  },
  {
    id: 'parque-arriba1-servicio1020',
    type: 'service',
    position: { x: 424, y: 910 },
    draggable: false,
    data: { label: 'Pileta T2', issueKey: 'CH-1020' }
  }
]

const parqueArriba1EdgesInitial: Edge[] = [
  {
    id: 'parque-arriba1-valvula-998',
    source: 'parque-arriba1-valvula',
    sourceHandle: 'out-main',
    target: 'parque-arriba1-ramal998',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-arriba1-998-line',
    source: 'parque-arriba1-ramal998',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-line-998',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-998-999',
    source: 'parque-arriba1-line-998',
    sourceHandle: 'out1',
    target: 'parque-arriba1-ramal999',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-999-1001',
    source: 'parque-arriba1-ramal999',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1001',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-998-1000',
    source: 'parque-arriba1-line-998',
    sourceHandle: 'out4',
    target: 'parque-arriba1-ramal1000',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1000-1002',
    source: 'parque-arriba1-ramal1000',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1002',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-998-1003',
    source: 'parque-arriba1-line-998',
    sourceHandle: 'out3',
    target: 'parque-arriba1-ramal1003',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-line',
    source: 'parque-arriba1-ramal1003',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-line-1003',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1016',
    source: 'parque-arriba1-ramal1003',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-ramal1016',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1004',
    source: 'parque-arriba1-line-1003',
    sourceHandle: 'out0',
    target: 'parque-arriba1-ramal1004',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1004-1010',
    source: 'parque-arriba1-ramal1004',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1010',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1005',
    source: 'parque-arriba1-line-1003',
    sourceHandle: 'out1',
    target: 'parque-arriba1-ramal1005',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1005-1011',
    source: 'parque-arriba1-ramal1005',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1011',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1006',
    source: 'parque-arriba1-line-1003',
    sourceHandle: 'out2',
    target: 'parque-arriba1-ramal1006',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1006-1012',
    source: 'parque-arriba1-ramal1006',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1012',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1007',
    source: 'parque-arriba1-line-1003',
    sourceHandle: 'out3',
    target: 'parque-arriba1-ramal1007',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1007-1013',
    source: 'parque-arriba1-ramal1007',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1013',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1008',
    source: 'parque-arriba1-line-1003',
    sourceHandle: 'out4',
    target: 'parque-arriba1-ramal1008',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1008-1014',
    source: 'parque-arriba1-ramal1008',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1014',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1003-1009',
    source: 'parque-arriba1-line-1003',
    sourceHandle: 'out5',
    target: 'parque-arriba1-ramal1009',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1009-1015',
    source: 'parque-arriba1-ramal1009',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1015',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1016-line',
    source: 'parque-arriba1-ramal1016',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-line-1016',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1016-1017',
    source: 'parque-arriba1-line-1016',
    sourceHandle: 'out1',
    target: 'parque-arriba1-ramal1017',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1017-1019',
    source: 'parque-arriba1-ramal1017',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1019',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1016-1018',
    source: 'parque-arriba1-line-1016',
    sourceHandle: 'out4',
    target: 'parque-arriba1-ramal1018',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-arriba1-1018-1020',
    source: 'parque-arriba1-ramal1018',
    sourceHandle: 'out-bottom',
    target: 'parque-arriba1-servicio1020',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueBtv2NodesInitial: Node[] = [
  {
    id: 'parque-btv2-valvula',
    type: 'valveRed',
    position: { x: 360, y: 80 },
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-1022' }
  },
  {
    id: 'parque-btv2-ramal1023',
    type: 'pipeSegment',
    position: { x: 360, y: 210 },
    draggable: false,
    data: { issueKey: 'CH-1023' }
  },
  {
    id: 'parque-btv2-line-1023',
    type: 'pipe',
    position: { x: 180, y: 270 },
    draggable: false,
    data: { label: '', lineStart: 180, lineEnd: 360 }
  },
  {
    id: 'parque-btv2-ramal1031',
    type: 'pipeSegment',
    position: { x: 360, y: 330 },
    draggable: false,
    data: { issueKey: 'CH-1031' }
  },
  {
    id: 'parque-btv2-line-1031-1032',
    type: 'pipe',
    position: { x: 80, y: 321 },
    draggable: false,
    data: { label: '', lineStart: 60, lineEnd: 300 }
  },
  {
    id: 'parque-btv2-servicio1032',
    type: 'service',
    position: { x: 80, y: 330 },
    draggable: false,
    data: { label: 'Ingreso\nTobogán\narriba (1)', issueKey: 'CH-1032', statusBottom: -4 }
  },
  {
    id: 'parque-btv2-ramal1033',
    type: 'pipeSegment',
    position: { x: 560, y: 330 },
    draggable: false,
    data: { issueKey: 'CH-1033' }
  },
  {
    id: 'parque-btv2-servicio1035',
    type: 'service',
    position: { x: 520, y: 420 },
    draggable: false,
    data: { label: 'Burbuja\nbaños', issueKey: 'CH-1035' }
  },
  {
    id: 'parque-btv2-ramal1034',
    type: 'pipeSegment',
    position: { x: 680, y: 330 },
    draggable: false,
    data: { issueKey: 'CH-1034' }
  },
  {
    id: 'parque-btv2-servicio1036',
    type: 'service',
    position: { x: 640, y: 420 },
    draggable: false,
    data: { label: 'Ingreso\nVilches\n(1)', issueKey: 'CH-1036', statusBottom: -4 }
  },
  {
    id: 'parque-btv2-valvula1024',
    type: 'valve',
    position: { x: 360, y: 400 },
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-1024' }
  },
  {
    id: 'parque-btv2-line-1024',
    type: 'pipe',
    position: { x: 180, y: 520 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 360 }
  },
  {
    id: 'parque-btv2-ramal1025',
    type: 'pipeSegment',
    position: { x: 240, y: 580 },
    draggable: false,
    data: { issueKey: 'CH-1025' }
  },
  {
    id: 'parque-btv2-servicio1028',
    type: 'service',
    position: { x: 200, y: 670 },
    draggable: false,
    data: { label: 'Ingreso\nVidrio\njacuzzi (1)', issueKey: 'CH-1028', statusBottom: -4 }
  },
  {
    id: 'parque-btv2-ramal1026',
    type: 'pipeSegment',
    position: { x: 360, y: 580 },
    draggable: false,
    data: { issueKey: 'CH-1026' }
  },
  {
    id: 'parque-btv2-servicio1029',
    type: 'service',
    position: { x: 320, y: 670 },
    draggable: false,
    data: { label: 'Burbujas\nexternas', issueKey: 'CH-1029' }
  },
  {
    id: 'parque-btv2-ramal1027',
    type: 'pipeSegment',
    position: { x: 480, y: 580 },
    draggable: false,
    data: { issueKey: 'CH-1027' }
  },
  {
    id: 'parque-btv2-servicio1030',
    type: 'service',
    position: { x: 440, y: 670 },
    draggable: false,
    data: { label: 'Ingreso\n3 chorritos\n(1)', issueKey: 'CH-1030', statusBottom: -4 }
  }
]

const parqueBtv2EdgesInitial: Edge[] = [
  {
    id: 'parque-btv2-1022-1023',
    source: 'parque-btv2-valvula',
    sourceHandle: 'out-main',
    target: 'parque-btv2-ramal1023',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-btv2-1023-line',
    source: 'parque-btv2-ramal1023',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-line-1023',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-line-1031',
    source: 'parque-btv2-line-1023',
    sourceHandle: 'out3',
    target: 'parque-btv2-ramal1031',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-line-1033',
    source: 'parque-btv2-line-1023',
    sourceHandle: 'out4',
    target: 'parque-btv2-ramal1033',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1033-1035',
    source: 'parque-btv2-ramal1033',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-servicio1035',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-line-1034',
    source: 'parque-btv2-line-1023',
    sourceHandle: 'out5',
    target: 'parque-btv2-ramal1034',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1034-1036',
    source: 'parque-btv2-ramal1034',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-servicio1036',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1031-1024',
    source: 'parque-btv2-ramal1031',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-valvula1024',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1024-line',
    source: 'parque-btv2-valvula1024',
    sourceHandle: 'out-main',
    target: 'parque-btv2-line-1024',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-line-1025',
    source: 'parque-btv2-line-1024',
    sourceHandle: 'out1',
    target: 'parque-btv2-ramal1025',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1025-1028',
    source: 'parque-btv2-ramal1025',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-servicio1028',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-line-1026',
    source: 'parque-btv2-line-1024',
    sourceHandle: 'out3',
    target: 'parque-btv2-ramal1026',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1026-1029',
    source: 'parque-btv2-ramal1026',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-servicio1029',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-line-1027',
    source: 'parque-btv2-line-1024',
    sourceHandle: 'out5',
    target: 'parque-btv2-ramal1027',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-btv2-1027-1030',
    source: 'parque-btv2-ramal1027',
    sourceHandle: 'out-bottom',
    target: 'parque-btv2-servicio1030',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueJfv3NodesInitial: Node[] = [
  {
    id: 'parque-jfv3-valvula',
    type: 'valveRed',
    position: { x: 360, y: 80 },
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-1038' }
  },
  {
    id: 'parque-jfv3-ramal1039',
    type: 'pipeSegment',
    position: { x: 360, y: 210 },
    draggable: false,
    data: { issueKey: 'CH-1039' }
  },
  {
    id: 'parque-jfv3-line-1039',
    type: 'pipe',
    position: { x: 180, y: 290 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 360 }
  },
  {
    id: 'parque-jfv3-ramal1040',
    type: 'pipeSegment',
    position: { x: 240, y: 440 },
    draggable: false,
    data: { issueKey: 'CH-1040' }
  },
  {
    id: 'parque-jfv3-servicio1043',
    type: 'service',
    position: { x: 200, y: 530 },
    draggable: false,
    data: { label: 'Fito', issueKey: 'CH-1043' }
  },
  {
    id: 'parque-jfv3-ramal1041',
    type: 'pipeSegment',
    position: { x: 360, y: 440 },
    draggable: false,
    data: { issueKey: 'CH-1041' }
  },
  {
    id: 'parque-jfv3-servicio1044',
    type: 'service',
    position: { x: 320, y: 530 },
    draggable: false,
    data: { label: 'Ingreso\nVilches\n(2)', issueKey: 'CH-1044', statusBottom: -6 }
  },
  {
    id: 'parque-jfv3-ramal1042',
    type: 'pipeSegment',
    position: { x: 480, y: 440 },
    draggable: false,
    data: { issueKey: 'CH-1042' }
  },
  {
    id: 'parque-jfv3-servicio1045',
    type: 'service',
    position: { x: 440, y: 530 },
    draggable: false,
    data: { label: 'Ingreso\nVidrio\njacuzzi (2)', issueKey: 'CH-1045', statusBottom: -6 }
  }
]

const parqueJfv3EdgesInitial: Edge[] = [
  {
    id: 'parque-jfv3-1038-1039',
    source: 'parque-jfv3-valvula',
    sourceHandle: 'out-main',
    target: 'parque-jfv3-ramal1039',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-jfv3-1039-line',
    source: 'parque-jfv3-ramal1039',
    sourceHandle: 'out-bottom',
    target: 'parque-jfv3-line-1039',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-jfv3-1039-1040',
    source: 'parque-jfv3-line-1039',
    sourceHandle: 'out1',
    target: 'parque-jfv3-ramal1040',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-jfv3-1040-1043',
    source: 'parque-jfv3-ramal1040',
    sourceHandle: 'out-bottom',
    target: 'parque-jfv3-servicio1043',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-jfv3-1039-1041',
    source: 'parque-jfv3-line-1039',
    sourceHandle: 'out3',
    target: 'parque-jfv3-ramal1041',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-jfv3-1041-1044',
    source: 'parque-jfv3-ramal1041',
    sourceHandle: 'out-bottom',
    target: 'parque-jfv3-servicio1044',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-jfv3-1039-1042',
    source: 'parque-jfv3-line-1039',
    sourceHandle: 'out5',
    target: 'parque-jfv3-ramal1042',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-jfv3-1042-1045',
    source: 'parque-jfv3-ramal1042',
    sourceHandle: 'out-bottom',
    target: 'parque-jfv3-servicio1045',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueDuchas4NodesInitial: Node[] = [
  {
    id: 'parque-duchas4-valvula',
    type: 'valveRed',
    position: { x: 360, y: 80 },
    draggable: false,
    data: { label: 'Llave', issueKey: 'CH-1062' }
  },
  {
    id: 'parque-duchas4-ramal1063',
    type: 'pipeSegment',
    position: { x: 360, y: 210 },
    draggable: false,
    data: { issueKey: 'CH-1063' }
  },
  {
    id: 'parque-duchas4-line-1063',
    type: 'pipe',
    position: { x: 180, y: 290 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 360 }
  },
  {
    id: 'parque-duchas4-ramal1064',
    type: 'pipeSegment',
    position: { x: 240, y: 410 },
    draggable: false,
    data: { issueKey: 'CH-1064' }
  },
  {
    id: 'parque-duchas4-servicio1066',
    type: 'service',
    position: { x: 200, y: 500 },
    draggable: false,
    data: { label: 'Duchas\nbaños\narriba', issueKey: 'CH-1066' }
  },
  {
    id: 'parque-duchas4-ramal1065',
    type: 'pipeSegment',
    position: { x: 480, y: 410 },
    draggable: false,
    data: { issueKey: 'CH-1065' }
  },
  {
    id: 'parque-duchas4-servicio1067',
    type: 'service',
    position: { x: 440, y: 500 },
    draggable: false,
    data: { label: 'Ingreso\n3 chorritos\n(2)', issueKey: 'CH-1067' }
  }
]

const parqueDuchas4EdgesInitial: Edge[] = [
  {
    id: 'parque-duchas4-1062-1063',
    source: 'parque-duchas4-valvula',
    sourceHandle: 'out-main',
    target: 'parque-duchas4-ramal1063',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-duchas4-1063-line',
    source: 'parque-duchas4-ramal1063',
    sourceHandle: 'out-bottom',
    target: 'parque-duchas4-line-1063',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-duchas4-1063-1064',
    source: 'parque-duchas4-line-1063',
    sourceHandle: 'out1',
    target: 'parque-duchas4-ramal1064',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-duchas4-1064-1066',
    source: 'parque-duchas4-ramal1064',
    sourceHandle: 'out-bottom',
    target: 'parque-duchas4-servicio1066',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-duchas4-1063-1065',
    source: 'parque-duchas4-line-1063',
    sourceHandle: 'out5',
    target: 'parque-duchas4-ramal1065',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-duchas4-1065-1067',
    source: 'parque-duchas4-ramal1065',
    sourceHandle: 'out-bottom',
    target: 'parque-duchas4-servicio1067',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueAguaTibiaNodesInitial: Node[] = [
  {
    id: 'parque-aguatibia-succion',
    type: 'suction',
    position: { x: 320, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-1047' }
  },
  {
    id: 'parque-aguatibia-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1049' }
  },
  {
    id: 'parque-aguatibia-bomba',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-1050' }
  },
  {
    id: 'parque-aguatibia-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1048' }
  },
  {
    id: 'parque-aguatibia-ramal1051',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1051' }
  },
  {
    id: 'parque-aguatibia-line-1051',
    type: 'pipe',
    position: { x: 160, y: 400 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 288 }
  },
  {
    id: 'parque-aguatibia-ramal1052',
    type: 'pipeSegment',
    position: { x: 224, y: 480 },
    draggable: false,
    data: { issueKey: 'CH-1052' }
  },
  {
    id: 'parque-aguatibia-servicio1053',
    type: 'service',
    position: { x: 184, y: 570 },
    draggable: false,
    data: { label: 'Ingreso\nTobogán\narriba (2)', issueKey: 'CH-1053' }
  },
  {
    id: 'parque-aguatibia-ramal1054',
    type: 'pipeSegment',
    position: { x: 456, y: 480 },
    draggable: false,
    data: { issueKey: 'CH-1054' }
  },
  {
    id: 'parque-aguatibia-line-1054',
    type: 'pipe',
    position: { x: 296, y: 520 },
    draggable: false,
    data: { label: '', lineStart: 72, lineEnd: 360 }
  },
  {
    id: 'parque-aguatibia-ramal1055',
    type: 'pipeSegment',
    position: { x: 344, y: 600 },
    draggable: false,
    data: { issueKey: 'CH-1055' }
  },
  {
    id: 'parque-aguatibia-servicio1058',
    type: 'service',
    position: { x: 304, y: 690 },
    draggable: false,
    data: { label: 'Cisterna\nbaños\narriba', issueKey: 'CH-1058' }
  },
  {
    id: 'parque-aguatibia-ramal1056',
    type: 'pipeSegment',
    position: { x: 456, y: 600 },
    draggable: false,
    data: { issueKey: 'CH-1056' }
  },
  {
    id: 'parque-aguatibia-servicio1059',
    type: 'service',
    position: { x: 416, y: 690 },
    draggable: false,
    data: { label: 'Interactivo', issueKey: 'CH-1059' }
  },
  {
    id: 'parque-aguatibia-ramal1057',
    type: 'pipeSegment',
    position: { x: 568, y: 600 },
    draggable: false,
    data: { issueKey: 'CH-1057' }
  },
  {
    id: 'parque-aguatibia-servicio1060',
    type: 'service',
    position: { x: 528, y: 690 },
    draggable: false,
    data: { label: 'Cascada\nescalera\nde subida', issueKey: 'CH-1060' }
  }
]

const parqueAguaTibiaEdgesInitial: Edge[] = [
  {
    id: 'parque-aguatibia-succion-puesto',
    source: 'parque-aguatibia-succion',
    target: 'parque-aguatibia-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-aguatibia-electrico-puesto',
    source: 'parque-aguatibia-electrico',
    target: 'parque-aguatibia-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-aguatibia-bomba-puesto',
    source: 'parque-aguatibia-bomba',
    sourceHandle: 'out-diag',
    target: 'parque-aguatibia-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-aguatibia-puesto-1051',
    source: 'parque-aguatibia-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-ramal1051',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-aguatibia-1051-line',
    source: 'parque-aguatibia-ramal1051',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-line-1051',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1051-1052',
    source: 'parque-aguatibia-line-1051',
    sourceHandle: 'out1',
    target: 'parque-aguatibia-ramal1052',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1052-1053',
    source: 'parque-aguatibia-ramal1052',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-servicio1053',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1051-1054',
    source: 'parque-aguatibia-line-1051',
    sourceHandle: 'out4',
    target: 'parque-aguatibia-ramal1054',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1054-line',
    source: 'parque-aguatibia-ramal1054',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-line-1054',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1054-1055',
    source: 'parque-aguatibia-line-1054',
    sourceHandle: 'out1',
    target: 'parque-aguatibia-ramal1055',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1055-1058',
    source: 'parque-aguatibia-ramal1055',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-servicio1058',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1054-1056',
    source: 'parque-aguatibia-line-1054',
    sourceHandle: 'out3',
    target: 'parque-aguatibia-ramal1056',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1056-1059',
    source: 'parque-aguatibia-ramal1056',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-servicio1059',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1054-1057',
    source: 'parque-aguatibia-line-1054',
    sourceHandle: 'out5',
    target: 'parque-aguatibia-ramal1057',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  },
  {
    id: 'parque-aguatibia-1057-1060',
    source: 'parque-aguatibia-ramal1057',
    sourceHandle: 'out-bottom',
    target: 'parque-aguatibia-servicio1060',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueInteractivoNodesInitial: Node[] = [
  {
    id: 'parque-interactivo-succion',
    type: 'suction',
    position: { x: 320, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-1079' }
  },
  {
    id: 'parque-interactivo-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1080' }
  },
  {
    id: 'parque-interactivo-bomba',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-1081' }
  },
  {
    id: 'parque-interactivo-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1082' }
  },
  {
    id: 'parque-interactivo-ramal1083',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1083' }
  },
  {
    id: 'parque-interactivo-servicio1084',
    type: 'service',
    position: { x: 295, y: 460 },
    draggable: false,
    data: { label: 'Cactus\ninteractivo', issueKey: 'CH-1084' }
  }
]

const parqueInteractivoEdgesInitial: Edge[] = [
  {
    id: 'parque-interactivo-succion-puesto',
    source: 'parque-interactivo-succion',
    target: 'parque-interactivo-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-interactivo-electrico-puesto',
    source: 'parque-interactivo-electrico',
    target: 'parque-interactivo-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-interactivo-bomba-puesto',
    source: 'parque-interactivo-bomba',
    sourceHandle: 'out-diag',
    target: 'parque-interactivo-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-interactivo-puesto-1083',
    source: 'parque-interactivo-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-interactivo-ramal1083',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-interactivo-1083-1084',
    source: 'parque-interactivo-ramal1083',
    sourceHandle: 'out-bottom',
    target: 'parque-interactivo-servicio1084',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueBurbujaNodesInitial: Node[] = [
  {
    id: 'parque-burbuja-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1086' }
  },
  {
    id: 'parque-burbuja-soplador',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Soplador', issueKey: 'CH-1087' }
  },
  {
    id: 'parque-burbuja-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1088' }
  },
  {
    id: 'parque-burbuja-ramal1089',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1089' }
  },
  {
    id: 'parque-burbuja-servicio1090',
    type: 'cloudService',
    position: { x: 295, y: 450 },
    draggable: false,
    data: { label: 'Burbuja\nprincipal', issueKey: 'CH-1090', statusBottom: -14 }
  }
]

const parqueBurbujaEdgesInitial: Edge[] = [
  {
    id: 'parque-burbuja-electrico-puesto',
    source: 'parque-burbuja-electrico',
    target: 'parque-burbuja-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-burbuja-soplador-puesto',
    source: 'parque-burbuja-soplador',
    sourceHandle: 'out-diag',
    target: 'parque-burbuja-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-burbuja-puesto-1089',
    source: 'parque-burbuja-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-burbuja-ramal1089',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-burbuja-1089-1090',
    source: 'parque-burbuja-ramal1089',
    sourceHandle: 'out-bottom',
    target: 'parque-burbuja-servicio1090',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueBurbujaBanosNodesInitial: Node[] = [
  {
    id: 'parque-burbujabanos-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1092' }
  },
  {
    id: 'parque-burbujabanos-soplador',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Soplador', issueKey: 'CH-1093' }
  },
  {
    id: 'parque-burbujabanos-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1094' }
  },
  {
    id: 'parque-burbujabanos-ramal1095',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1095' }
  },
  {
    id: 'parque-burbujabanos-servicio1096',
    type: 'cloudService',
    position: { x: 295, y: 450 },
    draggable: false,
    data: { label: 'Burbuja\nbaños', issueKey: 'CH-1096', statusBottom: -14 }
  }
]

const parqueBurbujaBanosEdgesInitial: Edge[] = [
  {
    id: 'parque-burbujabanos-electrico-puesto',
    source: 'parque-burbujabanos-electrico',
    target: 'parque-burbujabanos-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-burbujabanos-soplador-puesto',
    source: 'parque-burbujabanos-soplador',
    sourceHandle: 'out-diag',
    target: 'parque-burbujabanos-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-burbujabanos-puesto-1095',
    source: 'parque-burbujabanos-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-burbujabanos-ramal1095',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-burbujabanos-1095-1096',
    source: 'parque-burbujabanos-ramal1095',
    sourceHandle: 'out-bottom',
    target: 'parque-burbujabanos-servicio1096',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueBurbujaExtNodesInitial: Node[] = [
  {
    id: 'parque-burbujaext-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1098' }
  },
  {
    id: 'parque-burbujaext-soplador',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Soplador', issueKey: 'CH-1099' }
  },
  {
    id: 'parque-burbujaext-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1100' }
  },
  {
    id: 'parque-burbujaext-ramal1101',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1101' }
  },
  {
    id: 'parque-burbujaext-servicio1102',
    type: 'cloudService',
    position: { x: 295, y: 450 },
    draggable: false,
    data: { label: 'Burbuja\nexterna', issueKey: 'CH-1102', statusBottom: -14 }
  }
]

const parqueBurbujaExtEdgesInitial: Edge[] = [
  {
    id: 'parque-burbujaext-electrico-puesto',
    source: 'parque-burbujaext-electrico',
    target: 'parque-burbujaext-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-burbujaext-soplador-puesto',
    source: 'parque-burbujaext-soplador',
    sourceHandle: 'out-diag',
    target: 'parque-burbujaext-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-burbujaext-puesto-1101',
    source: 'parque-burbujaext-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-burbujaext-ramal1101',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-burbujaext-1101-1102',
    source: 'parque-burbujaext-ramal1101',
    sourceHandle: 'out-bottom',
    target: 'parque-burbujaext-servicio1102',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueMedialunaExtNodesInitial: Node[] = [
  {
    id: 'parque-medialunaext-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1104' }
  },
  {
    id: 'parque-medialunaext-soplador',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Soplador', issueKey: 'CH-1105' }
  },
  {
    id: 'parque-medialunaext-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1106' }
  },
  {
    id: 'parque-medialunaext-ramal1107',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1107' }
  },
  {
    id: 'parque-medialunaext-servicio1108',
    type: 'cloudService',
    position: { x: 295, y: 450 },
    draggable: false,
    data: { label: 'Medialuna\nexterna', issueKey: 'CH-1108', statusBottom: -14 }
  }
]

const parqueMedialunaExtEdgesInitial: Edge[] = [
  {
    id: 'parque-medialunaext-electrico-puesto',
    source: 'parque-medialunaext-electrico',
    target: 'parque-medialunaext-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-medialunaext-soplador-puesto',
    source: 'parque-medialunaext-soplador',
    sourceHandle: 'out-diag',
    target: 'parque-medialunaext-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-medialunaext-puesto-1107',
    source: 'parque-medialunaext-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-medialunaext-ramal1107',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-medialunaext-1107-1108',
    source: 'parque-medialunaext-ramal1107',
    sourceHandle: 'out-bottom',
    target: 'parque-medialunaext-servicio1108',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueCascadaNodesInitial: Node[] = [
  {
    id: 'parque-cascada-succion',
    type: 'suction',
    position: { x: 320, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-1110' }
  },
  {
    id: 'parque-cascada-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1111' }
  },
  {
    id: 'parque-cascada-bomba',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-1112' }
  },
  {
    id: 'parque-cascada-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1113' }
  },
  {
    id: 'parque-cascada-ramal1115',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1115' }
  },
  {
    id: 'parque-cascada-servicio1116',
    type: 'service',
    position: { x: 295, y: 450 },
    draggable: false,
    data: { label: 'Cascada\nSala 5', issueKey: 'CH-1116' }
  }
]

const parqueCascadaEdgesInitial: Edge[] = [
  {
    id: 'parque-cascada-succion-puesto',
    source: 'parque-cascada-succion',
    target: 'parque-cascada-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-cascada-electrico-puesto',
    source: 'parque-cascada-electrico',
    target: 'parque-cascada-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-cascada-bomba-puesto',
    source: 'parque-cascada-bomba',
    sourceHandle: 'out-diag',
    target: 'parque-cascada-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-cascada-puesto-1115',
    source: 'parque-cascada-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-cascada-ramal1115',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-cascada-1115-1116',
    source: 'parque-cascada-ramal1115',
    sourceHandle: 'out-bottom',
    target: 'parque-cascada-servicio1116',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueSala1NodesInitial: Node[] = [
  {
    id: 'parque-sala1-succion',
    type: 'suction',
    position: { x: 320, y: 80 },
    draggable: false,
    data: { label: 'Cañería Succión', issueKey: 'CH-1118' }
  },
  {
    id: 'parque-sala1-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1119' }
  },
  {
    id: 'parque-sala1-bomba',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Bomba', issueKey: 'CH-1120' }
  },
  {
    id: 'parque-sala1-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1121' }
  },
  {
    id: 'parque-sala1-ramal1122',
    type: 'pipeSegment',
    position: { x: 320, y: 360 },
    draggable: false,
    data: { issueKey: 'CH-1122' }
  },
  {
    id: 'parque-sala1-servicio1123',
    type: 'service',
    position: { x: 295, y: 450 },
    draggable: false,
    data: { label: 'Servicio', issueKey: 'CH-1123' }
  }
]

const parqueSala1EdgesInitial: Edge[] = [
  {
    id: 'parque-sala1-succion-puesto',
    source: 'parque-sala1-succion',
    target: 'parque-sala1-puesto',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-sala1-electrico-puesto',
    source: 'parque-sala1-electrico',
    target: 'parque-sala1-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-sala1-bomba-puesto',
    source: 'parque-sala1-bomba',
    sourceHandle: 'out-diag',
    target: 'parque-sala1-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-sala1-puesto-1122',
    source: 'parque-sala1-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-sala1-ramal1122',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-sala1-1122-1123',
    source: 'parque-sala1-ramal1122',
    sourceHandle: 'out-bottom',
    target: 'parque-sala1-servicio1123',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueSala2NodesInitial: Node[] = [
  {
    id: 'parque-sala2-filtro',
    type: 'filter',
    position: { x: 58, y: 61 },
    draggable: false,
    data: { label: 'Filtro', issueKey: 'CH-1125' }
  },
  {
    id: 'parque-sala2-lanchon',
    type: 'pump',
    position: { x: 140, y: 90 },
    draggable: false,
    data: { label: 'Lanchón', issueKey: 'CH-1126' }
  },
  {
    id: 'parque-sala2-electrico',
    type: 'electric',
    position: { x: 120, y: 220 },
    draggable: false,
    data: { label: 'Comp. Eléctrico', issueKey: 'CH-1130' }
  },
  {
    id: 'parque-sala2-puesto',
    type: 'station',
    position: { x: 320, y: 220 },
    draggable: false,
    data: { label: 'Puesto', issueKey: 'CH-1127' }
  },
  {
    id: 'parque-sala2-circulacion',
    type: 'waveService',
    position: { x: 310, y: 355 },
    draggable: false,
    data: { label: 'Circulación', issueKey: 'CH-1128', statusBottom: -14, size: 'large' }
  }
]

const parqueSala2EdgesInitial: Edge[] = [
  {
    id: 'parque-sala2-lanchon-filtro',
    source: 'parque-sala2-lanchon',
    sourceHandle: 'out-left',
    target: 'parque-sala2-filtro',
    targetHandle: 'in-right',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8 }
  },
  {
    id: 'parque-sala2-lanchon-puesto',
    source: 'parque-sala2-lanchon',
    sourceHandle: 'out-diag',
    target: 'parque-sala2-puesto',
    targetHandle: 'in-diag',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 10 }
  },
  {
    id: 'parque-sala2-electrico-puesto',
    source: 'parque-sala2-electrico',
    target: 'parque-sala2-puesto',
    targetHandle: 'in-left',
    type: 'straight',
    style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' }
  },
  {
    id: 'parque-sala2-puesto-circulacion',
    source: 'parque-sala2-puesto',
    sourceHandle: 'out-bottom',
    target: 'parque-sala2-circulacion',
    targetHandle: 'in-top',
    type: 'straight',
    style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' }
  }
]

const parqueSala3NodesInitial: Node[] = [
  { id: 'parque-sala3-filtro', type: 'filter', position: { x: 58, y: 61 }, draggable: false, data: { label: 'Filtro', issueKey: 'CH-1131' } },
  { id: 'parque-sala3-lanchon', type: 'pump', position: { x: 140, y: 90 }, draggable: false, data: { label: 'Lanchón', issueKey: 'CH-1132' } },
  { id: 'parque-sala3-electrico', type: 'electric', position: { x: 120, y: 220 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-1133' } },
  { id: 'parque-sala3-puesto', type: 'station', position: { x: 320, y: 220 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-1134' } },
  { id: 'parque-sala3-circulacion', type: 'waveService', position: { x: 310, y: 355 }, draggable: false, data: { label: 'Circulación', issueKey: 'CH-1135', statusBottom: -14, size: 'large' } }
]
const parqueSala3EdgesInitial: Edge[] = [
  { id: 'parque-sala3-lanchon-filtro', source: 'parque-sala3-lanchon', sourceHandle: 'out-left', target: 'parque-sala3-filtro', targetHandle: 'in-right', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8 } },
  { id: 'parque-sala3-lanchon-puesto', source: 'parque-sala3-lanchon', sourceHandle: 'out-diag', target: 'parque-sala3-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-sala3-electrico-puesto', source: 'parque-sala3-electrico', target: 'parque-sala3-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'parque-sala3-puesto-circulacion', source: 'parque-sala3-puesto', sourceHandle: 'out-bottom', target: 'parque-sala3-circulacion', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } }
]

const parqueSala4NodesInitial: Node[] = [
  { id: 'parque-sala4-filtro', type: 'filter', position: { x: 58, y: 61 }, draggable: false, data: { label: 'Filtro', issueKey: 'CH-1137' } },
  { id: 'parque-sala4-lanchon', type: 'pump', position: { x: 140, y: 90 }, draggable: false, data: { label: 'Lanchón', issueKey: 'CH-1138' } },
  { id: 'parque-sala4-electrico', type: 'electric', position: { x: 120, y: 220 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-1139' } },
  { id: 'parque-sala4-puesto', type: 'station', position: { x: 320, y: 220 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-1140' } },
  { id: 'parque-sala4-circulacion', type: 'waveService', position: { x: 310, y: 355 }, draggable: false, data: { label: 'Circulación', issueKey: 'CH-1141', statusBottom: -14, size: 'large' } }
]
const parqueSala4EdgesInitial: Edge[] = [
  { id: 'parque-sala4-lanchon-filtro', source: 'parque-sala4-lanchon', sourceHandle: 'out-left', target: 'parque-sala4-filtro', targetHandle: 'in-right', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8 } },
  { id: 'parque-sala4-lanchon-puesto', source: 'parque-sala4-lanchon', sourceHandle: 'out-diag', target: 'parque-sala4-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-sala4-electrico-puesto', source: 'parque-sala4-electrico', target: 'parque-sala4-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'parque-sala4-puesto-circulacion', source: 'parque-sala4-puesto', sourceHandle: 'out-bottom', target: 'parque-sala4-circulacion', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } }
]

const parqueTobogan3NodesInitial: Node[] = [
  { id: 'parque-tobogan3-succion', type: 'suction', position: { x: 320, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-1143' } },
  { id: 'parque-tobogan3-electrico', type: 'electric', position: { x: 120, y: 220 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-1144' } },
  { id: 'parque-tobogan3-bomba', type: 'pump', position: { x: 140, y: 90 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-1145' } },
  { id: 'parque-tobogan3-puesto', type: 'station', position: { x: 320, y: 220 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-1146' } },
  { id: 'parque-tobogan3-teebar', type: 'teeBar', position: { x: 220, y: 348 }, draggable: false, data: {} },
  { id: 'parque-tobogan3-ramal1147', type: 'pipeSegment', position: { x: 260, y: 413 }, draggable: false, data: { issueKey: 'CH-1147' } },
  { id: 'parque-tobogan3-ramal1171', type: 'pipeSegment', position: { x: 380, y: 413 }, draggable: false, data: { issueKey: 'CH-1171' } },
  { id: 'parque-tobogan3-servicio1148', type: 'service', position: { x: 255, y: 513 }, draggable: false, data: { label: 'Servicio', issueKey: 'CH-1148' } },
  { id: 'parque-tobogan3-servicio1172', type: 'service', position: { x: 375, y: 513 }, draggable: false, data: { label: 'Servicio', issueKey: 'CH-1172' } }
]
const parqueTobogan3EdgesInitial: Edge[] = [
  { id: 'parque-tobogan3-succion-puesto', source: 'parque-tobogan3-succion', target: 'parque-tobogan3-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-tobogan3-electrico-puesto', source: 'parque-tobogan3-electrico', target: 'parque-tobogan3-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'parque-tobogan3-bomba-puesto', source: 'parque-tobogan3-bomba', sourceHandle: 'out-diag', target: 'parque-tobogan3-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-tobogan3-puesto-teebar', source: 'parque-tobogan3-puesto', sourceHandle: 'out-bottom', target: 'parque-tobogan3-teebar', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-tobogan3-teebar-1147', source: 'parque-tobogan3-teebar', sourceHandle: 'out-bottom-left', target: 'parque-tobogan3-ramal1147', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-tobogan3-teebar-1171', source: 'parque-tobogan3-teebar', sourceHandle: 'out-bottom-right', target: 'parque-tobogan3-ramal1171', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-tobogan3-1147-1148', source: 'parque-tobogan3-ramal1147', sourceHandle: 'out-bottom', target: 'parque-tobogan3-servicio1148', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-tobogan3-1171-1172', source: 'parque-tobogan3-ramal1171', sourceHandle: 'out-bottom', target: 'parque-tobogan3-servicio1172', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } }
]

const parqueCascadaOlasNodesInitial: Node[] = [
  { id: 'parque-cascadaolas-succion', type: 'suction', position: { x: 320, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-1150' } },
  { id: 'parque-cascadaolas-electrico', type: 'electric', position: { x: 120, y: 220 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-1151' } },
  { id: 'parque-cascadaolas-bomba', type: 'pump', position: { x: 140, y: 90 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-1152' } },
  { id: 'parque-cascadaolas-puesto', type: 'station', position: { x: 320, y: 220 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-1153' } },
  { id: 'parque-cascadaolas-ramal1154', type: 'pipeSegment', position: { x: 320, y: 360 }, draggable: false, data: { issueKey: 'CH-1154' } },
  { id: 'parque-cascadaolas-servicio1155', type: 'service', position: { x: 295, y: 460 }, draggable: false, data: { label: 'Servicio', issueKey: 'CH-1155' } }
]
const parqueCascadaOlasEdgesInitial: Edge[] = [
  { id: 'parque-cascadaolas-succion-puesto', source: 'parque-cascadaolas-succion', target: 'parque-cascadaolas-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-cascadaolas-electrico-puesto', source: 'parque-cascadaolas-electrico', target: 'parque-cascadaolas-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'parque-cascadaolas-bomba-puesto', source: 'parque-cascadaolas-bomba', sourceHandle: 'out-diag', target: 'parque-cascadaolas-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-cascadaolas-puesto-1154', source: 'parque-cascadaolas-puesto', sourceHandle: 'out-bottom', target: 'parque-cascadaolas-ramal1154', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-cascadaolas-1154-1155', source: 'parque-cascadaolas-ramal1154', sourceHandle: 'out-bottom', target: 'parque-cascadaolas-servicio1155', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } }
]

const parqueChorrosOlasNodesInitial: Node[] = [
  { id: 'parque-chorrosolas-succion', type: 'suction', position: { x: 320, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-1157' } },
  { id: 'parque-chorrosolas-electrico', type: 'electric', position: { x: 120, y: 220 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-1158' } },
  { id: 'parque-chorrosolas-bomba', type: 'pump', position: { x: 140, y: 90 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-1159' } },
  { id: 'parque-chorrosolas-puesto', type: 'station', position: { x: 320, y: 220 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-1160' } },
  { id: 'parque-chorrosolas-ramal1161', type: 'pipeSegment', position: { x: 320, y: 360 }, draggable: false, data: { issueKey: 'CH-1161' } },
  { id: 'parque-chorrosolas-servicio1162', type: 'service', position: { x: 295, y: 460 }, draggable: false, data: { label: 'Servicio', issueKey: 'CH-1162' } }
]
const parqueChorrosOlasEdgesInitial: Edge[] = [
  { id: 'parque-chorrosolas-succion-puesto', source: 'parque-chorrosolas-succion', target: 'parque-chorrosolas-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-chorrosolas-electrico-puesto', source: 'parque-chorrosolas-electrico', target: 'parque-chorrosolas-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'parque-chorrosolas-bomba-puesto', source: 'parque-chorrosolas-bomba', sourceHandle: 'out-diag', target: 'parque-chorrosolas-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-chorrosolas-puesto-1161', source: 'parque-chorrosolas-puesto', sourceHandle: 'out-bottom', target: 'parque-chorrosolas-ramal1161', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-chorrosolas-1161-1162', source: 'parque-chorrosolas-ramal1161', sourceHandle: 'out-bottom', target: 'parque-chorrosolas-servicio1162', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } }
]

const parqueAguaFriaParqueNodesInitial: Node[] = [
  { id: 'parque-agua-fria-parque-succion', type: 'suction', position: { x: 320, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-1069' } },
  { id: 'parque-agua-fria-parque-electrico', type: 'electric', position: { x: 120, y: 220 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-1070' } },
  { id: 'parque-agua-fria-parque-bomba', type: 'pump', position: { x: 140, y: 90 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-1071' } },
  { id: 'parque-agua-fria-parque-puesto', type: 'station', position: { x: 320, y: 220 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-1072' } },
  { id: 'parque-agua-fria-parque-teebar', type: 'teeBar', position: { x: 220, y: 320 }, draggable: false, data: {} },
  { id: 'parque-agua-fria-parque-ramal1073', type: 'pipeSegment', position: { x: 120, y: 450 }, draggable: false, data: { issueKey: 'CH-1073' } },
  { id: 'parque-agua-fria-parque-line1073', type: 'pipe', position: { x: 0, y: 505 }, draggable: false, data: { label: '', lineStart: 72, lineEnd: 288 } },
  { id: 'parque-agua-fria-parque-ramal1074', type: 'pipeSegment', position: { x: 72, y: 560 }, draggable: false, data: { issueKey: 'CH-1074' } },
  { id: 'parque-agua-fria-parque-ramal1075', type: 'pipeSegment', position: { x: 288, y: 560 }, draggable: false, data: { issueKey: 'CH-1075' } },
  { id: 'parque-agua-fria-parque-servicio1076', type: 'service', position: { x: 288, y: 650 }, draggable: false, data: { issueKey: 'CH-1076' } },
  { id: 'parque-agua-fria-parque-servicio1077', type: 'service', position: { x: 72, y: 650 }, draggable: false, data: { issueKey: 'CH-1077' } },
  { id: 'parque-agua-fria-parque-ramal1173', type: 'pipeSegment', position: { x: 440, y: 450 }, draggable: false, data: { issueKey: 'CH-1173' } },
  { id: 'parque-agua-fria-parque-line1173', type: 'pipe', position: { x: 460, y: 580 }, draggable: false, data: { label: '', lineStart: 0, lineEnd: 360 } },
  { id: 'parque-agua-fria-parque-ramal1174', type: 'pipeSegment', position: { x: 460, y: 635 }, draggable: false, data: { issueKey: 'CH-1174' } },
  { id: 'parque-agua-fria-parque-ramal1175', type: 'pipeSegment', position: { x: 532, y: 635 }, draggable: false, data: { issueKey: 'CH-1175' } },
  { id: 'parque-agua-fria-parque-ramal1176', type: 'pipeSegment', position: { x: 604, y: 635 }, draggable: false, data: { issueKey: 'CH-1176' } },
  { id: 'parque-agua-fria-parque-ramal1177', type: 'pipeSegment', position: { x: 676, y: 635 }, draggable: false, data: { issueKey: 'CH-1177' } },
  { id: 'parque-agua-fria-parque-ramal1178', type: 'pipeSegment', position: { x: 748, y: 635 }, draggable: false, data: { issueKey: 'CH-1178' } },
  { id: 'parque-agua-fria-parque-ramal1179', type: 'pipeSegment', position: { x: 820, y: 635 }, draggable: false, data: { issueKey: 'CH-1179' } },
  { id: 'parque-agua-fria-parque-servicio1180', type: 'service', position: { x: 460, y: 725 }, draggable: false, data: { issueKey: 'CH-1180' } },
  { id: 'parque-agua-fria-parque-servicio1181', type: 'service', position: { x: 532, y: 725 }, draggable: false, data: { issueKey: 'CH-1181' } },
  { id: 'parque-agua-fria-parque-servicio1182', type: 'service', position: { x: 604, y: 725 }, draggable: false, data: { issueKey: 'CH-1182' } },
  { id: 'parque-agua-fria-parque-servicio1183', type: 'service', position: { x: 676, y: 725 }, draggable: false, data: { issueKey: 'CH-1183' } },
  { id: 'parque-agua-fria-parque-servicio1184', type: 'service', position: { x: 748, y: 725 }, draggable: false, data: { issueKey: 'CH-1184' } },
  { id: 'parque-agua-fria-parque-servicio1185', type: 'service', position: { x: 820, y: 725 }, draggable: false, data: { issueKey: 'CH-1185' } }
]
const parqueAguaFriaParqueEdgesInitial: Edge[] = [
  { id: 'parque-agua-fria-parque-succion-puesto', source: 'parque-agua-fria-parque-succion', target: 'parque-agua-fria-parque-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-agua-fria-parque-electrico-puesto', source: 'parque-agua-fria-parque-electrico', target: 'parque-agua-fria-parque-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'parque-agua-fria-parque-bomba-puesto', source: 'parque-agua-fria-parque-bomba', sourceHandle: 'out-diag', target: 'parque-agua-fria-parque-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-agua-fria-parque-puesto-teebar', source: 'parque-agua-fria-parque-puesto', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-teebar', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-agua-fria-parque-teebar-1073', source: 'parque-agua-fria-parque-teebar', sourceHandle: 'out-bottom-left', target: 'parque-agua-fria-parque-ramal1073', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-agua-fria-parque-teebar-1173', source: 'parque-agua-fria-parque-teebar', sourceHandle: 'out-bottom-right', target: 'parque-agua-fria-parque-ramal1173', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'parque-agua-fria-parque-1073-line', source: 'parque-agua-fria-parque-ramal1073', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-line1073', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1074', source: 'parque-agua-fria-parque-line1073', sourceHandle: 'out1', target: 'parque-agua-fria-parque-ramal1074', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1075', source: 'parque-agua-fria-parque-line1073', sourceHandle: 'out4', target: 'parque-agua-fria-parque-ramal1075', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1074-1077', source: 'parque-agua-fria-parque-ramal1074', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1077', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1075-1076', source: 'parque-agua-fria-parque-ramal1075', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1076', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1173-line', source: 'parque-agua-fria-parque-ramal1173', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-line1173', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1174', source: 'parque-agua-fria-parque-line1173', sourceHandle: 'out0', target: 'parque-agua-fria-parque-ramal1174', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1175', source: 'parque-agua-fria-parque-line1173', sourceHandle: 'out1', target: 'parque-agua-fria-parque-ramal1175', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1176', source: 'parque-agua-fria-parque-line1173', sourceHandle: 'out2', target: 'parque-agua-fria-parque-ramal1176', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1177', source: 'parque-agua-fria-parque-line1173', sourceHandle: 'out3', target: 'parque-agua-fria-parque-ramal1177', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1178', source: 'parque-agua-fria-parque-line1173', sourceHandle: 'out4', target: 'parque-agua-fria-parque-ramal1178', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-line-1179', source: 'parque-agua-fria-parque-line1173', sourceHandle: 'out5', target: 'parque-agua-fria-parque-ramal1179', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1174-1180', source: 'parque-agua-fria-parque-ramal1174', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1180', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1175-1181', source: 'parque-agua-fria-parque-ramal1175', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1181', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1176-1182', source: 'parque-agua-fria-parque-ramal1176', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1182', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1177-1183', source: 'parque-agua-fria-parque-ramal1177', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1183', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1178-1184', source: 'parque-agua-fria-parque-ramal1178', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1184', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } },
  { id: 'parque-agua-fria-parque-1179-1185', source: 'parque-agua-fria-parque-ramal1179', sourceHandle: 'out-bottom', target: 'parque-agua-fria-parque-servicio1185', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 8, strokeLinecap: 'round' } }
]

const pozo19NodesInitial: Node[] = [
  { id: 'pozo19-succion', type: 'suction', position: { x: 340, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-979' } },
  { id: 'pozo19-electrico', type: 'electric', position: { x: 120, y: 260 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-982' } },
  { id: 'pozo19-bomba', type: 'pump', position: { x: 140, y: 120 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-983' } },
  { id: 'pozo19-puesto', type: 'station', position: { x: 340, y: 260 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-981' } },
  { id: 'pozo19-cañeria', type: 'pipeSegment', position: { x: 340, y: 480 }, draggable: false, data: { issueKey: 'CH-984' } }
]
const pozo19EdgesInitial: Edge[] = [
  { id: 'pozo19-succion-puesto', source: 'pozo19-succion', target: 'pozo19-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'pozo19-electrico-puesto', source: 'pozo19-electrico', target: 'pozo19-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'pozo19-bomba-puesto', source: 'pozo19-bomba', sourceHandle: 'out-diag', target: 'pozo19-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'pozo19-puesto-cañeria', source: 'pozo19-puesto', sourceHandle: 'out-bottom-center', target: 'pozo19-cañeria', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } }
]

const pozoLaloNodesInitial: Node[] = [
  { id: 'pozoLalo-succion', type: 'suction', position: { x: 340, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-985' } },
  { id: 'pozoLalo-electrico', type: 'electric', position: { x: 120, y: 260 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-988' } },
  { id: 'pozoLalo-bomba', type: 'pump', position: { x: 140, y: 120 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-989' } },
  { id: 'pozoLalo-puesto', type: 'station', position: { x: 340, y: 260 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-987' } },
  { id: 'pozoLalo-cañeria', type: 'pipeSegment', position: { x: 340, y: 480 }, draggable: false, data: { issueKey: 'CH-990' } }
]
const pozoLaloEdgesInitial: Edge[] = [
  { id: 'pozoLalo-succion-puesto', source: 'pozoLalo-succion', target: 'pozoLalo-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'pozoLalo-electrico-puesto', source: 'pozoLalo-electrico', target: 'pozoLalo-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'pozoLalo-bomba-puesto', source: 'pozoLalo-bomba', sourceHandle: 'out-diag', target: 'pozoLalo-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'pozoLalo-puesto-cañeria', source: 'pozoLalo-puesto', sourceHandle: 'out-bottom-center', target: 'pozoLalo-cañeria', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } }
]

const pozoLuisaNodesInitial: Node[] = [
  { id: 'pozoLuisa-succion', type: 'suction', position: { x: 340, y: 80 }, draggable: false, data: { label: 'Cañería Succión', issueKey: 'CH-991' } },
  { id: 'pozoLuisa-electrico', type: 'electric', position: { x: 120, y: 260 }, draggable: false, data: { label: 'Comp. Eléctrico', issueKey: 'CH-994' } },
  { id: 'pozoLuisa-bomba', type: 'pump', position: { x: 140, y: 120 }, draggable: false, data: { label: 'Bomba', issueKey: 'CH-995' } },
  { id: 'pozoLuisa-puesto', type: 'station', position: { x: 340, y: 260 }, draggable: false, data: { label: 'Puesto', issueKey: 'CH-993' } },
  { id: 'pozoLuisa-cañeria', type: 'pipeSegment', position: { x: 340, y: 480 }, draggable: false, data: { issueKey: 'CH-996' } }
]
const pozoLuisaEdgesInitial: Edge[] = [
  { id: 'pozoLuisa-succion-puesto', source: 'pozoLuisa-succion', target: 'pozoLuisa-puesto', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'pozoLuisa-electrico-puesto', source: 'pozoLuisa-electrico', target: 'pozoLuisa-puesto', targetHandle: 'in-left', type: 'straight', style: { stroke: '#F87171', strokeWidth: 5, strokeDasharray: '8 8' } },
  { id: 'pozoLuisa-bomba-puesto', source: 'pozoLuisa-bomba', sourceHandle: 'out-diag', target: 'pozoLuisa-puesto', targetHandle: 'in-diag', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } },
  { id: 'pozoLuisa-puesto-cañeria', source: 'pozoLuisa-puesto', sourceHandle: 'out-bottom-center', target: 'pozoLuisa-cañeria', targetHandle: 'in-top', type: 'straight', style: { stroke: '#4A90E2', strokeWidth: 10 } }
]


function App() {
  const toast = useToast()
  const [grutaNodes, setGrutaNodes, onGrutaNodesChange] = useNodesState(grutaNodesInitial)
  const [grutaEdges, , onGrutaEdgesChange] = useEdgesState(grutaEdgesInitial)
  const [hidroNodes, setHidroNodes, onHidroNodesChange] = useNodesState(hidroNodesInitial)
  const [hidroEdges, , onHidroEdgesChange] = useEdgesState(hidroEdgesInitial)
  const [gruta2Nodes, setGruta2Nodes, onGruta2NodesChange] = useNodesState(gruta2NodesInitial)
  const [gruta2Edges, , onGruta2EdgesChange] = useEdgesState(gruta2EdgesInitial)
  const [gruta3Nodes, setGruta3Nodes, onGruta3NodesChange] = useNodesState(gruta3NodesInitial)
  const [gruta3Edges, , onGruta3EdgesChange] = useEdgesState(gruta3EdgesInitial)
  const [gruta4Nodes, setGruta4Nodes, onGruta4NodesChange] = useNodesState(gruta4NodesInitial)
  const [gruta4Edges, , onGruta4EdgesChange] = useEdgesState(gruta4EdgesInitial)
  const [fangoEsteNodes, setFangoEsteNodes, onFangoEsteNodesChange] = useNodesState(fangoEsteNodesInitial)
  const [fangoEsteEdges, , onFangoEsteEdgesChange] = useEdgesState(fangoEsteEdgesInitial)
  const [fangoOesteNodes, setFangoOesteNodes, onFangoOesteNodesChange] = useNodesState(fangoOesteNodesInitial)
  const [fangoOesteEdges, , onFangoOesteEdgesChange] = useEdgesState(fangoOesteEdgesInitial)
  const [aljibeFangoNodes, setAljibeFangoNodes, onAljibeFangoNodesChange] = useNodesState(aljibeFangoNodesInitial)
  const [aljibeFangoEdges, , onAljibeFangoEdgesChange] = useEdgesState(aljibeFangoEdgesInitial)
  const [ascensorNodes, setAscensorNodes, onAscensorNodesChange] = useNodesState(ascensorNodesInitial)
  const [ascensorEdges, , onAscensorEdgesChange] = useEdgesState(ascensorEdgesInitial)
  const [cacheutinaNodes, setCacheutinaNodes, onCacheutinaNodesChange] = useNodesState(cacheutinaNodesInitial)
  const [cacheutinaEdges, , onCacheutinaEdgesChange] = useEdgesState(cacheutinaEdgesInitial)
  const [chorroCacheutinaNodes, setChorroCacheutinaNodes, onChorroCacheutinaNodesChange] = useNodesState(chorroCacheutinaNodesInitial)
  const [chorroCacheutinaEdges, , onChorroCacheutinaEdgesChange] = useEdgesState(chorroCacheutinaEdgesInitial)
  const [cascadaNodes, setCascadaNodes, onCascadaNodesChange] = useNodesState(cascadaNodesInitial)
  const [cascadaEdges, , onCascadaEdgesChange] = useEdgesState(cascadaEdgesInitial)
  const [aguaFriaNodes, setAguaFriaNodes, onAguaFriaNodesChange] = useNodesState(aguaFriaNodesInitial)
  const [aguaFriaEdges, , onAguaFriaEdgesChange] = useEdgesState(aguaFriaEdgesInitial)
  const [parqueArriba1Nodes, setParqueArriba1Nodes, onParqueArriba1NodesChange] = useNodesState(parqueArriba1NodesInitial)
  const [parqueArriba1Edges, , onParqueArriba1EdgesChange] = useEdgesState(parqueArriba1EdgesInitial)
  const [parqueBtv2Nodes, setParqueBtv2Nodes, onParqueBtv2NodesChange] = useNodesState(parqueBtv2NodesInitial)
  const [parqueBtv2Edges, , onParqueBtv2EdgesChange] = useEdgesState(parqueBtv2EdgesInitial)
  const [parqueJfv3Nodes, setParqueJfv3Nodes, onParqueJfv3NodesChange] = useNodesState(parqueJfv3NodesInitial)
  const [parqueJfv3Edges, , onParqueJfv3EdgesChange] = useEdgesState(parqueJfv3EdgesInitial)
  const [parqueDuchas4Nodes, setParqueDuchas4Nodes, onParqueDuchas4NodesChange] = useNodesState(parqueDuchas4NodesInitial)
  const [parqueDuchas4Edges, , onParqueDuchas4EdgesChange] = useEdgesState(parqueDuchas4EdgesInitial)
  const [parqueAguaTibiaNodes, setParqueAguaTibiaNodes, onParqueAguaTibiaNodesChange] = useNodesState(parqueAguaTibiaNodesInitial)
  const [parqueAguaTibiaEdges, , onParqueAguaTibiaEdgesChange] = useEdgesState(parqueAguaTibiaEdgesInitial)
  const [parqueInteractivoNodes, setParqueInteractivoNodes, onParqueInteractivoNodesChange] = useNodesState(parqueInteractivoNodesInitial)
  const [parqueInteractivoEdges, , onParqueInteractivoEdgesChange] = useEdgesState(parqueInteractivoEdgesInitial)
  const [parqueBurbujaNodes, setParqueBurbujaNodes, onParqueBurbujaNodesChange] = useNodesState(parqueBurbujaNodesInitial)
  const [parqueBurbujaEdges, , onParqueBurbujaEdgesChange] = useEdgesState(parqueBurbujaEdgesInitial)
  const [parqueBurbujaBanosNodes, setParqueBurbujaBanosNodes, onParqueBurbujaBanosNodesChange] = useNodesState(parqueBurbujaBanosNodesInitial)
  const [parqueBurbujaBanosEdges, , onParqueBurbujaBanosEdgesChange] = useEdgesState(parqueBurbujaBanosEdgesInitial)
  const [parqueBurbujaExtNodes, setParqueBurbujaExtNodes, onParqueBurbujaExtNodesChange] = useNodesState(parqueBurbujaExtNodesInitial)
  const [parqueBurbujaExtEdges, , onParqueBurbujaExtEdgesChange] = useEdgesState(parqueBurbujaExtEdgesInitial)
  const [parqueMedialunaExtNodes, setParqueMedialunaExtNodes, onParqueMedialunaExtNodesChange] = useNodesState(parqueMedialunaExtNodesInitial)
  const [parqueMedialunaExtEdges, , onParqueMedialunaExtEdgesChange] = useEdgesState(parqueMedialunaExtEdgesInitial)
  const [parqueCascadaNodes, setParqueCascadaNodes, onParqueCascadaNodesChange] = useNodesState(parqueCascadaNodesInitial)
  const [parqueCascadaEdges, , onParqueCascadaEdgesChange] = useEdgesState(parqueCascadaEdgesInitial)
  const [parqueSala1Nodes, setParqueSala1Nodes, onParqueSala1NodesChange] = useNodesState(parqueSala1NodesInitial)
  const [parqueSala1Edges, , onParqueSala1EdgesChange] = useEdgesState(parqueSala1EdgesInitial)
  const [parqueSala2Nodes, setParqueSala2Nodes, onParqueSala2NodesChange] = useNodesState(parqueSala2NodesInitial)
  const [parqueSala2Edges, , onParqueSala2EdgesChange] = useEdgesState(parqueSala2EdgesInitial)
  const [parqueSala3Nodes, setParqueSala3Nodes, onParqueSala3NodesChange] = useNodesState(parqueSala3NodesInitial)
  const [parqueSala3Edges, , onParqueSala3EdgesChange] = useEdgesState(parqueSala3EdgesInitial)
  const [parqueSala4Nodes, setParqueSala4Nodes, onParqueSala4NodesChange] = useNodesState(parqueSala4NodesInitial)
  const [parqueSala4Edges, , onParqueSala4EdgesChange] = useEdgesState(parqueSala4EdgesInitial)
  const [parqueTobogan3Nodes, setParqueTobogan3Nodes, onParqueTobogan3NodesChange] = useNodesState(parqueTobogan3NodesInitial)
  const [parqueTobogan3Edges, , onParqueTobogan3EdgesChange] = useEdgesState(parqueTobogan3EdgesInitial)
  const [parqueCascadaOlasNodes, setParqueCascadaOlasNodes, onParqueCascadaOlasNodesChange] = useNodesState(parqueCascadaOlasNodesInitial)
  const [parqueCascadaOlasEdges, , onParqueCascadaOlasEdgesChange] = useEdgesState(parqueCascadaOlasEdgesInitial)
  const [parqueChorrosOlasNodes, setParqueChorrosOlasNodes, onParqueChorrosOlasNodesChange] = useNodesState(parqueChorrosOlasNodesInitial)
  const [parqueChorrosOlasEdges, , onParqueChorrosOlasEdgesChange] = useEdgesState(parqueChorrosOlasEdgesInitial)
  const [parqueAguaFriaParqueNodes, setParqueAguaFriaParqueNodes, onParqueAguaFriaParqueNodesChange] = useNodesState(parqueAguaFriaParqueNodesInitial)
  const [parqueAguaFriaParqueEdges, , onParqueAguaFriaParqueEdgesChange] = useEdgesState(parqueAguaFriaParqueEdgesInitial)
  const [pozo19Nodes, setPozo19Nodes, onPozo19NodesChange] = useNodesState(pozo19NodesInitial)
  const [pozo19Edges, , onPozo19EdgesChange] = useEdgesState(pozo19EdgesInitial)
  const [pozoLaloNodes, setPozoLaloNodes, onPozoLaloNodesChange] = useNodesState(pozoLaloNodesInitial)
  const [pozoLaloEdges, , onPozoLaloEdgesChange] = useEdgesState(pozoLaloEdgesInitial)
  const [pozoLuisaNodes, setPozoLuisaNodes, onPozoLuisaNodesChange] = useNodesState(pozoLuisaNodesInitial)
  const [pozoLuisaEdges, , onPozoLuisaEdgesChange] = useEdgesState(pozoLuisaEdgesInitial)
  const isMobile = useBreakpointValue({ base: true, lg: false }) ?? false
  const [transitionNode, setTransitionNode] = useState<Node | null>(null)
  const [transitionOptions, setTransitionOptions] = useState<Array<{ id: string; name: string; toName?: string; requiresBreakdownComment?: boolean }>>([])
  const [transitionOpen, setTransitionOpen] = useState(false)
  const [transitionLoading, setTransitionLoading] = useState(false)
  const [waterFieldValue, setWaterFieldValue] = useState('')
  const [waterFieldValues, setWaterFieldValues] = useState<string[]>([])
  const [waterFieldOptions, setWaterFieldOptions] = useState<Array<{ id?: string; value: string }>>([])
  const [waterFieldLoading, setWaterFieldLoading] = useState(false)
  const [waterFieldSaving, setWaterFieldSaving] = useState(false)
  const [waterFieldIsMulti, setWaterFieldIsMulti] = useState(false)
  const [pumpOptions, setPumpOptions] = useState<
    Array<{ key: string; summary?: string; status?: string; issueType?: string; epicKey?: string; epicSummary?: string; inUseElsewhere?: boolean }>
  >([])
  const [pumpLoading, setPumpLoading] = useState(false)
  const [pumpSaving, setPumpSaving] = useState(false)
  const [pumpActiveKey, setPumpActiveKey] = useState('')
  const [pumpSelectedKey, setPumpSelectedKey] = useState('')
  const [puestoActivePumps, setPuestoActivePumps] = useState<Record<string, string | null>>({})
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentSystem, setCurrentSystem] = useState('gruta1')
  const [currentGroup, setCurrentGroup] = useState('gruta')
  const [menuLevel, setMenuLevel] = useState<'group' | 'system'>('group')
  const [controlIssues, setControlIssues] = useState<
    Array<{ key: string; summary?: string; status?: string; issueType?: string; epicKey?: string; epicSummary?: string; sector?: string }>
  >([])
  const [controlLoading, setControlLoading] = useState(false)
  const [controlEpicModalItem, setControlEpicModalItem] = useState<typeof controlIssues[0] | null>(null)
  const [controlEpicOptions, setControlEpicOptions] = useState<Array<{ key: string; summary: string }>>([])
  const [controlEpicLoading, setControlEpicLoading] = useState(false)
  const [controlEpicSaving, setControlEpicSaving] = useState(false)
  const [controlEpicValue, setControlEpicValue] = useState('')
  const [controlTransitionOptions, setControlTransitionOptions] = useState<Array<{ id: string; name: string; toName?: string }>>([])
  const [controlTransitionLoading, setControlTransitionLoading] = useState(false)
  const [controlTransitionSaving, setControlTransitionSaving] = useState(false)
  const [controlBreakdownModal, setControlBreakdownModal] = useState<{
    open: boolean
    transitionId: string
    transitionName: string
    issueKey: string | null
    source: 'control' | 'diagram'
  }>({ open: false, transitionId: '', transitionName: '', issueKey: null, source: 'control' })
  const [controlBreakdownExplanation, setControlBreakdownExplanation] = useState('')
  const diagramAreaRef = useRef<HTMLDivElement>(null)
  const [diagramAreaHeight, setDiagramAreaHeight] = useState<number | null>(null)

  console.log('nodeTypes:', nodeTypes) // Debug: verificar que los tipos se registren
  console.log('initialNodes:', grutaNodesInitial) // Debug: verificar que los nodos tengan type

  // Deshabilitar creación de nuevas conexiones - diagrama fijo
  const onConnect = (connection: Connection) => {
    // No permitir nuevas conexiones - diagrama fijo
    console.log('Conexión bloqueada:', connection)
  }

  const currentSystemLabel = SYSTEMS.find((sys) => sys.id === currentSystem)?.label ?? 'Sistema'
  const displayLabel = currentGroup === 'control' ? 'Control' : currentSystemLabel

  const controlListByType = useMemo(() => {
    const groups: Record<string, typeof controlIssues> = {}
    for (const issue of controlIssues) {
      const t = issue.issueType || 'Otro'
      if (!groups[t]) groups[t] = []
      groups[t].push(issue)
    }
    return groups
  }, [controlIssues])
  const currentGroupLabel = SYSTEM_GROUPS.find((group) => group.id === currentGroup)?.label ?? 'Grupo'
  const systemsForGroup = SYSTEMS.filter((sys) => sys.group === currentGroup)
  const sala4Systems =
    currentGroup === 'parque' ? systemsForGroup.filter((sys) => sys.subgroup === 'sala4') : []
  const sala5Systems =
    currentGroup === 'parque' ? systemsForGroup.filter((sys) => sys.subgroup === 'sala5') : []
  const regularSystems =
    currentGroup === 'parque' ? systemsForGroup.filter((sys) => !sys.subgroup) : systemsForGroup
  const activeNodes =
    currentSystem === 'gruta1'
      ? grutaNodes
      : currentSystem === 'hidro'
        ? hidroNodes
        : currentSystem === 'gruta2'
          ? gruta2Nodes
          : currentSystem === 'gruta3'
            ? gruta3Nodes
            : currentSystem === 'gruta4'
              ? gruta4Nodes
              : currentSystem === 'fangoEste'
                ? fangoEsteNodes
                : currentSystem === 'fangoOeste'
                  ? fangoOesteNodes
                  : currentSystem === 'aljibeFango'
                    ? aljibeFangoNodes
                    : currentSystem === 'ascensor'
                      ? ascensorNodes
                      : currentSystem === 'cacheutina'
                        ? cacheutinaNodes
                      : currentSystem === 'chorroCacheutina'
                        ? chorroCacheutinaNodes
                        : currentSystem === 'cascada'
                          ? cascadaNodes
                        : currentSystem === 'aguaFria'
                          ? aguaFriaNodes
                        : currentSystem === 'parqueArriba1'
                            ? parqueArriba1Nodes
                        : currentSystem === 'parqueBtv2'
                              ? parqueBtv2Nodes
                        : currentSystem === 'parqueJfv3'
                                ? parqueJfv3Nodes
                                : currentSystem === 'parqueDuchas4'
                                  ? parqueDuchas4Nodes
                                  : currentSystem === 'parqueAguaTibia'
                                    ? parqueAguaTibiaNodes
                                    : currentSystem === 'parqueInteractivo'
                                      ? parqueInteractivoNodes
                                      : currentSystem === 'parqueBurbuja'
                                        ? parqueBurbujaNodes
                                        : currentSystem === 'parqueBurbujaBanos'
                                          ? parqueBurbujaBanosNodes
                                          : currentSystem === 'parqueBurbujaExt'
                                            ? parqueBurbujaExtNodes
                                            : currentSystem === 'parqueMedialunaExt'
                                              ? parqueMedialunaExtNodes
                                              : currentSystem === 'parqueCascada'
                                                ? parqueCascadaNodes
                                                : currentSystem === 'parqueSala2'
                                                  ? parqueSala2Nodes
                                                  : currentSystem === 'parqueSala3'
                                                    ? parqueSala3Nodes
                                                    : currentSystem === 'parqueSala4'
                                                      ? parqueSala4Nodes
                                                      : currentSystem === 'parqueTobogan3'
                                                        ? parqueTobogan3Nodes
                                                        : currentSystem === 'parqueCascadaOlas'
                                                          ? parqueCascadaOlasNodes
                                                          : currentSystem === 'parqueChorrosOlas'
                                                            ? parqueChorrosOlasNodes
                                                            : currentSystem === 'parqueAguaFriaParque'
                                                              ? parqueAguaFriaParqueNodes
                                                              : currentSystem === 'pozo19'
                                                              ? pozo19Nodes
                                                              : currentSystem === 'pozoLalo'
                                                                ? pozoLaloNodes
                                                                : currentSystem === 'pozoLuisa'
                                                                  ? pozoLuisaNodes
                                                                  : parqueSala1Nodes
  const activeEdges =
    currentSystem === 'gruta1'
      ? grutaEdges
      : currentSystem === 'hidro'
        ? hidroEdges
        : currentSystem === 'gruta2'
          ? gruta2Edges
          : currentSystem === 'gruta3'
            ? gruta3Edges
            : currentSystem === 'gruta4'
              ? gruta4Edges
              : currentSystem === 'fangoEste'
                ? fangoEsteEdges
                : currentSystem === 'fangoOeste'
                  ? fangoOesteEdges
                  : currentSystem === 'aljibeFango'
                    ? aljibeFangoEdges
                    : currentSystem === 'ascensor'
                      ? ascensorEdges
                      : currentSystem === 'cacheutina'
                        ? cacheutinaEdges
                      : currentSystem === 'chorroCacheutina'
                        ? chorroCacheutinaEdges
                        : currentSystem === 'cascada'
                          ? cascadaEdges
                        : currentSystem === 'aguaFria'
                          ? aguaFriaEdges
                        : currentSystem === 'parqueArriba1'
                            ? parqueArriba1Edges
                        : currentSystem === 'parqueBtv2'
                              ? parqueBtv2Edges
                        : currentSystem === 'parqueJfv3'
                                ? parqueJfv3Edges
                                : currentSystem === 'parqueDuchas4'
                                  ? parqueDuchas4Edges
                                  : currentSystem === 'parqueAguaTibia'
                                    ? parqueAguaTibiaEdges
                                    : currentSystem === 'parqueInteractivo'
                                      ? parqueInteractivoEdges
                                      : currentSystem === 'parqueBurbuja'
                                        ? parqueBurbujaEdges
                                        : currentSystem === 'parqueBurbujaBanos'
                                          ? parqueBurbujaBanosEdges
                                          : currentSystem === 'parqueBurbujaExt'
                                            ? parqueBurbujaExtEdges
                                            : currentSystem === 'parqueMedialunaExt'
                                              ? parqueMedialunaExtEdges
                                              : currentSystem === 'parqueCascada'
                                                ? parqueCascadaEdges
                                                : currentSystem === 'parqueSala2'
                                                  ? parqueSala2Edges
                                                  : currentSystem === 'parqueSala3'
                                                    ? parqueSala3Edges
                                                    : currentSystem === 'parqueSala4'
                                                      ? parqueSala4Edges
                                                      : currentSystem === 'parqueTobogan3'
                                                        ? parqueTobogan3Edges
                                                        : currentSystem === 'parqueCascadaOlas'
                                                          ? parqueCascadaOlasEdges
                                                          : currentSystem === 'parqueChorrosOlas'
                                                            ? parqueChorrosOlasEdges
                                                            : currentSystem === 'parqueAguaFriaParque'
                                                              ? parqueAguaFriaParqueEdges
                                                              : currentSystem === 'pozo19'
                                                              ? pozo19Edges
                                                              : currentSystem === 'pozoLalo'
                                                                ? pozoLaloEdges
                                                                : currentSystem === 'pozoLuisa'
                                                                  ? pozoLuisaEdges
                                                                  : parqueSala1Edges
  const activeOnNodesChange =
    currentSystem === 'gruta1'
      ? onGrutaNodesChange
      : currentSystem === 'hidro'
        ? onHidroNodesChange
        : currentSystem === 'gruta2'
          ? onGruta2NodesChange
          : currentSystem === 'gruta3'
            ? onGruta3NodesChange
            : currentSystem === 'gruta4'
              ? onGruta4NodesChange
              : currentSystem === 'fangoEste'
                ? onFangoEsteNodesChange
                : currentSystem === 'fangoOeste'
                  ? onFangoOesteNodesChange
                  : currentSystem === 'aljibeFango'
                    ? onAljibeFangoNodesChange
                    : currentSystem === 'ascensor'
                      ? onAscensorNodesChange
                      : currentSystem === 'cacheutina'
                        ? onCacheutinaNodesChange
                      : currentSystem === 'chorroCacheutina'
                        ? onChorroCacheutinaNodesChange
                        : currentSystem === 'cascada'
                          ? onCascadaNodesChange
                        : currentSystem === 'aguaFria'
                          ? onAguaFriaNodesChange
                        : currentSystem === 'parqueArriba1'
                            ? onParqueArriba1NodesChange
                        : currentSystem === 'parqueBtv2'
                              ? onParqueBtv2NodesChange
                        : currentSystem === 'parqueJfv3'
                                ? onParqueJfv3NodesChange
                                : currentSystem === 'parqueDuchas4'
                                  ? onParqueDuchas4NodesChange
                                  : currentSystem === 'parqueAguaTibia'
                                    ? onParqueAguaTibiaNodesChange
                                    : currentSystem === 'parqueInteractivo'
                                      ? onParqueInteractivoNodesChange
                                      : currentSystem === 'parqueBurbuja'
                                        ? onParqueBurbujaNodesChange
                                        : currentSystem === 'parqueBurbujaBanos'
                                          ? onParqueBurbujaBanosNodesChange
                                          : currentSystem === 'parqueBurbujaExt'
                                            ? onParqueBurbujaExtNodesChange
                                            : currentSystem === 'parqueMedialunaExt'
                                              ? onParqueMedialunaExtNodesChange
                                              : currentSystem === 'parqueCascada'
                                                ? onParqueCascadaNodesChange
                                                : currentSystem === 'parqueSala2'
                                                  ? onParqueSala2NodesChange
                                                  : currentSystem === 'parqueSala3'
                                                    ? onParqueSala3NodesChange
                                                    : currentSystem === 'parqueSala4'
                                                      ? onParqueSala4NodesChange
                                                      : currentSystem === 'parqueTobogan3'
                                                        ? onParqueTobogan3NodesChange
                                                        : currentSystem === 'parqueCascadaOlas'
                                                          ? onParqueCascadaOlasNodesChange
                                                          : currentSystem === 'parqueChorrosOlas'
                                                            ? onParqueChorrosOlasNodesChange
                                                            : currentSystem === 'parqueAguaFriaParque'
                                                              ? onParqueAguaFriaParqueNodesChange
                                                              : currentSystem === 'pozo19'
                                                              ? onPozo19NodesChange
                                                              : currentSystem === 'pozoLalo'
                                                                ? onPozoLaloNodesChange
                                                                : currentSystem === 'pozoLuisa'
                                                                  ? onPozoLuisaNodesChange
                                                                  : onParqueSala1NodesChange
  const activeOnEdgesChange =
    currentSystem === 'gruta1'
      ? onGrutaEdgesChange
      : currentSystem === 'hidro'
        ? onHidroEdgesChange
        : currentSystem === 'gruta2'
          ? onGruta2EdgesChange
          : currentSystem === 'gruta3'
            ? onGruta3EdgesChange
            : currentSystem === 'gruta4'
              ? onGruta4EdgesChange
              : currentSystem === 'fangoEste'
                ? onFangoEsteEdgesChange
                : currentSystem === 'fangoOeste'
                  ? onFangoOesteEdgesChange
                  : currentSystem === 'aljibeFango'
                    ? onAljibeFangoEdgesChange
                    : currentSystem === 'ascensor'
                      ? onAscensorEdgesChange
                      : currentSystem === 'cacheutina'
                        ? onCacheutinaEdgesChange
                      : currentSystem === 'chorroCacheutina'
                        ? onChorroCacheutinaEdgesChange
                        : currentSystem === 'cascada'
                          ? onCascadaEdgesChange
                        : currentSystem === 'aguaFria'
                          ? onAguaFriaEdgesChange
                        : currentSystem === 'parqueArriba1'
                            ? onParqueArriba1EdgesChange
                        : currentSystem === 'parqueBtv2'
                              ? onParqueBtv2EdgesChange
                        : currentSystem === 'parqueJfv3'
                                ? onParqueJfv3EdgesChange
                                : currentSystem === 'parqueDuchas4'
                                  ? onParqueDuchas4EdgesChange
                                  : currentSystem === 'parqueAguaTibia'
                                    ? onParqueAguaTibiaEdgesChange
                                    : currentSystem === 'parqueInteractivo'
                                      ? onParqueInteractivoEdgesChange
                                      : currentSystem === 'parqueBurbuja'
                                        ? onParqueBurbujaEdgesChange
                                        : currentSystem === 'parqueBurbujaBanos'
                                          ? onParqueBurbujaBanosEdgesChange
                                          : currentSystem === 'parqueBurbujaExt'
                                            ? onParqueBurbujaExtEdgesChange
                                          : currentSystem === 'parqueMedialunaExt'
                                            ? onParqueMedialunaExtEdgesChange
                                            : currentSystem === 'parqueCascada'
                                              ? onParqueCascadaEdgesChange
                                              : currentSystem === 'parqueSala2'
                                                ? onParqueSala2EdgesChange
                                                : currentSystem === 'parqueSala3'
                                                  ? onParqueSala3EdgesChange
                                                    : currentSystem === 'parqueSala4'
                                                    ? onParqueSala4EdgesChange
                                                    : currentSystem === 'parqueTobogan3'
                                                      ? onParqueTobogan3EdgesChange
                                                      : currentSystem === 'parqueCascadaOlas'
                                                        ? onParqueCascadaOlasEdgesChange
                                                        : currentSystem === 'parqueChorrosOlas'
                                                          ? onParqueChorrosOlasEdgesChange
                                                          : currentSystem === 'parqueAguaFriaParque'
                                                            ? onParqueAguaFriaParqueEdgesChange
                                                            : currentSystem === 'pozo19'
                                                            ? onPozo19EdgesChange
                                                            : currentSystem === 'pozoLalo'
                                                              ? onPozoLaloEdgesChange
                                                              : currentSystem === 'pozoLuisa'
                                                                ? onPozoLuisaEdgesChange
                                                                : onParqueSala1EdgesChange

  const hiddenPumpNodeIds = useMemo(() => {
    const hidden = new Set<string>()
    for (const [nodeId, puestoKey] of Object.entries(PUMP_NODE_TO_PUESTO_KEY)) {
      if (!(puestoKey in puestoActivePumps)) continue
      const activeKey = puestoActivePumps[puestoKey]
      if (!activeKey || String(activeKey).trim() === '') hidden.add(nodeId)
    }
    return hidden
  }, [puestoActivePumps])

  /** Issue keys con epic "En reparación" o "En depósito" (desde control). */
  const issueKeysReparacionDeposito = useMemo(() => {
    const set = new Set<string>()
    const reparacionDeposito = /reparación|depósito/i
    for (const issue of controlIssues) {
      const summary = (issue.epicSummary ?? '').trim()
      if (reparacionDeposito.test(summary)) set.add(issue.key)
    }
    return set
  }, [controlIssues])

  /** Nodos de equipo (bomba/soplador) cuyo issue activo tiene epic En reparación o En depósito: se ocultan edges puesto ↔ equipo. */
  const equipmentNodeIdsReparacionDeposito = useMemo(() => {
    const set = new Set<string>()
    for (const [nodeId, puestoKey] of Object.entries(PUMP_NODE_TO_PUESTO_KEY)) {
      const activeKey = puestoActivePumps[puestoKey]
      if (activeKey && issueKeysReparacionDeposito.has(activeKey)) set.add(nodeId)
    }
    return set
  }, [puestoActivePumps, issueKeysReparacionDeposito])

  const filteredActiveNodes = useMemo(
    () =>
      activeNodes.filter((node) => {
        if (node.type !== 'pump') return true
        return !hiddenPumpNodeIds.has(node.id)
      }),
    [activeNodes, hiddenPumpNodeIds]
  )

  const filteredActiveEdges = useMemo(() => {
    return activeEdges.filter((edge) => {
      if (hiddenPumpNodeIds.has(edge.source) || hiddenPumpNodeIds.has(edge.target)) return false
      // Ocultar relación puesto ↔ equipo cuando el equipo tiene epic "En reparación" o "En depósito"
      const sourcePuesto = getPuestoNodeIdFromEquipment(edge.source)
      const targetPuesto = getPuestoNodeIdFromEquipment(edge.target)
      if (equipmentNodeIdsReparacionDeposito.has(edge.source) && edge.target === sourcePuesto) return false
      if (equipmentNodeIdsReparacionDeposito.has(edge.target) && edge.source === targetPuesto) return false
      return true
    })
  }, [activeEdges, hiddenPumpNodeIds, equipmentNodeIdsReparacionDeposito])

  const handleSelectSystem = (systemId: string) => {
    const selected = SYSTEMS.find((sys) => sys.id === systemId)
    if (selected?.group) setCurrentGroup(selected.group)
    setCurrentSystem(systemId)
    setMenuOpen(false)
    setMenuLevel('group')
  }

  const fetchPumpsBatch = useCallback(async (): Promise<Record<string, string | null>> => {
    if (PUESTO_KEYS_WITH_PUMPS.length === 0) return {}
    try {
      const res = await fetch(`${API_BASE_URL}/api/pumps-batch?keys=${PUESTO_KEYS_WITH_PUMPS.join(',')}`)
      const data = await res.json()
      const map: Record<string, string | null> = {}
      for (const key of PUESTO_KEYS_WITH_PUMPS) {
        map[key] = data[key]?.activeKey ?? null
      }
      setPuestoActivePumps(map)
      return map
    } catch {
      return {}
    }
  }, [])

  const loadIssues = useCallback(async () => {
    try {
      const [issuesRes, pumpsMap] = await Promise.all([
        fetch(`${API_BASE_URL}/api/issues`),
        fetchPumpsBatch()
      ])
      const data = await issuesRes.json()
      const map = new Map<string, { status?: string; summary?: string; waterField?: any }>()
      for (const issue of data.issues || []) {
        if (issue?.key) {
          map.set(issue.key, {
            status: issue?.status?.name,
            summary: issue?.summary,
            waterField: issue?.customfield_11815
          })
        }
      }
      const applyIssueData = (prev: Node[]) =>
        prev.map((node) => {
          let key = node.data?.issueKey as string | undefined
          let activePumpKey: string | null = null
          if (node.type === 'pump' && key) {
            const puestoKey = PUMP_NODE_TO_PUESTO_KEY[node.id]
            const activeKey = puestoKey ? pumpsMap[puestoKey] : null
            if (activeKey) {
              activePumpKey = activeKey
              key = activeKey
            }
          }
          if (!key) return node
          const issueData = map.get(key)
          if (!issueData) return node
          const nextData = { ...node.data }
          if (issueData.status && nextData.status !== issueData.status) {
            nextData.status = issueData.status
          }
          if (typeof issueData.waterField !== 'undefined' && nextData.customfield_11815 !== issueData.waterField) {
            nextData.customfield_11815 = issueData.waterField
          }
          // Para nodos pump: reflejar la bomba activa (key + summary) desde Jira
          if (node.type === 'pump' && activePumpKey) {
            nextData.issueKey = activePumpKey
            if (issueData.summary) nextData.summary = issueData.summary
          }
          // Para nodos service y waveService: mostrar el summary de Jira como label
          if ((node.type === 'service' || node.type === 'waveService') && issueData.summary) nextData.label = issueData.summary
          return { ...node, data: nextData }
        })
      setGrutaNodes(applyIssueData)
      setHidroNodes(applyIssueData)
      setGruta2Nodes(applyIssueData)
      setGruta3Nodes(applyIssueData)
      setGruta4Nodes(applyIssueData)
      setFangoEsteNodes(applyIssueData)
      setFangoOesteNodes(applyIssueData)
      setAljibeFangoNodes(applyIssueData)
      setAscensorNodes(applyIssueData)
      setCacheutinaNodes(applyIssueData)
      setChorroCacheutinaNodes(applyIssueData)
      setCascadaNodes(applyIssueData)
      setAguaFriaNodes(applyIssueData)
      setParqueArriba1Nodes(applyIssueData)
      setParqueBtv2Nodes(applyIssueData)
      setParqueJfv3Nodes(applyIssueData)
      setParqueDuchas4Nodes(applyIssueData)
      setParqueAguaTibiaNodes(applyIssueData)
      setParqueInteractivoNodes(applyIssueData)
      setParqueBurbujaNodes(applyIssueData)
      setParqueBurbujaBanosNodes(applyIssueData)
      setParqueBurbujaExtNodes(applyIssueData)
      setParqueMedialunaExtNodes(applyIssueData)
      setParqueCascadaNodes(applyIssueData)
      setParqueSala1Nodes(applyIssueData)
      setParqueSala2Nodes(applyIssueData)
      setParqueSala3Nodes(applyIssueData)
      setParqueSala4Nodes(applyIssueData)
      setParqueTobogan3Nodes(applyIssueData)
      setParqueCascadaOlasNodes(applyIssueData)
      setParqueChorrosOlasNodes(applyIssueData)
      setParqueAguaFriaParqueNodes(applyIssueData)
      setPozo19Nodes(applyIssueData)
      setPozoLaloNodes(applyIssueData)
      setPozoLuisaNodes(applyIssueData)
    } catch {
      // Silenciar errores de polling
    }
  }, [fetchPumpsBatch, setGrutaNodes, setHidroNodes, setGruta2Nodes, setGruta3Nodes, setGruta4Nodes, setFangoEsteNodes, setFangoOesteNodes, setAljibeFangoNodes, setAscensorNodes, setCacheutinaNodes, setChorroCacheutinaNodes, setCascadaNodes, setAguaFriaNodes, setParqueArriba1Nodes, setParqueBtv2Nodes, setParqueJfv3Nodes, setParqueDuchas4Nodes, setParqueAguaTibiaNodes, setParqueInteractivoNodes, setParqueBurbujaNodes, setParqueBurbujaBanosNodes, setParqueBurbujaExtNodes, setParqueMedialunaExtNodes, setParqueCascadaNodes, setParqueSala1Nodes, setParqueSala2Nodes, setParqueSala3Nodes, setParqueSala4Nodes, setParqueTobogan3Nodes, setParqueCascadaOlasNodes, setParqueChorrosOlasNodes, setParqueAguaFriaParqueNodes, setPozo19Nodes, setPozoLaloNodes, setPozoLuisaNodes])

  const extractWaterFieldValues = (value: any) => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item?.value ?? item?.name ?? item))
        .filter(Boolean)
    }
    if (typeof value === 'string' || typeof value === 'number') return [String(value)]
    if (typeof value === 'object') {
      const normalized = String(value?.value ?? value?.name ?? '')
      return normalized ? [normalized] : []
    }
    return [String(value)]
  }

  const formatWaterFieldValue = (value: any) => {
    const values = extractWaterFieldValues(value)
    return values.join(', ')
  }

  const isPuestoNode = (node: Node | null) => {
    const label = String(node?.data?.label ?? '').toLowerCase()
    return label.includes('puesto')
  }

  const loadPumpOptions = async (issueKey: string) => {
    try {
      setPumpLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/issues/${issueKey}/pumps`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || 'Error al cargar bombas')
      }
      const data = await response.json()
      const options = Array.isArray(data.options) ? data.options : []
      const activeKey = String(data.activeKey || '')
      setPumpOptions(options)
      setPumpActiveKey(activeKey)
      setPumpSelectedKey(activeKey || (options[0]?.key ?? ''))
    } catch (error: any) {
      setPumpOptions([])
      setPumpActiveKey('')
      setPumpSelectedKey('')
      toast({ title: 'No se pudieron cargar bombas/sopladores', description: String(error?.message || error), status: 'error', duration: 2000 })
    } finally {
      setPumpLoading(false)
    }
  }

  const closeTransitionModal = () => {
    setTransitionOpen(false)
    setTransitionOptions([])
    setTransitionNode(null)
    setWaterFieldOptions([])
    setWaterFieldValue('')
    setWaterFieldValues([])
    setWaterFieldLoading(false)
    setWaterFieldIsMulti(false)
    setPumpOptions([])
    setPumpActiveKey('')
    setPumpSelectedKey('')
    setPumpLoading(false)
    setPumpSaving(false)
  }

  const onNodeClick = (_: any, node: Node) => {
    if (node.data?.issueKey) {
      const key = node.data.issueKey as string
      setTransitionNode(node)
      setTransitionOpen(true)
      setTransitionLoading(true)
      fetch(`${API_BASE_URL}/api/issues/${key}/transitions`)
        .then((res) => res.json())
        .then((data) => setTransitionOptions(data.transitions || []))
        .catch((error) => {
          toast({ title: 'No se pudieron cargar transiciones', description: String(error?.message || error), status: 'error', duration: 2000 })
        })
        .finally(() => setTransitionLoading(false))
      if (WATER_FIELD_ISSUE_KEYS.includes(key)) {
        const currentValues = extractWaterFieldValues(node.data?.customfield_11815)
        setWaterFieldValues(currentValues)
        setWaterFieldValue(currentValues[0] ?? '')
        setWaterFieldOptions([])
        setWaterFieldIsMulti(false)
        setWaterFieldLoading(true)
        fetch(`${API_BASE_URL}/api/issues/${key}/field-options?fieldId=${WATER_FIELD_ID}`)
          .then((res) => res.json())
          .then((data) => {
            const options = data.options || []
            const isMulti = Boolean(data.isMulti)
            setWaterFieldOptions(options)
            setWaterFieldIsMulti(isMulti)
            if (options.length > 0) {
              const allowed = new Set(options.map((opt: { value: string }) => opt.value))
              const filteredValues = currentValues.filter((value) => allowed.has(value))
              if (isMulti) {
                setWaterFieldValues(filteredValues)
              } else if (filteredValues[0]) {
                setWaterFieldValue(filteredValues[0])
              }
            }
          })
          .catch((error) => {
            toast({ title: `No se pudieron cargar ${WATER_FIELD_LABEL}`, description: String(error?.message || error), status: 'error', duration: 2000 })
          })
          .finally(() => setWaterFieldLoading(false))
      } else {
        setWaterFieldOptions([])
        setWaterFieldValue('')
        setWaterFieldValues([])
        setWaterFieldIsMulti(false)
        setWaterFieldLoading(false)
      }
      if (isPuestoNode(node)) {
        setPumpOptions([])
        setPumpActiveKey('')
        setPumpSelectedKey('')
        loadPumpOptions(key)
      } else {
        setPumpOptions([])
        setPumpActiveKey('')
        setPumpSelectedKey('')
        setPumpLoading(false)
      }
      return
    }
    toast({ title: node.data?.label ?? node.id, description: 'Nodo seleccionado', status: 'info', duration: 1500 })
  }

  const onEdgeClick = (_: any, edge: Edge) => {
    const edgeData = edge.data
    if (edgeData) {
      const details = [
        `Diámetro: ${edgeData.diameter || 'N/A'}`,
        `Material: ${edgeData.material || 'N/A'}`,
        `Presión: ${edgeData.pressure || 'N/A'}`,
        `Caudal: ${edgeData.flow || 'N/A'}`
      ].join(' • ')
      
      toast({ 
        title: edgeData.name, 
        description: details, 
        status: 'success', 
        duration: 3000,
        isClosable: true
      })
    }
  }

  useEffect(() => {
    let timer: number | undefined
    loadIssues()
    timer = window.setInterval(loadIssues, ISSUE_POLL_MS)
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [loadIssues])

  useEffect(() => {
    if (currentGroup !== 'control') return
    let cancelled = false
    setControlLoading(true)
    fetch(`${API_BASE_URL}/api/issues/control`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setControlIssues(data.issues || [])
      })
      .catch(() => {
        if (!cancelled) setControlIssues([])
      })
      .finally(() => {
        if (!cancelled) setControlLoading(false)
      })
    return () => { cancelled = true }
  }, [currentGroup])

  useEffect(() => {
    if (currentGroup === 'control') setDiagramAreaHeight(null)
  }, [currentGroup])

  const openControlEpicModal = (item: typeof controlIssues[0]) => {
    setControlEpicModalItem(item)
    setControlEpicValue(item.epicKey || '')
    setControlEpicLoading(true)
    setControlEpicOptions([])
    setControlTransitionOptions([])
    setControlTransitionLoading(true)
    fetch(`${API_BASE_URL}/api/epics`)
      .then((res) => res.json())
      .then((data) => setControlEpicOptions(data.epics || []))
      .catch(() => setControlEpicOptions([]))
      .finally(() => setControlEpicLoading(false))
    fetch(`${API_BASE_URL}/api/issues/${item.key}/transitions`)
      .then((res) => res.json())
      .then((data) => setControlTransitionOptions(data.transitions || []))
      .catch(() => setControlTransitionOptions([]))
      .finally(() => setControlTransitionLoading(false))
  }

  const closeControlEpicModal = () => {
    setControlEpicModalItem(null)
    setControlEpicOptions([])
    setControlEpicValue('')
    setControlEpicLoading(false)
    setControlEpicSaving(false)
    setControlTransitionOptions([])
    setControlTransitionLoading(false)
    setControlTransitionSaving(false)
    setControlBreakdownModal((prev) => ({ ...prev, open: false }))
    setControlBreakdownExplanation('')
  }

  const isTransitionToYellowOrRed = (t: { name?: string; toName?: string; requiresBreakdownComment?: boolean }) => {
    if (t.requiresBreakdownComment) return true
    const name = (t.name || '').trim()
    const toName = (t.toName || '').trim()
    if (name === '🟨' || name === '🟥' || toName === '🟨' || toName === '🟥') return true
    return /yellow|amarillo|red|rojo/i.test(name) || /yellow|amarillo|red|rojo/i.test(toName)
  }
  const openControlBreakdownModal = (transitionId: string, transitionName: string) => {
    const issueKey = controlEpicModalItem?.key ?? null
    setControlBreakdownModal({ open: true, transitionId, transitionName, issueKey, source: 'control' })
    setControlBreakdownExplanation('')
  }
  const openDiagramBreakdownModal = (transitionId: string, transitionName: string) => {
    const issueKey = (transitionNode?.data?.issueKey as string) ?? null
    // Fijar altura del área del diagrama ANTES de abrir el modal para que no se achique al abrir/cerrar
    const h = diagramAreaRef.current?.offsetHeight
    if (h && h > 200) setDiagramAreaHeight(h)
    setControlBreakdownModal({ open: true, transitionId, transitionName, issueKey, source: 'diagram' })
    setControlBreakdownExplanation('')
  }
  const closeControlBreakdownModal = () => {
    if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
      (document.activeElement as HTMLElement).blur()
    }
    setControlBreakdownModal((prev) => ({ ...prev, open: false }))
    setControlBreakdownExplanation('')
  }

  const handleControlTransitionWithExplanation = async () => {
    const key = controlBreakdownModal.issueKey
    const { transitionId, source } = controlBreakdownModal
    const text = controlBreakdownExplanation.trim()
    if (!key || !transitionId) return
    if (!text) {
      toast({ title: 'Debe indicar la razón de la rotura o mal funcionamiento', status: 'warning', duration: 2500 })
      return
    }
    try {
      setControlTransitionSaving(true)
      const res = await fetch(`${API_BASE_URL}/api/issues/${key}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitionId })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al actualizar estado')
      }
      const commentRes = await fetch(`${API_BASE_URL}/api/issues/${key}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text })
      })
      if (!commentRes.ok) {
        const err = await commentRes.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al guardar el comentario')
      }
      toast({ title: 'Estado actualizado y comentario registrado', status: 'success', duration: 1500 })
      closeControlBreakdownModal()
      if (source === 'control') {
        const listRes = await fetch(`${API_BASE_URL}/api/issues/control`)
        const listData = await listRes.json().catch(() => ({}))
        const updated = (listData.issues || []).find((i: typeof controlIssues[0]) => i.key === key)
        if (updated) setControlEpicModalItem(updated)
        setControlIssues(listData.issues || [])
      } else {
        setTransitionOpen(false)
        setTransitionNode(null)
        await loadIssues()
      }
    } catch (e: unknown) {
      toast({ title: 'Error', description: String(e instanceof Error ? e.message : e), status: 'error', duration: 2000 })
    } finally {
      setControlTransitionSaving(false)
    }
  }

  const handleControlTransition = async (transitionId: string) => {
    if (!controlEpicModalItem?.key) return
    const key = controlEpicModalItem.key
    try {
      setControlTransitionSaving(true)
      const res = await fetch(`${API_BASE_URL}/api/issues/${key}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitionId })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al actualizar')
      }
      toast({ title: 'Estado actualizado', status: 'success', duration: 1500 })
      const listRes = await fetch(`${API_BASE_URL}/api/issues/control`)
      const listData = await listRes.json().catch(() => ({}))
      const updated = (listData.issues || []).find((i: typeof controlIssues[0]) => i.key === key)
      if (updated) setControlEpicModalItem(updated)
      setControlIssues(listData.issues || [])
    } catch (e: unknown) {
      toast({ title: 'No se pudo actualizar el estado', description: String(e instanceof Error ? e.message : e), status: 'error', duration: 2000 })
    } finally {
      setControlTransitionSaving(false)
    }
  }

  const handleControlEpicSave = async () => {
    if (!controlEpicModalItem?.key) return
    try {
      setControlEpicSaving(true)
      const res = await fetch(`${API_BASE_URL}/api/issues/${controlEpicModalItem.key}/epic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicKey: controlEpicValue || null })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al actualizar')
      }
      toast({ title: 'Epic actualizado', status: 'success', duration: 1500 })
      closeControlEpicModal()
      setControlLoading(true)
      fetch(`${API_BASE_URL}/api/issues/control`)
        .then((r) => r.json())
        .then((data) => setControlIssues(data.issues || []))
        .catch(() => {})
        .finally(() => setControlLoading(false))
    } catch (e: unknown) {
      toast({ title: 'No se pudo actualizar el Epic', description: String(e instanceof Error ? e.message : e), status: 'error', duration: 2000 })
    } finally {
      setControlEpicSaving(false)
    }
  }

  const handleWaterFieldSave = async () => {
    if (!transitionNode?.data?.issueKey) return
    const key = transitionNode.data.issueKey as string
    if (!WATER_FIELD_ISSUE_KEYS.includes(key)) return
    try {
      setWaterFieldSaving(true)
      const trimmedValue = waterFieldValue.trim()
      const selectedValues = waterFieldValues.map((value) => value.trim()).filter(Boolean)
      const fieldValue =
        waterFieldIsMulti
          ? selectedValues.length > 0
            ? selectedValues.map((value) => ({ value }))
            : []
          : trimmedValue.length === 0
            ? null
            : waterFieldOptions.length > 0
              ? { value: trimmedValue }
              : trimmedValue
      const update = await fetch(`${API_BASE_URL}/api/issues/${key}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { [WATER_FIELD_ID]: fieldValue } })
      })
      if (!update.ok) {
        const error = await update.json().catch(() => ({}))
        throw new Error(error?.error || 'Error al actualizar')
      }
      toast({ title: `${WATER_FIELD_LABEL} actualizado`, status: 'success', duration: 1500 })
      await loadIssues()
    } catch (error: any) {
      toast({ title: `No se pudo actualizar ${WATER_FIELD_LABEL}`, description: String(error?.message || error), status: 'error', duration: 2000 })
    } finally {
      setWaterFieldSaving(false)
    }
  }

  const handleTransition = async (transitionId: string) => {
    if (!transitionNode?.data?.issueKey) return
    const key = transitionNode.data.issueKey as string
    try {
      const update = await fetch(`${API_BASE_URL}/api/issues/${key}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitionId })
      })
      if (!update.ok) {
        const err = await update.json()
        throw new Error(err?.error || 'Error al actualizar')
      }
      toast({ title: `${key} actualizado`, status: 'success', duration: 1500 })
      await loadIssues()
    } catch (error: any) {
      toast({ title: 'No se pudo actualizar', description: String(error?.message || error), status: 'error', duration: 2000 })
    } finally {
      closeTransitionModal()
    }
  }

  const handlePumpSave = async () => {
    if (!transitionNode?.data?.issueKey) return
    const key = transitionNode.data.issueKey as string
    if (!pumpSelectedKey) {
      toast({ title: 'Seleccioná una bomba o soplador', status: 'warning', duration: 1500 })
      return
    }
    try {
      setPumpSaving(true)
      const res = await fetch(`${API_BASE_URL}/api/issues/${key}/active-pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedKey: pumpSelectedKey })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Error al actualizar')
      }
      setPumpActiveKey(pumpSelectedKey)
      toast({ title: 'Bomba/soplador actualizado', status: 'success', duration: 1500 })
      await loadIssues()
      await loadPumpOptions(key)
    } catch (error: any) {
      toast({ title: 'No se pudo actualizar la bomba/soplador', description: String(error?.message || error), status: 'error', duration: 2000 })
    } finally {
      setPumpSaving(false)
    }
  }

  /** Tamaño de cuadrados de estado (amarillo/rojo) para que no se achiquen respecto al emoji. */
  const statusSquareSize = '1.2em'

  /** Cuadrado amarillo con recuadro blanco (solo este indicador, sin texto). */
  const YellowSquare = () => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        verticalAlign: 'middle',
        flexShrink: 0
      }}
      aria-label="Amarillo"
    >
      <span
        style={{
          display: 'block',
          width: statusSquareSize,
          height: statusSquareSize,
          backgroundImage: 'linear-gradient(#FF8F00, #FF8F00)',
          backgroundColor: '#FF8F00',
          borderRadius: 4,
        boxShadow: '0 0 6px rgba(255, 143, 0, 0.8), 0 0 12px rgba(255, 143, 0, 0.5)'
        }}
      />
    </span>
  )

  /** Cuadrado rojo con color CSS: rojo vivo para que se vea más rojo en móvil. */
  const RedSquare = () => (
    <Box
      as="span"
      display="inline-block"
      w={statusSquareSize}
      h={statusSquareSize}
      bg="#E53935"
      borderRadius="2px"
      verticalAlign="middle"
      aria-label="Rojo"
    />
  )

  /** Badge de transición: amarillo/rojo = cuadrados CSS; verde = emoji. */
  const transitionBadge = (name: string) => {
    const isYellow = name?.trim() === '🟨' || /yellow|amarillo/i.test(name ?? '')
    const isRed = name?.trim() === '🟥' || /red|rojo/i.test(name ?? '')
    return (
      <Badge colorScheme="gray" title={name}>
        {isYellow ? <YellowSquare /> : isRed ? <RedSquare /> : name}
      </Badge>
    )
  }

  /** Para botones de transición: 🟩 emoji; amarillo/rojo = cuadrados CSS. */
  const transitionButtonLabel = (t: { name?: string; toName?: string }) => {
    const name = (t.name || '').toLowerCase().trim()
    const toName = (t.toName || '').toLowerCase().trim()
    if (/green|verde|🟩/.test(name) || /green|verde|🟩/.test(toName)) return <span title={t.name}>🟩</span>
    if (/yellow|amarillo|🟨/.test(name) || /yellow|amarillo|🟨/.test(toName)) return <span title={t.name}><YellowSquare /></span>
    if (/red|rojo|🟥/.test(name) || /red|rojo|🟥/.test(toName)) return <span title={t.name}><RedSquare /></span>
    return transitionBadge(t.name ?? '')
  }

  const isWaterFieldNode = WATER_FIELD_ISSUE_KEYS.includes(transitionNode?.data?.issueKey ?? '')
  const currentWaterField = formatWaterFieldValue(transitionNode?.data?.customfield_11815)
  const isPuestoModal = isPuestoNode(transitionNode)
  const activePump = pumpOptions.find((option) => option.key === pumpActiveKey)

  // Zoom inicial por props (sin hooks del store interno)

  if (isMobile) {
  return (
      <Box w="100vw" h="100dvh" bg="gray.50">
        <Box ref={diagramAreaRef} w="100%" h="100%" minH="100dvh" position="relative">
          <div className="system-menu">
            <button
              type="button"
              className={`menu-button${menuOpen ? ' open' : ''}`}
              onClick={() =>
                setMenuOpen((prev) => {
                  const next = !prev
                  if (next) setMenuLevel('group')
                  return next
                })
              }
              aria-label="Abrir menú de sistemas"
            >
              <span />
              <span />
              <span />
            </button>
            {menuOpen && (
              <div className="menu-dropdown">
                {menuLevel === 'group' && (
                  <>
                    {SYSTEM_GROUPS.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        className={`menu-item${currentGroup === group.id ? ' active' : ''}`}
                        onClick={() => {
                          setCurrentGroup(group.id)
                          if (group.id === 'control') {
                            setMenuOpen(false)
                          } else {
                            setMenuLevel('system')
                          }
                        }}
                      >
                        {group.label}
                      </button>
                    ))}
                  </>
                )}
                {menuLevel === 'system' && (
                  <>
                    <div className="menu-header">
                      <button type="button" className="menu-back" onClick={() => setMenuLevel('group')}>
                        ← Grupos
                      </button>
                      <span className="menu-title">{currentGroupLabel}</span>
      </div>
                    {currentGroup === 'parque' && (sala4Systems.length > 0 || sala5Systems.length > 0) && (
                      <div className="menu-subtitle">Resto de sistemas</div>
                    )}
                    {regularSystems.map((sys) => (
                      <button
                        key={sys.id}
                        type="button"
                        className={`menu-item${currentSystem === sys.id ? ' active' : ''}`}
                        onClick={() => handleSelectSystem(sys.id)}
                      >
                        {sys.label}
        </button>
                    ))}
                    {sala4Systems.length > 0 && (
                      <>
                        <div className="menu-subtitle">Sistemas Sala 4</div>
                        {sala4Systems.map((sys) => (
                          <button
                            key={sys.id}
                            type="button"
                            className={`menu-item${currentSystem === sys.id ? ' active' : ''}`}
                            onClick={() => handleSelectSystem(sys.id)}
                          >
                            {sys.label}
                          </button>
                        ))}
                      </>
                    )}
                    {sala5Systems.length > 0 && (
                      <>
                        <div className="menu-subtitle">Sistemas Sala 5</div>
                        {sala5Systems.map((sys) => (
                          <button
                            key={sys.id}
                            type="button"
                            className={`menu-item${currentSystem === sys.id ? ' active' : ''}`}
                            onClick={() => handleSelectSystem(sys.id)}
                          >
                            {sys.label}
                          </button>
                        ))}
                      </>
                    )}
                    {systemsForGroup.length === 0 && (
                      <div className="menu-empty">No hay sistemas cargados.</div>
                    )}
                  </>
                )}
      </div>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 'max(20px, calc(env(safe-area-inset-top, 0px) + 12px))',
              right: 'max(24px, calc(env(safe-area-inset-right, 0px) + 16px))',
              zIndex: 10,
              background: displayLabel === 'Control' ? '#FDE047' : '#FEEBC8',
              border: displayLabel === 'Control' ? '1px solid #FACC15' : '1px solid #F6AD55',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: 600,
              color: displayLabel === 'Control' ? '#422006' : '#7B341E',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
              whiteSpace: 'nowrap'
            }}
          >
            {displayLabel}
          </div>
          {currentGroup === 'control' ? (
            <Box pt={1} px={3} pb={4} overflowY="auto" h="100%" position="absolute" inset={0} top={44}>
              {controlLoading ? (
                <Flex justify="center" align="center" h="50%">
                  <Spinner size="lg" color="gray.300" />
                </Flex>
              ) : (
                <Stack spacing={5}>
                  {['Bomba', 'Soplador', 'Lanchón'].concat(
                    Object.keys(controlListByType).filter((k) => !['Bomba', 'Soplador', 'Lanchón'].includes(k))
                  ).map((type) => {
                    const items = controlListByType[type] || []
                    if (items.length === 0) return null
                    return (
                      <Box key={type}>
                        <Heading size="sm" mb={2} sx={{ color: 'white' }}>{type}</Heading>
                        <Stack spacing={2}>
                          {items.map((item) => (
                            <Box
                              key={item.key}
                              p={3}
                              bg="gray.800"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor="gray.600"
                              cursor="pointer"
                              onClick={() => openControlEpicModal(item)}
                              _hover={{ bg: 'gray.700' }}
                            >
                              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                <Badge colorScheme="blue">{item.key}</Badge>
                                {item.status ? transitionBadge(item.status) : <Badge colorScheme="gray">Sin estado</Badge>}
                              </HStack>
                              <Text fontSize="sm" fontWeight="medium" mt={1} color="gray.100">{item.summary || item.key}</Text>
                              <Text fontSize="xs" color="gray.400">
                                Epic: {item.epicSummary ? `${item.epicSummary} (${item.epicKey})` : item.epicKey || 'Sin Epic'}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              )}
              <Modal isOpen={!!controlEpicModalItem} onClose={closeControlEpicModal} isCentered size="xs">
                <ModalOverlay bg="transparent" />
                <ModalContent maxW="92vw">
                  <ModalHeader pb={2}>
                    {controlEpicModalItem && (
                      <>
                        <Text fontWeight="bold" noOfLines={2}>{controlEpicModalItem.summary || controlEpicModalItem.key}</Text>
                        <HStack mt={1}>
                          <Badge colorScheme="blue">{controlEpicModalItem.key}</Badge>
                        </HStack>
                      </>
                    )}
                  </ModalHeader>
                  <ModalBody pt={2}>
                    <Stack spacing={4}>
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>Transiciones</Text>
                        <HStack spacing={2} fontSize="sm" color="gray.600" mb={2}>
                          <Text>Estado actual:</Text>
                          {controlEpicModalItem?.status ? transitionBadge(controlEpicModalItem.status) : <Text>Sin datos</Text>}
                        </HStack>
                        {controlTransitionLoading ? (
                          <Text fontSize="sm">Cargando transiciones...</Text>
                        ) : controlTransitionOptions.length === 0 ? (
                          <Text fontSize="sm">No hay transiciones disponibles.</Text>
                        ) : (
                          <SimpleGrid columns={2} spacing={2}>
                            {controlTransitionOptions
                              .filter((t) => t.name.toLowerCase() !== 'por hacer')
                              .map((t) => (
                                <Button
                                  key={t.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => (isTransitionToYellowOrRed(t) ? openControlBreakdownModal(t.id, t.name) : handleControlTransition(t.id))}
                                  isDisabled={controlTransitionSaving}
                                >
                                  {transitionButtonLabel(t)}
                                </Button>
                              ))}
                          </SimpleGrid>
                        )}
                      </Box>
                      <Divider />
                      <FormControl>
                        <FormLabel fontSize="sm">Epic asociado</FormLabel>
                        {controlEpicLoading ? (
                          <Text fontSize="sm">Cargando epics...</Text>
                        ) : (
                          <Select
                            size="sm"
                            value={controlEpicValue}
                            onChange={(e) => setControlEpicValue(e.target.value)}
                          >
                            <option value="">Sin Epic</option>
                            {controlEpicOptions.map((epic) => (
                              <option key={epic.key} value={epic.key}>
                                {epic.summary} ({epic.key})
                              </option>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    </Stack>
                  </ModalBody>
                  <ModalFooter>
                    <Button size="sm" variant="ghost" onClick={closeControlEpicModal}>
                      Cancelar
                    </Button>
                    <Button size="sm" colorScheme="blue" onClick={handleControlEpicSave} isDisabled={controlEpicSaving || controlEpicLoading}>
                      {controlEpicSaving ? <Spinner size="xs" /> : 'Guardar'}
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
              <Modal isOpen={controlBreakdownModal.open} onClose={closeControlBreakdownModal} isCentered size="md" blockScrollOnMount={false} returnFocusOnClose={false}>
                <ModalOverlay bg="transparent" />
                <ModalContent maxH="85dvh" maxW="95vw" display="flex" flexDirection="column">
                  <ModalHeader flexShrink={0}>Razón de la rotura o mal funcionamiento</ModalHeader>
                  <ModalBody overflowY="auto" flex="1" minH={0} py={2}>
                    <FormControl isRequired>
                      <FormLabel>Explique la razón de la rotura o mal funcionamiento:</FormLabel>
                      <Textarea
                        value={controlBreakdownExplanation}
                        onChange={(e) => setControlBreakdownExplanation(e.target.value)}
                        placeholder="Describa el problema..."
                        rows={4}
                        size="sm"
                        fontSize="16px"
                      />
                    </FormControl>
                  </ModalBody>
                  <ModalFooter flexShrink={0} flexWrap="wrap" gap={2}>
                    <Stack direction={{ base: 'column', sm: 'row' }} w="100%" spacing={2}>
                      <Button type="button" size="sm" variant="ghost" onClick={() => closeControlBreakdownModal()} minH="44px" flex={1}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" colorScheme="blue" onClick={handleControlTransitionWithExplanation} isDisabled={controlTransitionSaving || !controlBreakdownExplanation.trim()} minH="44px" flex={1}>
                        {controlTransitionSaving ? <Spinner size="xs" /> : 'Confirmar cambio de estado'}
                      </Button>
                    </Stack>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Box>
          ) : (
          <>
          <Modal isOpen={transitionOpen} onClose={closeTransitionModal} isCentered size="xs">
            <ModalOverlay bg="transparent" />
            <ModalContent maxW="92vw">
              <ModalHeader pb={2}>
                <HStack justify="space-between">
                  <Text>Transiciones</Text>
                  {transitionNode?.data?.issueKey && <Badge colorScheme="blue">{transitionNode.data.issueKey}</Badge>}
                </HStack>
                <HStack spacing={2} fontSize="sm" color="gray.600">
                  <Text>Estado actual:</Text>
                  {transitionNode?.data?.status ? transitionBadge(transitionNode.data.status) : <Text>Sin datos</Text>}
                </HStack>
              </ModalHeader>
              <ModalBody pt={2}>
                {transitionLoading && <Text fontSize="sm">Cargando transiciones...</Text>}
                {!transitionLoading && transitionOptions.length === 0 && (
                  <Text fontSize="sm">No hay transiciones disponibles.</Text>
                )}
                {!transitionLoading && transitionOptions.length > 0 && (
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                    {transitionOptions
                      .filter((t) => t.name.toLowerCase() !== 'por hacer')
                      .map((t) => (
                        <Button
                          key={t.id}
                          size="sm"
                          variant="outline"
                          onClick={() => (t.requiresBreakdownComment ? openDiagramBreakdownModal(t.id, t.name) : handleTransition(t.id))}
                        >
                          {transitionButtonLabel(t)}
                        </Button>
                      ))}
                  </SimpleGrid>
                )}
                {isWaterFieldNode && (
                  <Stack spacing={2} mt={4} pt={3} borderTop="1px solid" borderColor="gray.200">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="semibold">
                        {WATER_FIELD_LABEL}
                      </Text>
                      {waterFieldSaving && <Spinner size="xs" />}
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      Actual: {currentWaterField || 'Sin datos'}
                    </Text>
                    {waterFieldLoading ? (
                      <Text fontSize="sm">Cargando opciones...</Text>
                    ) : (
                      <FormControl>
                        <FormLabel fontSize="xs" mb={1}>
                          Nuevo valor
                        </FormLabel>
                        {waterFieldOptions.length > 0 ? (
                          waterFieldIsMulti ? (
                            <Select
                              size="sm"
                              value={waterFieldValues}
                              onChange={(event) => {
                                const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                                setWaterFieldValues(selected)
                              }}
                              multiple
                            >
                              {waterFieldOptions.map((option) => (
                                <option key={option.id ?? option.value} value={option.value}>
                                  {option.value}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Select
                              size="sm"
                              value={waterFieldValue}
                              onChange={(event) => setWaterFieldValue(event.target.value)}
                              placeholder="Seleccionar"
                            >
                              {waterFieldOptions.map((option) => (
                                <option key={option.id ?? option.value} value={option.value}>
                                  {option.value}
                                </option>
                              ))}
                            </Select>
                          )
                        ) : waterFieldIsMulti ? (
                          <Input
                            size="sm"
                            value={waterFieldValues.join(', ')}
                            onChange={(event) => {
                              const values = event.target.value
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                              setWaterFieldValues(values)
                            }}
                            placeholder="Ingresar valores separados por coma"
                          />
                        ) : (
                          <Input
                            size="sm"
                            value={waterFieldValue}
                            onChange={(event) => setWaterFieldValue(event.target.value)}
                            placeholder="Ingresar valor"
                          />
                        )}
                      </FormControl>
                    )}
                    <Button size="sm" onClick={handleWaterFieldSave} isDisabled={waterFieldSaving || waterFieldLoading}>
                      Guardar
                    </Button>
                  </Stack>
                )}
                {isPuestoModal && (
                  <Stack spacing={2} mt={4} pt={3} borderTop="1px solid" borderColor="gray.200">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="semibold">
                        Bombas / Sopladores
                      </Text>
                      {pumpSaving && <Spinner size="xs" />}
                    </HStack>
                    {pumpLoading ? (
                      <Text fontSize="sm">Cargando bombas y sopladores...</Text>
                    ) : pumpOptions.length === 0 ? (
                      <Text fontSize="sm">No hay bombas o sopladores conectados.</Text>
                    ) : (
                      <>
                        <Text fontSize="xs" color="gray.600">
                          Actual: {activePump?.summary ? `${activePump.summary} (${activePump.key})` : pumpActiveKey || 'Sin selección'}
                        </Text>
                        <Stack spacing={1}>
                          {pumpOptions.map((option) => {
                            const isActive = option.key === pumpActiveKey
                            return (
                              <Box
                                key={option.key}
                                borderWidth="1px"
                                borderRadius="md"
                                p={2}
                                bg={isActive ? 'green.50' : 'orange.50'}
                                borderColor={isActive ? 'green.300' : 'orange.300'}
                                _dark={{ bg: isActive ? 'green.900' : 'orange.900', borderColor: isActive ? 'green.600' : 'orange.600' }}
                              >
                                {isActive && (
                                  <Text fontSize="xs" fontWeight="bold" mb={1}>En uso</Text>
                                )}
                                {option.inUseElsewhere && !isActive && (
                                  <Text fontSize="xs" fontWeight="semibold" color="orange.600" _dark={{ color: 'orange.300' }} mb={1}>
                                    En uso en otro puesto
                                  </Text>
                                )}
                                <HStack justify="space-between">
                                  <Text fontSize="sm" fontWeight={isActive ? 'bold' : undefined}>{option.summary || option.key}</Text>
                                  {option.status ? transitionBadge(option.status) : <Badge colorScheme="gray">Sin estado</Badge>}
                                </HStack>
                                <Text fontSize="xs" color="gray.600">
                                  {option.issueType || 'Tipo'} • {option.key}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  Epic: {option.epicSummary ? `${option.epicSummary} (${option.epicKey})` : option.epicKey || 'Sin Epic'}
                                </Text>
                              </Box>
                            )
                          })}
                        </Stack>
                        <FormControl>
                          <FormLabel fontSize="xs" mb={1}>
                            Seleccionar
                          </FormLabel>
                          <Select
                            size="sm"
                            value={pumpSelectedKey}
                            onChange={(event) => setPumpSelectedKey(event.target.value)}
                            placeholder="Seleccionar"
                          >
                            {pumpOptions.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.summary ? `${option.summary} (${option.key})` : option.key}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <Button size="sm" onClick={handlePumpSave} isDisabled={pumpSaving || pumpLoading || !pumpSelectedKey}>
                          Confirmar
                        </Button>
                      </>
                    )}
                  </Stack>
                )}
              </ModalBody>
              <ModalFooter>
                <Button size="sm" variant="ghost" onClick={closeTransitionModal}>
                  Cancelar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Modal isOpen={controlBreakdownModal.open} onClose={closeControlBreakdownModal} isCentered size="md" blockScrollOnMount={false} returnFocusOnClose={false}>
            <ModalOverlay bg="transparent" />
            <ModalContent maxH="85dvh" maxW="95vw" display="flex" flexDirection="column">
              <ModalHeader flexShrink={0}>Razón de la rotura o mal funcionamiento</ModalHeader>
              <ModalBody overflowY="auto" flex="1" minH={0} py={2}>
                <FormControl isRequired>
                  <FormLabel>Explique la razón de la rotura o mal funcionamiento:</FormLabel>
                  <Textarea
                    value={controlBreakdownExplanation}
                    onChange={(e) => setControlBreakdownExplanation(e.target.value)}
                    placeholder="Describa el problema..."
                    rows={4}
                    size="sm"
                    fontSize="16px"
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter flexShrink={0} flexWrap="wrap" gap={2}>
                <Stack direction={{ base: 'column', sm: 'row' }} w="100%" spacing={2}>
                  <Button type="button" size="sm" variant="ghost" onClick={() => closeControlBreakdownModal()} minH="44px" flex={1}>
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" colorScheme="blue" onClick={handleControlTransitionWithExplanation} isDisabled={controlTransitionSaving || !controlBreakdownExplanation.trim()} minH="44px" flex={1}>
                    {controlTransitionSaving ? <Spinner size="xs" /> : 'Confirmar cambio de estado'}
                  </Button>
                </Stack>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Box
            position="absolute"
            inset={0}
            w="100%"
            h={diagramAreaHeight != null ? `${diagramAreaHeight}px` : '100%'}
            minH={diagramAreaHeight != null ? `${diagramAreaHeight}px` : '100dvh'}
          >
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={filteredActiveNodes}
              edges={filteredActiveEdges}
              onNodesChange={activeOnNodesChange}
              onEdgesChange={activeOnEdgesChange}
              onConnect={onConnect}
              fitView
              fitViewOptions={{
                padding: 0.28,
                includeHiddenNodes: true,
                minZoom: 0.4,
                maxZoom: 2
              }}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              defaultViewport={{ x: 0, y: 0, zoom: 0.88 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
              panOnScroll={false}
              zoomOnPinch={true}
              preventScrolling={false}
              translateExtent={VIEW_BOUNDS}
              nodeExtent={VIEW_BOUNDS}
            >
              <Background gap={16} color="#EDF2F7" />
            </ReactFlow>
          </Box>
          </>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box minH="100dvh" bg="gray.50" py={{ base: 2, md: 6 }}>
      <Container maxW={{ base: 'full', lg: '7xl' }} px={{ base: 2, md: 4 }}>
        <Modal isOpen={transitionOpen} onClose={closeTransitionModal} isCentered size="md">
          <ModalOverlay bg="transparent" />
          <ModalContent>
            <ModalHeader>
              <HStack justify="space-between">
                <Text>Transiciones</Text>
                {transitionNode?.data?.issueKey && <Badge colorScheme="blue">{transitionNode.data.issueKey}</Badge>}
              </HStack>
              <HStack spacing={2} fontSize="sm" color="gray.600">
                <Text>Estado actual:</Text>
                {transitionNode?.data?.status ? transitionBadge(transitionNode.data.status) : <Text>Sin datos</Text>}
              </HStack>
            </ModalHeader>
            <ModalBody>
              {transitionLoading && <Text fontSize="sm">Cargando transiciones...</Text>}
              {!transitionLoading && transitionOptions.length === 0 && (
                <Text fontSize="sm">No hay transiciones disponibles.</Text>
              )}
              {!transitionLoading && transitionOptions.length > 0 && (
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                  {transitionOptions
                    .filter((t) => t.name.toLowerCase() !== 'por hacer')
                    .map((t) => (
                      <Button
                        key={t.id}
                        size="sm"
                        variant="outline"
                        onClick={() => (t.requiresBreakdownComment ? openDiagramBreakdownModal(t.id, t.name) : handleTransition(t.id))}
                      >
                        {transitionButtonLabel(t)}
                      </Button>
                    ))}
                </SimpleGrid>
              )}
              {isWaterFieldNode && (
                <Stack spacing={2} mt={4} pt={3} borderTop="1px solid" borderColor="gray.200">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold">
                      {WATER_FIELD_LABEL}
                    </Text>
                    {waterFieldSaving && <Spinner size="xs" />}
                  </HStack>
                  <Text fontSize="xs" color="gray.600">
                    Actual: {currentWaterField || 'Sin datos'}
                  </Text>
                  {waterFieldLoading ? (
                    <Text fontSize="sm">Cargando opciones...</Text>
                  ) : (
                    <FormControl>
                      <FormLabel fontSize="xs" mb={1}>
                        Nuevo valor
                      </FormLabel>
                      {waterFieldOptions.length > 0 ? (
                        waterFieldIsMulti ? (
                          <Select
                            size="sm"
                            value={waterFieldValues}
                            onChange={(event) => {
                              const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                              setWaterFieldValues(selected)
                            }}
                            multiple
                          >
                            {waterFieldOptions.map((option) => (
                              <option key={option.id ?? option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Select
                            size="sm"
                            value={waterFieldValue}
                            onChange={(event) => setWaterFieldValue(event.target.value)}
                            placeholder="Seleccionar"
                          >
                            {waterFieldOptions.map((option) => (
                              <option key={option.id ?? option.value} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </Select>
                        )
                      ) : (
                        waterFieldIsMulti ? (
                          <Input
                            size="sm"
                            value={waterFieldValues.join(', ')}
                            onChange={(event) => {
                              const values = event.target.value
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean)
                              setWaterFieldValues(values)
                            }}
                            placeholder="Ingresar valores separados por coma"
                          />
                        ) : (
                          <Input
                            size="sm"
                            value={waterFieldValue}
                            onChange={(event) => setWaterFieldValue(event.target.value)}
                            placeholder="Ingresar valor"
                          />
                        )
                      )}
                    </FormControl>
                  )}
                  <Button size="sm" onClick={handleWaterFieldSave} isDisabled={waterFieldSaving || waterFieldLoading}>
                    Guardar
                  </Button>
                </Stack>
              )}
              {isPuestoModal && (
                <Stack spacing={2} mt={4} pt={3} borderTop="1px solid" borderColor="gray.200">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold">
                      Bombas / Sopladores
                    </Text>
                    {pumpSaving && <Spinner size="xs" />}
                  </HStack>
                  {pumpLoading ? (
                    <Text fontSize="sm">Cargando bombas y sopladores...</Text>
                  ) : pumpOptions.length === 0 ? (
                    <Text fontSize="sm">No hay bombas o sopladores conectados.</Text>
                  ) : (
                    <>
                      <Text fontSize="xs" color="gray.600">
                        Actual: {activePump?.summary ? `${activePump.summary} (${activePump.key})` : pumpActiveKey || 'Sin selección'}
                      </Text>
                      <Stack spacing={1}>
                        {pumpOptions.map((option) => {
                          const isActive = option.key === pumpActiveKey
                          return (
                            <Box
                              key={option.key}
                              borderWidth="1px"
                              borderRadius="md"
                              p={2}
                              bg={isActive ? 'green.50' : 'orange.50'}
                              borderColor={isActive ? 'green.300' : 'orange.300'}
                              _dark={{ bg: isActive ? 'green.900' : 'orange.900', borderColor: isActive ? 'green.600' : 'orange.600' }}
                            >
                              {isActive && (
                                <Text fontSize="xs" fontWeight="bold" mb={1}>En uso</Text>
                              )}
                              {option.inUseElsewhere && !isActive && (
                                <Text fontSize="xs" fontWeight="semibold" color="orange.600" _dark={{ color: 'orange.300' }} mb={1}>
                                  En uso en otro puesto
                                </Text>
                              )}
                              <HStack justify="space-between">
                                <Text fontSize="sm" fontWeight={isActive ? 'bold' : undefined}>{option.summary || option.key}</Text>
                                {option.status ? transitionBadge(option.status) : <Badge colorScheme="gray">Sin estado</Badge>}
                              </HStack>
                              <Text fontSize="xs" color="gray.600">
                                {option.issueType || 'Tipo'} • {option.key}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Epic: {option.epicSummary ? `${option.epicSummary} (${option.epicKey})` : option.epicKey || 'Sin Epic'}
                              </Text>
                            </Box>
                          )
                        })}
                      </Stack>
                      <FormControl>
                        <FormLabel fontSize="xs" mb={1}>
                          Seleccionar
                        </FormLabel>
                        <Select
                          size="sm"
                          value={pumpSelectedKey}
                          onChange={(event) => setPumpSelectedKey(event.target.value)}
                          placeholder="Seleccionar"
                        >
                          {pumpOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.summary ? `${option.summary} (${option.key})` : option.key}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <Button size="sm" onClick={handlePumpSave} isDisabled={pumpSaving || pumpLoading || !pumpSelectedKey}>
                        Confirmar
                      </Button>
                    </>
                  )}
                </Stack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button size="sm" variant="ghost" onClick={closeTransitionModal}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={controlBreakdownModal.open} onClose={closeControlBreakdownModal} isCentered size="md" blockScrollOnMount={false} returnFocusOnClose={false}>
          <ModalOverlay bg="transparent" />
          <ModalContent maxH="85dvh" maxW="95vw" display="flex" flexDirection="column">
            <ModalHeader flexShrink={0}>Razón de la rotura o mal funcionamiento</ModalHeader>
            <ModalBody overflowY="auto" flex="1" minH={0} py={2}>
              <FormControl isRequired>
                <FormLabel>Explique la razón de la rotura o mal funcionamiento:</FormLabel>
                <Textarea
                  value={controlBreakdownExplanation}
                  onChange={(e) => setControlBreakdownExplanation(e.target.value)}
                  placeholder="Describa el problema..."
                  rows={4}
                  size="sm"
                  fontSize="16px"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter flexShrink={0} flexWrap="wrap" gap={2}>
              <Stack direction={{ base: 'column', sm: 'row' }} w="100%" spacing={2}>
                <Button type="button" size="sm" variant="ghost" onClick={() => closeControlBreakdownModal()} minH="44px" flex={1}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" colorScheme="blue" onClick={handleControlTransitionWithExplanation} isDisabled={controlTransitionSaving || !controlBreakdownExplanation.trim()} minH="44px" flex={1}>
                  {controlTransitionSaving ? <Spinner size="xs" /> : 'Confirmar cambio de estado'}
                </Button>
              </Stack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Heading size={{ base: "md", md: "lg" }} mb={2}>Control hidráulico</Heading>
        <Text color="gray.600" mb={4} fontSize={{ base: "sm", md: "md" }}>Vista preliminar • {displayLabel}</Text>
        
        {/* Layout desktop */}
        <Flex direction={{ base: "column", lg: "row" }} gap={4} align="stretch">
          {currentGroup !== 'control' && (
          <Box 
            w={{ lg: '220px' }} 
            bg="white" 
            borderWidth="1px" 
            borderRadius="lg" 
            p={{ base: 3, md: 4 }}
            order={{ lg: 1 }}
            display={{ base: "none", lg: "block" }}
          >
            <Heading size="sm" mb={2}>Sistemas</Heading>
            <Text fontSize="sm" color="gray.600">Próximamente</Text>
            <Divider my={4} />
            <Text fontSize="xs" color="gray.600">Consejo: hacé zoom con la rueda del mouse y arrastrá el lienzo.</Text>
            <Divider my={2} />
            <Text fontSize="xs" color="gray.600">💡 Las cañerías son pulsables para ver información técnica.</Text>
            <Divider my={2} />
            <Text fontSize="xs" color="gray.600">👆 Pasá el cursor sobre las cañerías de servicios para ver su nombre.</Text>
            <Divider my={2} />
            <Text fontSize="xs" color="gray.600">🔒 Diagrama fijo - elementos no movibles.</Text>
          </Box>
          )}
          
          <Box 
            flex="1" 
            w="full"
            minW={{ base: '100%', lg: '720px' }} 
            bg="white" 
            borderWidth="1px" 
            borderRadius="lg" 
            h={{ base: "75vh", md: "80vh", lg: "90vh" }}
            minH={{ base: "75vh", md: "80vh", lg: "90vh" }}
            p={0} 
            overflow="hidden"
            position="relative"
            order={{ base: 1, lg: 2 }}
          >
            <div className="system-menu">
              <button
                type="button"
                className={`menu-button${menuOpen ? ' open' : ''}`}
                onClick={() =>
                  setMenuOpen((prev) => {
                    const next = !prev
                    if (next) setMenuLevel('group')
                    return next
                  })
                }
                aria-label="Abrir menú de sistemas"
              >
                <span />
                <span />
                <span />
              </button>
              {menuOpen && (
                <div className="menu-dropdown">
                  {menuLevel === 'group' && (
                    <>
                      {SYSTEM_GROUPS.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className={`menu-item${currentGroup === group.id ? ' active' : ''}`}
                          onClick={() => {
                            setCurrentGroup(group.id)
                            setMenuLevel('system')
                          }}
                        >
                          {group.label}
                        </button>
                      ))}
                    </>
                  )}
                  {menuLevel === 'system' && (
                    <>
                      <div className="menu-header">
                        <button type="button" className="menu-back" onClick={() => setMenuLevel('group')}>
                          ← Grupos
                        </button>
                        <span className="menu-title">{currentGroupLabel}</span>
                      </div>
                      {currentGroup === 'parque' && (sala4Systems.length > 0 || sala5Systems.length > 0) && (
                        <div className="menu-subtitle">Resto de sistemas</div>
                      )}
                      {regularSystems.map((sys) => (
                        <button
                          key={sys.id}
                          type="button"
                          className={`menu-item${currentSystem === sys.id ? ' active' : ''}`}
                          onClick={() => handleSelectSystem(sys.id)}
                        >
                          {sys.label}
                        </button>
                      ))}
                      {sala4Systems.length > 0 && (
                        <>
                          <div className="menu-subtitle">Sistemas Sala 4</div>
                          {sala4Systems.map((sys) => (
                            <button
                              key={sys.id}
                              type="button"
                              className={`menu-item${currentSystem === sys.id ? ' active' : ''}`}
                              onClick={() => handleSelectSystem(sys.id)}
                            >
                              {sys.label}
                            </button>
                          ))}
                        </>
                      )}
                      {sala5Systems.length > 0 && (
                        <>
                          <div className="menu-subtitle">Sistemas Sala 5</div>
                          {sala5Systems.map((sys) => (
                            <button
                              key={sys.id}
                              type="button"
                              className={`menu-item${currentSystem === sys.id ? ' active' : ''}`}
                              onClick={() => handleSelectSystem(sys.id)}
                            >
                              {sys.label}
                            </button>
                          ))}
                        </>
                      )}
                      {systemsForGroup.length === 0 && (
                        <div className="menu-empty">No hay sistemas cargados.</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: 'max(20px, calc(env(safe-area-inset-top, 0px) + 12px))',
                right: 'max(24px, calc(env(safe-area-inset-right, 0px) + 16px))',
                zIndex: 10,
                background: displayLabel === 'Control' ? '#FDE047' : '#FEEBC8',
                border: displayLabel === 'Control' ? '1px solid #FACC15' : '1px solid #F6AD55',
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 14,
                fontWeight: 600,
                color: displayLabel === 'Control' ? '#422006' : '#7B341E',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                whiteSpace: 'nowrap'
              }}
            >
              {displayLabel}
            </div>
            {currentGroup === 'control' ? (
            <Box pt={1} px={3} pb={4} overflowY="auto" h="100%" position="absolute" inset={0} top={44}>
              {controlLoading ? (
                <Flex justify="center" align="center" h="50%">
                  <Spinner size="lg" color="gray.300" />
                </Flex>
              ) : (
                <Stack spacing={5}>
                  {['Bomba', 'Soplador', 'Lanchón'].concat(
                    Object.keys(controlListByType).filter((k) => !['Bomba', 'Soplador', 'Lanchón'].includes(k))
                  ).map((type) => {
                    const items = controlListByType[type] || []
                    if (items.length === 0) return null
                    return (
                      <Box key={type}>
                        <Heading size="sm" mb={2} sx={{ color: 'white' }}>{type}</Heading>
                        <Stack spacing={2}>
                          {items.map((item) => (
                            <Box
                              key={item.key}
                              p={3}
                              bg="gray.800"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor="gray.600"
                              cursor="pointer"
                              onClick={() => openControlEpicModal(item)}
                              _hover={{ bg: 'gray.700' }}
                            >
                              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                <Badge colorScheme="blue">{item.key}</Badge>
                                {item.status ? transitionBadge(item.status) : <Badge colorScheme="gray">Sin estado</Badge>}
                              </HStack>
                              <Text fontSize="sm" fontWeight="medium" mt={1} color="gray.100">{item.summary || item.key}</Text>
                              <Text fontSize="xs" color="gray.400">
                                Epic: {item.epicSummary ? `${item.epicSummary} (${item.epicKey})` : item.epicKey || 'Sin Epic'}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              )}
              <Modal isOpen={!!controlEpicModalItem} onClose={closeControlEpicModal} isCentered size="md">
                <ModalOverlay bg="transparent" />
                <ModalContent>
                  <ModalHeader>
                    {controlEpicModalItem && (
                      <>
                        <Text fontWeight="bold" noOfLines={2}>{controlEpicModalItem.summary || controlEpicModalItem.key}</Text>
                        <HStack mt={1}>
                          <Badge colorScheme="blue">{controlEpicModalItem.key}</Badge>
                        </HStack>
                      </>
                    )}
                  </ModalHeader>
                  <ModalBody>
                    <Stack spacing={4}>
                      <Box>
                        <Text fontWeight="semibold" mb={2}>Transiciones</Text>
                        <HStack spacing={2} fontSize="sm" color="gray.600" mb={2}>
                          <Text>Estado actual:</Text>
                          {controlEpicModalItem?.status ? transitionBadge(controlEpicModalItem.status) : <Text>Sin datos</Text>}
                        </HStack>
                        {controlTransitionLoading ? (
                          <Text fontSize="sm">Cargando transiciones...</Text>
                        ) : controlTransitionOptions.length === 0 ? (
                          <Text fontSize="sm">No hay transiciones disponibles.</Text>
                        ) : (
                          <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
                            {controlTransitionOptions
                              .filter((t) => t.name.toLowerCase() !== 'por hacer')
                              .map((t) => (
                                <Button
                                  key={t.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => (isTransitionToYellowOrRed(t) ? openControlBreakdownModal(t.id, t.name) : handleControlTransition(t.id))}
                                  isDisabled={controlTransitionSaving}
                                >
                                  {transitionButtonLabel(t)}
                                </Button>
                              ))}
                          </SimpleGrid>
                        )}
                      </Box>
                      <Divider />
                      <FormControl>
                        <FormLabel>Epic asociado</FormLabel>
                        {controlEpicLoading ? (
                          <Text fontSize="sm">Cargando epics...</Text>
                        ) : (
                          <Select
                            size="sm"
                            value={controlEpicValue}
                            onChange={(e) => setControlEpicValue(e.target.value)}
                          >
                            <option value="">Sin Epic</option>
                            {controlEpicOptions.map((epic) => (
                              <option key={epic.key} value={epic.key}>
                                {epic.summary} ({epic.key})
                              </option>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    </Stack>
                  </ModalBody>
                  <ModalFooter>
                    <Button size="sm" variant="ghost" onClick={closeControlEpicModal}>
                      Cancelar
                    </Button>
                    <Button size="sm" colorScheme="blue" onClick={handleControlEpicSave} isDisabled={controlEpicSaving || controlEpicLoading}>
                      {controlEpicSaving ? <Spinner size="xs" /> : 'Guardar'}
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
              <Modal isOpen={controlBreakdownModal.open} onClose={closeControlBreakdownModal} isCentered size="md" blockScrollOnMount={false} returnFocusOnClose={false}>
                <ModalOverlay bg="transparent" />
                <ModalContent maxH="85dvh" maxW="95vw" display="flex" flexDirection="column">
                  <ModalHeader flexShrink={0}>Razón de la rotura o mal funcionamiento</ModalHeader>
                  <ModalBody overflowY="auto" flex="1" minH={0} py={2}>
                    <FormControl isRequired>
                      <FormLabel>Explique la razón de la rotura o mal funcionamiento:</FormLabel>
                      <Textarea
                        value={controlBreakdownExplanation}
                        onChange={(e) => setControlBreakdownExplanation(e.target.value)}
                        placeholder="Describa el problema..."
                        rows={4}
                        size="sm"
                        fontSize="16px"
                      />
                    </FormControl>
                  </ModalBody>
                  <ModalFooter flexShrink={0} flexWrap="wrap" gap={2}>
                    <Stack direction={{ base: 'column', sm: 'row' }} w="100%" spacing={2}>
                      <Button type="button" size="sm" variant="ghost" onClick={() => closeControlBreakdownModal()} minH="44px" flex={1}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" colorScheme="blue" onClick={handleControlTransitionWithExplanation} isDisabled={controlTransitionSaving || !controlBreakdownExplanation.trim()} minH="44px" flex={1}>
                        {controlTransitionSaving ? <Spinner size="xs" /> : 'Confirmar cambio de estado'}
                      </Button>
                    </Stack>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Box>
            ) : (
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={filteredActiveNodes}
              edges={filteredActiveEdges}
              onNodesChange={activeOnNodesChange}
              onEdgesChange={activeOnEdgesChange}
              onConnect={onConnect}
              fitView
              fitViewOptions={{ 
                padding: 0.28, 
                includeHiddenNodes: true,
                minZoom: 0.4,
                maxZoom: 2
              }}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              defaultViewport={{ x: 0, y: 0, zoom: 0.88 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
              panOnScroll={false}
              zoomOnPinch={true}
              preventScrolling={false}
              translateExtent={VIEW_BOUNDS}
              nodeExtent={VIEW_BOUNDS}
            >
              <Background gap={16} color="#EDF2F7" />
            </ReactFlow>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default App
