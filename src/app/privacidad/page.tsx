
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Política de Privacidad - Bidtory',
  description: 'Conozca cómo Bidtory, operado por Puro Contenido SAS, recopila, usa, almacena y protege su información personal.',
  robots: {
    index: false,
    follow: false,
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center justify-center">
            <Image src="/logo-bidtory-color.svg" alt="Bidtory Logo" width={130} height={36} className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/suscripciones" className="text-sm font-medium hover:text-accent transition-colors">Planes</Link>
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
            <h1>Política de Privacidad del Sitio Web de Puro Contenido SAS</h1>
            <p><strong>Última Actualización: 24 de agosto de 2025</strong></p>
            
            <h2>Introducción</h2>
            <p>En Puro Contenido SAS (en adelante, "Puro Contenido", "nosotros" o "nuestro"), con NIT 900.561.858-3 y domicilio en AC 53 #46-62 Of. 104, Bogotá, Colombia, valoramos su privacidad y nos comprometemos a proteger sus datos personales. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos, divulgamos y protegemos la información personal que usted nos proporciona o que se genera al acceder y utilizar nuestro sitio web www.purocontenido.com (en adelante, "el Sitio Web"), incluyendo el Portal Web Público y la aplicación privada para clientes "Bidtory Aplica" (en adelante, "la Zona de Clientes").</p>
            <p>Al acceder o utilizar el Sitio Web, usted acepta las prácticas descritas en esta Política de Privacidad. Si no está de acuerdo con esta política, por favor no utilice nuestro Servicio.</p>
            
            <h3>1. Responsable del Tratamiento de sus Datos Personales</h3>
            <p>El responsable del tratamiento de sus datos personales es:</p>
            <ul>
                <li><strong>Puro Contenido SAS</strong></li>
                <li><strong>NIT:</strong> 900.561.858-3</li>
                <li><strong>Domicilio:</strong> AC 53 #46-62 Of. 104, Bogotá, Colombia</li>
                <li><strong>Correo Electrónico de Contacto para Privacidad:</strong> soporte@purocontenido.com</li>
            </ul>
            
            <h3>2. Información que Recopilamos</h3>
            <p>Recopilamos diferentes tipos de información dependiendo de su interacción con el Sitio Web:</p>
            <h4>2.1. Información que Usted nos Proporciona Directamente</h4>
            <ul>
                <li><strong>Formulario de Contacto (Portal Web Público):</strong> Cuando utiliza nuestro formulario de contacto en /contact, recopilamos su nombre completo, nombre de la empresa, dirección de correo electrónico, área de interés y el mensaje opcional que nos envíe. Estos datos no se almacenan en nuestra base de datos, sino que se transmiten directamente a nuestro equipo por correo electrónico para su gestión.</li>
                <li><strong>Datos de Registro y Cuenta (Zona de Clientes):</strong> Si usted es un usuario registrado de la Zona de Clientes (Bidtory Aplica), recopilamos su dirección de correo electrónico y gestionamos su contraseña a través de Firebase Authentication. Opcionalmente, puede añadir un nombre para mostrar y una foto de perfil.</li>
                <li><strong>Comunicaciones de Marketing:</strong> Si usted nos otorga su consentimiento explícito a través de una casilla de verificación "opt-in" (ej. en el formulario de registro), podremos recopilar su dirección de correo electrónico para enviarle comunicaciones de marketing, ofertas y novedades de Bidtory o Puro Contenido SAS.</li>
            </ul>
            <h4>2.2. Información que Usted Sube al Utilizar la Zona de Clientes ("Contenido del Cliente")</h4>
            <p>Como parte de su uso de la Zona de Clientes (Bidtory Aplica), usted o los usuarios de su empresa subirán, transmitirán, almacenarán o generarán diversos tipos de información y documentos (en adelante, "Contenido del Cliente"). Este Contenido del Cliente puede incluir:</p>
            <ul>
                <li>Información detallada sobre oportunidades de licitación o proyectos.</li>
                <li>Documentos de la empresa cliente (ej. certificados de existencia y representación, estados financieros, registros mercantiles, hojas de vida).</li>
                <li>Documentos de pliegos y términos de referencia de las licitaciones.</li>
                <li>Borradores y versiones finales de propuestas y ofertas.</li>
                <li>Comentarios y comunicaciones en la bitácora de colaboración.</li>
            </ul>
            <p><strong>Puro Contenido SAS como Encargado del Tratamiento (Procesador de Datos):</strong> Respecto al Contenido del Cliente que usted sube a la Zona de Clientes, usted (o su empresa) actúa como Responsable del Tratamiento (Data Controller), y Puro Contenido SAS actúa como Encargado del Tratamiento (Data Processor). Esto significa que procesamos este Contenido del Cliente estrictamente bajo sus instrucciones y para los fines acordados de colaboración en la formulación de propuestas, garantizando la confidencialidad y seguridad.</p>
            <h4>2.3. Información que Recopilamos Automáticamente al Usar el Sitio Web</h4>
            <ul>
                <li><strong>Datos de Uso y Técnicos:</strong> Cuando visita el Sitio Web, incluyendo la Zona de Clientes, recopilamos información sobre cómo accede y utiliza el servicio. Esto puede incluir su dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo de permanencia, clics, y la fecha y hora de su acceso. Esto nos ayuda a comprender el comportamiento del usuario y a mejorar el Sitio Web.</li>
                <li><strong>Cookies y Tecnologías Similares:</strong> Utilizamos cookies y tecnologías similares para el funcionamiento esencial del Sitio Web, para la autenticación de usuarios, para proteger contra spam (reCAPTCHA) y para realizar análisis de uso (Google Analytics). Para más detalles, consulte nuestra Política de Cookies.</li>
                <li><strong>Información de Dispositivo:</strong> Podemos recopilar información sobre el dispositivo que utiliza para acceder al Sitio Web, como el modelo de hardware y los identificadores únicos del dispositivo.</li>
            </ul>

            <h3>3. Fines del Tratamiento de sus Datos Personales</h3>
            <p>Utilizamos la información que recopilamos para los siguientes propósitos:</p>
            <ul>
                <li><strong>Proveer y Mantener el Sitio Web:</strong> Para operar, mantener y proteger el Portal Web Público y la Zona de Clientes, y para entregar sus funcionalidades.</li>
                <li><strong>Gestión de Consultas:</strong> Para responder a las consultas y solicitudes que nos envía a través del formulario de contacto.</li>
                <li><strong>Gestión de Cuentas (Zona de Clientes):</strong> Para autenticar y gestionar su acceso a la Zona de Clientes, y para gestionar las sesiones de usuario.</li>
                <li><strong>Prestación de Servicios de Colaboración (Zona de Clientes):</strong> Para procesar el Contenido del Cliente y colaborar con usted en la formulación de propuestas, bajo sus instrucciones.</li>
                <li><strong>Mejora y Desarrollo del Servicio:</strong> Para analizar el uso del Sitio Web, comprender las tendencias, depurar errores, realizar investigaciones, desarrollar nuevas características y mejorar la experiencia del usuario.</li>
                <li><strong>Seguridad y Prevención del Fraude:</strong> Para proteger la seguridad del Sitio Web, detectar y prevenir fraudes, abusos y actividades no autorizadas, incluyendo la protección contra bots a través de reCAPTCHA.</li>
                <li><strong>Comunicaciones:</strong> Para enviarle notificaciones relevantes del servicio (ej. sobre oportunidades, plazos) a través de SendGrid, o comunicaciones de marketing si ha dado su consentimiento explícito.</li>
                <li><strong>Cumplimiento Legal:</strong> Para cumplir con nuestras obligaciones legales y regulatorias, responder a solicitudes legales válidas y hacer cumplir nuestros Términos y Condiciones de Uso.</li>
            </ul>

            <h3>4. Base Legal para el Tratamiento</h3>
            <p>El tratamiento de sus datos personales por parte de Puro Contenido SAS se basa en las siguientes condiciones:</p>
            <ul>
                <li><strong>Consentimiento:</strong> Para el envío de comunicaciones de marketing y para el uso de cookies no esenciales (analíticas).</li>
                <li><strong>Ejecución de un Contrato:</strong> Para proveerle el acceso y uso del Sitio Web, la Zona de Clientes y los servicios de colaboración contratados.</li>
                <li><strong>Interés Legítimo:</strong> Para la mejora del Sitio Web, la seguridad, la prevención del fraude y la gestión de nuestras operaciones comerciales, siempre y cuando sus derechos e intereses no prevalezcan.</li>
                <li><strong>Cumplimiento de una Obligación Legal:</strong> Cuando el tratamiento es necesario para cumplir con leyes y regulaciones aplicables.</li>
            </ul>

            <h3>5. Compartir y Divulgar su Información Personal (Sub-procesadores)</h3>
            <p>Podemos compartir su información personal y el Contenido del Cliente con terceros en las siguientes circunstancias y para los siguientes propósitos:</p>
            <h4>5.1. Proveedores de Servicios Externos (Sub-procesadores)</h4>
            <p>Contratamos a terceros para que realicen funciones en nuestro nombre y nos ayuden a operar, mantener y mejorar el Sitio Web y la Zona de Clientes. Estos proveedores de servicios tienen acceso a la información personal necesaria para realizar sus funciones, pero están obligados a protegerla y a no utilizarla para fines distintos a los de la prestación de servicios a Puro Contenido SAS. Nuestros principales sub-procesadores incluyen:</p>
            <ul>
                <li><strong>Google Cloud Platform (GCP):</strong> Provee la infraestructura de nube para el alojamiento de nuestro Sitio Web, bases de datos y almacenamiento de archivos. Sus datos y el Contenido del Cliente se almacenan en servidores de Google Cloud.</li>
                <li><strong>Google Firebase (Authentication):</strong> Provee el servicio de autenticación de usuarios para la Zona de Clientes, gestionando las contraseñas de forma segura.</li>
                <li><strong>SendGrid:</strong> Procesa las direcciones de correo electrónico y el contenido de las notificaciones enviadas a los usuarios registrados y los mensajes del formulario de contacto.</li>
                <li><strong>Google reCAPTCHA v3:</strong> Utilizado para la protección contra bots en formularios, lo que implica el análisis de su comportamiento en el Sitio Web.</li>
                <li><strong>Google Analytics:</strong> Para el seguimiento y análisis del tráfico web y el comportamiento del usuario (sujeto a su consentimiento de cookies).</li>
                <li><strong>Google Cloud Vertex AI:</strong> Utilizado para el análisis de documentos dentro de la Zona de Clientes. Los documentos procesados por Vertex AI no son utilizados por Google para entrenar sus modelos de IA.</li>
            </ul>
            <h4>5.2. Con su Empresa (Zona de Clientes)</h4>
            <p>El Contenido del Cliente y las actividades realizadas en la Zona de Clientes serán accesibles para los usuarios autorizados de su misma empresa, de acuerdo con los roles y permisos que haya configurado el Administrador de su Cliente.</p>
            <h4>5.3. Cumplimiento Legal y Aplicación de la Ley</h4>
            <p>Podemos divulgar su información si creemos de buena fe que dicha acción es necesaria para:</p>
            <ul>
                <li>Cumplir con una obligación legal o un requerimiento válido de autoridad judicial o administrativa.</li>
                <li>Proteger y defender los derechos o la propiedad de Puro Contenido SAS.</li>
                <li>Prevenir o investigar posibles irregularidades en relación con el Sitio Web.</li>
                <li>Proteger la seguridad personal de los usuarios del Sitio Web o del público.</li>
                <li>Proteger contra la responsabilidad legal.</li>
            </ul>
            <h4>5.4. Transferencias de Negocio</h4>
            <p>En caso de una fusión, adquisición, venta de activos o cualquier otra transacción de negocio que involucre a Puro Contenido SAS, su información personal y el Contenido del Cliente podrían ser transferidos como parte de los activos. Le notificaremos antes de que su información personal sea transferida y quede sujeta a una política de privacidad diferente.</p>

            <h3>6. Transferencias Internacionales de Datos</h3>
            <p>Tenga en cuenta que todos los datos de la aplicación (base de datos, archivos de usuarios, Contenido del Cliente) se almacenan físicamente en los centros de datos de Google Cloud Platform. Esto significa que su información personal y el Contenido del Cliente serán transferidos, almacenados y procesados en Estados Unidos. Puro Contenido SAS toma medidas para asegurar que sus datos reciban un nivel adecuado de protección cuando se transfieren internacionalmente, lo cual puede incluir la implementación de Cláusulas Contractuales Estándar (SCCs) o la adhesión a marcos de privacidad reconocidos, si aplica. Al utilizar el Sitio Web, usted acepta la transferencia de su información a nivel internacional a Estados Unidos.</p>

            <h3>7. Seguridad de los Datos</h3>
            <p>Nos esforzamos por proteger su información personal y el Contenido del Cliente mediante la implementación de medidas de seguridad técnicas y organizativas adecuadas para prevenir el acceso no autorizado, la divulgación, alteración, pérdida o destrucción. Estas medidas incluyen:</p>
            <ul>
                <li><strong>Cifrado en Reposo:</strong> Todos los datos almacenados en Google Datastore y Google Cloud Storage son cifrados automáticamente por Google.</li>
                <li><strong>Cifrado en Tránsito:</strong> Toda la comunicación entre el cliente (navegador) y nuestros servidores, y entre los servicios internos de GCP, se realiza a través de TLS (HTTPS), cifrando los datos en tránsito.</li>
                <li><strong>Control de Acceso Riguroso:</strong> El acceso a los datos, incluyendo el Contenido del Cliente, se rige por un estricto sistema de roles y permisos (IAM de GCP y lógica de roles en la aplicación). Un usuario de un cliente no puede acceder a los datos o Contenido del Cliente de otro cliente.</li>
                <li><strong>Acceso a Documentos Restringido:</strong> Los documentos en Google Cloud Storage no son públicos. El acceso se concede exclusivamente a través de URLs Firmadas (Signed URLs) de corta duración, generadas por el backend solo para usuarios autenticados y autorizados para ver el documento específico.</li>
                <li><strong>Autenticación Segura:</strong> Utilizamos Firebase Authentication para gestionar las contraseñas de forma segura.</li>
            </ul>
            <p>A pesar de estas medidas, ninguna transmisión de datos por Internet o método de almacenamiento electrónico es 100% seguro. Por lo tanto, no podemos garantizar la seguridad absoluta de su información.</p>

            <h3>8. Retención y Eliminación de Datos</h3>
            <ul>
                <li><strong>Cuentas de Usuario (Zona de Clientes):</strong> Cuando un usuario elimina su cuenta, se realiza un borrado en cascada de su registro en Firebase Authentication y su perfil asociado en la base de datos.</li>
                <li><strong>Contenido del Cliente (Zona de Clientes):</strong> El Contenido del Cliente (oportunidades, documentos, comentarios) no se elimina automáticamente con la cuenta de un usuario individual que lo creó, ya que pertenece a la entidad del Cliente. La eliminación de todos los datos y el Contenido del Cliente asociado a una empresa cliente se realiza una vez que finaliza la relación contractual con Puro Contenido SAS y previa solicitud explícita del Cliente. Mantendremos el Contenido del Cliente por un período de 90 días después de la terminación del contrato, para permitir al cliente solicitar la devolución de sus datos o su eliminación. Tras este período, se procederá a la eliminación segura de los datos, salvo que exista una obligación legal de retenerlos.</li>
                <li><strong>Datos de Contacto (Formulario Web Público):</strong> Los datos enviados a través del formulario de contacto se transmiten por correo electrónico y no se almacenan en la base de datos. La retención de estos correos electrónicos se rige por las políticas internas de gestión de comunicaciones de Puro Contenido SAS.</li>
                <li><strong>Backups:</strong> La plataforma se beneficia de los backups automáticos de GCP, cuyo propósito es la recuperación ante desastres del servicio, no la restauración de datos individuales a petición de un usuario o cliente.</li>
                <li><strong>Datos de Analítica:</strong> Los datos recopilados por Google Analytics se retienen de acuerdo con las políticas de retención de datos de Google.</li>
            </ul>

            <h3>9. Sus Derechos como Titular de Datos Personales (Ley 1581 de 2012)</h3>
            <p>De acuerdo con la Ley 1581 de 2012 de Colombia y sus decretos reglamentarios, usted tiene los siguientes derechos sobre sus datos personales:</p>
            <ul>
                <li><strong>Derecho de Acceso/Consulta:</strong> Conocer, actualizar y rectificar sus datos personales que se encuentren en nuestras bases de datos.</li>
                <li><strong>Derecho de Rectificación:</strong> Solicitar la corrección de datos incompletos, inexactos o desactualizados.</li>
                <li><strong>Derecho de Supresión/Cancelación:</strong> Solicitar la eliminación de sus datos personales de nuestras bases de datos cuando no exista un deber legal o contractual de permanecer en ellas. Para la eliminación del Contenido del Cliente, esto debe ser gestionado a través del administrador de su empresa y/o la terminación de la relación contractual con Puro Contenido SAS.</li>
                <li><strong>Derecho de Oposición:</strong> Oponerse al tratamiento de sus datos personales en determinadas circunstancias.</li>
                <li><strong>Derecho a Revocar el Consentimiento:</strong> Revocar la autorización otorgada para el tratamiento de sus datos personales en cualquier momento, salvo que exista un deber legal o contractual que impida dicha revocatoria.</li>
                <li><strong>Derecho a Presentar Quejas:</strong> Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a lo dispuesto en la ley.</li>
            </ul>
            <p>Para ejercer cualquiera de estos derechos, por favor contáctenos a través de soporte@purocontenido.com. Atenderemos su solicitud de acuerdo con los plazos y requisitos establecidos por la ley colombiana.</p>

            <h3>10. Privacidad de los Menores</h3>
            <p>Nuestro Sitio Web no está dirigido a personas menores de dieciocho (18) años. No recopilamos a sabiendas información de identificación personal de niños menores de 18 años. Si usted es padre o tutor y sabe que su hijo nos ha proporcionado datos personales, por favor contáctenos. Si nos damos cuenta de que hemos recopilado datos personales de niños sin verificación del consentimiento de los padres, tomaremos medidas para eliminar esa información de nuestros servidores.</p>
            
            <h3>11. Política de Cookies</h3>
            <p>Puro Contenido SAS utiliza cookies y tecnologías similares para operar y mejorar su experiencia en el Sitio Web. Para obtener información detallada sobre cómo utilizamos las cookies, qué tipos de cookies utilizamos y cómo puede gestionar sus preferencias de cookies, consulte nuestra Política de Cookies en <Link href="/cookies">https://purocontenido.com/cookies</Link>.</p>

            <h3>12. Cambios en esta Política de Privacidad</h3>
            <p>Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última Actualización" en la parte superior. Le recomendamos revisar esta Política de Privacidad periódicamente para cualquier cambio. Los cambios en esta Política de Privacidad son efectivos cuando se publican en esta página.</p>
            
            <h3>13. Contacto</h3>
            <p>Si tiene alguna pregunta sobre esta Política de Privacidad o sobre nuestras prácticas de datos, no dude en contactarnos en:</p>
            <ul>
                <li><strong>Puro Contenido SAS</strong></li>
                <li><strong>Correo electrónico:</strong> soporte@purocontenido.com</li>
                <li><strong>Dirección:</strong> AC 53 #46-62 Of. 104, Bogotá, Colombia</li>
            </ul>

          </article>
        </div>
      </main>

      <footer className="w-full border-t border-white/10 py-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <Image src="/logo-bidtory-color.svg" alt="Bidtory Logo" width={120} height={34} className="h-8 w-auto" />
              <p className="text-sm text-foreground/70 tracking-wide">&copy; {new Date().getFullYear()} Puro Contenido.</p>
            </div>
             <p className="text-xs text-foreground/50 mt-2 text-center md:text-left">Todos los derechos reservados.</p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Navegación</h4>
            <div className="flex flex-col gap-1">
              <Link href="/suscripciones" className="text-sm hover:text-accent">Planes</Link>
              <Link href="/#bidtory" className="text-sm hover:text-accent">Suite Bidtory</Link>
              <Link href="/contact" className="text-sm hover:text-accent">Contacto</Link>
            </div>
          </div>
           <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Legales</h4>
            <div className="flex flex-col gap-1">
                <Link href="/terminos" className="text-sm hover:text-accent">Términos de Servicio</Link>
                <Link href="/privacidad" className="text-sm text-accent">Política de Privacidad</Link>
                <Link href="/cookies" className="text-sm hover:text-accent">Política de Cookies</Link>
                <Link href="/accesibilidad" className="text-sm hover:text-accent">Accesibilidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
