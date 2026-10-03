import { createApp } from "vue";
import { Quasar } from "quasar";
import iconSet from "quasar/icon-set/material-icons";
import "quasar/src/css/index.sass";
import "@shared/styles/app.css";
import App from "./App.vue";
import { router } from "./app/router";
import { pinia } from "./app/providers/pinia";
import { queryClient, VueQueryPlugin } from "./app/providers/query";

createApp(App)
  .use(Quasar, { iconSet })
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .mount("#app");
