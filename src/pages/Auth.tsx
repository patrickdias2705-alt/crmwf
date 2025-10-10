
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Zap, Sparkles, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    // Animação de entrada das partículas
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
      setTimeout(() => {
        particle.classList.add('animate-float');
      }, index * 200);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Create account
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setError('');
        setShowSuccess(true);
        setTimeout(() => {
          setIsSignUp(false);
          setShowSuccess(false);
        }, 3000);
      } else {
        // Sign in
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background com gradiente premium mais aparente */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/8 to-accent/12" />
      <div className="absolute inset-0 aurora animate-pulse opacity-30" />
      
      {/* Partículas animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle absolute opacity-25"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `scale(${0.5 + Math.random() * 0.5})`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            {i % 3 === 0 ? <Zap className="h-4 w-4 text-primary" /> : 
             i % 2 === 0 ? <Sparkles className="h-3 w-3 text-primary" /> : 
             <Shield className="h-4 w-4 text-primary" />}
          </div>
        ))}
      </div>

      {/* Efeito de brilho centralizado mais intenso */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/15 via-primary/8 to-transparent rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo DenTech com animação */}
          <div className="text-center mb-8 animate-scale-in">
            <div className="relative inline-block group">
              <div className="relative mx-auto mb-4 w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary-variant/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/55c76384-6a84-4f3a-a555-8b1652907de7.png" 
                  alt="DenTech Logo" 
                  className="w-16 h-16 object-contain animate-pulse drop-shadow-2xl" 
                />
              </div>
            </div>
            <p className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent text-sm animate-fade-in font-medium drop-shadow-sm" style={{ animationDelay: '0.2s' }}>
              DenTech
            </p>
          </div>

        {/* Card com glass morphism mais aparente */}
        <Card className="glass border-primary/20 shadow-2xl backdrop-blur-xl animate-slide-up glow-primary" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
            <CardTitle className="text-xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {isSignUp ? 'Criar Conta' : 'Acesso ao Sistema'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isSignUp ? 'Configure sua conta para acessar todas as funcionalidades' : 'Entre com suas credenciais e acelere seus resultados'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="glass border-red-500/20 animate-shake">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showSuccess && (
                <Alert className="glass border-green-500/20 bg-green-500/10 animate-fade-in">
                  <Sparkles className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    Conta criada com sucesso! Agora você pode fazer login.
                  </AlertDescription>
                </Alert>
              )}
              
              {isSignUp && (
                <div className="space-y-2 animate-slide-down">
                  <Label htmlFor="name" className="text-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="glass border-primary/20 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 bg-background/60 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass border-primary/20 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 bg-background/60 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                  <Zap className="h-3 w-3 text-primary" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="glass border-primary/20 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 bg-background/60 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="space-y-3 pt-2">
                 <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground font-semibold shadow-glow hover:shadow-neon hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-0" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       <span className="text-primary-foreground font-medium">
                         {isSignUp ? 'Criando sua conta...' : 'Acessando sistema...'}
                       </span>
                    </>
                  ) : (
                     <span className="flex items-center gap-2 text-primary-foreground font-medium">
                       <Zap className="h-4 w-4" />
                       {isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
                     </span>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full h-10 glass border border-primary/20 hover:border-primary/30 hover:bg-primary/10 hover:text-foreground transition-all duration-300 text-muted-foreground" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setShowSuccess(false);
                  }}
                  disabled={isLoading}
                >
                  <span className="hover:text-foreground transition-colors">
                    {isSignUp ? 'Já tem conta? Fazer Login' : 'Não tem conta? Criar Agora'}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-xs text-muted-foreground">
            Powered by <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-semibold font-display">DenTech Technology</span>
          </p>
        </div>
      </div>
    </div>
  );
}
