/*
 * Política de descarte de formulários em modal. A regra pertence ao form — o
 * DialogComponent apenas reporta a intenção de fechar — porque só o form sabe
 * o que é rascunho sujo e o que ainda está em trânsito:
 *
 * - mutação pendente nunca fecha: o resultado não pode ser escondido;
 * - formulário sujo exige confirmação explícita de descarte;
 * - apenas form limpo fecha direto.
 *
 * Fechar a aba/janela também descarta: enquanto houver rascunho sujo o aviso
 * nativo de beforeunload fica armado. O navegador ignora confirm() e texto
 * próprio nesse evento — o contrato é preventDefault() + returnValue.
 */
import { onMounted, onUnmounted } from "vue";

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

  const beforeWindowUnload = (event: BeforeUnloadEvent): void => {
    if (!options.isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  };

  onMounted(() => {
    window.addEventListener("beforeunload", beforeWindowUnload);
  });
  onUnmounted(() => {
    window.removeEventListener("beforeunload", beforeWindowUnload);
  });

  return { canDismiss };
};
