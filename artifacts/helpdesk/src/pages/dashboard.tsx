import { useGetDashboardStats, useGetTicketsByStatus, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, CheckCircle2, AlertTriangle, Activity, CheckCircle, CircleDashed } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: statusCounts, isLoading: statusLoading } = useGetTicketsByStatus();
  const { data: activities, isLoading: activityLoading } = useGetRecentActivity();

  if (statsLoading || statusLoading || activityLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <div className="h-8 w-48 bg-muted rounded-md mb-2"></div>
          <div className="h-4 w-64 bg-muted/50 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/30 rounded-xl border border-border"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Open Tickets",
      value: stats?.openTickets || 0,
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Urgent Priority",
      value: stats?.urgentTickets || 0,
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Resolved (7d)",
      value: stats?.resolvedTickets || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Avg Resolution",
      value: stats?.avgResolutionHours ? `${stats.avgResolutionHours}h` : "N/A",
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const statusColors: Record<string, string> = {
    open: "hsl(var(--chart-1))",
    in_progress: "hsl(var(--chart-2))",
    resolved: "hsl(var(--chart-3))",
    closed: "hsl(var(--muted-foreground))",
  };

  const formattedChartData = statusCounts?.map((s) => ({
    name: s.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count: s.count,
    status: s.status
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your support operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Tickets by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 min-h-[300px]">
            {formattedChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {formattedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status] || statusColors.open} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="divide-y divide-border/30 max-h-[350px] overflow-y-auto">
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {activity.type === 'ticket_resolved' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : activity.type === 'ticket_created' ? (
                          <CircleDashed className="w-4 h-4 text-blue-500" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 ml-1" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-foreground line-clamp-2">
                          <span className="font-medium">{activity.description}</span>
                          {activity.ticketTitle && (
                            <Link href={`/tickets/${activity.ticketId}`}>
                              <span className="text-primary hover:underline cursor-pointer ml-1">
                                "{activity.ticketTitle}"
                              </span>
                            </Link>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
