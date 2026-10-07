# Arquitetura do frontend

```mermaid
flowchart LR
    subgraph Browser["Navegador"]
        Router["Vue Router<br/>guards 401/403"]
        Pages["Páginas<br/>auth, users, roles, logs"]
        Session["Pinia session store<br/>bootstrap + csrf"]
        Query["TanStack Query<br/>server state"]
        Http["Cliente HTTP<br/>baseURL + withCredentials"]
    end
    subgraph API["API Laravel"]
        Sanctum["Sanctum<br/>csrf-cookie"]
        V1["REST /api/v1"]
    end
    subgraph Contract["Contrato"]
        Pin["openapi.json pinado<br/>+ receipt"]
        Orval["Tipos Orval gerados"]
    end

    Router --> Pages
    Pages --> Session
    Pages --> Query
    Session --> Http
    Query --> Http
    Http -->|csrf-cookie| Sanctum
    Http -->|sessão cookie| V1
    Pin --> Orval
    Orval --> Query
    Orval --> Http
```

Fluxo de autenticação: `GET /sanctum/csrf-cookie` → `POST /api/v1/login` →
`bootstrap()` (`GET /api/v1/my-profile`) → guards liberam rotas por
`permissions`. Sessão limitada (`email_verified_at: null`) só acessa
logout, perfil mínimo e verificação.
