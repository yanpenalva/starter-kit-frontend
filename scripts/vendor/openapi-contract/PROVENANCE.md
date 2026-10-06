# Verificador de provenance do contrato

- Fonte: cópias staged somente leitura de `starter-kit-api-wave3-auth-worktree`.
- Branch upstream: `docs/wave-3-contract-published`.
- HEAD upstream: `4dbec425acc18d8843a0fde08e7aacb767312f05`.
- Commit da aplicação equivalente à `main`: `e646c34a280b851847676af290494e872edcaa9b`.
- Os módulos `.py` copiados permanecem byte-idênticos; seus digests constam em `SHA256SUMS.upstream`.
- Escopo copiado: CLI offline, primitivas de validação/provenance e extração segura de ZIP. `contract_fetch.py` não é copiado nem usado na CI.
- O modo de CI é `verify-committed`: verifica identidade, receipt e digest do spec sem invalidar snapshots por idade. O wrapper adicional verifica ZIP contra hash pinado, limites, duplicatas, traversal, symlink, arquivo extra, refs externas e igualdade dos bytes extraídos.
- Nenhuma chamada GitHub, shell de receipt ou credencial é usada pelo consumidor offline.
