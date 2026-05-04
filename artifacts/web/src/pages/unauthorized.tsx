import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
      <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You do not have the required permissions to view the admin dashboard. 
        This area is restricted to administrators only.
      </p>
      <Button asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Link>
      </Button>
    </div>
  );
}