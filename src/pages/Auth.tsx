import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { user, session, login } = useAuth();
  const { toast } = useToast();

  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadCompany = async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error) {
        setCompany(data);
      }
    };

    loadCompany();
  }, []);

  if (session && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) {
        toast({
          title: 'Login failed',
          description: error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Login successful. Redirecting to dashboard...',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-lg border bg-card shadow-xl md:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(222_47%_18%)_55%,hsl(16_65%_32%)_100%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-white">
                <img
                  src={company?.logo_url || "/favicon.ico"}
                  alt="Phoenix Realesthatic logo"
                  className="h-16 object-contain"
                />
              </div>
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Lead to booking control</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Manage properties, customers, and field teams from one workspace.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/72">
                A focused CRM dashboard for sales follow-ups, site visits, bookings, attendance, and reporting.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <Building2 className="h-5 w-5 text-accent" />
              <p className="mt-3 text-2xl font-bold">156</p>
              <p className="text-xs text-white/65">Active properties</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <TrendingUp className="h-5 w-5 text-accent" />
              <p className="mt-3 text-2xl font-bold">1.2K</p>
              <p className="text-xs text-white/65">Tracked leads</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <p className="mt-3 text-2xl font-bold">KYC</p>
              <p className="text-xs text-white/65">Ready records</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-white overflow-hidden">
                <img
                  src={company?.logo_url || "/favicon.ico"}
                  alt="Phoenix Realesthatic logo"
                  className="object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                  }}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Sign in to access your workspace.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
