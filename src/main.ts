import { createApp } from "vue";
import { Notify, Quasar } from "quasar";
import iconSet from "quasar/icon-set/material-icons";
import "quasar/src/css/index.sass";
import "@shared/styles/app.css";
import App from "./App.vue";
import { router } from "./app/router";
import { pinia } from "./app/providers/pinia";
import { queryClient, VueQueryPlugin } from "./app/providers/query";

const mountApp = (): void => {
  createApp(App)
    .use(Quasar, { iconSet, plugins: { Notify } })
    .use(pinia)
    .use(VueQueryPlugin, { queryClient })
    .use(router)
    .mount("#app");
};

const renderMockFatalError = (error: unknown): void => {
  const root = document.querySelector("#app");
  if (root === null) {
    return;
  }
  root.textContent = "";
  const title = document.createElement("h1");
  title.textContent = "Modo mock indisponível";
  const detail = document.createElement("p");
  detail.textContent = error instanceof Error ? error.message : String(error);
  root.append(title, detail);
};

const bootstrap = async (): Promise<void> => {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_API === "1") {
    const { startMockWorker } = await import("./mocks/browser");
    await startMockWorker();
  }
  mountApp();
};

bootstrap().catch((error: unknown) => {
  renderMockFatalError(error);
  throw error;
});
