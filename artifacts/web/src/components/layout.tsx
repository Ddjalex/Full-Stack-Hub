import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, clearToken } from "@/hooks/use-auth";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, ShieldAlert, Settings, Users } from "lucide-react";
import { useLeadNotifications } from "@/hooks/use-lead-notifications";

export default function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useLeadNotifications(!!user);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        clearToken();
        queryClient.setQueryData(getGetMeQueryKey(), null);
        toast({ title: "Logged out successfully" });
        setLocation("/login");
      },
      onError: (err) => {
        toast({ title: "Logout failed", description: err.message || "An error occurred", variant: "destructive" });
      }
    });
  };

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <Link
      href={href}
      className={`flex items-center space-x-1.5 text-sm font-medium transition-colors hover:text-foreground/80 ${
        location === href ? "text-foreground" : "text-foreground/60"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2 font-semibold">
              <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                M
              </div>
              <span>ManagePro</span>
            </Link>
            {user && (
              <nav className="flex items-center space-x-4">
                {navLink("/dashboard", "Dashboard", LayoutDashboard)}
                {user.role === "admin" && navLink("/leads", "Leads", Users)}
                {user.role === "admin" && navLink("/admin", "Admin", ShieldAlert)}
                {navLink("/settings", "Settings", Settings)}
              </nav>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm border px-3 py-1.5 rounded-full bg-muted/50">
                <span className="font-medium text-foreground truncate max-w-[140px]">{user.fullName}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{user.role}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
