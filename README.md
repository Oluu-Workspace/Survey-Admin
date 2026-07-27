# Tafiti Admin (`tafiti-survey-platform`)

**This is the research admin dashboard** — not the field agent app.

| App | Folder | Who uses it |
|-----|--------|-------------|
| **Tafiti Admin** | `Survey-Admin` (this repo) | Researchers / admins in the browser |
| **Tafiti** (PWA) | `field-data-studio` | Field agents on phones |
| **API** | `Survey-Backend` | Flask on port 5000 (or Render) |

## Typical admin workflow

1. **Research home** (`/dashboard`) — totals and survey list  
2. **Surveys** — create / activate studies, assign agents, edit questions  
3. Open a survey → **Overview → Data → Analysis → Report** (tabs on the survey page)  
4. **Data explorer** — same response tables, pick a survey from the grid  
5. **Review queue** — quality / lifecycle review  

## Local dev

```sh
npm i
# Point at API (see .env)
npm run dev
```

Default admin login (mock backend): `admin@surveypro.ke` / `admin123`

## Env

`VITE_API_BASE_URL=http://localhost:5000/api/v1`
