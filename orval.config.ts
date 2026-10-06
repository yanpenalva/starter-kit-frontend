import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "./openapi/openapi.json",
    },
    output: {
      target: "./src/lib/api/generated/endpoints.ts",
      schemas: "./src/lib/api/generated/models",
      mode: "tags-split",
      client: "vue-query",
      httpClient: "axios",
      formatter: "prettier",
      override: {
        mutator: {
          path: "./src/lib/http/orval-mutator.ts",
          name: "transportApi",
        },
        header: () => [
          "Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.",
          "Não editar manualmente; use npm run client:generate.",
        ],
        query: {
          signal: true,
          version: 5,
        },
      },
    },
  },
});
