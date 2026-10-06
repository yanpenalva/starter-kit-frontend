import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from "vue-router";
import { useSessionStore } from "@/features/auth/stores/session";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "public-home",
    component: () => import("@features/auth/pages/PublicHomePage.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@features/auth/pages/LoginPage.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@features/auth/pages/DashboardPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/users",
    name: "users",
    component: () => import("@features/users/pages/UsersPage.vue"),
    meta: { requiresAuth: true, permissions: ["users.view"] },
  },
  {
    path: "/roles",
    name: "roles",
    component: () => import("@features/roles/pages/RolesPage.vue"),
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/logs",
    name: "logs",
    component: () => import("@features/logs/pages/LogsPage.vue"),
    meta: { requiresAuth: true, permissions: ["logs.view"] },
  },
  {
    path: "/limited",
    name: "limited",
    component: () => import("@features/auth/pages/LimitedPage.vue"),
    meta: { requiresAuth: true, allowLimited: true },
  },
  {
    path: "/403",
    name: "forbidden",
    component: () => import("@features/auth/pages/ForbiddenPage.vue"),
  },
  {
    path: "/404",
    name: "not-found",
    component: () => import("@features/auth/pages/NotFoundPage.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "catch-all",
    component: () => import("@features/auth/pages/NotFoundPage.vue"),
  },
];

export async function navigationGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const session = useSessionStore();

  if (!session.isInitialized) {
    await session.bootstrap();
  }

  // 1. Account blocked (deactivated)
  if (session.isBlocked) {
    if (to.name !== "forbidden") {
      return next({ name: "forbidden", query: { reason: "blocked" } });
    }
    return next();
  }

  // 2. Guest-only routes when authenticated
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);
  if (guestOnly && session.isAuthenticated) {
    return next({ name: "dashboard" });
  }

  // 3. Protected routes when unauthenticated
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth && !session.isAuthenticated) {
    return next({
      name: "login",
      query: { redirect: to.fullPath !== "/" ? to.fullPath : undefined },
    });
  }

  // 4. Limited (unverified email) session restrictions
  if (requiresAuth && session.isLimited) {
    const allowLimited = to.matched.some((record) => record.meta.allowLimited);
    if (!allowLimited) {
      return next({ name: "limited" });
    }
  }

  // 5. Role restrictions
  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiresAuth && requiredRoles && requiredRoles.length > 0) {
    if (!session.hasAnyRole(requiredRoles)) {
      return next({
        name: "forbidden",
        query: { reason: "unauthorized_role" },
      });
    }
  }

  // 6. Permission restrictions
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
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(navigationGuard);
