
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo a su panel...",
      });
      router.push('/dashboard');
    } catch (error) {
      let errorMessage = "Ocurrió un error desconocido.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Correo o contraseña inválidos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Por favor, introduzca un correo electrónico válido.';
            break;
          default:
            errorMessage = 'No se pudo iniciar sesión. Por favor, inténtelo de nuevo.';
            break;
        }
      }
      toast({
        title: "Falló el Inicio de Sesión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ title: "Error", description: "Por favor, introduzca su correo electrónico.", variant: "destructive" });
      return;
    }
    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Correo Enviado",
        description: "Si la cuenta existe, recibirá un correo para restablecer su contraseña.",
      });
      setIsResetDialogOpen(false);
    } catch (error) {
      let errorMessage = "Ocurrió un error al enviar el correo.";
      if (error instanceof FirebaseError && error.code === 'auth/invalid-email') {
          errorMessage = 'El formato del correo electrónico no es válido.';
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-white/20 shadow-2xl shadow-black/50">
        <CardHeader className="text-center space-y-4">
          <Image src="/logo-bidtory-aplica-pos.svg" alt="Bidtory Aplica Logo" width={192} height={60} className="mx-auto h-20 w-auto" />
          <CardDescription className="text-foreground/80 pt-2">Inicie sesión para gestionar sus oportunidades y proyectos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="su@ejemplo.com" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetEmail(e.target.value);
                }}
                required 
                className="bg-input/70 border-white/20 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-input/70 border-white/20 focus:border-accent pr-10"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm gap-2">
          <p className="text-muted-foreground w-full">
              ¿Problemas para iniciar sesión? <AlertDialogTrigger asChild>
                  <button className="text-accent hover:underline">Restablezca su contraseña.</button>
              </AlertDialogTrigger>
          </p>
          <p className="text-muted-foreground w-full">
            ¿Aún no tiene acceso a Bidtory Aplica? <Link href="/" className="text-accent hover:underline">Descubra cómo podemos ayudarle.</Link>
          </p>
        </CardFooter>
      </Card>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
          <AlertDialogDescription>
            Introduzca su correo electrónico a continuación. Le enviaremos un enlace para restablecer su contraseña si la cuenta está registrada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
            <Label htmlFor="reset-email">Correo Electrónico</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="su@ejemplo.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handlePasswordReset} disabled={isResetLoading}>
            {isResetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isResetLoading ? "Enviando..." : "Enviar Correo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
