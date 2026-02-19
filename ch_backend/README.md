# Backend CH (Jira)

Este backend actúa como proxy seguro hacia Jira Cloud para leer el estado de las issues y ejecutar transiciones.

## Variables de entorno requeridas

- `PORT` (opcional, default 4000)
- `JIRA_BASE_URL` (ej: https://tu-dominio.atlassian.net)
- `JIRA_EMAIL` (email del usuario)
- `JIRA_API_TOKEN` (token de API de Jira)
- `JIRA_PROJECT_KEY` (ej: CH) o `JIRA_ISSUE_KEYS` (lista separada por coma)

## Endpoints

- `GET /api/health`
- `GET /api/issues` (opcional `?keys=CH-1,CH-2`)
- `GET /api/issues/:key/transitions`
- `POST /api/issues/:key/transition` con `{ "transitionId": "31" }` o `{ "transitionName": "Done" }`

## Uso local

```bash
cd ch_backend
npm install
npm run start
```
