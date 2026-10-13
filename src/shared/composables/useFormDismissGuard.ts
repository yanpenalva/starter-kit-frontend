/*
 * Política de descarte de formulários em modal. A regra pertence ao form — o
 * DialogComponent apenas reporta a intenção de fechar — porque só o form sabe
 * o que é rascunho sujo e o que ainda está em trânsito:
 *
 * - mutação pendente nunca fecha: o resultado não pode ser escondido;
 * - formulário sujo exige confirmação explícita de descarte;
 * - apenas form limpo fecha direto.
 */
export interface FormDismissGuard {
  canDismiss: () => boolean;
}

export const useFormDismissGuard = (options: {
  isDirty: () => boolean;
  isPending: () => boolean;
  message: string;
}): FormDismissGuard => {
  const canDismiss = (): boolean => {
    if (options.isPending()) return false;
    if (!options.isDirty()) return true;
    return globalThis.confirm(options.message);
  };

  return { canDismiss };
};
