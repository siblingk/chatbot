export type AppRole = "admin" | "user";

export type AppPermission =
  | "tasks.create"
  | "tasks.update"
  | "tasks.delete"
  | "tasks.read_all"
  | "users.manage";
