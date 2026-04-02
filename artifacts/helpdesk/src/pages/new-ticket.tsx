import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTicket } from "@workspace/api-client-react";

import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Ticket as TicketIcon } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const ticketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details in the description"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.string().min(1, "Please select a category"),
  submitterName: z.string().min(2, "Name is required"),
  submitterEmail: z.string().email("Valid email is required"),
});

export default function NewTicket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTicket = useCreateTicket();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "general",
      submitterName: "",
      submitterEmail: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ticketSchema>) => {
    createTicket.mutate({ data: values }, {
      onSuccess: (newTicket) => {
        toast({ 
          title: "Ticket created successfully", 
          description: `Ticket #${newTicket.id} has been created.` 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setLocation(`/tickets/${newTicket.id}`);
      },
      onError: () => {
        toast({ 
          title: "Error creating ticket", 
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-primary" /> Create New Ticket
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Submit a new support request.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="submitterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requester Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="submitterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requester Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-border/50 pt-6"></div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing & Subscriptions</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - Minor issue, no workflow impact</SelectItem>
                          <SelectItem value="medium">Medium - Standard support request</SelectItem>
                          <SelectItem value="high">High - Workflow severely impacted</SelectItem>
                          <SelectItem value="urgent">Urgent - Complete system outage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe the issue in detail. Include any steps to reproduce if applicable." 
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border/50 px-6 py-4 flex justify-end gap-3">
              <Link href="/tickets">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
