import { createApp, h } from "vue";
import { Quasar } from "quasar";
import iconSet from "quasar/icon-set/material-icons";
import "quasar/src/css/index.sass";
import "../src/shared/styles/app.css";
import AuthLayout from "../src/shared/layouts/AuthLayout.vue";

createApp({
  render: () =>
    h(
      AuthLayout,
      {
        title: "Um passo de cada vez",
        description: "Conteúdo de apresentação para validar o layout.",
        eyebrow: "PRÉVIA DE LAYOUT",
      },
      {
        default: () => h("div", { class: "smoke-slot" }, "Conteúdo sintético"),
        footer: () => "Rodapé de teste",
      },
    ),
})
  .use(Quasar, { iconSet })
  .mount("#layout-smoke");
