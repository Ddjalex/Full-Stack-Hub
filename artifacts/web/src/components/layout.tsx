import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, LayoutDashboard, ShieldAlert } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        queryClient.setQueryData(getGetMeQueryKey(), null);
        toast({ title: "Logged out successfully" });
        setLocation("/login");
      },
      onError: (err) => {
        toast({ title: "Logout failed", description: err.message || "An error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2 font-semibold">
              <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
                M
              </div>
              <span>ManagePro</span>
            </Link>
            {user && (
              <nav className="flex items-center space-x-4 text-sm font-medium">
                <Link 
                  href="/dashboard" 
                  className={`flex items-center space-x-1 transition-colors hover:text-foreground/80 ${location === "/dashboard" ? "text-foreground" : "text-foreground/60"}`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                {user.role === "admin" && (
                  <Link 
                    href="/admin" 
                    className={`flex items-center space-x-1 transition-colors hover:text-foreground/80 ${location === "/admin" ? "text-foreground" : "text-foreground/60"}`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm border px-3 py-1.5 rounded-full bg-muted/50">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{user.fullName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
                <LogOut className="h-4 w-4 mr-2" />
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