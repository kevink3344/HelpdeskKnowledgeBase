import { useState } from "react";
import { useListKbArticles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BookOpen, Eye, Folder, ChevronRight } from "lucide-react";

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  const { data: articles, isLoading } = useListKbArticles({
    search: search || undefined,
    category: category || undefined,
  }, {
    query: {
      queryKey: ["/api/kb/articles", { search, category }]
    }
  });

  const categories = ["All", "Authentication", "Network", "Billing", "General"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">Manage help articles and documentation.</p>
        </div>
        <Link href="/kb/new">
          <Button className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <div className="w-full md:w-64 space-y-6 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search articles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background shadow-sm"
            />
          </div>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 font-medium text-sm border-b">
              Categories
            </div>
            <div className="p-2 space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === "All" ? "" : cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    (cat === "All" && !category) || category === cat
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    {cat}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Article Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/50 shadow-sm animate-pulse h-40"></Card>
              ))}
            </div>
          ) : articles?.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No articles found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {articles?.map((article) => (
                <Link key={article.id} href={`/kb/${article.id}`}>
                  <Card className="border-border/50 shadow-sm hover:border-primary/50 transition-all cursor-pointer h-full flex flex-col group hover:shadow-md">
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors">
                          {article.category}
                        </Badge>
                        {!article.published && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Draft</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {article.content}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            {article.viewCount} views
                          </span>
                        </div>
                        <span className="text-primary font-medium flex items-center group-hover:translate-x-1 transition-transform">
                          Read <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
