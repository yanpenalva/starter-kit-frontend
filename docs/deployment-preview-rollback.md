# Deploy Estático, Preview e Estratégia de Rollback

Documento operacional para build versionado, ambiente de preview, gestão de origens cross-origin/Sanctum e procedimentos de rollback.

---

## 1. Build Estático Versionado

- **Comando**: `npm run build` (`vue-tsc --noEmit && vite build`).
- **Assets Versionados**: O Vite compila todos os módulos JS, CSS e fontes para `dist/assets/[name]-[hash].[ext]` com content-hash imutável no nome de arquivo.
- **Cache-Control Recomendado**:
  - `dist/index.html`: `Cache-Control: no-cache, no-store, must-revalidate` (o cliente sempre busca a versão mais recente).
  - `dist/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (cache permanente no CDN e navegador).
- **Tratamento do `dist/`**:
  - `dist/` é estritamente ignorado pelo versionador Git (`.gitignore`).
  - O diretório `dist/` gerado no pipeline de CI/CD é armazenado como **artefato imutável** (`upload-artifact`) e/ou sincronizado com storage estático (S3, Cloudflare Pages, GitHub Pages). Nunca é comitado no repositório.

---

## 2. Ambientes e Origens (`SANCTUM_STATEFUL_DOMAINS`)

### 2.1 Invariantes de Segurança
1. **Separação Estrita de Ambientes**: O build de preview **NUNCA** aponta para a API de produção (`https://api.starterkit.com`). O código da aplicação valida o hostname da API em tempo de execução via `resolveEnvironmentConfig` e falha se um preview apontar para produção (`InvalidEnvironmentConfigError`).
2. **Sem Segredos no Repositório**: Arquivos de variáveis reais (`.env`, `.env.*`) são gitignorados. Somente templates de exemplo (`.env.*.example`) são versionados.

### 2.2 Mapeamento de Origens por Ambiente

| Ambiente | Origem SPA (`cors.php` / `SANCTUM_STATEFUL_DOMAINS`) | Origem API (`VITE_API_URL`) | Arquivo de Exemplo |
| :--- | :--- | :--- | :--- |
| **Local (Dev)** | `localhost:5173`, `http://localhost:5173` | `http://localhost:8000` | `.env.development.example` |
| **Preview (PR)** | `*.starterkit.pages.dev` / `preview-pr-*.starterkit.pages.dev` | `https://staging-api.starterkit.com` | `.env.preview.example` |
| **Staging** | `https://staging.starterkit.com` | `https://staging-api.starterkit.com` | `.env.staging.example` |
| **Production** | `https://app.starterkit.com` | `https://api.starterkit.com` | `.env.production.example` |

### 2.3 Configuração no Lado do Laravel (`starter-kit-api`)
No arquivo `.env` da API correspondente:
- **Local**: `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173`
- **Preview / Staging**: `SANCTUM_STATEFUL_DOMAINS=preview-pr-*.starterkit.pages.dev,staging.starterkit.com`
- **Produção**: `SANCTUM_STATEFUL_DOMAINS=app.starterkit.com`

---

## 3. Workflow de CI: Preview por PR

- **Workflow**: `.github/workflows/preview.yml`
- **Gatilho**: Disparado em pull requests direcionados para `main` (`opened`, `synchronize`, `reopened`).
- **Mecanismo**:
  1. Instala dependências via `npm ci`.
  2. Executa `npm run build` injetando `VITE_APP_ENV=preview` e `VITE_API_URL` apontando para a API de staging/preview.
  3. Gera o artifact `preview-dist-pr-${{ github.event.pull_request.number }}` com retenção padrão de **7 dias**.
  4. Publica no ambiente de preview correspondente (ex.: Cloudflare Pages ou GitHub Pages no domínio `https://preview-pr-<PR_NUMBER>.starterkit.pages.dev`).
  5. Expiração: o artefato do build expira em 7 dias ou quando o PR é fechado/mesclado.

---

## 4. Estratégia e Procedimento de Rollback

### 4.1 Padrão de Versionamento e Tags
Toda release integrada para produção deve ser marcada com uma tag imutável no formato:
```text
fe-<YYYY-MM-DD>-<sha_curto>
```
Exemplo: `fe-2026-10-06-6295768`.

### 4.2 Procedimento Passo a Passo de Rollback

Em caso de degradação crítica após um deploy em produção:

1. **Identificar a Versão Saudável Anterior**:
   Consulte a lista de tags de release para localizar o release prévio validado:
   ```bash
   git tag -l "fe-*" --sort=-creatordate | head -n 5
   ```

2. **Opção A — Redeploy via Artefato de Release Anterior (Mais Rápido)**:
   - Se o deploy em produção é baseado em artefatos versionados (Storage bucket / CDN / GitHub Release asset), altere o ponteiro de publicação ativo (ou execute o workflow de deploy informando a tag saudável `fe-<data>-<sha>`):
   - Baixar o artefato construído da tag anterior e sincronizar com o bucket/CDN:
     ```bash
     # Exemplo com CDN / S3 / R2 / Pages
     gh release download fe-2026-10-06-abc1234 -p "dist-fe-2026-10-06-abc1234.tar.gz"
     tar -xzf dist-fe-2026-10-06-abc1234.tar.gz
     # Publicar / sincronizar pasta dist/
     ```

3. **Opção B — Git Revert / Redeploy da Tag**:
   - Caso seja necessário um novo pipeline para registrar o rollback:
     ```bash
     git checkout main
     git pull origin main
     git revert -m 1 <MERGE_COMMIT_PROBLEMATICO> # ou git revert <COMMIT_PROBLEMATICO>
     git push origin main
     ```
   - Ou disparar o pipeline manual selecionando a tag anterior `fe-<data>-<sha>`.

4. **Invalidação de Cache de Borda**:
   - Para garantir que os navegadores recebam imediatamente o `index.html` anterior:
   - Executar invalidação de cache do CDN para `/index.html`.
   - Como os assets sob `dist/assets/*` possuem hashes únicos, não há risco de colisão de cache para assets estáticos.

5. **Execução de Smoke Pós-Rollback**:
   - Executar o checklist de validação em [docs/smoke-checklist.md](smoke-checklist.md).
