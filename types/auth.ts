export type AppRole = "super_admin" | "admin" | "colaborador" | "user" | "shop";

export type AppPermission =
  | "tasks.create"
  | "tasks.update"
  | "tasks.delete"
  | "tasks.read_all"
  | "users.manage"
  | "shops.create"
  | "shops.update"
  | "shops.delete"
  | "shops.read_all"
  | "organizations.manage";
