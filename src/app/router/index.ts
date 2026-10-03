import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "public-home",
    component: () => import("@features/auth/pages/PublicHomePage.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
