import { useState } from "react";
import {
  useGetLeads,
  useGetLeadStats,
  useUpdateLeadStatus,
  getGetLeadsQueryKey,
  getGetLeadStatsQueryKey,
  type GetLeadsParams,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Phone,
  Mail,
  Megaphone,
} from "lucide-react";

type LeadStatus = "CREATED" | "QUALIFIED" | "CLOSED" | "REJECTED";

const STATUS_COLORS: Record<LeadStatus, string> = {
  CREATED: "bg-blue-100 text-blue-800 border-blue-200",
  QUALIFIED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-purple-100 text-purple-800 border-purple-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const ALL_STATUSES: LeadStatus[] = ["CREATED", "QUALIFIED", "CLOSED", "REJECTED"];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams: GetLeadsParams = {
    search: appliedSearch || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  };

  const { data: statsData, isLoading: statsLoading } = useGetLeadStats();
  const { data: leadsData, isLoading: leadsLoading } = useGetLeads(queryParams);

  const updateStatus = useUpdateLeadStatus();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
  };

  const handleStatusChange = (leadId: number, newStatus: LeadStatus) => {
    updateStatus.mutate(
      { id: leadId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
          toast({ title: "Status updated", description: `Lead moved to ${newStatus}` });
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description: err?.data?.error ?? err.message ?? "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const stats = statsData ?? { total: 0, created: 0, qualified: 0, closed: 0, rejected: 0 };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage Facebook leads through the conversion funnel.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "—" : stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-600">Created</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "—" : stats.created}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-600">Qualified</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "—" : stats.qualified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-purple-600">Closed</CardTitle>
            <Megaphone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "—" : stats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "—" : stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lead table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-muted/20 pb-4">
          <CardTitle className="text-xl">Leads</CardTitle>
          <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap">
            <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Name, email, phone…"
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as LeadStatus | "ALL")}
            >
              <SelectTrigger className="w-36 bg-background">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(appliedSearch || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setAppliedSearch("");
                  setStatusFilter("ALL");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source / Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[140px]">Change Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Loading leads…
                  </TableCell>
                </TableRow>
              ) : !leadsData?.leads.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No leads found.{" "}
                    {!appliedSearch && statusFilter === "ALL" && (
                      <span className="block text-xs mt-1">
                        Send a POST to <code className="bg-muted px-1 rounded">/api/leads</code> from Zapier to add leads.
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                leadsData.leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.fullName}</div>
                      {lead.facebookLeadId && (
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                          FB: {lead.facebookLeadId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[160px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          {lead.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.source && (
                        <div className="text-sm font-medium">{lead.source}</div>
                      )}
                      {lead.campaignName && (
                        <div className="text-xs text-muted-foreground">{lead.campaignName}</div>
                      )}
                      {lead.adName && (
                        <div className="text-xs text-muted-foreground">{lead.adName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[lead.status as LeadStatus]}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(lead.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) =>
                          handleStatusChange(lead.id, v as LeadStatus)
                        }
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="h-8 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration hint */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm font-semibold mb-2">Zapier / Webhook Integration</p>
          <p className="text-xs text-muted-foreground mb-3">
            Send a POST request to <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">/api/leads</code> with the following JSON body:
          </p>
          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto text-foreground">
{`{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "facebookLeadId": "fb_lead_id_from_webhook",
  "source": "Facebook",
  "campaignName": "Summer Campaign",
  "adName": "Ad Set A"
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
