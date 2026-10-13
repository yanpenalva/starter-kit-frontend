/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type AuthMfaChallenge422 =
  | {
      message: "Código MFA ou de recuperação inválido.";
      errors: {
        /**
         * @minItems 1
         * @maxItems 1
         */
        code: ["Código MFA ou de recuperação inválido."];
      };
    }
  | {
      message: "Informe o código MFA ou um código de recuperação.";
      errors: {
        /**
         * @minItems 1
         * @maxItems 1
         */
        code: ["Código MFA ou de recuperação obrigatório."];
      };
    };
