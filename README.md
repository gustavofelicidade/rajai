## RAJAI — Setup rápido

### Backend (FastAPI)
1. Criar venv e instalar dependências:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Rodar API:
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
3. Endpoints úteis:
   - Catálogo GEO: `http://localhost:8000/api/v1/geo/bairros/catalogo`
   - Choropleth: `http://localhost:8000/api/v1/geo/bairros/choropleth?metric=total_ultraprocessado`
   - Tooltip: `http://localhost:8000/api/v1/geo/bairros/{bairro}/tooltip`
   - Legacy: `/api/v1/dados/tabela_1 ... tabela_6`

### Frontend (React + Vite)
1. Instalar deps:
   ```bash
   cd frontend
   npm install
   ```
2. Configurar API (opcional se rodar em localhost:8000):
   - Crie `.env.local` com `VITE_API_URL=http://localhost:8000`
3. Rodar dev server:
   ```bash
   npm run dev
   ```
4. Build:
   ```bash
   npm run build
   ```

### Notas
- GeoJSON é carregado via URL pública; o join usa `properties.NOME` normalizado.
- Paleta choropleth definida em `src/index.css` (`--choropleth-0..4`).
