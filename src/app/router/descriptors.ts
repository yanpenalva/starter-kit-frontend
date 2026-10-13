export type RouteAccessMeta = {
  requiresAuth?: boolean;
  guestOnly?: boolean;
  requiresMfa?: boolean;
  allowLimited?: boolean;
  roles?: string[];
  permissions?: string[];
};

export interface NavigationDescriptor {
  name: string;
  path: string;
  component?: () => Promise<unknown>;
  redirect?: { name: string };
  meta?: RouteAccessMeta;
  nav?: {
    label: string;
    allowLimited?: boolean;
    limitedOnly?: boolean;
  };
}

export interface ShortcutDescriptor {
  name: string;
  path: string;
  label: string;
  permissions: string[];
}

export const routeDescriptors: readonly NavigationDescriptor[] = [
  {
    name: "home",
    path: "/",
    redirect: { name: "dashboard" },
  },
  {
    name: "login",
    path: "/login",
    component: () => import("@features/auth/pages/LoginPage.vue"),
    meta: { guestOnly: true },
  },
  {
    name: "mfa-challenge",
    path: "/mfa-challenge",
    component: () => import("@features/auth/pages/MfaChallengePage.vue"),
    meta: { guestOnly: true, requiresMfa: true },
  },
  {
    name: "register",
    path: "/register",
    component: () => import("@features/auth/pages/RegisterPage.vue"),
    meta: { guestOnly: true },
  },
  {
    name: "forgot-password",
    path: "/forgot-password",
    component: () => import("@features/auth/pages/ForgotPasswordPage.vue"),
    meta: { guestOnly: true },
  },
  {
    name: "reset-password",
    path: "/reset-password",
    component: () => import("@features/auth/pages/ResetPasswordPage.vue"),
    meta: { guestOnly: true },
  },
  {
    name: "verify-email",
    path: "/verify-email",
    component: () => import("@features/auth/pages/VerifyEmailPage.vue"),
  },
  {
    name: "dashboard",
    path: "/dashboard",
    component: () => import("@features/auth/pages/DashboardPage.vue"),
    meta: { requiresAuth: true },
    nav: { label: "Início" },
  },
  {
    name: "sessions",
    path: "/sessions",
    component: () => import("@features/auth/pages/SessionsPage.vue"),
    meta: { requiresAuth: true },
    nav: { label: "Sessões" },
  },
  {
    name: "profile",
    path: "/profile",
    component: () => import("@features/auth/pages/ProfilePage.vue"),
    meta: { requiresAuth: true },
    nav: { label: "Minha Conta" },
  },
  {
    name: "users",
    path: "/users",
    component: () => import("@features/users/pages/UsersPage.vue"),
    meta: { requiresAuth: true, permissions: ["users.view"] },
    nav: { label: "Usuários" },
  },
  {
    name: "user-detail",
    path: "/users/:userId",
    component: () => import("@features/users/pages/UserDetailPage.vue"),
    meta: { requiresAuth: true, permissions: ["users.view"] },
  },
  {
    name: "roles",
    path: "/roles",
    component: () => import("@features/roles/pages/RolesPage.vue"),
    meta: { requiresAuth: true, permissions: ["roles.view"] },
    nav: { label: "Perfis" },
  },
  {
    name: "logs",
    path: "/logs",
    component: () => import("@features/logs/pages/LogsPage.vue"),
    meta: { requiresAuth: true, permissions: ["logs.view"] },
    nav: { label: "Auditoria" },
  },
  {
    name: "manual",
    path: "/manual",
    component: () => import("@features/manual/pages/ManualPage.vue"),
    meta: { requiresAuth: true, allowLimited: true },
    nav: { label: "Manual", allowLimited: true },
  },
  {
    name: "limited",
    path: "/limited",
    component: () => import("@features/auth/pages/LimitedPage.vue"),
    meta: { requiresAuth: true, allowLimited: true },
    nav: { label: "Verificação", allowLimited: true, limitedOnly: true },
  },
  {
    name: "forbidden",
    path: "/403",
    component: () => import("@features/auth/pages/ForbiddenPage.vue"),
  },
  {
    name: "not-found",
    path: "/404",
    component: () => import("@features/auth/pages/NotFoundPage.vue"),
  },
  {
    name: "catch-all",
    path: "/:pathMatch(.*)*",
    component: () => import("@features/auth/pages/NotFoundPage.vue"),
  },
] as const;

export const shortcutDescriptors: readonly ShortcutDescriptor[] = [
  {
    name: "users",
    path: "/users",
    label: "Gerenciar Usuários",
    permissions: ["users.view"],
  },
  {
    name: "roles",
    path: "/roles",
    label: "Gerenciar Perfis",
    permissions: ["roles.view"],
  },
  {
    name: "logs",
    path: "/logs",
    label: "Ver Logs de Auditoria",
    permissions: ["logs.view"],
  },
];
