"use client";

import { useState } from "react";
import { sendEmailVerification, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** El reenvío es siempre un clic del usuario: el alta manda este correo una sola vez. */
export function VerifyEmailBanner({ user }: { user: User }) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      setWasSent(true);
      toast({ title: "Correo enviado", description: `Revise la bandeja de ${user.email}.` });
    } catch (error) {
      const tooMany = error instanceof FirebaseError && error.code === "auth/too-many-requests";
      toast({
        title: "No se pudo enviar el correo",
        description: tooMany
          ? "Se han pedido demasiados correos. Espere unos minutos e intente de nuevo."
          : "Intente de nuevo en un momento.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-6 py-3">
      <p className="text-sm text-amber-800 dark:text-amber-300">
        <strong>Verifique su correo electrónico</strong> — Le enviamos un enlace a{" "}
        <span className="font-medium">{user.email}</span>. Necesita verificarlo
        para recibir alertas de oportunidades.
      </p>
      <Button variant="outline" size="sm" onClick={handleResend} disabled={isSending || wasSent}>
        {wasSent ? "Correo enviado" : "Reenviar correo"}
      </Button>
    </div>
  );
}
