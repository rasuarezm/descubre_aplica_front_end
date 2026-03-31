
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Política de Cookies - Puro Contenido',
  description: 'Información sobre cómo utilizamos cookies en nuestro sitio web.',
  robots: {
    index: false,
    follow: false,
  }
};

export default function CookiesPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center justify-center gap-3">
            <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={28} height={28} className="h-auto w-7" />
            <span className="font-headline font-bold text-xl tracking-wide ml-2">Puro Contenido</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/methodology" className="text-sm font-medium hover:text-accent transition-colors">Nuestra Metodología</Link>
            <Link href="/#bidtory" className="text-sm font-medium hover:text-accent transition-colors">Suite Bidtory</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Acceso Clientes</Link>
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link href="/contact">Contactar</Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <article className="prose dark:prose-invert max-w-4xl mx-auto">
            <h1>Política de Cookies del Sitio Web de Puro Contenido SAS</h1>
            <p><strong>Última Actualización: 24 de agosto de 2025</strong></p>
            
            <h2>Introducción</h2>
            <p>Esta Política de Cookies explica cómo Puro Contenido SAS ("Puro Contenido", "nosotros", "nuestro"), a través de su sitio web www.purocontenido.com (en adelante, "el Sitio Web"), utiliza cookies y tecnologías similares para reconocerle cuando visita nuestro sitio. Explica qué son estas tecnologías y por qué las utilizamos, así como sus derechos para controlar nuestro uso de ellas.</p>
            
            <h2>1. ¿Qué son las Cookies?</h2>
            <p>Las cookies son pequeños archivos de datos que se colocan en su ordenador o dispositivo móvil cuando visita un sitio web. Son ampliamente utilizadas por los propietarios de sitios web para que sus sitios funcionen, o para que funcionen de manera más eficiente, así como para proporcionar información de informes.</p>
            <p>Las cookies establecidas por el propietario del sitio web (en este caso, Puro Contenido SAS) se denominan "cookies de origen". Las cookies establecidas por partes distintas al propietario del sitio web se denominan "cookies de terceros". Las cookies de terceros permiten que se proporcionen características o funcionalidades de terceros en o a través del sitio web (ej. publicidad, contenido interactivo y análisis). Las partes que establecen estas cookies de terceros pueden reconocer su ordenador tanto cuando visita el sitio web en cuestión como cuando visita ciertos otros sitios web.</p>
            
            <h2>2. ¿Por qué usamos Cookies?</h2>
            <p>Utilizamos cookies de origen y de terceros por varias razones. Algunas cookies son necesarias por razones técnicas para que nuestro Sitio Web funcione (cookies "estrictamente necesarias"). Otras nos permiten rastrear y orientar los intereses de nuestros usuarios para mejorar la experiencia en nuestro Servicio (cookies de "rendimiento" y "funcionalidad"), y para garantizar la seguridad del mismo.</p>
            
            <h2>3. Tipos de Cookies Utilizadas en el Sitio Web de Puro Contenido SAS</h2>
            <p>Los tipos específicos de cookies de origen y de terceros servidas a través de nuestro Sitio Web y los propósitos que cumplen se describen a continuación:</p>
            <h3>3.1. Cookies Estrictamente Necesarias</h3>
            <p>Estas cookies son esenciales para proporcionarle los servicios disponibles a través de nuestro Sitio Web y para permitirle utilizar algunas de sus funciones, como el acceso a la Zona de Clientes o la gestión de su sesión de usuario. Sin estas cookies, los servicios que ha solicitado, como el inicio de sesión, no pueden ser proporcionados.</p>
            <ul>
                <li><strong>Ejemplos:</strong> Cookies de sesión de Firebase Authentication (para mantener su sesión iniciada en la Zona de Clientes), cookies que recuerdan sus preferencias de consentimiento de cookies (establecidas por la librería de gestión de consentimiento de cookies).</li>
            </ul>
            <h3>3.2. Cookies de Rendimiento y Analíticas</h3>
            <p>Estas cookies recopilan información sobre cómo los visitantes utilizan nuestro Sitio Web (ej. qué páginas visitan con mayor frecuencia, qué enlaces hacen clic). Esta información se utiliza para mejorar el funcionamiento de nuestro Sitio Web y para entender el comportamiento del usuario. Estas cookies solo se activan si el usuario da su consentimiento explícito a través del banner de cookies.</p>
            <ul>
                <li><strong>Ejemplo:</strong> Google Analytics. Las cookies de Google Analytics recopilan datos sobre su interacción con el Sitio Web, como las páginas que visita, el tiempo que pasa en ellas, su dirección IP (anonimizada), y el tipo de dispositivo. Esta información nos ayuda a analizar el tráfico web y optimizar el Sitio Web.</li>
            </ul>
            <h3>3.3. Cookies de Funcionalidad</h3>
            <p>Estas cookies nos permiten recordar las elecciones que usted hace cuando utiliza nuestro Sitio Web, como recordar sus preferencias o los detalles de su perfil, y proporcionar características mejoradas y más personalizadas.</p>
            <ul>
                <li><strong>Ejemplo:</strong> Cookies establecidas por la librería de gestión de consentimiento de cookies para recordar si usted ha aceptado o rechazado el uso de cookies.</li>
            </ul>
            <h3>3.4. Cookies de Seguridad</h3>
            <p>Estas cookies son utilizadas para proteger el Sitio Web y a los usuarios de actividades fraudulentas y spam.</p>
            <ul>
                <li><strong>Ejemplo:</strong> Google reCAPTCHA v3. Este servicio utiliza cookies y analiza el comportamiento del usuario para determinar si la interacción es humana o un bot en el formulario de contacto y otras interacciones.</li>
            </ul>

            <h2>4. Cookies de Terceros</h2>
            <p>Nuestro Sitio Web utiliza servicios y librerías de terceros que pueden configurar sus propias cookies:</p>
            <ul>
                <li><strong>Google (Firebase, Analytics, reCAPTCHA, Google Fonts):</strong> Como se mencionó anteriormente, Google, a través de sus servicios Firebase (para autenticación), Analytics (para seguimiento), reCAPTCHA (para seguridad) y Google Fonts (para la tipografía del sitio), puede establecer cookies en su dispositivo. El uso de estas cookies está sujeto a las políticas de privacidad y los términos de servicio de Google.</li>
            </ul>
            
            <h2>5. Su Control sobre las Cookies</h2>
            <p>Usted tiene el derecho de decidir si acepta o rechaza las cookies. Puede ejercer sus preferencias de cookies de la siguiente manera:</p>
            <h3>5.1. Banner de Consentimiento de Cookies:</h3>
            <p>Al acceder a nuestro Sitio Web, se le presentará un banner de consentimiento de cookies que le permitirá aceptar o rechazar el uso de cookies no esenciales (como las de análisis). Usted puede cambiar su elección en cualquier momento haciendo clic en el enlace "Configuración de Cookies" o "Gestionar Consentimiento" que se encuentra generalmente en el pie de página de nuestro Sitio Web.</p>
            <h3>5.2. Configuración del Navegador:</h3>
            <p>Puede configurar o modificar los controles de su navegador web para aceptar o rechazar cookies. Si decide rechazar las cookies, aún podrá utilizar nuestro Sitio Web, aunque su acceso a algunas funciones y áreas del sitio puede estar restringido. Dado que los medios por los que puede rechazar las cookies a través de los controles de su navegador web varían de un navegador a otro, debe visitar el menú de ayuda de su navegador para obtener más información.</p>
            
            <h2>6. Cambios en esta Política de Cookies</h2>
            <p>Podemos actualizar esta Política de Cookies de vez en cuando para reflejar, por ejemplo, cambios en las cookies que utilizamos o por otras razones operativas, legales o reglamentarias. La fecha de "Última Actualización" en la parte superior de esta Política de Cookies indica cuándo fue revisada por última vez.</p>
            
            <h2>7. Contacto</h2>
            <p>Si tiene alguna pregunta sobre el uso de cookies en nuestro Sitio Web, no dude en contactarnos en:</p>
            <p><strong>Puro Contenido SAS</strong><br/>
            Correo electrónico: soporte@purocontenido.com<br/>
            Dirección: AC 53 #46-62 Of. 104, Bogotá, Colombia</p>

          </article>
        </div>
      </main>

      <footer className="w-full border-t border-white/10 py-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <Image src="/LogoPuroContenido.svg" alt="Puro Contenido Logo" width={24} height={24} className="h-auto w-6" />
              <p className="text-sm text-foreground/70 tracking-wide">&copy; {new Date().getFullYear()} Puro Contenido.</p>
            </div>
             <p className="text-xs text-foreground/50 mt-2 text-center md:text-left">Todos los derechos reservados.</p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Navegación</h4>
            <div className="flex flex-col gap-1">
              <Link href="/methodology" className="text-sm hover:text-accent">Nuestra Metodología</Link>
              <Link href="/#bidtory" className="text-sm hover:text-accent">Suite Bidtory</Link>
              <Link href="/contact" className="text-sm hover:text-accent">Contacto</Link>
            </div>
          </div>
           <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Legales</h4>
            <div className="flex flex-col gap-1">
                <Link href="/terminos" className="text-sm hover:text-accent">Términos de Servicio</Link>
                <Link href="/privacidad" className="text-sm hover:text-accent">Política de Privacidad</Link>
                <Link href="/cookies" className="text-sm text-accent">Política de Cookies</Link>
                <Link href="/accesibilidad" className="text-sm hover:text-accent">Accesibilidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
