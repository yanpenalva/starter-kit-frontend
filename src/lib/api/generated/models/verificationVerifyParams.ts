/**
 * Gerado por Orval 8.39.0 a partir do contrato OpenAPI aprovado e pinado.
 * Não editar manualmente; use npm run client:generate.
 */

export type VerificationVerifyParams = {
  /**
   * Carimbo de expiração da URL assinada; exigido pelo middleware de assinatura.
   */
  expires?: string;
  /**
   * Assinatura HMAC da URL de verificação; exigido pelo middleware de assinatura.
   */
  signature?: string;
};
