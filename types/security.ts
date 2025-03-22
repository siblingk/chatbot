interface LoginSession {
  device: string;
  location: string;
  lastActive: string;
}

interface UserRole {
  userId: string;
  userName: string;
  role: "admin" | "manager" | "user";
}

export interface SecurityConfig {
  twoFactorEnabled: boolean;
  activeSessions: LoginSession[];
  userRoles: UserRole[];
}
