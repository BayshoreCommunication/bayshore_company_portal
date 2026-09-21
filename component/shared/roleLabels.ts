export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  manager: "Account Manager",
  employee: "Employee",
  o_level: "O Level",
  executive: "Executive",
  hr: "HR",
  assistant_manager: "Asst. Manager",
  client: "Client",
};

export const roleLabel = (role?: string) => (role ? ROLE_LABELS[role] ?? role : "");
