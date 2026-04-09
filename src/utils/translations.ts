export type Lang = 'en' | 'es';

const T = {
  en: {
    /* ── Header ── */
    siteName: 'PediPlace',
    tagline: 'Donor Prospect Bot',
    realIRS: 'Real IRS Data',
    nonprofits: '2M+ Nonprofits',

    /* ── Stats bar ── */
    statLeads: 'BOT LEADS',
    statPipeline: 'IN PIPELINE',
    statContacted: 'CONTACTED',
    statDonors: 'DONORS',
    exportLeads: 'Export Leads',

    /* ── Main tabs ── */
    tabBot: 'Donor Bot',
    tabDiscover: 'Discover Funders',
    tabPrograms: 'Programs & Giving',

    /* ── Chat header ── */
    chatTitle: 'PediBot',
    chatSubtitle: 'PediPlace Donor Assistant • Always active',
    chatOnline: 'Online',
    chatPlaceholder: 'Type a message or select an option above...',
    chatComplete: 'Conversation complete • Lead saved',
    chatStartNew: 'Start new conversation',

    /* ── Sidebar cards ── */
    donateNow: 'Donate Now',
    donateDesc: 'Skip the chat and donate directly to PediPlace. Every dollar helps an uninsured child.',
    visitSite: 'Visit PediPlace.org',
    contactTitle: 'Contact PediPlace',
    recentLeads: 'Recent Bot Leads',
    noLeads: 'No leads yet — complete the chat to capture a lead',

    /* ── Programs section ── */
    programsTitle: 'Our Programs & Services',
    programsSubtitle: 'Pediatric healthcare for uninsured children in Denton & Lewisville, TX',
    viewPediPlace: 'View on PediPlace.org',

    /* ── Donation tiers section ── */
    tiersTitle: 'Donation Impact Tiers',
    tiersSubtitle: 'Every dollar goes directly to patient care',
    perGift: '/ gift',
    giveLink: 'Give',

    /* ── Volunteer section ── */
    volunteerTitle: 'Volunteer Opportunities',
    volunteerSubtitle: 'All assembled donations accepted Mon–Fri 9am–12pm & 2pm–4pm',
    volunteerWarning: 'All bag donations must come already assembled. Drop-off at 502 S. Old Orchard Lane, #126, Lewisville, TX 75067.',
    emailCassandra: 'Email Cassandra',

    /* ── CTA banner ── */
    ctaTitle: 'Ready to make a difference?',
    ctaBody: 'Every gift — large or small — helps an uninsured child in Denton County get the care they deserve.',
    ctaDonate: 'Donate at PediPlace.org',
    ctaBot: 'Chat with PediBot',

    /* ── Discover funders ── */
    discoverInfo: 'Powered by ProPublica IRS 990 + Curated Grant Database — 25 pre-matched top funders for PediPlace\'s pediatric healthcare mission. Click "Generate Email" to create an AI-written outreach.',
    searchPlaceholder: 'Search by name, focus area, location...',
    allTypes: 'All Types',
    filters: 'Filters',
    showingProspects: (n: number) => `Showing ${n} matched prospects`,
    irsInfo: 'Live ProPublica IRS 990 Database — 2M+ real nonprofit filings. Texas results by default.',
    irsPlaceholder: 'Search IRS 990 database — e.g. pediatric health texas, children foundation denton...',
    searchIRS: 'Search IRS',
    searching: 'Searching...',
    generateEmail: 'Generate Email',
    addPipeline: 'Add to Pipeline',
    inPipelineBtn: 'In Pipeline',
    viewFiling: 'View IRS Filing',

    /* ── Bot conversation ── */
    bot_welcome: "👋 Hi there! I'm **PediBot**, PediPlace's giving assistant.\n\nI connect donors, volunteers, and corporate partners with our pediatric healthcare programs serving uninsured children in Denton & Lewisville, TX.\n\nWhat's your name?",
    bot_interest: (name: string) => `Nice to meet you, **${name}**! 😊\n\nWhy are you interested in supporting PediPlace today?`,
    bot_program: "That's wonderful! 💛 PediPlace has several programs making a real difference. Which area resonates most with you?",
    bot_donation: (prog: string) => `Great choice — **${prog}** is one of our most impactful programs.\n\nHere's how your gift directly helps children at PediPlace. Which giving level feels right for you?`,
    bot_volunteer: (name: string) => `Amazing, ${name}! 🤝 Volunteers are the heart of PediPlace.\n\nWhat type of volunteer opportunity interests you?`,
    bot_volunteer_items: (type: string) => `Perfect! Here's what we need for **${type}**.\n\n⚠️ **All donations must come already assembled.**\n\n📍 Drop-off: 502 S. Old Orchard Lane, #126, Lewisville, TX 75067\n🕐 Mon–Fri: 9am–12pm & 2pm–4pm (closed for lunch 12:30–1:30pm)\n\nMay I get your email to send you full instructions and confirm your drop-off?`,
    bot_corporate: "Excellent! 🏢 Corporate and foundation partners are vital to our mission.\n\nWe have a list of 25 top-matched funders for PediPlace — including foundations like Robert Wood Johnson, W.K. Kellogg, Gates Foundation, and many Texas-based funders.\n\nWhich best describes your organization?",
    bot_inkind: "Thank you for thinking of in-kind giving! 📦 Here's what PediPlace needs most right now:\n\n**Everyday Essentials:** Diapers, baby wipes, Tylenol/Advil/Motrin, Band-Aids, children's books, Target/Walmart gift cards\n\n**Special Bags:** Snack bags, newborn welcome bags, birthday bags, hygiene bags — all must come pre-assembled.\n\nCan you share your email? We'll send you our full supply list and drop-off instructions.",
    bot_email: (prog: string, amt: string) => `Thank you for your interest in **${prog}**${amt ? ` and considering a **$${Number(amt).toLocaleString()}** gift` : ''}! 🙏\n\nCan I get your email address to send you donation instructions, our latest impact report, and next steps?`,
    bot_timeline: "Almost done! When are you thinking of making this gift or getting involved?",
    bot_followup: "One last question — is there anything specific you'd like to know more about?\n\nFor example: How donations are used, tax receipts, volunteering at our school clinics, our mental health program, or matching gifts?",
    bot_complete: (name: string) => `🎉 Thank you so much, **${name}**!\n\nWe've received your interest and will be in touch within **2 business days**.\n\n📧 We'll send details to your email shortly.\n\n**Ready to give now?** You can donate directly at [pediplace.org](https://www.pediplace.org)\n📞 Questions? Call us: **972-436-7962**\n📍 502 S. Old Orchard Lane, #126, Lewisville, TX 75067`,

    /* ── Bot options ── */
    opt_donation: 'Make a monetary donation',
    opt_corporate: 'Corporate / foundation giving',
    opt_volunteer: 'Volunteer my time',
    opt_inkind: 'In-kind / supply donation',
    opt_explore: 'Just exploring / learning more',
    opt_thisWeek: 'This week',
    opt_thisMonth: 'This month',
    opt_nextQuarter: 'Next 3 months',
    opt_exploring: 'Just exploring for now',
    opt_foundation: 'Private foundation / family foundation',
    opt_corporateOrg: 'Corporate giving / CSR program',
    opt_community: 'Community foundation',
    opt_government: 'Government / federal grant',
    opt_other: 'Other organization',
    opt_usage: 'How are donations used?',
    opt_tax: 'Is my donation tax-deductible?',
    opt_school: 'Tell me about school clinics',
    opt_matching: 'Corporate matching gifts',
    opt_none: 'No further questions',
    opt_done: "That's all, thank you!",

    /* ── Follow-up answers ── */
    fup_usage: '100% of your donation goes directly to patient care — we break it down in our annual report sent to your email.',
    fup_tax: 'Yes! PediPlace is a registered 501(c)(3). Your receipt will be emailed within 24 hours of your donation.',
    fup_school: 'We have clinics inside Central Elementary (LISD) and Fred Moore High School (DISD), serving at-risk students directly.',
    fup_matching: 'Many employers will match your donation! Ask your HR department for a matching gift form and we\'ll verify the donation.',
    fup_none: "No problem! We'll send you everything you need via email.",
    fup_more: 'Any other questions?',

    /* ── Contact details ── */
    hours: 'Mon–Fri 8am–5pm (Tue until 8pm)',
    medVolunteer: 'Medical volunteers: Cassandra',
  },

  es: {
    /* ── Header ── */
    siteName: 'PediPlace',
    tagline: 'Bot de Donantes',
    realIRS: 'Datos Reales del IRS',
    nonprofits: '2M+ Organizaciones',

    /* ── Stats bar ── */
    statLeads: 'CONTACTOS',
    statPipeline: 'EN PROCESO',
    statContacted: 'CONTACTADOS',
    statDonors: 'DONANTES',
    exportLeads: 'Exportar Contactos',

    /* ── Main tabs ── */
    tabBot: 'Bot de Donantes',
    tabDiscover: 'Buscar Financiadores',
    tabPrograms: 'Programas y Donaciones',

    /* ── Chat header ── */
    chatTitle: 'PediBot',
    chatSubtitle: 'Asistente de PediPlace • Siempre activo',
    chatOnline: 'En línea',
    chatPlaceholder: 'Escribe un mensaje o selecciona una opción...',
    chatComplete: 'Conversación completa • Contacto guardado',
    chatStartNew: 'Iniciar nueva conversación',

    /* ── Sidebar cards ── */
    donateNow: 'Donar Ahora',
    donateDesc: 'Omita el chat y done directamente a PediPlace. Cada dólar ayuda a un niño sin seguro.',
    visitSite: 'Visitar PediPlace.org',
    contactTitle: 'Contactar a PediPlace',
    recentLeads: 'Contactos Recientes del Bot',
    noLeads: 'Sin contactos aún — complete el chat para capturar un contacto',

    /* ── Programs section ── */
    programsTitle: 'Nuestros Programas y Servicios',
    programsSubtitle: 'Atención médica pediátrica para niños sin seguro en Denton y Lewisville, TX',
    viewPediPlace: 'Ver en PediPlace.org',

    /* ── Donation tiers section ── */
    tiersTitle: 'Niveles de Impacto de Donación',
    tiersSubtitle: 'Cada dólar va directamente a la atención del paciente',
    perGift: '/ donación',
    giveLink: 'Donar',

    /* ── Volunteer section ── */
    volunteerTitle: 'Oportunidades de Voluntariado',
    volunteerSubtitle: 'Donaciones ensambladas aceptadas Lun–Vie 9am–12pm y 2pm–4pm',
    volunteerWarning: 'Todas las bolsas deben venir ya ensambladas. Entrega en: 502 S. Old Orchard Lane, #126, Lewisville, TX 75067.',
    emailCassandra: 'Enviar Email a Cassandra',

    /* ── CTA banner ── */
    ctaTitle: '¿Listo para hacer una diferencia?',
    ctaBody: 'Cada regalo — grande o pequeño — ayuda a un niño sin seguro en el Condado de Denton a recibir la atención que merece.',
    ctaDonate: 'Donar en PediPlace.org',
    ctaBot: 'Chatear con PediBot',

    /* ── Discover funders ── */
    discoverInfo: 'Desarrollado con la base de datos del IRS 990 de ProPublica — 25 financiadores principales seleccionados para la misión de salud pediátrica de PediPlace. Haz clic en "Generar Email" para crear un mensaje de contacto.',
    searchPlaceholder: 'Buscar por nombre, área de enfoque, ubicación...',
    allTypes: 'Todos los Tipos',
    filters: 'Filtros',
    showingProspects: (n: number) => `Mostrando ${n} prospectos coincidentes`,
    irsInfo: 'Base de datos en vivo del IRS 990 de ProPublica — más de 2 millones de archivos reales. Resultados de Texas por defecto.',
    irsPlaceholder: 'Buscar en la base de datos del IRS — ej. salud pediátrica texas, fundación niños denton...',
    searchIRS: 'Buscar en IRS',
    searching: 'Buscando...',
    generateEmail: 'Generar Email',
    addPipeline: 'Agregar al Proceso',
    inPipelineBtn: 'En Proceso',
    viewFiling: 'Ver Declaración IRS',

    /* ── Bot conversation ── */
    bot_welcome: "👋 ¡Hola! Soy **PediBot**, el asistente de donaciones de PediPlace.\n\nConecto a donantes, voluntarios y socios corporativos con nuestros programas de salud pediátrica para niños sin seguro en Denton y Lewisville, TX.\n\n¿Cómo te llamas?",
    bot_interest: (name: string) => `¡Mucho gusto, **${name}**! 😊\n\n¿Por qué estás interesado en apoyar a PediPlace hoy?`,
    bot_program: "¡Maravilloso! 💛 PediPlace tiene varios programas que hacen una gran diferencia. ¿Qué área te interesa más?",
    bot_donation: (prog: string) => `Excelente elección — **${prog}** es uno de nuestros programas más impactantes.\n\nAsí es como tu donación ayuda directamente a los niños en PediPlace. ¿Qué nivel de donación te parece adecuado?`,
    bot_volunteer: (name: string) => `¡Increíble, ${name}! 🤝 Los voluntarios son el corazón de PediPlace.\n\n¿Qué tipo de oportunidad de voluntariado te interesa?`,
    bot_volunteer_items: (type: string) => `¡Perfecto! Esto es lo que necesitamos para **${type}**.\n\n⚠️ **Todas las donaciones deben venir ya ensambladas.**\n\n📍 Entrega en: 502 S. Old Orchard Lane, #126, Lewisville, TX 75067\n🕐 Lun–Vie: 9am–12pm y 2pm–4pm (cerrado al mediodía 12:30–1:30pm)\n\n¿Me puedes dar tu correo electrónico para enviarte instrucciones completas?`,
    bot_corporate: "¡Excelente! 🏢 Los socios corporativos y fundaciones son vitales para nuestra misión.\n\nTenemos una lista de 25 financiadores principales para PediPlace — incluyendo fundaciones como Robert Wood Johnson, W.K. Kellogg, Gates Foundation, y muchos financiadores con base en Texas.\n\n¿Cuál describe mejor a su organización?",
    bot_inkind: "¡Gracias por pensar en donaciones en especie! 📦 Esto es lo que PediPlace más necesita ahora:\n\n**Artículos cotidianos:** Pañales, toallitas para bebé, Tylenol/Advil/Motrin, curitas, libros para niños, tarjetas de regalo de Target y Walmart\n\n**Bolsas especiales:** Bolsas de merienda, bolsas de bienvenida para recién nacidos, bolsas de cumpleaños, bolsas de higiene — todas deben venir preensambladas.\n\n¿Puedes compartir tu correo electrónico? Te enviaremos nuestra lista completa e instrucciones de entrega.",
    bot_email: (prog: string, amt: string) => `¡Gracias por tu interés en **${prog}**${amt ? ` y por considerar un regalo de **$${Number(amt).toLocaleString()}**` : ''}! 🙏\n\n¿Me puedes dar tu correo electrónico para enviarte las instrucciones de donación, nuestro informe de impacto y los próximos pasos?`,
    bot_timeline: "¡Casi terminamos! ¿Cuándo estás pensando en hacer este regalo o participar?",
    bot_followup: "Última pregunta — ¿Hay algo específico sobre lo que quisieras saber más?\n\nPor ejemplo: Cómo se usan las donaciones, recibos fiscales, voluntariado en nuestras clínicas escolares, nuestro programa de salud mental, o donaciones equivalentes.",
    bot_complete: (name: string) => `🎉 ¡Muchas gracias, **${name}**!\n\nHemos recibido tu interés y nos pondremos en contacto en **2 días hábiles**.\n\n📧 Te enviaremos los detalles a tu correo pronto.\n\n**¿Listo para donar ahora?** Puedes donar directamente en [pediplace.org](https://www.pediplace.org)\n📞 ¿Preguntas? Llámanos: **972-436-7962**\n📍 502 S. Old Orchard Lane, #126, Lewisville, TX 75067`,

    /* ── Bot options ── */
    opt_donation: 'Hacer una donación monetaria',
    opt_corporate: 'Donación corporativa / fundación',
    opt_volunteer: 'Ser voluntario',
    opt_inkind: 'Donación en especie / suministros',
    opt_explore: 'Solo estoy explorando / aprendiendo',
    opt_thisWeek: 'Esta semana',
    opt_thisMonth: 'Este mes',
    opt_nextQuarter: 'Próximos 3 meses',
    opt_exploring: 'Solo explorando por ahora',
    opt_foundation: 'Fundación privada / familiar',
    opt_corporateOrg: 'Programa corporativo / RSC',
    opt_community: 'Fundación comunitaria',
    opt_government: 'Subvención gubernamental / federal',
    opt_other: 'Otra organización',
    opt_usage: '¿Cómo se usan las donaciones?',
    opt_tax: '¿Es deducible de impuestos mi donación?',
    opt_school: 'Cuéntame sobre las clínicas escolares',
    opt_matching: 'Donaciones equivalentes corporativas',
    opt_none: 'Sin más preguntas',
    opt_done: '¡Eso es todo, gracias!',

    /* ── Follow-up answers ── */
    fup_usage: 'El 100% de tu donación va directamente a la atención del paciente — lo desglosamos en nuestro informe anual enviado a tu correo.',
    fup_tax: '¡Sí! PediPlace es una organización 501(c)(3) registrada. Tu recibo será enviado por correo dentro de 24 horas después de tu donación.',
    fup_school: 'Tenemos clínicas dentro de la Escuela Primaria Central (LISD) y la Escuela Secundaria Fred Moore (DISD), sirviendo directamente a estudiantes en riesgo.',
    fup_matching: '¡Muchos empleadores igualan tu donación! Pregunta a tu departamento de Recursos Humanos por un formulario de donación equivalente.',
    fup_none: '¡No hay problema! Te enviaremos todo lo que necesitas por correo electrónico.',
    fup_more: '¿Alguna otra pregunta?',

    /* ── Contact details ── */
    hours: 'Lun–Vie 8am–5pm (Mar hasta 8pm)',
    medVolunteer: 'Voluntarios médicos: Cassandra',
  },
} as const;

export type TranslationKey = keyof typeof T.en;

export function useTranslation(lang: Lang) {
  return T[lang];
}

export default T;
