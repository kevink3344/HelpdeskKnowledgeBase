import { useLocation, useParams, Link } from "wouter";
import { useGetKbArticle, useIncrementKbArticleViews } from "@workspace/api-client-react";
import { useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Folder, Calendar, Tag, Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function KbArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();

  const incrementViews = useIncrementKbArticleViews();

  const { data: article, isLoading } = useGetKbArticle(articleId, {
    query: {
      enabled: !!articleId,
      queryKey: [`/api/kb/articles/${articleId}`]
    }
  });

  useEffect(() => {
    if (articleId) {
      // Only increment once on mount
      incrementViews.mutate({ id: articleId });
    }
  }, [articleId]); // Removed incrementViews from deps to prevent loop

  if (isLoading || !article) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-24 bg-muted rounded"></div>
        <div className="h-64 bg-muted/50 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/kb">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Folder className="w-3 h-3 mr-1" /> {article.category}
          </Badge>
          {!article.published && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Draft</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Edit className="w-4 h-4 mr-2" /> Edit Article
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-6 pt-8 px-8">
          <CardTitle className="text-3xl font-bold leading-tight mb-4">{article.title}</CardTitle>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Updated {format(new Date(article.updatedAt), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {article.viewCount} views
            </span>
            {article.relatedTicketId && (
              <Link href={`/tickets/${article.relatedTicketId}`}>
                <span className="flex items-center gap-1.5 text-primary hover:underline cursor-pointer">
                  <ExternalLink className="w-4 h-4" />
                  From Ticket #{article.relatedTicketId}
                </span>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
            {article.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-6 border-t flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-muted-foreground mr-2" />
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-muted font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
