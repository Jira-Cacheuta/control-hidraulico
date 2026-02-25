import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import axios from 'axios'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true })

const {
  PORT = 4000,
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
  JIRA_PROJECT_KEY,
  JIRA_ISSUE_KEYS
} = process.env

const app = express()

app.use(cors({ origin: true }))
app.use(express.json())
app.use(morgan('dev'))

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`)
  }
}

const jiraBaseUrl = () => (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '')

function getJiraClient() {
  requireEnv(JIRA_BASE_URL, 'JIRA_BASE_URL')
  requireEnv(JIRA_EMAIL, 'JIRA_EMAIL')
  requireEnv(JIRA_API_TOKEN, 'JIRA_API_TOKEN')

  return axios.create({
    baseURL: `${jiraBaseUrl()}/rest/api/3`,
    auth: {
      username: process.env.JIRA_EMAIL,
      password: process.env.JIRA_API_TOKEN
    },
    headers: { Accept: 'application/json' }
  })
}

/** GET issue con issuelinks usando API v2; en v2 los links suelen traer "id" para poder borrarlos. */
async function getIssueLinksV2(issueKey) {
  const base = jiraBaseUrl()
  const auth = { username: process.env.JIRA_EMAIL, password: process.env.JIRA_API_TOKEN }
  const key = encodeURIComponent(issueKey)
  const { data } = await axios.get(`${base}/rest/api/2/issue/${key}`, {
    params: { fields: 'issuelinks' },
    auth,
    headers: { Accept: 'application/json' }
  })
  return data?.fields?.issuelinks || []
}

function parseKeys(input) {
  if (!input) return []
  return input
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

let cachedLinkTypes
let cachedEpicFieldId

async function getLinkTypes(jira) {
  if (cachedLinkTypes) return cachedLinkTypes
  const { data } = await jira.get('/issueLinkType')
  cachedLinkTypes = data?.issueLinkTypes || []
  return cachedLinkTypes
}

function findLinkType(linkTypes, label) {
  if (!label) return null
  const normalized = label.toLowerCase()
  return (
    linkTypes.find((type) => String(type?.name || '').toLowerCase() === normalized) ||
    linkTypes.find((type) => String(type?.inward || '').toLowerCase() === normalized) ||
    linkTypes.find((type) => String(type?.outward || '').toLowerCase() === normalized)
  )
}

async function getEpicFieldId(jira) {
  if (cachedEpicFieldId) return cachedEpicFieldId
  const { data } = await jira.get('/field')
  const match = (data || []).find((field) => field?.name === 'Epic Link')
  cachedEpicFieldId = match?.id || null
  return cachedEpicFieldId
}

function extractEpicKey(fields, epicFieldId) {
  if (!fields) return null
  if (epicFieldId && fields[epicFieldId]) return fields[epicFieldId]
  const parentKey = fields?.parent?.key
  return parentKey || null
}

async function updateEpic(jira, issueKey, epicFieldId, epicKeyOrNull) {
  const key = encodeURIComponent(issueKey)
  const fields = epicFieldId
    ? { [epicFieldId]: epicKeyOrNull || null }
    : { parent: epicKeyOrNull ? { key: epicKeyOrNull } : null }
  await jira.put(`/issue/${key}`, { fields })
}

function getLinkedIssueKey(link) {
  return link?.inwardIssue?.key || link?.outwardIssue?.key || null
}

/** Devuelve la key del otro extremo del link (no currentKey). */
function getOtherIssueKey(link, currentKey) {
  const inKey = link?.inwardIssue?.key
  const outKey = link?.outwardIssue?.key
  if (inKey === currentKey) return outKey || null
  if (outKey === currentKey) return inKey || null
  return inKey || outKey || null
}

/** Extrae el id del link para DELETE; en GET issue puede venir como id, linkId, link_id, etc. */
function getLinkId(link) {
  const id = link?.id ?? link?.linkId ?? link?.link_id ?? link?.linkID
  return id != null && id !== '' ? String(id) : null
}

function isLinkTypeMatch(link, label) {
  if (!label) return false
  const normalized = label.toLowerCase()
  return (
    String(link?.type?.name || '').toLowerCase() === normalized ||
    String(link?.type?.inward || '').toLowerCase() === normalized ||
    String(link?.type?.outward || '').toLowerCase() === normalized
  )
}

async function getIssueWithLinks(jira, issueKey, epicFieldId) {
  const key = encodeURIComponent(issueKey)
  const fields = ['summary', 'status', 'issuetype', 'issuelinks', 'parent']
  if (epicFieldId) fields.push(epicFieldId)
  const { data } = await jira.get(`/issue/${key}`, { params: { fields: fields.join(',') } })
  return data
}

async function fetchIssuesByJql(jira, jql) {
  const issues = []
  let nextPageToken
  const maxResults = 100

  while (true) {
    const { data } = await jira.get('/search/jql', {
      params: {
        jql,
        fields: 'summary,status,issuetype,updated,customfield_11815',
        maxResults,
        ...(nextPageToken ? { nextPageToken } : {})
      }
    })

    const batch = data.issues || []
    issues.push(...batch)

    if (data.isLast === true || batch.length === 0) break
    nextPageToken = data.nextPageToken
    if (!nextPageToken) break
  }

  return issues
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

/** Lista epics del proyecto para selector (Epic Link). Excluye solo estos 5 por summary exacto. */
const EPICS_EXCLUDED_FROM_SELECTOR = [
  'Sist. 1-Arriba',
  'Sist. 2-BTV',
  'Sist. 3-JFV',
  'Sist. 4-Duchas',
  'Sist. Hidro',
  // En Jira el summary puede venir sin prefijo "Sist. "
  '1-Arriba',
  '2-BTV',
  '3-JFV',
  '4-Duchas'
]

app.get('/api/epics', async (req, res) => {
  try {
    const jira = getJiraClient()
    const jql = 'project = CH AND issuetype = Epic ORDER BY summary'
    const issues = []
    let nextPageToken
    const maxResults = 100
    while (true) {
      const { data } = await jira.get('/search/jql', {
        params: {
          jql,
          fields: 'summary',
          maxResults,
          ...(nextPageToken ? { nextPageToken } : {})
        }
      })
      const batch = data.issues || []
      issues.push(...batch)
      if (data.isLast === true || batch.length === 0) break
      nextPageToken = data.nextPageToken
      if (!nextPageToken) break
    }
    const all = issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary || issue.key
    }))
    const list = all.filter((e) => !EPICS_EXCLUDED_FROM_SELECTOR.includes((e.summary || '').trim()))
    res.json({ epics: list })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

/** Borra en Jira los links "is blocked by" y "blocks" entre la issue key y cualquier Puesto. No toca "connects to". */
async function removePuestoBlocksOnlyForIssue(jira, issueKey) {
  const links = await getIssueLinksV2(issueKey)
  const toDelete = []
  for (const link of links) {
    if (!isLinkTypeMatch(link, 'is blocked by') && !isLinkTypeMatch(link, 'blocks')) continue
    const otherKey = getOtherIssueKey(link, issueKey)
    if (!otherKey) continue
    try {
      const otherRes = await jira.get(`/issue/${encodeURIComponent(otherKey)}`, { params: { fields: 'issuetype' } })
      const otherType = (otherRes?.data?.fields?.issuetype?.name || '').toLowerCase()
      if (!otherType.includes('puesto')) continue
    } catch (_) {
      continue
    }
    const linkId = getLinkId(link)
    if (linkId) toDelete.push(linkId)
  }
  for (const linkId of toDelete) {
    try {
      await jira.delete(`/issueLink/${linkId}`)
    } catch (err) {
      console.warn('[epic] No se pudo borrar link puesto-equipo:', linkId, err?.response?.status, err?.response?.data)
    }
  }
}

/** Actualiza el Epic Link de una issue. Body: { epicKey: string | null }
 * Si el epic es "En reparación" o "En depósito", borra solo los links "is blocked by" y "blocks" entre la issue y cualquier Puesto (no toca "connects to").
 * La compatibilidad puesto-equipo ("connects to") se gestiona solo en Jira; la app no crea ni borra esos links. */
app.post('/api/issues/:key/epic', async (req, res) => {
  try {
    const jira = getJiraClient()
    const key = req.params.key
    const epicKey = req.body?.epicKey === undefined ? undefined : (req.body?.epicKey === '' || req.body?.epicKey === null ? null : String(req.body.epicKey).trim())
    const epicFieldId = await getEpicFieldId(jira)
    await updateEpic(jira, key, epicFieldId, epicKey || null)

    if (epicKey) {
      const epicRes = await jira.get(`/issue/${encodeURIComponent(epicKey)}`, { params: { fields: 'summary' } })
      const epicSummary = (epicRes?.data?.fields?.summary || '').toLowerCase()
      const esEnReparacionDeposito = epicSummary.includes('en reparación') || epicSummary.includes('en depósito')
      if (esEnReparacionDeposito) {
        await removePuestoBlocksOnlyForIssue(jira, key)
      }
    }
    res.json({ ok: true })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.get('/api/issues/control', async (req, res) => {
  try {
    const jira = getJiraClient()
    const epicFieldId = await getEpicFieldId(jira)
    const fields = ['summary', 'status', 'issuetype', 'parent']
    if (epicFieldId) fields.push(epicFieldId)
    const jql = 'project = CH AND issuetype in (Bomba, Soplador, Lanchón) ORDER BY issuetype, key'
    const issues = []
    let nextPageToken
    const maxResults = 100
    while (true) {
      const { data } = await jira.get('/search/jql', {
        params: {
          jql,
          fields: fields.join(','),
          maxResults,
          ...(nextPageToken ? { nextPageToken } : {})
        }
      })
      const batch = data.issues || []
      issues.push(...batch)
      if (data.isLast === true || batch.length === 0) break
      nextPageToken = data.nextPageToken
      if (!nextPageToken) break
    }
    // Recolectar epic keys únicos y cargar todos los epics en paralelo (evita N requests secuenciales)
    const uniqueEpicKeys = [...new Set(issues.map((issue) => extractEpicKey(issue?.fields, epicFieldId)).filter(Boolean))]
    const BATCH = 15
    const epicCache = new Map()
    for (let i = 0; i < uniqueEpicKeys.length; i += BATCH) {
      const chunk = uniqueEpicKeys.slice(i, i + BATCH)
      const results = await Promise.all(
        chunk.map(async (epicKey) => {
          try {
            const epicRes = await jira.get(`/issue/${encodeURIComponent(epicKey)}`, {
              params: { fields: 'summary,parent' }
            })
            const epicSummary = epicRes?.data?.fields?.summary || null
            const parentSummary = epicRes?.data?.fields?.parent?.fields?.summary || ''
            const summaryLower = (epicSummary || '').toLowerCase()
            const parentLower = (parentSummary || '').toLowerCase()
            let sector = null
            if (summaryLower.includes('gruta') || parentLower.includes('gruta')) sector = 'Gruta'
            else if (summaryLower.includes('parque') || parentLower.includes('parque')) sector = 'Parque'
            return { epicKey, summary: epicSummary, sector }
          } catch (_) {
            return { epicKey, summary: null, sector: null }
          }
        })
      )
      for (const r of results) epicCache.set(r.epicKey, { summary: r.summary, sector: r.sector })
    }

    const normalized = []
    for (const issue of issues) {
      const epicKey = extractEpicKey(issue?.fields, epicFieldId)
      const cached = epicKey ? epicCache.get(epicKey) : null
      const epicSummary = cached?.summary ?? null
      const epicSummaryLower = (epicSummary || '').toLowerCase()
      const statusName = (issue?.fields?.status?.name || '').trim()
      const statusNameLower = statusName.toLowerCase()
      const sinEpic = !epicKey
      const estadoRojoAmarillo =
        statusName === '🟨' ||
        statusName === '🟥' ||
        ['red', 'rojo', 'yellow', 'amarillo'].some((c) => statusNameLower.includes(c))
      const epicEnReparacionDeposito = ['en reparación', 'en depósito'].some((e) => epicSummaryLower.includes(e))
      const cumpleControl = sinEpic || estadoRojoAmarillo || epicEnReparacionDeposito
      if (!cumpleControl) continue
      normalized.push({
        key: issue.key,
        summary: issue.fields?.summary,
        status: issue.fields?.status?.name,
        issueType: issue.fields?.issuetype?.name,
        epicKey,
        epicSummary,
        sector: cached?.sector ?? null
      })
    }
    res.json({ issues: normalized })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

/** Debug: ver estructura de issuelinks para diagnosticar borrado. GET /api/debug/issue/CH-884/links */
app.get('/api/debug/issue/:key/links', async (req, res) => {
  try {
    const key = req.params.key
    const jira = getJiraClient()
    const base = jiraBaseUrl()
    const auth = { username: process.env.JIRA_EMAIL, password: process.env.JIRA_API_TOKEN }
    const enc = encodeURIComponent(key)
    const [v3Res, v2Res, linkTypesRes] = await Promise.all([
      jira.get(`/issue/${enc}`, { params: { fields: 'issuelinks' } }),
      axios.get(`${base}/rest/api/2/issue/${enc}`, { params: { fields: 'issuelinks' }, auth, headers: { Accept: 'application/json' } }),
      getLinkTypes(jira)
    ])
    const v3Links = v3Res?.data?.fields?.issuelinks || []
    const v2Links = v2Res?.data?.fields?.issuelinks || []
    const blocksType = linkTypesRes.find((t) => (t?.name || '').toLowerCase() === 'blocks')
    res.json({
      key,
      blocksLinkType: blocksType ? { name: blocksType.name, inward: blocksType.inward, outward: blocksType.outward } : null,
      v3Links: v3Links.map((l) => ({ id: getLinkId(l), type: l?.type?.name, inwardKey: l?.inwardIssue?.key, outwardKey: l?.outwardIssue?.key })),
      v2Links: v2Links.map((l) => ({ id: getLinkId(l), type: l?.type?.name, inwardKey: l?.inwardIssue?.key, outwardKey: l?.outwardIssue?.key }))
    })
  } catch (e) {
    res.status(500).json({ error: e?.message })
  }
})

app.get('/api/issues', async (req, res) => {
  try {
    const jira = getJiraClient()
    const keys = parseKeys(req.query.keys || JIRA_ISSUE_KEYS)
    let jql = ''
    const issues = []

    if (keys.length > 0) {
      const chunkSize = 50
      for (let i = 0; i < keys.length; i += chunkSize) {
        const chunk = keys.slice(i, i + chunkSize)
        jql = `key in (${chunk.join(',')})`
        const batchIssues = await fetchIssuesByJql(jira, jql)
        issues.push(...batchIssues)
      }
    } else if (JIRA_PROJECT_KEY) {
      jql = `project = ${JIRA_PROJECT_KEY} ORDER BY updated DESC`
      issues.push(...(await fetchIssuesByJql(jira, jql)))
    } else {
      return res.status(400).json({ error: 'Configurar JIRA_ISSUE_KEYS o JIRA_PROJECT_KEY' })
    }

    const unique = new Map()
    for (const issue of issues) {
      if (issue?.key && !unique.has(issue.key)) unique.set(issue.key, issue)
    }

    const normalized = Array.from(unique.values()).map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary,
      status: {
        name: issue.fields?.status?.name,
        category: issue.fields?.status?.statusCategory?.name
      },
      issueType: issue.fields?.issuetype?.name,
      updated: issue.fields?.updated,
      customfield_11815: issue.fields?.customfield_11815
    }))

    res.json({ issues: normalized })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.response?.data?.errors?.join?.(' ') || error?.message
    console.error('[GET /api/issues]', message, error?.response?.status, error?.response?.data)
    res.status(500).json({ error: message })
  }
})

function isYellowOrRedStatus(name) {
  if (!name) return false
  const s = String(name).trim()
  if (s === '🟨' || s === '🟥') return true
  return /yellow|amarillo|red|rojo/i.test(s)
}

app.get('/api/issues/:key/transitions', async (req, res) => {
  try {
    const jira = getJiraClient()
    const key = encodeURIComponent(req.params.key)
    const [transitionsRes, issueRes] = await Promise.all([
      jira.get(`/issue/${key}/transitions`),
      jira.get(`/issue/${key}`, { params: { fields: 'issuetype' } })
    ])
    const issueTypeName = (issueRes?.data?.fields?.issuetype?.name || '').trim()
    const isControlType = ['Bomba', 'Soplador', 'Lanchón'].includes(issueTypeName)
    const transitions = (transitionsRes?.data?.transitions || []).map((t) => {
      const toName = t.to?.name || ''
      const requiresBreakdownComment = isControlType && isYellowOrRedStatus(toName)
      return {
        id: t.id,
        name: t.name,
        toName,
        requiresBreakdownComment: !!requiresBreakdownComment
      }
    })
    res.json({ transitions })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.get('/api/jira/me', async (_req, res) => {
  try {
    const jira = getJiraClient()
    const { data } = await jira.get('/myself')
    res.json({
      accountId: data?.accountId,
      displayName: data?.displayName,
      emailAddress: data?.emailAddress
    })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.get('/api/issues/:key/field-options', async (req, res) => {
  try {
    const fieldId = String(req.query.fieldId || '')
    if (!fieldId) {
      return res.status(400).json({ error: 'fieldId es requerido' })
    }
    const jira = getJiraClient()
    const key = encodeURIComponent(req.params.key)
    const { data } = await jira.get(`/issue/${key}/editmeta`)
    const field = data?.fields?.[fieldId]
    const options = (field?.allowedValues || []).map((option) => ({
      id: option.id,
      value: option.value ?? option.name ?? String(option)
    }))
    res.json({
      fieldId,
      name: field?.name,
      type: field?.schema?.type,
      isMulti: field?.schema?.type === 'array',
      options
    })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

/** Devuelve activeKey (bomba/soplador/lanchón activo) para un puesto, o null si no tiene.
 *  Usa el link "is blocked by": si el Puesto está bloqueado por una Bomba, Soplador o Lanchón, esa es la key activa. */
async function getPuestoActivePumpKey(jira, key, linkTypes, epicFieldId) {
  const issue = await getIssueWithLinks(jira, key, epicFieldId)
  const links = issue?.fields?.issuelinks || []
  const blockedType = findLinkType(linkTypes, 'is blocked by')
  if (!blockedType) return null
  const blockedLinks = links.filter((link) => isLinkTypeMatch(link, 'is blocked by'))
  const equipmentTypes = ['Bomba', 'Soplador', 'Lanchón']
  for (const link of blockedLinks) {
    const otherKey = getOtherIssueKey(link, key)
    if (!otherKey) continue
    const other = await getIssueWithLinks(jira, otherKey, epicFieldId)
    const t = other?.fields?.issuetype?.name
    if (t && equipmentTypes.includes(t)) return otherKey
  }
  return null
}

app.get('/api/pumps-batch', async (req, res) => {
  try {
    const keysParam = req.query.keys || ''
    const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean)
    if (keys.length === 0) {
      return res.json({})
    }
    const jira = getJiraClient()
    const linkTypes = await getLinkTypes(jira)
    const epicFieldId = await getEpicFieldId(jira)
    const result = {}
    await Promise.all(
      keys.map(async (key) => {
        try {
          const activeKey = await getPuestoActivePumpKey(jira, key, linkTypes, epicFieldId)
          result[key] = { activeKey }
        } catch (_) {
          result[key] = { activeKey: null }
        }
      })
    )
    res.json(result)
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.get('/api/issues/:key/pumps', async (req, res) => {
  try {
    const jira = getJiraClient()
    const key = req.params.key
    const linkTypes = await getLinkTypes(jira)
    const connectsType = findLinkType(linkTypes, 'connects to')
    const blockedType = findLinkType(linkTypes, 'is blocked by')
    if (!connectsType) {
      return res.status(400).json({ error: 'No existe el link type "connects to" en Jira.' })
    }

    const epicFieldId = await getEpicFieldId(jira)
    const issue = await getIssueWithLinks(jira, key, epicFieldId)
    const links = issue?.fields?.issuelinks || []

    const connectedKeys = links
      .filter((link) => isLinkTypeMatch(link, 'connects to'))
      .map((link) => getOtherIssueKey(link, key))
      .filter(Boolean)

    const uniqueConnected = Array.from(new Set(connectedKeys))
    const options = []
    const epicSummaryCache = new Map()

    const equipmentTypesPumps = ['Bomba', 'Soplador', 'Lanchón']
    for (const connectedKey of uniqueConnected) {
      const connected = await getIssueWithLinks(jira, connectedKey, epicFieldId)
      const issueType = connected?.fields?.issuetype?.name
      if (!issueType || !equipmentTypesPumps.includes(issueType)) continue
      const epicKey = extractEpicKey(connected?.fields, epicFieldId)
      let epicSummary = null
      if (epicKey) {
        if (epicSummaryCache.has(epicKey)) {
          epicSummary = epicSummaryCache.get(epicKey)
        } else {
          const epicResp = await jira.get(`/issue/${encodeURIComponent(epicKey)}`, { params: { fields: 'summary' } })
          epicSummary = epicResp?.data?.fields?.summary || null
          epicSummaryCache.set(epicKey, epicSummary)
        }
      }
      // inUseElsewhere: la bomba tiene link "blocks" con otro puesto (ya está en uso ahí)
      // Misma lógica que active-pump al detectar links a borrar: bomba en link, other es puesto distinto
      let inUseElsewhere = false
      const bombaLinks = connected?.fields?.issuelinks || []
      for (const link of bombaLinks) {
        if (!isLinkTypeMatch(link, 'blocks')) continue
        const otherKey = getOtherIssueKey(link, connectedKey)
        if (!otherKey || otherKey === key) continue
        const otherIssue = await getIssueWithLinks(jira, otherKey, epicFieldId)
        const otherType = String(otherIssue?.fields?.issuetype?.name || '').toLowerCase().trim()
        if (otherType.includes('puesto')) {
          inUseElsewhere = true
          if (process.env.DEBUG_PUMPS) {
            console.log(`[pumps] ${connectedKey} inUseElsewhere=true (blocks ${otherKey})`)
          }
          break
        }
      }
      options.push({
        key: connected?.key,
        summary: connected?.fields?.summary,
        status: connected?.fields?.status?.name,
        issueType,
        epicKey,
        epicSummary,
        inUseElsewhere
      })
    }

    let activeKey = null
    if (blockedType) {
      const blockedLinks = links.filter((link) => isLinkTypeMatch(link, 'is blocked by'))
      for (const link of blockedLinks) {
        const bombaKey = getOtherIssueKey(link, key)
        if (!bombaKey) continue
        const match = options.find((opt) => opt.key === bombaKey)
        if (match) {
          activeKey = bombaKey
          break
        }
      }
    }

    const result = { options, activeKey }
    if (req.query.debug === '1') {
      result._debug = { puestoKey: key, options: options.map((o) => ({ key: o.key, inUseElsewhere: o.inUseElsewhere })) }
    }
    res.json(result)
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.post('/api/issues/:key/active-pump', async (req, res) => {
  try {
    const jira = getJiraClient()
    const key = req.params.key
    const selectedKey = String(req.body?.selectedKey || '').trim()
    if (!selectedKey) {
      return res.status(400).json({ error: 'selectedKey es requerido' })
    }

    const linkTypes = await getLinkTypes(jira)
    const connectsType = findLinkType(linkTypes, 'connects to')
    const blockedType = findLinkType(linkTypes, 'is blocked by')
    if (!connectsType || !blockedType) {
      return res.status(400).json({ error: 'Link types requeridos no existen en Jira.' })
    }

    const epicFieldId = await getEpicFieldId(jira)
    const issue = await getIssueWithLinks(jira, key, epicFieldId)
    const links = issue?.fields?.issuelinks || []

    const connectedKeys = links
      .filter((link) => isLinkTypeMatch(link, 'connects to'))
      .map((link) => getOtherIssueKey(link, key))
      .filter(Boolean)
    if (!connectedKeys.includes(selectedKey)) {
      return res.status(400).json({ error: 'La bomba/soplador seleccionado no está conectado al Puesto.' })
    }

    const blocksType = findLinkType(linkTypes, 'blocks') || blockedType
    const typeForCreate = blocksType || blockedType

    const bombaIssue = await getIssueWithLinks(jira, selectedKey, epicFieldId)
    const bombaLinks = bombaIssue?.fields?.issuelinks || []
    const oldPuestosToUnlink = []
    // Solo borrar links tipo Blocks entre bomba y puesto (no tocar Comp Eléctrico, Cañería, etc.)
    for (const link of bombaLinks) {
      if (!isLinkTypeMatch(link, 'blocks')) continue
      const otherKey = getOtherIssueKey(link, selectedKey)
      if (!otherKey || otherKey === key) continue
      const otherIssue = await getIssueWithLinks(jira, otherKey, epicFieldId)
      const otherType = String(otherIssue?.fields?.issuetype?.name || '').toLowerCase().trim()
      if (!otherType.includes('puesto')) continue
      const linkId = getLinkId(link)
      if (linkId) {
        try {
          await jira.delete(`/issueLink/${linkId}`)
        } catch (err) {
          console.warn('[active-pump] Borrado link bomba→puesto por id falló:', linkId, err?.response?.status, err?.response?.data)
          oldPuestosToUnlink.push(otherKey)
        }
      } else {
        oldPuestosToUnlink.push(otherKey)
      }
    }
    const unlinkedPuestos = [...oldPuestosToUnlink]
    // Intentar borrar desde API v2 por si v3 no devolvió id en los links de la bomba
    if (oldPuestosToUnlink.length > 0) {
      const bombaLinksV2 = await getIssueLinksV2(selectedKey)
      for (const link of bombaLinksV2) {
        if (!isLinkTypeMatch(link, 'blocks')) continue
        const otherKey = getOtherIssueKey(link, selectedKey)
        if (!otherKey || (otherKey || '').toLowerCase() === (key || '').toLowerCase()) continue
        if (!oldPuestosToUnlink.includes(otherKey)) continue
        const linkId = getLinkId(link)
        if (linkId) {
          try {
            await jira.delete(`/issueLink/${linkId}`)
            oldPuestosToUnlink.splice(oldPuestosToUnlink.indexOf(otherKey), 1)
          } catch (err) {
            console.warn('[active-pump] Borrado link bomba→puesto (v2) falló:', linkId, err?.response?.status)
          }
          break
        }
      }
    }
    const sk = (selectedKey || '').toLowerCase()
    for (const puestoKey of oldPuestosToUnlink) {
      let deleted = false
      const puestoIssue = await getIssueWithLinks(jira, puestoKey, epicFieldId)
      const puestoLinks = puestoIssue?.fields?.issuelinks || []
      for (const link of puestoLinks) {
        if (!isLinkTypeMatch(link, 'blocks')) continue
        const other = getOtherIssueKey(link, puestoKey)
        if (!other || (other || '').toLowerCase() !== sk) continue
        const linkId = getLinkId(link)
        if (linkId) {
          try {
            await jira.delete(`/issueLink/${linkId}`)
            deleted = true
          } catch (_) {}
          break
        }
      }
      if (deleted) continue
      const linksV2 = await getIssueLinksV2(puestoKey)
      for (const link of linksV2) {
        if (!isLinkTypeMatch(link, 'blocks')) continue
        const other = getOtherIssueKey(link, puestoKey)
        if (!other || (other || '').toLowerCase() !== sk) continue
        const linkId = getLinkId(link)
        if (linkId) {
          try {
            await jira.delete(`/issueLink/${linkId}`)
          } catch (_) {}
          break
        }
      }
    }

    const blockedLinks = links.filter((link) => isLinkTypeMatch(link, 'is blocked by'))
    const selectedExists = blockedLinks.some((link) => getOtherIssueKey(link, key) === selectedKey)

    // Solo borrar links "is blocked by" hacia bombas/sopladores (no Comp Eléctrico, Cañería Succión, etc.)
    // La bomba que se quita conserva su Epic (no se pone en null)
    for (const link of blockedLinks) {
      const otherKey = getOtherIssueKey(link, key)
      if (!otherKey || otherKey === selectedKey) continue
      const otherIssue = await getIssueWithLinks(jira, otherKey, epicFieldId)
      const otherType = String(otherIssue?.fields?.issuetype?.name || '').toLowerCase().trim()
      const isBombaOrSoplador = otherType === 'bomba' || otherType === 'soplador'
      if (!isBombaOrSoplador) continue
      const linkId = getLinkId(link)
      if (linkId) {
        await jira.delete(`/issueLink/${linkId}`)
      }
    }

    if (!selectedExists) {
      const linkTypeName = typeForCreate?.name || 'Blocks'
      // En tu Jira: inward="blocks", outward="is blocked by" → bomba=inward, puesto=outward para "puesto is blocked by bomba"
      await jira.post('/issueLink', {
        type: { name: linkTypeName },
        inwardIssue: { key: selectedKey },
        outwardIssue: { key }
      })
    }

    const selectedIssue = await getIssueWithLinks(jira, selectedKey, epicFieldId)
    const puestoEpic = extractEpicKey(issue?.fields, epicFieldId)
    const selectedEpic = extractEpicKey(selectedIssue?.fields, epicFieldId)
    const epicToSet = puestoEpic || selectedEpic || null
    if (epicToSet) {
      await updateEpic(jira, key, epicFieldId, epicToSet)
      await updateEpic(jira, selectedKey, epicFieldId, epicToSet)
    }

    res.json({ ok: true, unlinkedPuestos: unlinkedPuestos })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.post('/api/issues/:key/fields', async (req, res) => {
  try {
    const fields = req.body?.fields
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'fields es requerido' })
    }
    const jira = getJiraClient()
    const key = encodeURIComponent(req.params.key)
    await jira.put(`/issue/${key}`, { fields })
    res.json({ ok: true })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

app.post('/api/issues/:key/transition', async (req, res) => {
  try {
    const jira = getJiraClient()
    const { transitionId, transitionName } = req.body || {}
    const key = encodeURIComponent(req.params.key)

    let id = transitionId
    if (!id && transitionName) {
      const { data } = await jira.get(`/issue/${key}/transitions`)
      const match = (data.transitions || []).find(
        (t) => t.name.toLowerCase() === transitionName.toLowerCase()
      )
      if (match) id = match.id
    }

    if (!id) {
      return res.status(400).json({ error: 'transitionId o transitionName es requerido' })
    }

    await jira.post(`/issue/${key}/transitions`, {
      transition: { id }
    })

    res.json({ ok: true })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

/** Añade un comentario a una issue. Body: { body: string } (texto plano; se envía a Jira en ADF). */
app.post('/api/issues/:key/comment', async (req, res) => {
  try {
    const jira = getJiraClient()
    const key = encodeURIComponent(req.params.key)
    const text = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
    if (!text) {
      return res.status(400).json({ error: 'body (texto del comentario) es requerido' })
    }
    const body = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text }]
        }
      ]
    }
    await jira.post(`/issue/${key}/comment`, { body })
    res.json({ ok: true })
  } catch (error) {
    const message = error?.response?.data?.errorMessages || error?.message
    res.status(500).json({ error: message })
  }
})

// Servir frontend compilado (ch_web/dist) y fallback SPA para despliegue en un solo servidor
const distPath = path.join(__dirname, '..', '..', 'ch_web', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Backend CH escuchando en http://localhost:${PORT}`)
})
