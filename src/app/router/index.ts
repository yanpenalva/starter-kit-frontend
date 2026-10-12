import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from "vue-router";
import { useSessionStore } from "@/features/auth/stores/session";
import { routeDescriptors } from "./descriptors";

const toRouteRecord = ({
  path,
  name,
  component,
  redirect,
  meta,
}: (typeof routeDescriptors)[number]): RouteRecordRaw => {
  if (redirect) {
    return { path, name, redirect, meta };
  }
  if (!component) {
    throw new Error(`rota ${name} sem component nem redirect`);
  }
  return { path, name, component, meta };
};

export const routes: RouteRecordRaw[] = routeDescriptors.map(toRouteRecord);

export const navigationGuard = async (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const session = useSessionStore();
  if (!session.isInitialized) {
    await session.bootstrap();
  }
  if (session.isBlocked) {
    if (to.name !== "forbidden") {
      return next({ name: "forbidden", query: { reason: "blocked" } });
    }
    return next();
  }
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);
  if (guestOnly && session.isAuthenticated) {
    return next({ name: "dashboard" });
  }
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth && !session.isAuthenticated) {
    return next({
      name: "login",
      query: { redirect: to.fullPath !== "/" ? to.fullPath : undefined },
    });
  }
  if (requiresAuth && session.isLimited) {
    const allowLimited = to.matched.some((record) => record.meta.allowLimited);
    if (!allowLimited) {
      return next({ name: "limited" });
    }
  }
  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiresAuth && requiredRoles && requiredRoles.length > 0) {
    if (!session.hasAnyRole(requiredRoles)) {
      return next({
        name: "forbidden",
        query: { reason: "unauthorized_role" },
      });
    }
  }
  const requiredPermissions = to.meta.permissions as string[] | undefined;
  if (requiresAuth && requiredPermissions && requiredPermissions.length > 0) {
    if (!session.hasAnyPermission(requiredPermissions)) {
      return next({
        name: "forbidden",
        query: { reason: "unauthorized_permission" },
      });
    }
  }
  return next();
};
export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to) => (to.hash ? { el: to.hash } : { top: 0 }),
});
router.beforeEach(navigationGuard);
