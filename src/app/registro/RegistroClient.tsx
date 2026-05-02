"use client";

import { useState, useCallback } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { LegalLayout } from "@/components/layout/LegalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";
import descubreApiClient from "@/lib/descubre-api-client";

const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6LfE3zsrAAAAAEF_CY-ik0PVRxLGfGPCihLQ04YZ";

const PLAN_NAMES: Record<string, string> = {
  esencial: "Esencial",
  profesional: "Profesional",
  experto: "Experto",
};

const TIPOS_DOCUMENTO = [
  { value: "", label: "Seleccione un tipo..." },
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "NIT", label: "NIT" },
  { value: "CE", label: "Cédula de Extranjería (CE)" },
];

function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  // Business-safe email validation: blocks spaces/double dots and requires TLD >= 2.
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized) &&
    !normalized.includes("..");
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Colombia: mobile 10 digits starts with 3, landline 10 digits starts with 60.
  return /^3\d{9}$/.test(cleaned) || /^60\d{8}$/.test(cleaned);
}

function formatColombianPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.startsWith("3")) {
    // 300 123 4567
    return digits.replace(/(\d{0,3})(\d{0,3})(\d{0,4}).*/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  if (digits.startsWith("60")) {
    // 601 234 5678
    return digits.replace(/(\d{0,3})(\d{0,3})(\d{0,4}).*/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return digits;
}

export function RegistroClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const planParam = searchParams.get("plan") || "";
  const planElegido = ["esencial", "profesional", "experto"].includes(planParam)
    ? planParam
    : "esencial";
  const planNombre = PLAN_NAMES[planElegido] || "Esencial";

  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    emailConfirm: "",
    password: "",
    passwordConfirm: "",
    nombreEmpresa: "",
    nombrePersonaContacto: "",
    cargoPersonaContacto: "",
    tipoDocumento: "",
    numeroDocumento: "",
    digitoVerificacion: "",
    emailFacturacion: "",
    telefonoFacturacion: "",
    direccionFacturacion: "",
    aceptaTerminos: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAccountEmailReady =
    isValidEmail(form.email) &&
    isValidEmail(form.emailConfirm) &&
    form.email.trim().toLowerCase() === form.emailConfirm.trim().toLowerCase();
  const isBillingEmailReady = isValidEmail(form.emailFacturacion);
  const isBillingPhoneReady = isValidPhone(form.telefonoFacturacion);
  const isContactDataReady =
    isAccountEmailReady && isBillingEmailReady && isBillingPhoneReady;

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.email.trim()) {
      newErrors.email = "El correo electrónico es requerido.";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Ingrese un correo electrónico válido.";
    }

    if (form.email !== form.emailConfirm) {
      newErrors.emailConfirm = "Los correos electrónicos no coinciden.";
    } else if (form.emailConfirm && !isValidEmail(form.emailConfirm)) {
      newErrors.emailConfirm = "Ingrese un correo electrónico válido.";
    }

    if (form.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (form.password !== form.passwordConfirm) {
      newErrors.passwordConfirm = "Las contraseñas no coinciden.";
    }

    if (!form.nombreEmpresa.trim()) {
      newErrors.nombreEmpresa = "El nombre de la empresa es requerido.";
    }

    if (!form.nombrePersonaContacto.trim()) {
      newErrors.nombrePersonaContacto =
        "El nombre de la persona de contacto es requerido.";
    }

    if (!form.tipoDocumento) {
      newErrors.tipoDocumento = "Seleccione un tipo de documento.";
    }

    if (!form.numeroDocumento.trim()) {
      newErrors.numeroDocumento = "El número de documento es requerido.";
    }

    if (form.tipoDocumento === "NIT") {
      if (!form.digitoVerificacion.trim()) {
        newErrors.digitoVerificacion =
          "El dígito de verificación es requerido para NIT.";
      } else if (!/^[0-9]$/.test(form.digitoVerificacion)) {
        newErrors.digitoVerificacion =
          "El DV debe ser un único dígito numérico (0-9).";
      }
    }

    if (!form.emailFacturacion.trim()) {
      newErrors.emailFacturacion = "El email de facturación es requerido.";
    } else if (!isValidEmail(form.emailFacturacion)) {
      newErrors.emailFacturacion = "Ingrese un correo electrónico válido.";
    }

    if (!form.telefonoFacturacion.trim()) {
      newErrors.telefonoFacturacion =
        "El teléfono de facturación es requerido.";
    } else if (!isValidPhone(form.telefonoFacturacion)) {
      newErrors.telefonoFacturacion =
        "El teléfono debe tener 10 dígitos y comenzar con 3 (celular) o 60 (fijo).";
    }

    if (!form.direccionFacturacion.trim()) {
      newErrors.direccionFacturacion =
        "La dirección de facturación es requerida.";
    }

    if (!form.aceptaTerminos) {
      newErrors.aceptaTerminos =
        "Debe aceptar los Términos de Uso y la Política de Privacidad.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!recaptchaReady) {
      toast({
        title: "Error",
        description:
          "La verificación de seguridad aún no está lista. Espere un momento e intente de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const recaptchaToken = await new Promise<string>((resolve, reject) => {
        if (typeof window === "undefined" || !window.grecaptcha) {
          reject(new Error("reCAPTCHA no disponible"));
          return;
        }
        window.grecaptcha.ready(() => {
          window.grecaptcha!
            .execute(RECAPTCHA_SITE_KEY, { action: "REGISTRO_CLIENTE" })
            .then(resolve)
            .catch(reject);
        });
      });

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      const payload = {
        nombre_empresa: form.nombreEmpresa.trim(),
        nombre_persona_contacto: form.nombrePersonaContacto.trim(),
        cargo_persona_contacto: form.cargoPersonaContacto.trim() || undefined,
        nivel_suscripcion_elegido: planElegido,
        tipo_documento_facturacion: form.tipoDocumento || undefined,
        numero_documento_facturacion: form.numeroDocumento.trim() || undefined,
        digito_verificacion_facturacion:
          form.tipoDocumento === "NIT"
            ? form.digitoVerificacion.trim() || undefined
            : undefined,
        email_facturacion: form.emailFacturacion.trim() || undefined,
        telefono_contacto_facturacion:
          form.telefonoFacturacion.replace(/\s/g, "") || undefined,
        direccion_facturacion: form.direccionFacturacion.trim() || undefined,
        recaptcha_token: recaptchaToken,
      };

      const data = await descubreApiClient.post<{
        success?: boolean;
        message?: string;
        email_verificacion_requerida?: boolean;
      }>("/v1/client_profile", payload);

      toast({
        title: "¡Bienvenido a Bidtory!",
        description: data.message || "Su cuenta ha sido creada exitosamente.",
      });
      router.push("/dashboard/descubre");
    } catch (err) {
      let message = "Error en el proceso de registro.";
      if (err instanceof FirebaseError) {
        if (err.code === "auth/email-already-in-use") {
          message = "Este correo electrónico ya está registrado.";
        } else if (err.code === "auth/weak-password") {
          message = "La contraseña es demasiado débil.";
        } else if (err.code === "auth/invalid-email") {
          message = "El correo electrónico no es válido.";
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LegalLayout>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
        strategy="lazyOnload"
        onLoad={() => setRecaptchaReady(true)}
      />
      <div className="container mx-auto max-w-xl px-4 py-8 md:py-12">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center font-headline text-xl">
              Crear su Cuenta Bidtory
            </CardTitle>
            <p className="text-center text-muted-foreground text-sm mt-1">
              Está a un paso de optimizar su búsqueda de licitaciones y
              oportunidades de negocio.
            </p>
            <p className="text-center text-sm mt-2">
              Plan seleccionado: <strong>{planNombre}</strong>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-sm font-medium border-b border-border pb-2 mb-4">
                  Información de la Cuenta
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        updateField("email", e.target.value.toLowerCase().replace(/\s/g, ""))
                      }
                      placeholder="su@correo.com"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={100}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="emailConfirm">Confirmar Correo</Label>
                    <Input
                      id="emailConfirm"
                      type="email"
                      value={form.emailConfirm}
                      onChange={(e) =>
                        updateField(
                          "emailConfirm",
                          e.target.value.toLowerCase().replace(/\s/g, "")
                        )
                      }
                      placeholder="Confirme su correo"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={100}
                      className={errors.emailConfirm ? "border-destructive" : ""}
                    />
                    {errors.emailConfirm && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.emailConfirm}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña (min. 6 caracteres)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="Contraseña"
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="passwordConfirm">Confirmar Contraseña</Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      value={form.passwordConfirm}
                      onChange={(e) =>
                        updateField("passwordConfirm", e.target.value)
                      }
                      placeholder="Confirmar contraseña"
                      className={errors.passwordConfirm ? "border-destructive" : ""}
                    />
                    {errors.passwordConfirm && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.passwordConfirm}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium border-b border-border pb-2 mb-4">
                  Información de Contacto y Empresa
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
                    <Input
                      id="nombreEmpresa"
                      value={form.nombreEmpresa}
                      onChange={(e) =>
                        updateField("nombreEmpresa", e.target.value)
                      }
                      placeholder="Nombre de su empresa"
                      className={errors.nombreEmpresa ? "border-destructive" : ""}
                    />
                    {errors.nombreEmpresa && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.nombreEmpresa}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nombrePersonaContacto">
                      Nombre de la Persona de Contacto
                    </Label>
                    <Input
                      id="nombrePersonaContacto"
                      value={form.nombrePersonaContacto}
                      onChange={(e) =>
                        updateField("nombrePersonaContacto", e.target.value)
                      }
                      placeholder="Su nombre completo"
                      className={
                        errors.nombrePersonaContacto ? "border-destructive" : ""
                      }
                    />
                    {errors.nombrePersonaContacto && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.nombrePersonaContacto}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cargoPersonaContacto">
                      Cargo (Opcional)
                    </Label>
                    <Input
                      id="cargoPersonaContacto"
                      value={form.cargoPersonaContacto}
                      onChange={(e) =>
                        updateField("cargoPersonaContacto", e.target.value)
                      }
                      placeholder="Ej: Gerente Comercial"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium border-b border-border pb-2 mb-4">
                  Información para Facturación
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                    <select
                      id="tipoDocumento"
                      value={form.tipoDocumento}
                      onChange={(e) =>
                        updateField("tipoDocumento", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {TIPOS_DOCUMENTO.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipoDocumento && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.tipoDocumento}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numeroDocumento">Número Documento</Label>
                      <Input
                        id="numeroDocumento"
                        value={form.numeroDocumento}
                        onChange={(e) =>
                          updateField("numeroDocumento", e.target.value)
                        }
                        placeholder="Número"
                        className={
                          errors.numeroDocumento ? "border-destructive" : ""
                        }
                      />
                      {errors.numeroDocumento && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.numeroDocumento}
                        </p>
                      )}
                    </div>
                    {form.tipoDocumento === "NIT" && (
                      <div>
                        <Label htmlFor="digitoVerificacion">DV</Label>
                        <Input
                          id="digitoVerificacion"
                          value={form.digitoVerificacion}
                          onChange={(e) =>
                            updateField(
                              "digitoVerificacion",
                              e.target.value.replace(/[^0-9]/g, "").slice(0, 1)
                            )
                          }
                          placeholder="0-9"
                          maxLength={1}
                          className={
                            errors.digitoVerificacion ? "border-destructive" : ""
                          }
                        />
                        {errors.digitoVerificacion && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.digitoVerificacion}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="emailFacturacion">Email para Facturación</Label>
                    <Input
                      id="emailFacturacion"
                      type="email"
                      value={form.emailFacturacion}
                      onChange={(e) =>
                        updateField(
                          "emailFacturacion",
                          e.target.value.toLowerCase().replace(/\s/g, "")
                        )
                      }
                      placeholder="correo@facturacion.com"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={100}
                      className={
                        errors.emailFacturacion ? "border-destructive" : ""
                      }
                    />
                    {errors.emailFacturacion && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.emailFacturacion}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="telefonoFacturacion">
                      Teléfono Contacto Facturación
                    </Label>
                    <Input
                      id="telefonoFacturacion"
                      type="tel"
                      value={form.telefonoFacturacion}
                      onChange={(e) =>
                        updateField(
                          "telefonoFacturacion",
                          formatColombianPhoneInput(e.target.value)
                        )
                      }
                      placeholder="300 123 4567 o 601 234 5678"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={12}
                      className={
                        errors.telefonoFacturacion ? "border-destructive" : ""
                      }
                    />
                    {errors.telefonoFacturacion && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.telefonoFacturacion}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="direccionFacturacion">
                      Dirección de Facturación{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="direccionFacturacion"
                      value={form.direccionFacturacion}
                      onChange={(e) =>
                        updateField("direccionFacturacion", e.target.value)
                      }
                      placeholder="Dirección completa"
                      className={
                        errors.direccionFacturacion ? "border-destructive" : ""
                      }
                    />
                    {errors.direccionFacturacion && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.direccionFacturacion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.aceptaTerminos}
                    onChange={(e) =>
                      updateField("aceptaTerminos", e.target.checked)
                    }
                    className="mt-1 rounded border-input"
                  />
                  <span className="text-sm">
                    Acepto los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      Términos de Uso
                    </Link>{" "}
                    y la{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      Política de Privacidad
                    </Link>
                    .
                  </span>
                </label>
                {errors.aceptaTerminos && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.aceptaTerminos}
                  </p>
                )}
              </div>

              <p className="text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Sus datos están protegidos.
              </p>

              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground shadow-sm hover:bg-accent/90"
                size="lg"
                disabled={isSubmitting || !isContactDataReady}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Crear Cuenta y Suscribirse"
                )}
              </Button>
              {!isContactDataReady && (
                <p className="text-center text-xs text-muted-foreground">
                  Complete correos válidos y teléfono colombiano válido para continuar.
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </LegalLayout>
  );
}
