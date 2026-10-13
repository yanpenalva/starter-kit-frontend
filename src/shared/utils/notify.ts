import { Notify } from "quasar";

type ToastKind = "success" | "error" | "warning" | "info";
type NotifyPosition =
  | "left"
  | "right"
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom";

const TOAST_COLORS: Readonly<Record<ToastKind, string>> = {
  success: "positive",
  error: "negative",
  warning: "warning",
  info: "info",
};

export const notify = (
  kind: ToastKind,
  message: string,
  options: { timeout?: number; position?: NotifyPosition } = {},
): void => {
  Notify.create({
    message,
    timeout: options.timeout ?? 4000,
    position: options.position ?? "bottom-right",
    color: TOAST_COLORS[kind],
    textColor: kind === "warning" ? "dark" : "white",
    attrs: { role: "status", "aria-live": "polite" },
  });
};
