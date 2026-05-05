import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock, User, CheckCircle, Facebook, Copy, ExternalLink, CheckCheck } from "lucide-react";

const emailSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const WEBHOOK_URL = `${window.location.origin}/api/facebook/webhook`;

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
          {value}
        </code>
        <Button variant="ghost" size="icon" onClick={copy} className="shrink-0 h-9 w-9">
          {copied ? <CheckCheck className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const [emailSaved, setEmailSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onEmailSubmit = (values: EmailForm) => {
    setEmailSaved(false);
    updateProfile.mutate(
      { data: { fullName: values.fullName, email: values.email } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setEmailSaved(true);
          toast({ title: "Profile updated", description: "Your name and email have been saved." });
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Failed to update profile";
          toast({ title: "Update failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const onPasswordSubmit = (values: PasswordForm) => {
    setPasswordSaved(false);
    updateProfile.mutate(
      {
        data: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      },
      {
        onSuccess: () => {
          setPasswordSaved(true);
          passwordForm.reset();
          toast({ title: "Password changed", description: "Your password has been updated." });
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Failed to change password";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, and integrations.</p>
      </div>

      {/* Name & Email */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your display name and email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
              <FormField
                control={emailForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Full Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="you@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {emailSaved && (
                  <span className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in duration-300">
                    <CheckCircle className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Enter your current password to set a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Your current password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="At least 8 characters" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Repeat new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Updating..." : "Change Password"}
                </Button>
                {passwordSaved && (
                  <span className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in duration-300">
                    <CheckCircle className="h-4 w-4" /> Password updated
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Facebook Integration */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Facebook className="h-5 w-5 text-[#1877F2]" />
              Facebook Lead Integration
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" /> Connected
            </Badge>
          </div>
          <CardDescription>
            Configure your Facebook App to send new leads automatically to this dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <CopyField label="Callback URL (paste into Facebook App → Webhooks)" value={WEBHOOK_URL} />
            <CopyField label="Verify Token (paste into Facebook App → Webhooks)" value="Your FACEBOOK_VERIFY_TOKEN secret" />
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <p className="text-sm font-semibold">Setup steps in Meta for Developers:</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to <strong>Meta for Developers</strong> → Your App → <strong>Webhooks</strong></li>
              <li>Subscribe to <strong>Page</strong> object, field: <strong>leadgen</strong></li>
              <li>Paste the Callback URL and Verify Token above</li>
              <li>Click <strong>Verify and Save</strong> — it should say "Verified" ✓</li>
              <li>Subscribe your Facebook Page to the webhook</li>
            </ol>
          </div>

          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 space-y-1">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How it works</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              When someone fills out your Facebook Lead Ad form, Facebook instantly sends the lead
              to this webhook. The lead is fetched from Graph API and saved to your dashboard automatically.
              Conversion events (Qualified, Closed) are also sent back to Facebook via CAPI for ad optimization.
            </p>
          </div>

          <Button variant="outline" className="gap-2" asChild>
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open Meta for Developers
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
