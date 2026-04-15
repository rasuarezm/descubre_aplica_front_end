
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Términos de Servicio - Bidtory',
  description: 'Consulte los términos y condiciones que rigen el uso de Bidtory y su Zona de Clientes, operado por Puro Contenido SAS.',
  robots: {
    index: false,
    follow: false,
  }
};

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/50 border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center justify-center">
            <Image src="/logo-bidtory-color.svg" alt="Bidtory Logo" width={130} height={36} className="h-8 w-auto" />
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
            <h1>Términos y Condiciones de Uso del Sitio Web de Puro Contenido SAS</h1>
            <p><strong>Última Actualización: 24 de agosto de 2025</strong></p>
            <p>Bienvenido al sitio web de Puro Contenido SAS.</p>
            <p>Estos Términos y Condiciones de Uso ("Términos de Uso") rigen su acceso y utilización del sitio web de Puro Contenido SAS, ubicado en www.purocontenido.com (en adelante, "el Sitio Web"). El Sitio Web es operado por Puro Contenido SAS, una sociedad legalmente constituida bajo las leyes de la República de Colombia, identificada con NIT 900.561.858-3 y con domicilio principal en AC 53 #46-62 Of. 104, Bogotá, Colombia (en adelante, "Puro Contenido", "nosotros" o "nuestro").</p>
            <p>Al acceder, navegar o utilizar este Sitio Web, usted ("el Usuario", "usted" o "su") acepta estar legalmente vinculado por estos Términos de Uso, nuestra Política de Privacidad y nuestra Política de Cookies, las cuales se incorporan por referencia a estos Términos de Uso. Si no está de acuerdo con alguna parte de estos Términos de Uso, no debe acceder ni utilizar el Sitio Web.</p>

            <h2>1. Descripción del Sitio Web y Servicios</h2>
            <h3>1.1. Portal Web Público</h3>
            <p>El Sitio Web de Puro Contenido SAS tiene como objetivo principal proporcionar información sobre nuestra empresa, nuestra metodología, nuestros servicios profesionales y nuestra "Suite Bidtory" (que incluye Bidtory Discover y Bidtory Aplica). También permite a los visitantes contactarnos a través de un formulario de contacto.</p>
            <h3>1.2. Aplicación Privada para Clientes (Bidtory Aplica)</h3>
            <p>Una parte del Sitio Web es una zona privada y segura, accesible solo para nuestros clientes actuales ("Zona de Clientes" o "Bidtory Aplica"). Esta aplicación SaaS facilita la colaboración entre nuestros clientes y el equipo de Puro Contenido en la gestión de oportunidades de negocio y la formulación de propuestas para licitaciones y proyectos. Bidtory Aplica se proporciona como un servicio de valor añadido actualmente sin costo directo para los clientes.</p>
            <p><strong>Nota sobre Bidtory Descubre:</strong> La plataforma Bidtory Descubre, enfocada en la identificación de oportunidades por suscripción, opera bajo el dominio bidtory.co y se rige por sus propios y distintos Términos y Condiciones de Servicio y Política de Privacidad. La Zona de Clientes en purocontenido.com (Bidtory Aplica) es un servicio complementario actualmente exclusivo para clientes de Puro Contenido SAS y no se ofrece como una suscripción pública independiente en este momento.</p>

            <h2>2. Aceptación de los Términos de Uso y Modificaciones</h2>
            <h3>2.1. Consentimiento Expreso</h3>
            <p>Al acceder, navegar o utilizar el Sitio Web, usted reconoce que ha leído, entendido y aceptado estos Términos de Uso, nuestra Política de Privacidad y nuestra Política de Cookies.</p>
            <h3>2.2. Capacidad Legal</h3>
            <p>Usted declara y garantiza que tiene la capacidad legal para celebrar este contrato. Si utiliza el Sitio Web en nombre de una entidad legal (ej. una empresa), declara que tiene la autoridad para vincular a dicha entidad a estos Términos de Uso.</p>
            <h3>2.3. Modificaciones a los Términos de Uso</h3>
            <p>Puro Contenido SAS se reserva el derecho de modificar o actualizar estos Términos de Uso en cualquier momento y a su entera discreción. Le notificaremos sobre cualquier cambio sustancial publicando los Términos de Uso actualizados en el Sitio Web. Los cambios entrarán en vigor tan pronto como sean publicados o en la fecha que se especifique en la notificación. Su uso continuado del Sitio Web después de la publicación de los Términos de Uso modificados constituirá su aceptación de dichos cambios. Si no está de acuerdo con los nuevos Términos, debe dejar de usar el Sitio Web.</p>
            
            <h2>3. Tipos de Usuarios y Cuentas</h2>
            <h3>3.1. Visitantes Anónimos</h3>
            <p>Cualquier persona puede acceder y navegar por el Portal Web Público.</p>
            <h3>3.2. Usuarios Registrados (Clientes)</h3>
            <p>El acceso a la Zona de Clientes (Bidtory Aplica) está restringido a usuarios registrados con credenciales válidas (correo electrónico y contraseña).</p>
            <ul>
              <li>a. Creación de Cuenta: Las cuentas de la Zona de Clientes son creadas por Puro Contenido SAS para sus clientes o invitadas por los administradores de la cuenta del cliente.</li>
              <li>b. Roles de Usuario: Dentro de la Zona de Clientes, existen distintos roles con diferentes permisos (ej. Lector, Colaborador, Administrador de Cliente), según lo gestionado por el Administrador del Cliente.</li>
              <li>c. Seguridad de la Cuenta: Usted es el único responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta. Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta o violación de seguridad. Puro Contenido SAS no será responsable de ninguna pérdida o daño que surja del incumplimiento de esta obligación.</li>
              <li>d. Uso Personal y No Transferible: Su cuenta es personal e intransferible y está destinada al uso exclusivo por parte de los empleados o colaboradores autorizados de su empresa. No puede compartir sus credenciales con terceros ajenos a su empresa.</li>
            </ul>

            <h2>4. Zona de Clientes (Bidtory Aplica) y Contenido del Cliente</h2>
            <h3>4.1. Propósito de la Zona de Clientes</h3>
            <p>La Zona de Clientes (Bidtory Aplica) permite la colaboración en tiempo real con Puro Contenido SAS en la gestión de oportunidades y la formulación de propuestas para licitaciones o proyectos. Esto incluye el acceso a información sobre oportunidades, la subida de documentos y la participación en bitácoras de comentarios.</p>
            <h3>4.2. Contenido del Cliente</h3>
            <p>Incluye cualquier documento, información, archivo o material que usted o los usuarios de su empresa suban, transmitan, almacenen o generen en la Zona de Clientes (ej. pliegos de licitación, estados financieros, certificaciones, propuestas, comentarios en la bitácora) (en adelante, "Contenido del Cliente").</p>
            <h3>4.3. Propiedad y Responsabilidad del Contenido del Cliente</h3>
            <ul>
              <li>a. Usted retiene todos los derechos de propiedad intelectual sobre el Contenido del Cliente.</li>
              <li>b. Usted es el único responsable de la exactitud, veracidad, integridad, legalidad y pertinencia del Contenido del Cliente.</li>
              <li>c. Usted declara y garantiza que tiene todos los derechos, licencias y autorizaciones necesarias para cargar, procesar y utilizar el Contenido del Cliente en la Zona de Clientes, y para otorgar a Puro Contenido SAS los derechos de uso descritos en estos Términos de Uso, sin violar ningún derecho de propiedad intelectual, secretos comerciales, derechos de privacidad o cualquier otra ley o regulación aplicable de terceros.</li>
              <li>d. Puro Contenido SAS no asume ninguna responsabilidad por el Contenido del Cliente, incluyendo, pero no limitado a, su legalidad, veracidad o la violación de derechos de terceros.</li>
            </ul>
            <h3>4.4. Licencia Otorgada a Puro Contenido SAS</h3>
            <p>Al subir Contenido del Cliente a la Zona de Clientes, usted otorga a Puro Contenido SAS una licencia limitada, no exclusiva, revocable, libre de regalías, para usar, reproducir, distribuir, modificar, adaptar, almacenar y procesar el Contenido del Cliente únicamente con el propósito de prestar los servicios contratados de colaboración en la preparación, consolidación y gestión de propuestas, y bajo sus instrucciones. Esta licencia se limita estrictamente a la duración y el alcance de los servicios que Puro Contenido SAS le está prestando a usted como cliente.</p>
            <h3>4.5. Confidencialidad del Contenido del Cliente</h3>
            <p>Puro Contenido SAS se compromete a mantener la estricta confidencialidad del Contenido del Cliente. No divulgaremos, compartiremos ni utilizaremos el Contenido del Cliente para fines distintos a los de la prestación de los servicios acordados, salvo que:</p>
            <ul>
                <li>a. Usted haya dado su consentimiento explícito y por escrito.</li>
                <li>b. Sea necesario para la prestación de los servicios acordados (ej. compartir con socios involucrados en una propuesta conjunta, siempre con su conocimiento y consentimiento previo).</li>
                <li>c. Sea requerido por ley o por una orden judicial o de autoridad competente.</li>
            </ul>
            <p>Puro Contenido SAS implementa y mantiene medidas de seguridad técnicas y organizativas adecuadas y robustas, según se detalla en nuestra Política de Privacidad, para proteger el Contenido del Cliente contra el acceso no autorizado, la divulgación, alteración, pérdida o destrucción.</p>
            <h3>4.6. Uso Prohibido del Contenido del Cliente</h3>
            <p>Usted se compromete a no subir Contenido del Cliente que:</p>
            <ul>
              <li>a. Sea ilegal, difamatorio, obsceno, pornográfico, acosador, amenazante, abusivo o que viole la privacidad o los derechos de publicidad de terceros.</li>
              <li>b. Contenga virus, gusanos, troyanos o cualquier otro código, archivo o programa dañino.</li>
              <li>c. Viole derechos de propiedad intelectual, secretos comerciales o confidencialidad de terceros para los que no tenga autorización.</li>
              <li>d. Contenga datos personales sensibles sin contar con el consentimiento explícito y verificable de sus titulares o la base legal correspondiente para su tratamiento.</li>
            </ul>

            <h2>5. Funcionalidad de Inteligencia Artificial (IA) en Bidtory Aplica</h2>
            <h3>5.1. Uso de IA</h3>
            <p>La Zona de Clientes (Bidtory Aplica) puede utilizar servicios de Inteligencia Artificial (a través de Google Cloud Vertex AI) para analizar documentos (ej. pliegos, términos de referencia) que usted suba. El propósito de la IA es extraer y sugerir información clave (ej. resúmenes técnicos, fechas importantes, requisitos documentales) para agilizar la preparación de propuestas.</p>
            <h3>5.2. Resultados de la IA como Sugerencias</h3>
            <p>Usted reconoce y acepta que los resultados generados por la IA son sugerencias y herramientas de apoyo, y no constituyen asesoramiento legal, técnico, financiero o comercial. La IA puede generar información incorrecta o incompleta.</p>
            <h3>5.3. Responsabilidad del Usuario</h3>
            <p>Es su responsabilidad exclusiva revisar, validar, corregir y complementar toda la información generada o sugerida por la IA antes de utilizarla en sus propuestas o decisiones. Puro Contenido SAS no garantiza la exactitud, integridad o idoneidad de la información generada por la IA.</p>
            <h3>5.4. Uso de Datos por la IA</h3>
            <p>Los documentos que usted sube y que son procesados por las APIs de IA de Google Cloud Vertex AI, según los términos de servicio de Google, no son utilizados por Google para entrenar sus modelos de IA. Los datos se procesan para generar una respuesta y no se retienen para otros fines, lo cual es una salvaguarda importante para la confidencialidad de su Contenido del Cliente.</p>

            <h2>6. Propiedad Intelectual del Sitio Web</h2>
            <h3>6.1. Propiedad de Puro Contenido SAS</h3>
            <p>Todo el contenido y materiales del Sitio Web, incluyendo textos, gráficos, logotipos, iconos, imágenes, clips de audio, descargas digitales, compilaciones de datos y software (excluyendo el Contenido del Cliente), son propiedad de Puro Contenido SAS o de sus licenciantes y están protegidos por las leyes colombianas e internacionales de derechos de autor y marcas registradas.</p>
            <h3>6.2. Marcas</h3>
            <p>La marca "Puro Contenido SAS", el logotipo, la marca "Bidtory™" y sus componentes (Bidtory Descubre, Bidtory Aplica), así como otros nombres de productos y servicios relacionados, diseños y eslóganes, son marcas comerciales o marcas de servicio de Puro Contenido SAS, registradas o en proceso de registro. No se le otorga ninguna licencia o derecho para usar estas marcas sin el consentimiento previo por escrito de Puro Contenido SAS.</p>
            <h3>6.3. Licencia de Uso Limitado</h3>
            <p>Se le concede una licencia limitada, no exclusiva, intransferible y revocable para acceder y utilizar el Sitio Web únicamente para los fines informativos y de colaboración para los que fue diseñado, de acuerdo con estos Términos de Uso.</p>

            <h2>7. Uso Aceptable del Sitio Web</h2>
            <h3>7.1. Prohibiciones</h3>
            <p>El Usuario se compromete a no utilizar el Sitio Web para los siguientes fines o de las siguientes maneras:</p>
            <ul>
              <li>a. Para cualquier propósito ilegal o que viole leyes o regulaciones locales, nacionales o internacionales aplicables.</li>
              <li>b. Interferir o interrumpir la integridad o el rendimiento del Sitio Web o de los datos de terceros contenidos en él.</li>
              <li>c. Intentar obtener acceso no autorizado al Sitio Web, a los sistemas o redes relacionados, o a las cuentas de otros usuarios.</li>
              <li>d. Realizar ingeniería inversa, descompilar, desensamblar o intentar descubrir el código fuente, ideas o algoritmos del Sitio Web o de cualquier parte del mismo.</li>
              <li>e. Recopilar o almacenar datos personales de otros usuarios sin su consentimiento.</li>
              <li>f. Enviar o facilitar el envío de publicidad o material promocional no solicitado o no autorizado, o cualquier otra forma de solicitud similar (spam).</li>
              <li>g. Publicar o transmitir cualquier Contenido del Cliente que sea ilegal, difamatorio, obsceno, pornográfico, acosador, amenazante, abusivo o que viole la privacidad o los derechos de publicidad de terceros, o que sea de alguna manera objetable (esto se aplica especialmente a los comentarios en la Bitácora).</li>
            </ul>

            <h2>8. Enlaces a Sitios de Terceros</h2>
            <p>El Sitio Web puede contener enlaces a sitios web o servicios de terceros (ej. bidtory.co) que no son propiedad ni están controlados por Puro Contenido SAS. No tenemos control sobre el contenido, las políticas de privacidad o las prácticas de ningún sitio o servicio de terceros, ni asumimos ninguna responsabilidad por ellos. Usted reconoce y acepta que Puro Contenido SAS no será responsable, directa o indirectamente, por ningún daño o pérdida causado o supuestamente causado por o en conexión con el uso o la dependencia de cualquier contenido, bienes o servicios disponibles en o a través de dichos sitios o servicios. Le recomendamos leer los términos y condiciones y las políticas de privacidad de cualquier sitio web o servicio de terceros que visite.</p>

            <h2>9. Exclusión de Garantías</h2>
            <h3>9.1. Sitio Web "Tal Cual" y "Según Disponibilidad"</h3>
            <p>El Sitio Web, incluyendo la Zona de Clientes y la funcionalidad de IA, se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo, ya sean expresas o implícitas. En la medida máxima permitida por la ley aplicable, Puro Contenido SAS renuncia a todas las garantías, expresas o implícitas, incluyendo, pero no limitado a, las garantías implícitas de comerciabilidad, idoneidad para un propósito particular, no infracción, y aquellas que surjan del curso de la negociación o el uso comercial.</p>
            <h3>9.2. No Garantía de Continuidad o Precisión</h3>
            <p>Puro Contenido SAS no garantiza que:</p>
            <ul>
              <li>a. El Sitio Web será ininterrumpido, seguro o libre de errores.</li>
              <li>b. Los resultados que se puedan obtener del uso del Sitio Web serán precisos, confiables o completos.</li>
              <li>c. Cualquier error en el Sitio Web será corregido.</li>
              <li>d. El Sitio Web o los servidores que lo hacen disponible estén libres de virus u otros componentes dañinos.</li>
              <li>e. La información generada por la IA será precisa, completa o adecuada para sus fines.</li>
            </ul>

            <h2>10. Limitación de Responsabilidad</h2>
            <h3>10.1. Alcance de la Limitación</h3>
            <p>En ningún caso Puro Contenido SAS, sus directores, empleados, afiliados, agentes, contratistas, licenciantes o proveedores de servicios serán responsables por daños directos, indirectos, incidentales, especiales, consecuenciales o punitivos, incluyendo, pero no limitado a, pérdida de ganancias, pérdida de datos (incluido el Contenido del Cliente), pérdida de uso, pérdida de fondo de comercio, interrupción de negocio, o cualquier otro daño intangible, que resulten de:</p>
            <ul>
              <li>a. Su acceso, uso o incapacidad para acceder o usar el Sitio Web o la Zona de Clientes.</li>
              <li>b. Cualquier conducta o contenido de cualquier tercero en el Sitio Web.</li>
              <li>c. Cualquier Contenido del Cliente, incluyendo su exactitud, veracidad o legalidad.</li>
              <li>d. Cualquier contenido obtenido del Sitio Web, incluida la información generada por IA.</li>
              <li>e. El acceso, uso o alteración no autorizados de sus transmisiones o Contenido del Cliente.</li>
              <li>f. Cualquier error u omisión en el Sitio Web o en la información generada por IA.</li>
              <li>g. Su confianza en la información obtenida del Sitio Web o generada por la IA.</li>
              <li>h. Cualquier otra cuestión relacionada con el Sitio Web, ya sea basada en garantía, contrato, agravio (incluyendo negligencia) o cualquier otra teoría legal, incluso si se ha informado a Puro Contenido SAS de la posibilidad de tales daños.</li>
            </ul>
            <h3>10.2. Límite Máximo de Responsabilidad</h3>
            <p>Sin perjuicio de lo anterior, la responsabilidad total acumulada de Puro Contenido SAS hacia usted por todos los reclamos derivados de o relacionados con el Sitio Web o el Contenido del Cliente, bajo cualquier teoría de responsabilidad, estará limitada en todo momento a un monto máximo de doscientos mil pesos colombianos (COP 200.000) o cincuenta dólares de los Estados Unidos (US$50), lo que sea menor. Este límite aplica específicamente al uso de la herramienta Bidtory Aplica y el Sitio Web, y no afecta ni se vincula a las condiciones o montos de responsabilidad establecidos en contratos de servicios profesionales principales.</p>

            <h2>11. Indemnización</h2>
            <p>Usted acepta defender, indemnizar y eximir de responsabilidad a Puro Contenido SAS, sus afiliados, licenciantes y proveedores de servicios, y a sus respectivos directores, funcionarios, empleados, contratistas, agentes, licenciantes, proveedores, sucesores y cesionarios de y contra cualquier reclamo, responsabilidad, daños, juicios, premios, pérdidas, costos, gastos u honorarios (incluidos los honorarios razonables de abogados) que surjan de o estén relacionados con:</p>
            <ul>
              <li>a. Su incumplimiento de estos Términos de Uso o de cualquier política o ley aplicable.</li>
              <li>b. Su uso del Sitio Web, incluyendo, pero no limitado a, su Contenido del Cliente (incluyendo su legalidad y el cumplimiento de derechos de terceros), o cualquier información obtenida del Sitio Web o generada por IA.</li>
              <li>c. Su violación de cualquier derecho de un tercero, incluyendo derechos de propiedad intelectual, secretos comerciales o de privacidad, en relación con el Contenido del Cliente que usted sube.</li>
            </ul>

            <h2>12. Terminación</h2>
            <p>Puro Contenido SAS puede suspender o terminar su acceso al Sitio Web o a la Zona de Clientes, total o parcialmente, en cualquier momento, con o sin causa, con o sin previo aviso, y sin responsabilidad para usted. Esto puede incluir, pero no se limita a, la terminación por incumplimiento de estos Términos de Uso o actividades ilegales. Tras la terminación de su acceso a la Zona de Clientes, Puro Contenido SAS gestionará el Contenido del Cliente de acuerdo con su política de retención de datos, tal como se describe en la Política de Privacidad.</p>

            <h2>13. Legislación Aplicable y Resolución de Disputas</h2>
            <h3>13.1. Ley Aplicable</h3>
            <p>Estos Términos de Uso y cualquier disputa o reclamo que surja de o en relación con ellos o el Sitio Web (incluyendo disputas o reclamos no contractuales) se regirán e interpretarán de acuerdo con las leyes de la República de Colombia, sin tener en cuenta sus principios de conflicto de leyes.</p>
            <h3>13.2. Resolución de Disputas</h3>
            <ul>
              <li>a. Negociación Amigable: Las Partes se comprometen a intentar resolver cualquier disputa, controversia o reclamo que surja de o en relación con estos Términos de Uso o el Sitio Web mediante negociación de buena fe.</li>
              <li>b. Jurisdicción: Si las Partes no pueden resolver la disputa mediante negociación amigable, las Partes se someten irrevocablemente a la jurisdicción exclusiva de los Tribunales de la ciudad de Bogotá, Colombia, para la resolución de cualquier disputa.</li>
            </ul>

            <h2>14. Disposiciones Generales</h2>
            <h3>14.1. Acuerdo Completo</h3>
            <p>Estos Términos de Uso, junto con la Política de Privacidad y la Política de Cookies, constituyen el acuerdo completo entre usted y Puro Contenido SAS con respecto al Sitio Web y reemplazan todas las comunicaciones y propuestas anteriores o contemporáneas, ya sean orales o escritas, entre usted y Puro Contenido SAS.</p>
            <h3>14.2. No Renuncia</h3>
            <p>El hecho de que Puro Contenido SAS no ejerza o haga cumplir algún derecho o disposición de estos Términos de Uso no constituirá una renuncia a dicho derecho o disposición.</p>
            <h3>14.3. Divisibilidad</h3>
            <p>Si alguna disposición de estos Términos de Uso se considera inválida, ilegal o inaplicable por un tribunal de jurisdicción competente, dicha disposición se eliminará o limitará en la medida mínima necesaria para que las disposiciones restantes de los Términos de Uso sigan siendo plenamente vigentes y aplicables.</p>
            <h3>14.4. Cesión</h3>
            <p>Usted no puede ceder o transferir estos Términos de Uso, ni sus derechos u obligaciones derivados de ellos, sin el consentimiento previo por escrito de Puro Contenido SAS. Puro Contenido SAS puede ceder o transferir estos Términos de Uso, sin restricción, a su entera discreción.</p>
            <h3>14.5. Encabezados</h3>
            <p>Los encabezados de las secciones en estos Términos de Uso son solo para conveniencia y no tienen ningún efecto legal o contractual.</p>
            <h3>14.6. Integración y Precedencia con Acuerdos Principales</h3>
            <ul>
              <li>a. Estos Términos de Uso rigen específicamente su acceso y utilización del Sitio Web de Puro Contenido SAS y de la plataforma Bidtory Aplica como una herramienta complementaria.</li>
              <li>b. Si usted tiene un contrato de servicios profesionales firmado y vigente con Puro Contenido SAS para la prestación de servicios (ej. consultoría, formulación de proyectos, etc.), dicho contrato principal prevalecerá sobre estos Términos de Uso en lo que respecta a:
                <ul>
                  <li>El alcance específico de los servicios profesionales contratados.</li>
                  <li>Las obligaciones de pago y condiciones financieras acordadas.</li>
                  <li>Las responsabilidades de cada parte relacionadas directamente con los resultados del servicio principal.</li>
                  <li>Cualquier otra condición comercial fundamental o particular que haya sido negociada y acordada por escrito en ese contrato.</li>
                </ul>
              </li>
              <li>c. La aceptación de estos Términos de Uso no modifica ni sustituye las obligaciones o derechos establecidos en su contrato principal de servicios. Estos Términos de Uso complementan dicho contrato, regulando de manera específica y exclusiva el acceso, la seguridad, la confidencialidad del Contenido del Cliente dentro de la plataforma Bidtory Aplica, las reglas de uso aceptable de la herramienta y la limitación de responsabilidad aplicable a la funcionalidad y operación de Bidtory Aplica como una herramienta tecnológica.</li>
            </ul>

            <h2>Contacto</h2>
            <p>Para cualquier pregunta o comentario sobre estos Términos de Uso, por favor contáctenos en:</p>
            <p><strong>Puro Contenido SAS</strong></p>
            <p>Correo electrónico: soporte@purocontenido.com</p>
            <p>Dirección: AC 53 #46-62 Of. 104, Bogotá, Colombia</p>
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
              <Link href="/methodology" className="text-sm hover:text-accent">Nuestra Metodología</Link>
              <Link href="/#bidtory" className="text-sm hover:text-accent">Suite Bidtory</Link>
              <Link href="/contact" className="text-sm hover:text-accent">Contacto</Link>
            </div>
          </div>
           <div className="text-center md:text-left">
            <h4 className="font-semibold text-sm mb-2">Legales</h4>
            <div className="flex flex-col gap-1">
                <Link href="/terminos" className="text-sm text-accent">Términos de Servicio</Link>
                <Link href="/privacidad" className="text-sm hover:text-accent">Política de Privacidad</Link>
                <Link href="/cookies" className="text-sm hover:text-accent">Política de Cookies</Link>
                <Link href="/accesibilidad" className="text-sm hover:text-accent">Accesibilidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
