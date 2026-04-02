import { useState } from "react";
import { useListTickets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Search, Plus, SlidersHorizontal, Filter, MessageSquare, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Tickets() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const { data: tickets, isLoading } = useListTickets({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    priority: priority !== "all" ? priority : undefined,
  }, {
    query: {
      queryKey: ["/api/tickets", { search, status, priority }]
    }
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case 'high': return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case 'medium': return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case 'low': return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'open': return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case 'in_progress': return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
      case 'resolved': return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case 'closed': return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage and respond to customer requests.</p>
        </div>
        <Link href="/tickets/new">
          <Button className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tickets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px] bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[140px] bg-background">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Ticket Details</TableHead>
                <TableHead className="hidden md:table-cell">Requester</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Priority</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 w-48 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="h-4 w-24 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : tickets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    No tickets found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                tickets?.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/10 group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{ticket.id}
                    </TableCell>
                    <TableCell>
                      <Link href={`/tickets/${ticket.id}`} className="block">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer block truncate max-w-[300px] lg:max-w-[400px]">
                          {ticket.title}
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="truncate">{ticket.category}</span>
                          {ticket.commentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {ticket.commentCount}
                            </span>
                          )}
                          {ticket.attachmentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {ticket.attachmentCount}
                            </span>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm font-medium">{ticket.submitterName}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{ticket.submitterEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize font-medium px-2.5 py-0.5 ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize font-medium px-2.5 py-0.5 ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
