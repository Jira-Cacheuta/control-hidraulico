import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'

const TEXT = '#2D3748'

/** Si el texto tiene más de un string (palabra), devuelve uno por línea para apilar en el ícono. */
function getLabelLinesStacked(label: string): string[] {
  const words = label.replace(/\n/g, ' ').trim().split(/\s+/).filter(Boolean)
  return words.length > 0 ? words : [label.trim() || '']
}

function ShapeText({ text, color = TEXT, fontSize = 11 }: { text: string; color?: string; fontSize?: number }) {
  const lines = getLabelLinesStacked(text)
  const fs = lines.length > 2 ? Math.max(8, fontSize - 2) : fontSize
  const dy = lines.length > 2 ? 10 : 14
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={color}>
      {lines.map((line, idx) => (
        <tspan key={`${line}-${idx}`} x="50%" dy={idx === 0 ? (lines.length > 1 ? -(lines.length - 1) * (dy / 2) : 0) : dy}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function ServiceText({ text }: { text: string }) {
  const lines = getLabelLinesStacked(text)
  const fs = lines.length > 2 ? 8 : 10
  const dy = lines.length > 2 ? 10 : 12
  return (
    <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={TEXT}>
      {lines.map((line, idx) => (
        <tspan key={`${line}-${idx}`} x="50%" dy={idx === 0 ? (lines.length > 1 ? -(lines.length - 1) * (dy / 2) : 0) : dy}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

const STATUS_SQUARE_SIZE = '1.2em'

function isYellowStatus(status: string) {
  const s = (status || '').trim()
  return s === '🟨' || /yellow|amarillo/i.test(s)
}

function isRedStatus(status: string) {
  const s = (status || '').trim()
  return s === '🟥' || /red|rojo/i.test(s)
}

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
        width: STATUS_SQUARE_SIZE,
        height: STATUS_SQUARE_SIZE,
        backgroundImage: 'linear-gradient(#FF8F00, #FF8F00)',
        backgroundColor: '#FF8F00',
        borderRadius: 4,
        boxShadow: '0 0 6px rgba(255, 143, 0, 0.8), 0 0 12px rgba(255, 143, 0, 0.5)'
      }}
    />
  </span>
)

/** Cuadrado rojo con color CSS: rojo vivo para que se vea bien en móvil. */
const RedSquare = () => (
  <span
    style={{
      display: 'inline-block',
      width: STATUS_SQUARE_SIZE,
      height: STATUS_SQUARE_SIZE,
      backgroundColor: '#E53935',
      borderRadius: 2,
      verticalAlign: 'middle'
    }}
    aria-label="Rojo"
  />
)

function StatusBadge({
  status,
  bottom,
  top
}: {
  status?: string
  bottom?: number
  top?: number
}) {
  if (!status) return null
  const positionStyle =
    typeof top === 'number'
      ? { top }
      : { bottom: typeof bottom === 'number' ? bottom : 8 }
  const isYellow = isYellowStatus(status)
  const isRed = isRedStatus(status)
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        ...positionStyle,
        transform: 'translateX(-50%)',
        background: 'white',
        border: isYellow ? '1px solid #FDE047' : isRed ? '1px solid #EF5350' : '1px solid #CBD5E0',
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 11,
        lineHeight: 1.2,
        color: TEXT,
        whiteSpace: 'nowrap',
        zIndex: 2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
      }}
    >
      {isYellow ? <YellowSquare /> : isRed ? <RedSquare /> : status}
    </div>
  )
}

// Nodo para cañería de succión (círculo verde)
export function SuctionNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#DFF7E3" stroke="#2F855A" strokeWidth="3" />
        <ShapeText text={data?.label ?? 'Cañería Succión'} />
      </svg>
      <StatusBadge status={data?.status} bottom={6} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo para cañerías (horizontal) - sin flechas, más gruesas
export function PipeNode({ data }: NodeProps) {
  const width = 360
  const rawLineStart = typeof data?.lineStart === 'number' ? data.lineStart : 0
  const rawLineEnd = typeof data?.lineEnd === 'number' ? data.lineEnd : width
  const lineStart = Math.max(0, Math.min(width, rawLineStart))
  const lineEnd = Math.max(lineStart, Math.min(width, rawLineEnd))
  return (
    <div style={{ width, height: 18, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} 18`}>
        <line x1={lineStart} y1="9" x2={lineEnd} y2="9" stroke="#4A90E2" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <StatusBadge status={data?.status} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ top: '50%', left: '50%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="out0" style={{ left: '0%', top: '50%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="out1" style={{ left: '20%', top: '50%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="out2" style={{ left: '40%', top: '50%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="out3" style={{ left: '60%', top: '50%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="out4" style={{ left: '80%', top: '50%', opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="out5" style={{ left: '100%', top: '50%', opacity: 0 }} />
    </div>
  )
}

export function PipeSegmentNode({ data }: NodeProps) {
  return (
    <div style={{ width: 40, height: 40, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="#DFF7E3" stroke="#2F855A" strokeWidth="3" />
        <text x="20" y="22" textAnchor="middle" fontSize="8" fill={TEXT}>Cañería</text>
      </svg>
      <StatusBadge status={data?.status} bottom={-12} />
      <Handle type="source" position={Position.Bottom} id="out-bottom" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
    </div>
  )
}

/** Barra en T azul: vertical que une con la línea del puesto + horizontal que llega solo hasta las verticales a las cañerías. Uniones suavizadas. */
export function TeeBarNode(_data: NodeProps) {
  const w = 200
  const h = 40
  const strokeW = 8
  const xLeft = w * 0.2
  const xRight = w * 0.8
  const xCenter = w / 2
  const yBar = h
  const d = `M ${xCenter} 0 L ${xCenter} ${yBar} L ${xLeft} ${yBar} L ${xCenter} ${yBar} L ${xRight} ${yBar}`
  return (
    <div style={{ width: w, height: h, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        <path d={d} fill="none" stroke="#4A90E2" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Handle type="target" position={Position.Top} id="in-top" style={{ left: '50%', top: 0, transform: 'translate(-50%, -50%)', opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom-left" style={{ left: '20%', top: '100%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom-right" style={{ left: '80%', top: '100%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
    </div>
  )
}

export function StationNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="#E9D8FD" stroke="#6B46C1" strokeWidth="3" />
        <ShapeText text={data?.label ?? 'Puesto'} />
      </svg>
      <StatusBadge status={data?.status} bottom={6} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="in-left" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="in-right" style={{ opacity: 0 }} />
      <Handle
        type="target"
        position={Position.Left}
        id="in-diag"
        style={{ left: '0%', top: '34%', transform: 'translate(-50%, -50%)', opacity: 0 }}
      />
      <Handle type="source" position={Position.Bottom} id="out-bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom-center" style={{ left: '50%', top: '100%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom-left" style={{ left: '35%', top: '100%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom-right" style={{ left: '65%', top: '100%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
    </div>
  )
}

// Nodo para tablero eléctrico (cuadrado delineado)
export function ElectricNode({ data }: NodeProps) {
  return (
    <div
      style={{
        width: 'clamp(90px, 12vw, 140px)',
        height: 'clamp(90px, 12vw, 140px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ display: 'block' }}>
        <polygon points="62,10 30,70 58,70 46,110 90,50 62,50" fill="#ECC94B" stroke="#B7791F" strokeWidth="3" />
      </svg>
      <div style={{ marginTop: -6, fontSize: 12, color: TEXT, textAlign: 'center', lineHeight: 1 }}>
        {data?.label ?? 'Comp. Eléctrico'}
      </div>
      {data?.status && (() => {
        const yellow = isYellowStatus(data.status)
        const red = isRedStatus(data.status)
        return (
          <div
            style={{
              marginTop: 6,
              background: 'white',
              border: yellow ? '1px solid #FDE047' : red ? '1px solid #EF5350' : '1px solid #CBD5E0',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 11,
              lineHeight: 1.2,
              color: TEXT,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
            }}
          >
            {yellow ? <YellowSquare /> : red ? <RedSquare /> : data.status}
          </div>
        )
      })()}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo para bomba (estrella negra)
// Solo summary dentro del ícono; si el summary tiene varias palabras (ej. "Soplador 1143"), una debajo de la otra
export function PumpNode({ data }: NodeProps) {
  const baseLabel = data?.label ?? 'Bomba'
  const labelPosition = data?.labelPosition as 'top' | 'inside' | undefined
  const showTopLabel = labelPosition === 'top'
  const summary = data?.summary?.trim()
  const displayLines: string[] = summary
    ? summary.split(/\s+/).filter(Boolean)
    : [baseLabel]

  const lineHeight = 11
  const fontSize = displayLines.length > 2 ? 9 : 10
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      {showTopLabel && (
        <div
          style={{
            position: 'absolute',
            top: -Math.max(12, displayLines.length * 12),
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            color: TEXT,
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          {displayLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      )}
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <polygon points="60,8 72,42 108,42 79,62 90,96 60,75 30,96 41,62 12,42 48,42" fill="#111111" stroke="#000000" strokeWidth="2" />
        {!showTopLabel && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fill="#FFFFFF">
            {displayLines.map((line, idx) => (
              <tspan key={line} x="50%" dy={idx === 0 ? (displayLines.length > 1 ? -(displayLines.length - 1) * (lineHeight / 2) : 0) : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        )}
      </svg>
      <StatusBadge status={data?.status} bottom={6} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle
        type="source"
        position={Position.Right}
        id="out-diag"
        style={{ left: '82%', top: '58%', transform: 'translate(-50%, -50%)', opacity: 0 }}
      />
      <Handle type="source" position={Position.Left} id="out-left" style={{ left: 0, top: '34%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
    </div>
  )
}

// Nodo Filtro: heptágono gris, más chico que el resto
export function FilterNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(48px, 7vw, 64px)', height: 'clamp(48px, 7vw, 64px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <polygon
          points="50,12 80,26 87,58 66,84 34,84 13,58 20,26"
          fill="#A0AEC0"
          stroke="#4A5568"
          strokeWidth="2"
        />
        <ShapeText text={data?.label ?? 'Filtro'} fontSize={11} color="#2D3748" />
      </svg>
      <StatusBadge status={data?.status} bottom={2} />
      <Handle type="target" position={Position.Right} id="in-right" style={{ left: '100%', top: '62%', transform: 'translate(-50%, -50%)', opacity: 0 }} />
    </div>
  )
}

// Nodo Circulación: ola azul chica, servicio (summary desde Jira). Texto dentro de la ola; estado abajo para no tapar. size='large' para Sala 2/3/4.
export function WaveServiceNode({ data }: NodeProps) {
  const label = data?.label ?? 'Circulación'
  const lines = getLabelLinesStacked(label)
  const isLarge = data?.size === 'large'
  const fs = isLarge ? (lines.length > 2 ? 8 : 9) : (lines.length > 2 ? 8 : 10)
  const dy = isLarge ? (lines.length > 2 ? 9 : 10) : (lines.length > 2 ? 9 : 11)
  const statusBottom = typeof data?.statusBottom === 'number' ? data.statusBottom : -14
  const sizeStyle = isLarge
    ? { width: 'clamp(125px, 16vw, 170px)', height: 'clamp(85px, 11vw, 120px)' }
    : { width: 'clamp(70px, 9vw, 100px)', height: 'clamp(50px, 7vw, 70px)' }
  return (
    <div style={{ ...sizeStyle, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 80">
        <path
          d="M0 40 C25 18 45 18 60 40 C75 62 95 62 120 40 L120 80 L0 80 Z"
          fill="#90CDF4"
          stroke="#2B6CB0"
          strokeWidth="2"
        />
        <text x="28%" y="68%" textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={TEXT}>
          {lines.map((line, idx) => (
            <tspan key={`${line}-${idx}`} x="28%" dy={idx === 0 ? (lines.length > 1 ? -(lines.length - 1) * (dy / 2) : 0) : dy}>
              {line}
            </tspan>
          ))}
        </text>
      </svg>
      <StatusBadge status={data?.status} bottom={statusBottom} top={data?.statusTop} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo para válvula (rombo/paralelogramo delineado)
export function ValveNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <polygon points="60,10 110,60 60,110 10,60" fill="#C6F6D5" stroke="#2F855A" strokeWidth="3" />
        <ShapeText text={data?.label ?? 'Llave'} />
      </svg>
      <StatusBadge status={data?.status} bottom={20} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-main" style={{ opacity: 0 }} />
    </div>
  )
}

export function RedValveNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <polygon points="60,10 110,60 60,110 10,60" fill="#FEB2B2" stroke="#C53030" strokeWidth="3" />
        <ShapeText text={data?.label ?? 'Llave'} />
      </svg>
      <StatusBadge status={data?.status} bottom={20} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-main" style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo para servicios finales (círculo delineado)
export function ServiceNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <path
          d="M60 12 C42 36 30 52 30 70 C30 92 43 106 60 106 C77 106 90 92 90 70 C90 52 78 36 60 12 Z"
          fill="#90CDF4"
          stroke="#2B6CB0"
          strokeWidth="3"
        />
        <ServiceText text={data?.label ?? 'Servicio'} />
      </svg>
      <StatusBadge status={data?.status} bottom={data?.statusBottom} top={data?.statusTop} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom" style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo para válvula triangular (punta hacia abajo)
export function TriangleValveNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <polygon points="60,108 110,20 10,20" fill="#FBD38D" stroke="#C05621" strokeWidth="3" />
        <ShapeText text={data?.label ?? 'Válvula'} fontSize={10} />
      </svg>
      <StatusBadge status={data?.status} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="in-left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom" style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo para pulsador (elipse chata rosada)
export function PulsadorNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 10vw, 120px)', height: 'clamp(40px, 6vw, 60px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 60">
        <rect x="8" y="12" width="104" height="36" rx="18" ry="18" fill="#FED7E2" stroke="#D53F8C" strokeWidth="3" />
        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={TEXT}>
          {data?.label ?? 'Pulsador'}
        </text>
      </svg>
      <StatusBadge status={data?.status} bottom={-12} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out-bottom" style={{ opacity: 0 }} />
    </div>
  )
}

// Nodo de servicio tipo nube blanca
export function CloudServiceNode({ data }: NodeProps) {
  const label = data?.label ?? 'Abanico'
  const lines = getLabelLinesStacked(label)
  const fs = lines.length > 2 ? 8 : 10
  const dy = lines.length > 2 ? 10 : 12
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(70px, 10vw, 110px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 140 100">
        <path
          d="M40 70 C25 70 15 60 15 48 C15 36 25 27 38 27 C42 16 52 10 64 10 C78 10 90 18 94 30 C110 30 123 42 123 58 C123 73 111 84 96 84 L42 84 C30 84 20 78 20 68"
          fill="#FFFFFF"
          stroke="#A0AEC0"
          strokeWidth="3"
        />
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={TEXT}>
          {lines.map((line: string, idx: number) => (
            <tspan key={`${line}-${idx}`} x="50%" dy={idx === 0 ? (lines.length > 1 ? -(lines.length - 1) * (dy / 2) : 0) : dy}>
              {line}
            </tspan>
          ))}
        </text>
      </svg>
      <StatusBadge status={data?.status} bottom={data?.statusBottom} top={data?.statusTop} />
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
    </div>
  )
}

export function HydroSystemNode({ data }: NodeProps) {
  return (
    <div style={{ width: 'clamp(90px, 12vw, 140px)', height: 'clamp(90px, 12vw, 140px)', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 120 120">
        <polygon points="60,8 108,42 90,108 30,108 12,42" fill="#A0AEC0" stroke="#4A5568" strokeWidth="2" />
        <ShapeText text={data?.label ?? 'Sist. Hidro'} color="#FFFFFF" fontSize={10} />
      </svg>
      <Handle type="target" position={Position.Top} id="in-top" style={{ opacity: 0 }} />
    </div>
  )
}

export const nodeTypes = {
  suction: SuctionNode,
  pipe: PipeNode,
  pipeSegment: PipeSegmentNode,
  teeBar: TeeBarNode,
  station: StationNode,
  electric: ElectricNode,
  pump: PumpNode,
  filter: FilterNode,
  waveService: WaveServiceNode,
  valve: ValveNode,
  valveRed: RedValveNode,
  valveTriangle: TriangleValveNode,
  pulsador: PulsadorNode,
  service: ServiceNode,
  cloudService: CloudServiceNode,
  hydroSystem: HydroSystemNode,
}


