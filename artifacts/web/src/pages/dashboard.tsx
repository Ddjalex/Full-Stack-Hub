import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Shield, User } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Here is an overview of your account details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_2fr] items-center gap-4 border-b pb-4">
              <span className="text-sm font-medium text-muted-foreground flex items-center">
                <User className="mr-2 h-4 w-4" /> Name
              </span>
              <span className="text-sm font-medium">{user.fullName}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] items-center gap-4 border-b pb-4">
              <span className="text-sm font-medium text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" /> Email
              </span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground flex items-center">
                <Shield className="mr-2 h-4 w-4" /> Role
              </span>
              <span>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="text-2xl font-bold">
                {new Date(user.createdAt).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                ({formatDistanceToNow(new Date(user.createdAt))} ago)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}