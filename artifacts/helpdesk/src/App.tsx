import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets";
import NewTicket from "@/pages/new-ticket";
import TicketDetail from "@/pages/ticket-detail";
import KnowledgeBase from "@/pages/knowledge-base";
import NewKbArticle from "@/pages/new-kb-article";
import KbArticleDetail from "@/pages/kb-article-detail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/tickets/new" component={NewTicket} />
        <Route path="/tickets/:id" component={TicketDetail} />
        <Route path="/kb" component={KnowledgeBase} />
        <Route path="/kb/new" component={NewKbArticle} />
        <Route path="/kb/:id" component={KbArticleDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
