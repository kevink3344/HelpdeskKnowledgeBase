import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full"></div>
        <AlertCircle className="w-24 h-24 text-red-500 relative z-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">404 - Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          The page you are looking for doesn't exist, has been moved, or you don't have access to it.
        </p>
      </div>
      <Link href="/">
        <Button className="mt-4" size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
