import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateKbArticle } from "@workspace/api-client-react";

import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const articleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Please provide more details in the content"),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().transform(val => val.split(',').map(t => t.trim()).filter(Boolean)),
  published: z.boolean().default(true),
});

export default function NewKbArticle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createArticle = useCreateKbArticle();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "General",
      tags: [] as any,
      published: true,
    },
  });

  const onSubmit = (values: z.infer<typeof articleSchema>) => {
    createArticle.mutate({ data: values }, {
      onSuccess: (newArticle) => {
        toast({ 
          title: "Article created", 
          description: `Knowledge base article has been saved.` 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/kb/articles"] });
        setLocation(`/kb/${newArticle.id}`);
      },
      onError: () => {
        toast({ 
          title: "Error saving article", 
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/kb">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Create Knowledge Base Article
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Write documentation to help users self-serve.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-8 space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. How to reset your password" className="text-lg" {...field} />
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
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Authentication">Authentication</SelectItem>
                          <SelectItem value="Network">Network</SelectItem>
                          <SelectItem value="Billing">Billing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. login, security, account" 
                          onChange={(e) => onChange(e.target.value)}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your article content here..." 
                        className="min-h-[400px] resize-y font-mono text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/10">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish immediately</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Turn off to save as a draft for later editing.
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border/50 px-8 py-4 flex justify-between gap-3">
              <Link href="/kb">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createArticle.isPending}>
                {createArticle.isPending ? "Saving..." : "Save Article"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
