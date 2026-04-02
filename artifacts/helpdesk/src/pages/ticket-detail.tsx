import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetTicket, 
  useUpdateTicket, 
  useCreateComment, 
  useUploadAttachment, 
  useDeleteAttachment 
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Paperclip, MessageSquare, Clock, User, Tag, 
  AlertCircle, CheckCircle2, Shield, FileText, Download, X
} from "lucide-react";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().default(false),
});

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: ticket, isLoading } = useGetTicket(ticketId, {
    query: {
      enabled: !!ticketId,
      queryKey: [`/api/tickets/${ticketId}`]
    }
  });

  const updateTicket = useUpdateTicket();
  const createComment = useCreateComment();
  const deleteAttachment = useDeleteAttachment();

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
      isInternal: false,
    },
  });

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-24 bg-muted rounded"></div>
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-64 bg-muted/50 rounded-xl"></div>
            <div className="h-48 bg-muted/50 rounded-xl"></div>
          </div>
          <div className="w-80 space-y-4">
            <div className="h-96 bg-muted/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

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

  const handleStatusChange = (newStatus: any) => {
    updateTicket.mutate({
      id: ticketId,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        toast({ title: "Status updated", description: `Ticket marked as ${newStatus.replace('_', ' ')}` });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      }
    });
  };

  const handlePriorityChange = (newPriority: any) => {
    updateTicket.mutate({
      id: ticketId,
      data: { priority: newPriority }
    }, {
      onSuccess: () => {
        toast({ title: "Priority updated", description: `Ticket priority changed to ${newPriority}` });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      }
    });
  };

  const onCommentSubmit = (values: z.infer<typeof commentSchema>) => {
    createComment.mutate({
      id: ticketId,
      data: {
        content: values.content,
        isInternal: values.isInternal,
        authorName: "Support Agent", // Mocked for now
        authorEmail: "agent@supportdesk.com"
      }
    }, {
      onSuccess: () => {
        commentForm.reset();
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        toast({ title: "Comment added", description: "Your response has been saved." });
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticketId", ticketId.toString());

    try {
      const res = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "File uploaded", description: "Attachment added to ticket." });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      } else {
        toast({ title: "Upload failed", description: "Failed to upload attachment.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Upload error", description: "An error occurred during upload.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    deleteAttachment.mutate({ id: attachmentId }, {
      onSuccess: () => {
        toast({ title: "Attachment removed" });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              #{ticket.id}
            </h1>
            <Badge variant="outline" className={`capitalize ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className={`capitalize ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Ticket Info */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl leading-tight">{ticket.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {ticket.submitterName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose dark:prose-invert max-w-none text-sm">
                {ticket.description.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </CardContent>
            
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="px-6 pb-6 pt-0">
                <Separator className="mb-4" />
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attachments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 bg-muted/30 border rounded-md p-2 text-sm group relative pr-8">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">{file.fileName}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(file.fileSize / 1024)}kb)
                      </span>
                      <a href={file.url} target="_blank" rel="noreferrer" className="absolute right-8 text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDeleteAttachment(file.id)}
                        className="absolute right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Conversation Thread */}
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Conversation
            </h3>
            
            <div className="space-y-4">
              {ticket.comments?.map((comment) => (
                <Card 
                  key={comment.id} 
                  className={`border-border/50 shadow-sm ${comment.isInternal ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/50' : ''}`}
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${comment.isInternal ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : 'bg-primary/10 text-primary'}`}>
                        {comment.authorName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {comment.authorName}
                          {comment.isInternal && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-[10px] py-0 h-4">
                              <Shield className="w-3 h-3 mr-1" /> Internal
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 text-sm whitespace-pre-wrap">
                    {comment.content}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Reply Box */}
            <Card className="border-border/50 shadow-sm mt-6 overflow-visible border-primary/20">
              <Form {...commentForm}>
                <form onSubmit={commentForm.handleSubmit(onCommentSubmit)}>
                  <CardContent className="p-4">
                    <FormField
                      control={commentForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Type your reply here..." 
                              className="min-h-[120px] resize-y border-0 focus-visible:ring-0 p-0 shadow-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <div className="px-4 pb-4 flex items-center justify-between bg-muted/10 rounded-b-xl border-t pt-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        {isUploading ? "Uploading..." : "Attach"}
                      </Button>

                      <FormField
                        control={commentForm.control}
                        name="isInternal"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal flex items-center text-muted-foreground cursor-pointer">
                              <Shield className="w-3 h-3 mr-1" /> Internal Note
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={createComment.isPending}
                      className={commentForm.watch("isInternal") ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    >
                      {createComment.isPending ? "Sending..." : (commentForm.watch("isInternal") ? "Add Internal Note" : "Send Reply")}
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Ticket Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="text-muted-foreground flex items-center gap-2 col-span-1">
                  <Tag className="w-3.5 h-3.5" /> Category
                </div>
                <div className="font-medium col-span-2 text-right">{ticket.category}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="text-muted-foreground flex items-center gap-2 col-span-1">
                  <User className="w-3.5 h-3.5" /> Assignee
                </div>
                <div className="font-medium col-span-2 text-right">{ticket.assigneeName || "Unassigned"}</div>
              </div>
            </CardContent>
          </Card>

          {/* KB Suggestions */}
          <Card className="border-border/50 shadow-sm bg-muted/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Suggested Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/kb/1" className="block p-3 rounded-md bg-background border hover:border-primary/50 transition-colors text-sm group">
                <div className="font-medium text-primary group-hover:underline line-clamp-1">How to reset your password</div>
                <div className="text-xs text-muted-foreground mt-1">Authentication</div>
              </Link>
              <Link href="/kb/2" className="block p-3 rounded-md bg-background border hover:border-primary/50 transition-colors text-sm group">
                <div className="font-medium text-primary group-hover:underline line-clamp-1">Troubleshooting connection issues</div>
                <div className="text-xs text-muted-foreground mt-1">Network</div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
