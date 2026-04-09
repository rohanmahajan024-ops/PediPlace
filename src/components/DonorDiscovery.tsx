import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Download, CheckCircle, Plus, Send, Bot, X, Activity,
  Sun, Moon, LogIn, Filter, ExternalLink, Clipboard, ClipboardCheck,
  Loader2, Heart, Users, DollarSign, BookOpen, Baby, Brain,
  Stethoscope, School, Gift, Package, Mail, Phone,
  MapPin, Calendar, ChevronRight, ArrowRight,
  HandHeart, Repeat,
} from 'lucide-react';
import { curatedFunders, CuratedFunder } from '../data/curatedFunders';
import { sendChatMessage } from '../utils/geminiApi';
import { useTranslation, Lang } from '../utils/translations';
import { sendThankYouEmail, sendAdminLeadNotification } from '../utils/emailService';

/* ────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────── */
interface DonorDiscoveryProps {
  publicMode?: boolean;
  darkMode?: boolean;
  onToggleDark?: () => void;
  onLoginClick?: () => void;
}

interface PipelineEntry extends CuratedFunder {
  pipelineStatus: 'pipeline' | 'contacted' | 'responded' | 'donated';
}

interface ProPublicaOrg {
  ein: string;
  name: string;
  city: string;
  state: string;
  ntee_code: string;
  subsection_code?: number;
  asset_amount: number;
  income_amount: number;
  revenue_amount?: number;
  ruling?: number;
  stratum?: string;
  fisyr?: number;
  organization_id?: number;
}

interface ScanResult extends ProPublicaOrg {
  relevanceScore: number;
  relevanceReasons: string[];
  sourceId: string;
  sourceCategory: string;
  matchBadge: string;
}

interface IRSPipelineEntry {
  id: string;
  org: ProPublicaOrg & { relevanceScore?: number; matchBadge?: string };
  status: 'new' | 'contacted' | 'responded' | 'donated';
  notes: string;
  addedAt: string;
}

const US_STATES = [
  ['TX','Texas'],['CA','California'],['NY','New York'],['FL','Florida'],['IL','Illinois'],
  ['PA','Pennsylvania'],['OH','Ohio'],['GA','Georgia'],['NC','North Carolina'],['MI','Michigan'],
  ['NJ','New Jersey'],['VA','Virginia'],['WA','Washington'],['AZ','Arizona'],['MA','Massachusetts'],
  ['TN','Tennessee'],['IN','Indiana'],['MO','Missouri'],['MD','Maryland'],['CO','Colorado'],
  ['MN','Minnesota'],['WI','Wisconsin'],['AL','Alabama'],['SC','South Carolina'],['LA','Louisiana'],
];

// ProPublica Nonprofit Explorer API uses numeric category IDs 1-25
// ProPublica API ntee[id] only accepts integers 1–10 — exact codes from their docs
const NTEE_CATEGORIES = [
  { label: 'All Categories',              id: '' },
  { label: 'Arts, Culture & Humanities',  id: '1' },
  { label: 'Education',                   id: '2' },
  { label: 'Environment & Animals',       id: '3' },
  { label: 'Health',                      id: '4' },
  { label: 'Human Services',              id: '5' },
  { label: 'International Affairs',       id: '6' },
  { label: 'Public & Societal Benefit',   id: '7' },
  { label: 'Religion Related',            id: '8' },
  { label: 'Mutual/Membership Benefit',   id: '9' },
  { label: 'Unknown / Unclassified',      id: '10' },
];

// Maps ProPublica subsection_code → human-readable org type
const SUBSECTION_LABELS: Record<number, string> = {
  3: '501(c)(3) Public Charity',
  4: '501(c)(4) Social Welfare',
  5: '501(c)(5) Labor/Agriculture',
  6: '501(c)(6) Business League',
  7: '501(c)(7) Social Club',
  10: '501(c)(10) Domestic Fraternal',
  19: '501(c)(19) Veterans Org',
};

const NTEE_DESCRIPTIONS: Record<string, string> = {
  A: 'Arts, Culture & Humanities',
  B: 'Education',
  C: 'Environmental & Animal Protection',
  D: 'Animal-Related',
  E: 'Health — General & Rehabilitative',
  F: 'Mental Health & Crisis Intervention',
  G: 'Disease-Specific & Research',
  H: 'Medical Research',
  I: 'Crime & Legal-Related',
  J: 'Employment & Job-Related',
  K: 'Food, Agriculture & Nutrition',
  L: 'Housing & Shelter',
  M: 'Public Safety & Disaster',
  N: 'Recreation & Sports',
  O: 'Youth Development',
  P: 'Human Services',
  Q: 'International, Foreign Affairs',
  R: 'Civil Rights & Advocacy',
  S: 'Community Improvement',
  T: 'Philanthropy & Grantmaking',
  U: 'Science & Technology',
  W: 'Public & Societal Benefit',
  X: 'Religion-Related',
  Y: 'Mutual Benefit',
};

interface EmailModal {
  open: boolean;
  funder: CuratedFunder | null;
  loading: boolean;
  content: string;
  copied: boolean;
}

export interface BotLead {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  interest: string;
  program: string;
  donationAmount: string;
  timeline: string;
  volunteerType: string;
  notes: string;
}

export type BotStep =
  | 'welcome' | 'interest' | 'program' | 'donation_tier'
  | 'volunteer_type' | 'volunteer_items' | 'corporate_check'
  | 'inkind' | 'email' | 'timeline' | 'follow_up' | 'complete'
  | 'explore_menu' | 'programs_overview' | 'tiers_overview' | 'volunteer_overview';

export interface ChatMsg {
  id: string;
  role: 'bot' | 'user';
  text: string;
  options?: { label: string; value: string; icon?: string }[];
  inputType?: 'text' | 'email' | 'none';
  cards?: 'programs' | 'tiers' | 'volunteer';
}

/* ────────────────────────────────────────────────────
   STATIC DATA
──────────────────────────────────────────────────── */
const PROGRAMS = [
  {
    id: 'preventive',
    title: 'Preventive Care',
    icon: <Stethoscope className="w-5 h-5" />,
    color: 'blue',
    description: 'Vaccines, hearing & vision screenings, and annual physicals for children ages 2+.',
      stat: "$125 = one child's annual checkup",
  },
  {
    id: 'healthy-babies',
    title: 'Healthy Babies',
    icon: <Baby className="w-5 h-5" />,
    color: 'pink',
    description: 'Well-child visits from 3 days to 15 months. No fees for uninsured patients.',
    stat: '$750 = 6 newborn checkups (0–15 months)',
  },
  {
    id: 'chronic',
    title: 'Chronic Illness Care',
    icon: <Heart className="w-5 h-5" />,
    color: 'red',
    description: '30+ years treating asthma, ADHD, obesity, and complex medical conditions.',
    stat: '$500 = quarterly asthma care management',
  },
  {
    id: 'mental-health',
    title: 'Mental Health',
    icon: <Brain className="w-5 h-5" />,
    color: 'violet',
    description: 'APA-approved screenings + in-clinic Licensed Professional Counselors for anxiety, depression, and more.',
    stat: '$50 = one mental health session',
  },
  {
    id: 'school-clinic',
    title: 'School Clinic Initiative',
    icon: <School className="w-5 h-5" />,
    color: 'amber',
    description: 'On-site clinics at LISD and DISD schools bringing care to low-income, at-risk children.',
    stat: '$1,000 = annual checkups for 10 children',
  },
  {
    id: 'literacy',
    title: 'Reach Out and Read',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'emerald',
    description: 'Age-appropriate books at every well visit from 6 months to 6 years — 18-book library by age 6.',
    stat: '$250 = books for one child ages 6mo–5yr',
  },
  {
    id: 'family-care',
    title: 'Family Care Fund',
    icon: <HandHeart className="w-5 h-5" />,
    color: 'teal',
    description: 'Financial assistance for prescriptions and lab costs for uninsured families.',
    stat: '$200 = lab & prescription aid for one family',
  },
  {
    id: 'illness-wellness',
    title: 'Illness to Wellness',
    icon: <Activity className="w-5 h-5" />,
    color: 'orange',
    description: 'Acute care for flu, ear infections, viruses, and follow-up for chronic conditions.',
    stat: '$75 = one sick office visit',
  },
];

const DONATION_TIERS = [
  { amount: 5000, label: 'Medical & Laboratory Supplies', labelEs: 'Suministros Médicos y de Laboratorio', impact: 'Equips the clinic with essential medical and lab supplies', impactEs: 'Equipa la clínica con suministros médicos y de laboratorio esenciales', icon: '🔬', program: 'All Programs', color: 'from-purple-500 to-indigo-600' },
  { amount: 2500, label: 'Medication & Lab Testing', labelEs: 'Medicamentos y Pruebas de Laboratorio', impact: 'Covers medications and diagnostics for uninsured children', impactEs: 'Cubre medicamentos y diagnósticos para niños sin seguro', icon: '💊', program: 'Family Care Fund', color: 'from-blue-500 to-cyan-600' },
  { amount: 1000, label: 'Annual Check-ups × 10', labelEs: 'Chequeos Anuales × 10', impact: 'Provides annual physicals for 10 uninsured children', impactEs: 'Proporciona chequeos anuales para 10 niños sin seguro', icon: '👨‍⚕️', program: 'Healthy Kids', color: 'from-teal-500 to-emerald-600' },
  { amount: 750, label: 'Newborn Wellness Series', labelEs: 'Serie de Bienestar para Recién Nacidos', impact: 'Funds 6 recommended checkups from birth to 15 months', impactEs: 'Financia 6 chequeos recomendados desde el nacimiento hasta los 15 meses', icon: '👶', program: 'Healthy Babies', color: 'from-pink-500 to-rose-600' },
  { amount: 500, label: 'Asthma Care Quarterly', labelEs: 'Atención Trimestral del Asma', impact: 'Covers 4 quarterly asthma management visits for one child', impactEs: 'Cubre 4 visitas trimestrales de manejo del asma para un niño', icon: '🫁', program: 'Chronic Illness', color: 'from-orange-500 to-amber-600' },
  { amount: 250, label: 'Literacy for Life', labelEs: 'Lectura para la Vida', impact: 'Age-appropriate books for one child ages 6 months to 5 years', impactEs: 'Libros apropiados para un niño de 6 meses a 5 años', icon: '📚', program: 'Reach Out & Read', color: 'from-yellow-500 to-orange-600' },
  { amount: 200, label: 'Family Care Fund', labelEs: 'Fondo de Cuidado Familiar', impact: 'Prescription & lab testing financial assistance for one family', impactEs: 'Asistencia financiera para recetas y laboratorio para una familia', icon: '💝', program: 'Family Care Fund', color: 'from-rose-500 to-pink-600' },
  { amount: 125, label: 'Annual Checkup Gift', labelEs: 'Regalo de Chequeo Anual', impact: "One child's complete annual wellness visit", impactEs: 'Visita completa de bienestar anual para un niño', icon: '🩺', program: 'Preventive Care', color: 'from-cyan-500 to-blue-600' },
  { amount: 75, label: 'Sick Visit Care', labelEs: 'Visita por Enfermedad', impact: "Covers one child's office visit when ill", impactEs: 'Cubre la visita al consultorio de un niño cuando está enfermo', icon: '🤒', program: 'Illness to Wellness', color: 'from-indigo-500 to-violet-600' },
  { amount: 50, label: 'Mental Health Session', labelEs: 'Sesión de Salud Mental', impact: 'Provides one therapy session for a child', impactEs: 'Proporciona una sesión de terapia para un niño', icon: '🧠', program: 'Mental Health', color: 'from-violet-500 to-purple-600' },
];

const VOLUNTEER_OPTIONS = [
  { id: 'book', title: 'Book Donations', titleEs: 'Donación de Libros', icon: '📚', description: "Donate any new books to help build children's home libraries.", descriptionEs: 'Dona libros nuevos para ayudar a construir bibliotecas caseras para niños.', items: ["Any new children's books (all ages welcome)"], itemsEs: ['Cualquier libro nuevo para niños (todas las edades)'] },
  { id: 'snack-bags', title: 'Patient Snack Bags', titleEs: 'Bolsas de Merienda para Pacientes', icon: '🎒', description: 'Pre-assembled snack bags for patients visiting the clinic.', descriptionEs: 'Bolsas de merienda preensambladas para pacientes que visitan la clínica.', items: ['Cheese crackers', 'Peanut butter crackers', 'Granola bars', 'Baked potato chips', 'Applesauce pouches', 'Tuna fish', 'Trail mix', 'Pretzels', 'Fruit snacks', 'Juice boxes'], itemsEs: ['Galletas de queso', 'Galletas de mantequilla de maní', 'Barras de granola', 'Papas fritas horneadas', 'Bolsas de puré de manzana', 'Atún', 'Mezcla de frutos secos', 'Pretzels', 'Bocadillos de frutas', 'Jugos'] },
  { id: 'newborn-bags', title: 'Newborn Welcome Bags', titleEs: 'Bolsas de Bienvenida para Recién Nacidos', icon: '👶', description: 'Essentials for new families with newborns in our Healthy Babies program.', descriptionEs: 'Artículos esenciales para nuevas familias con recién nacidos en nuestro programa Bebés Saludables.', items: ['Baby wipes', 'Onesies', 'Socks', 'Diapers', 'Pacifiers', 'Thermometer', 'Mittens', 'Gift bags'], itemsEs: ['Toallitas para bebé', 'Mameluco (onesie)', 'Calcetines', 'Pañales', 'Chupones', 'Termómetro', 'Mitones', 'Bolsas de regalo'] },
  { id: 'birthday-bags', title: 'Birthday Celebration Bags', titleEs: 'Bolsas de Cumpleaños', icon: '🎂', description: 'Make a birthday special for children who might not otherwise celebrate.', descriptionEs: 'Haz especial el cumpleaños de niños que de otro modo no podrían celebrar.', items: ['1 box cake mix', '1 tub frosting', 'Small bottle of oil', 'Sprinkles & decorations', 'Foil baking pan', 'Birthday candles', 'Birthday plates & napkins', 'Birthday bag'], itemsEs: ['1 caja de mezcla para pastel', '1 tarro de betún', 'Botella pequeña de aceite', 'Chispas y decoraciones', 'Molde de papel aluminio', 'Velas de cumpleaños', 'Platos y servilletas de cumpleaños', 'Bolsa de cumpleaños'] },
  { id: 'hygiene-bags', title: 'Hygiene Bags', titleEs: 'Bolsas de Higiene', icon: '🧴', description: 'Personal care supplies for families in need.', descriptionEs: 'Artículos de cuidado personal para familias que lo necesitan.', items: ['Soap', 'Razors', 'Shampoo', 'Toothbrush', 'Toothpaste'], itemsEs: ['Jabón', 'Rasuradoras', 'Shampoo', 'Cepillo de dientes', 'Pasta de dientes'] },
  { id: 'everyday', title: 'Everyday Essentials', titleEs: 'Artículos Esenciales del Día a Día', icon: '🏥', description: 'Daily care items used throughout our clinic operations.', descriptionEs: 'Artículos de uso diario en las operaciones de nuestra clínica.', items: ["Diapers", "Baby wipes", "Baby & children's Tylenol/Advil/Motrin", 'Band-Aids', 'New children\'s books', 'Target & Walmart gift cards'], itemsEs: ['Pañales', 'Toallitas para bebé', 'Tylenol/Advil/Motrin para bebés y niños', 'Curitas', 'Libros nuevos para niños', 'Tarjetas de regalo de Target y Walmart'] },
  { id: 'medical', title: 'Medical Volunteer', titleEs: 'Voluntario Médico', icon: '👩‍⚕️', description: 'Healthcare professionals can volunteer clinical time.', descriptionEs: 'Los profesionales de la salud pueden donar tiempo clínico como voluntarios.', items: ['Contact: Cassandra Singleton', 'Email: Cassandra.singleton@pediplace.org', 'Must contact Director of Clinical Operations'], itemsEs: ['Contacto: Cassandra Singleton', 'Email: Cassandra.singleton@pediplace.org', 'Debe contactar al Director de Operaciones Clínicas'] },
];

const INTEREST_OPTIONS = [
  { label: 'Make a monetary donation', value: 'donation', icon: '💛' },
  { label: 'Corporate / foundation giving', value: 'corporate', icon: '🏢' },
  { label: 'Volunteer my time', value: 'volunteer', icon: '🤝' },
  { label: 'In-kind / supply donation', value: 'inkind', icon: '📦' },
  { label: 'Just exploring / learning more', value: 'explore', icon: 'ℹ️' },
];

const TIMELINE_OPTIONS = [
  { label: 'This week', value: 'this_week', icon: '⚡' },
  { label: 'This month', value: 'this_month', icon: '📅' },
  { label: 'Next 3 months', value: 'next_quarter', icon: '🗓️' },
  { label: 'Just exploring for now', value: 'exploring', icon: '🔍' },
];

const PROGRAM_CHOICES = PROGRAMS.map((p) => ({ label: p.title, value: p.id, icon: '✨' }));

const COLORS: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
  pink: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-500/10',
  red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
  violet: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10',
  amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
  emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
  teal: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-500/10',
  orange: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10',
};

const SOURCE_COLORS: Record<string, string> = {
  'Foundation Directory': 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  'IRS 990': 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  'HHS Public Grant Database': 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
};

/* ────────────────────────────────────────────────────
   LEAD STORAGE HELPERS
──────────────────────────────────────────────────── */
export const getStoredLeads = (): BotLead[] => {
  try {
    return JSON.parse(localStorage.getItem('pediplace_bot_leads') || '[]');
  } catch {
    return [];
  }
};

export const saveLead = (lead: BotLead) => {
  const leads = getStoredLeads();
  leads.unshift(lead);
  localStorage.setItem('pediplace_bot_leads', JSON.stringify(leads));
};

/* ────────────────────────────────────────────────────
   BOT LOGIC
──────────────────────────────────────────────────── */
export function buildBotMessages(
  step: BotStep,
  state: { name: string; interest: string; program: string; donationAmount: string },
  lang: Lang = 'en',
): ChatMsg[] {
  const t = lang === 'es'
    ? {
        welcome: "👋 ¡Hola! Soy **PediBot**, el asistente de donaciones de PediPlace.\n\nConecto a donantes, voluntarios y socios corporativos con nuestros programas de salud pediátrica para niños sin seguro en Denton y Lewisville, TX.\n\n¿Cómo te llamas?",
        interest: `¡Mucho gusto, **${state.name}**! 😊\n\n¿Por qué estás interesado en apoyar a PediPlace hoy?`,
        program: "¡Maravilloso! 💛 PediPlace tiene varios programas que hacen una gran diferencia. ¿Qué área te interesa más?",
        donation: `Excelente elección — **${PROGRAMS.find((p) => p.id === state.program)?.titleEs || state.program}** es uno de nuestros programas más impactantes.\n\nAsí es como tu donación ayuda directamente a los niños en PediPlace. ¿Qué nivel de donación te parece adecuado?`,
        volunteer: `¡Increíble, ${state.name}! 🤝 Los voluntarios son el corazón de PediPlace.\n\n¿Qué tipo de oportunidad de voluntariado te interesa?`,
        volunteer_items: `¡Perfecto! Esto es lo que necesitamos para **${VOLUNTEER_OPTIONS.find((v) => v.id === state.interest)?.titleEs || 'voluntariado'}**.\n\n⚠️ **Todas las donaciones deben venir ya ensambladas.**\n\n📍 Entrega en: 502 S. Old Orchard Lane, #126, Lewisville, TX 75067\n🕐 Lun–Vie: 9am–12pm y 2pm–4pm (cerrado al mediodía 12:30–1:30pm)\n\n¿Me puedes dar tu correo electrónico?`,
        corporate: "¡Excelente! 🏢 Los socios corporativos y fundaciones son vitales para nuestra misión.\n\nTenemos 25 financiadores principales para PediPlace — incluyendo Robert Wood Johnson, W.K. Kellogg, Gates Foundation, y muchos en Texas.\n\n¿Cuál describe mejor a su organización?",
        inkind: "¡Gracias por pensar en donaciones en especie! 📦 Artículos más necesarios:\n\n**Cotidianos:** Pañales, toallitas, Tylenol/Advil/Motrin, curitas, libros para niños, tarjetas de regalo de Target/Walmart\n\n**Bolsas especiales:** Merienda, recién nacidos, cumpleaños, higiene — todas preensambladas.\n\n¿Puedes compartir tu correo electrónico?",
        email: `¡Gracias por tu interés en **${state.program ? PROGRAMS.find((p) => p.id === state.program)?.titleEs || state.program : 'PediPlace'}**${state.donationAmount && !isNaN(Number(state.donationAmount)) ? ` y por considerar un regalo de **$${Number(state.donationAmount).toLocaleString()}**` : ''}! 🙏\n\n¿Me puedes dar tu correo electrónico para enviarte instrucciones de donación y próximos pasos?`,
        timeline: "¡Casi terminamos! ¿Cuándo estás pensando en hacer este regalo o participar?",
        followup: "Última pregunta — ¿Hay algo específico sobre lo que quisieras saber más?\n\nPor ejemplo: Cómo se usan las donaciones, recibos fiscales, clínicas escolares, salud mental, o donaciones equivalentes.",
        complete: `🎉 ¡Muchas gracias, **${state.name}**!\n\nHemos recibido tu interés y nos pondremos en contacto en **2 días hábiles**.\n\n📧 Te enviaremos los detalles a tu correo pronto.\n\n**¿Listo para donar ahora?** Dona directamente en [pediplace.org](https://www.pediplace.org)\n📞 ¿Preguntas? Llámanos: **972-436-7962**\n📍 502 S. Old Orchard Lane, #126, Lewisville, TX 75067`,
        interests: [
          { label: 'Hacer una donación monetaria', value: 'donation', icon: '💛' },
          { label: 'Donación corporativa / fundación', value: 'corporate', icon: '🏢' },
          { label: 'Ser voluntario', value: 'volunteer', icon: '🤝' },
          { label: 'Donación en especie / suministros', value: 'inkind', icon: '📦' },
          { label: 'Solo estoy explorando', value: 'explore', icon: 'ℹ️' },
        ],
        timelines: [
          { label: 'Esta semana', value: 'this_week', icon: '⚡' },
          { label: 'Este mes', value: 'this_month', icon: '📅' },
          { label: 'Próximos 3 meses', value: 'next_quarter', icon: '🗓️' },
          { label: 'Solo explorando', value: 'exploring', icon: '🔍' },
        ],
        corporateOpts: [
          { label: 'Fundación privada / familiar', value: 'foundation', icon: '🏛️' },
          { label: 'Programa corporativo / RSC', value: 'corporate', icon: '🏢' },
          { label: 'Fundación comunitaria', value: 'community', icon: '🌱' },
          { label: 'Subvención gubernamental / federal', value: 'government', icon: '🏛️' },
          { label: 'Otra organización', value: 'other', icon: '📋' },
        ],
        followupOpts: [
          { label: '¿Cómo se usan las donaciones?', value: 'usage', icon: '📊' },
          { label: '¿Es deducible de impuestos?', value: 'tax', icon: '📋' },
          { label: 'Cuéntame sobre las clínicas escolares', value: 'school', icon: '🏫' },
          { label: 'Donaciones equivalentes corporativas', value: 'matching', icon: '✖️' },
          { label: 'Sin más preguntas', value: 'none', icon: '✅' },
        ],
        followupAnswers: {
          usage: 'El 100% de tu donación va directamente a la atención del paciente.',
          tax: '¡Sí! PediPlace es una organización 501(c)(3) registrada. Tu recibo será enviado por correo dentro de 24 horas.',
          school: 'Tenemos clínicas dentro de la Escuela Primaria Central (LISD) y la Escuela Secundaria Fred Moore (DISD).',
          matching: '¡Muchos empleadores igualan tu donación! Pregunta a tu departamento de Recursos Humanos.',
          none: '¡No hay problema! Te enviaremos todo lo que necesitas por correo electrónico.',
        },
        moreQ: '¿Alguna otra pregunta?',
        doneOpt: '¡Eso es todo, gracias!',
      }
    : {
        welcome: "👋 Hi there! I'm **PediBot**, PediPlace's giving assistant.\n\nI connect donors, volunteers, and corporate partners with our pediatric healthcare programs serving uninsured children in Denton & Lewisville, TX.\n\nWhat's your name?",
        interest: `Nice to meet you, **${state.name}**! 😊\n\nWhy are you interested in supporting PediPlace today?`,
        program: "That's wonderful! 💛 PediPlace has several programs making a real difference. Which area resonates most with you?",
        donation: `Great choice — **${PROGRAMS.find((p) => p.id === state.program)?.title || state.program}** is one of our most impactful programs.\n\nHere's how your gift directly helps children at PediPlace. Which giving level feels right for you?`,
        volunteer: `Amazing, ${state.name}! 🤝 Volunteers are the heart of PediPlace.\n\nWhat type of volunteer opportunity interests you?`,
        volunteer_items: `Perfect! Here's what we need for **${VOLUNTEER_OPTIONS.find((v) => v.id === state.interest)?.title || 'volunteering'}**.\n\n⚠️ **All donations must come already assembled.**\n\n📍 Drop-off: 502 S. Old Orchard Lane, #126, Lewisville, TX 75067\n🕐 Mon–Fri: 9am–12pm & 2pm–4pm (closed for lunch 12:30–1:30pm)\n\nMay I get your email to send you full instructions and confirm your drop-off?`,
        corporate: "Excellent! 🏢 Corporate and foundation partners are vital to our mission.\n\nWe have a list of 25 top-matched funders for PediPlace — including foundations like Robert Wood Johnson, W.K. Kellogg, Gates Foundation, and many Texas-based funders.\n\nWhich best describes your organization?",
        inkind: "Thank you for thinking of in-kind giving! 📦 Here's what PediPlace needs most right now:\n\n**Everyday Essentials:** Diapers, baby wipes, Tylenol/Advil/Motrin, Band-Aids, children's books, Target/Walmart gift cards\n\n**Special Bags:** Snack bags, newborn welcome bags, birthday bags, hygiene bags — all must come pre-assembled.\n\nCan you share your email? We'll send you our full supply list and drop-off instructions.",
        email: `Thank you for your interest in **${state.program ? PROGRAMS.find((p) => p.id === state.program)?.title || state.program : 'PediPlace'}**${state.donationAmount && !isNaN(Number(state.donationAmount)) ? ` and considering a **$${Number(state.donationAmount).toLocaleString()}** gift` : ''}! 🙏\n\nCan I get your email address to send you donation instructions, our latest impact report, and next steps?`,
        timeline: "Almost done! When are you thinking of making this gift or getting involved?",
        followup: "One last question — is there anything specific you'd like to know more about?\n\nFor example: How donations are used, tax receipts, volunteering at our school clinics, our mental health program, or matching gifts?",
        complete: `🎉 Thank you so much, **${state.name}**!\n\nWe've received your interest and will be in touch within **2 business days**.\n\n📧 We'll send details to your email shortly.\n\n**Ready to give now?** You can donate directly at [pediplace.org](https://www.pediplace.org)\n📞 Questions? Call us: **972-436-7962**\n📍 502 S. Old Orchard Lane, #126, Lewisville, TX 75067`,
        interests: INTEREST_OPTIONS,
        timelines: TIMELINE_OPTIONS,
        corporateOpts: [
          { label: 'Private foundation / family foundation', value: 'foundation', icon: '🏛️' },
          { label: 'Corporate giving / CSR program', value: 'corporate', icon: '🏢' },
          { label: 'Community foundation', value: 'community', icon: '🌱' },
          { label: 'Government / federal grant', value: 'government', icon: '🏛️' },
          { label: 'Other organization', value: 'other', icon: '📋' },
        ],
        followupOpts: [
          { label: 'How are donations used?', value: 'usage', icon: '📊' },
          { label: 'Is my donation tax-deductible?', value: 'tax', icon: '📋' },
          { label: 'Tell me about school clinics', value: 'school', icon: '🏫' },
          { label: 'Corporate matching gifts', value: 'matching', icon: '✖️' },
          { label: 'No further questions', value: 'none', icon: '✅' },
        ],
        followupAnswers: {
          usage: '100% of your donation goes directly to patient care — we break it down in our annual report sent to your email.',
          tax: 'Yes! PediPlace is a registered 501(c)(3). Your receipt will be emailed within 24 hours of your donation.',
          school: 'We have clinics inside Central Elementary (LISD) and Fred Moore High School (DISD), serving at-risk students directly.',
          matching: 'Many employers will match your donation! Ask your HR department for a matching gift form.',
          none: "No problem! We'll send you everything you need via email.",
        },
        moreQ: 'Any other questions?',
        doneOpt: "That's all, thank you!",
      };

  const msgs: ChatMsg[] = [];
  const add = (text: string, opts?: ChatMsg['options'], inputType?: ChatMsg['inputType']) =>
    msgs.push({ id: `${step}-${msgs.length}`, role: 'bot', text, options: opts, inputType });

  const programChoices = PROGRAMS.map((p) => ({
    label: lang === 'es' ? p.titleEs : p.title,
    value: p.id,
    icon: '✨',
  }));
  const volunteerChoices = VOLUNTEER_OPTIONS.map((v) => ({
    label: lang === 'es' ? v.titleEs : v.title,
    value: v.id,
    icon: v.icon,
  }));

  switch (step) {
    case 'welcome':
      add(t.welcome, undefined, 'text');
      break;
    case 'interest':
      add(t.interest, t.interests);
      break;
    case 'program':
      add(t.program, programChoices);
      break;
    case 'donation_tier':
      add(t.donation,
        DONATION_TIERS.map((tier) => ({
          label: `$${tier.amount.toLocaleString()} — ${lang === 'es' ? tier.labelEs : tier.label}`,
          value: String(tier.amount),
          icon: tier.icon,
        })));
      break;
    case 'volunteer_type':
      add(t.volunteer, volunteerChoices);
      break;
    case 'volunteer_items':
      add(t.volunteer_items, undefined, 'email');
      break;
    case 'corporate_check':
      add(t.corporate, t.corporateOpts);
      break;
    case 'inkind':
      add(t.inkind, undefined, 'email');
      break;
    case 'email':
      add(t.email, undefined, 'email');
      break;
    case 'timeline':
      add(t.timeline, t.timelines);
      break;
    case 'follow_up':
      add(t.followup, t.followupOpts);
      break;
    case 'complete':
      add(t.complete);
      break;

    case 'explore_menu':
      add(
        lang === 'es'
          ? `¡Claro, **${state.name}**! 😊 Estás en el lugar correcto. ¿Qué te gustaría explorar?`
          : `Of course, **${state.name}**! 😊 You're in the right place. What would you like to explore first?`,
        lang === 'es'
          ? [
              { label: 'Nuestros programas de salud 🏥', value: 'programs_overview', icon: '🏥' },
              { label: 'Niveles de donación e impacto 💰', value: 'tiers_overview', icon: '💰' },
              { label: 'Oportunidades de voluntariado 🤝', value: 'volunteer_overview', icon: '🤝' },
              { label: 'Cómo se usan las donaciones 📊', value: 'usage', icon: '📊' },
              { label: 'Quiero hacer una donación 💛', value: 'give', icon: '💛' },
            ]
          : [
              { label: 'Our Healthcare Programs 🏥', value: 'programs_overview', icon: '🏥' },
              { label: 'Donation Levels & Impact 💰', value: 'tiers_overview', icon: '💰' },
              { label: 'Volunteer Opportunities 🤝', value: 'volunteer_overview', icon: '🤝' },
              { label: 'How donations are used 📊', value: 'usage', icon: '📊' },
              { label: "I'm ready to give 💛", value: 'give', icon: '💛' },
            ]
      );
      break;

    case 'programs_overview':
      msgs.push({
        id: `programs_overview-0`,
        role: 'bot',
        text: lang === 'es'
          ? '🏥 **Programas de PediPlace**\n\nAtendemos a niños sin seguro en Denton y Lewisville, TX a través de 8 programas especializados. Cada programa está diseñado para llenar un vacío crítico en la atención médica infantil:'
          : '🏥 **PediPlace Programs**\n\nWe serve uninsured children in Denton & Lewisville, TX through 8 specialized programs. Each is designed to fill a critical gap in pediatric care:',
        cards: 'programs',
        options: lang === 'es'
          ? [
              { label: 'Apoyar un programa 💝', value: 'support_program', icon: '💝' },
              { label: 'Ver niveles de donación 💰', value: 'tiers_overview', icon: '💰' },
              { label: 'Ver voluntariado 🤝', value: 'volunteer_overview', icon: '🤝' },
            ]
          : [
              { label: 'Support a program 💝', value: 'support_program', icon: '💝' },
              { label: 'See donation levels 💰', value: 'tiers_overview', icon: '💰' },
              { label: 'See volunteer opportunities 🤝', value: 'volunteer_overview', icon: '🤝' },
            ],
      });
      break;

    case 'tiers_overview':
      msgs.push({
        id: `tiers_overview-0`,
        role: 'bot',
        text: lang === 'es'
          ? '💰 **Niveles de donación — Tu regalo, su impacto**\n\nEl 100% de cada donación va directamente a la atención del paciente. Así es exactamente cómo tu regalo marca la diferencia:'
          : '💰 **Giving Levels — Your Gift, Their Impact**\n\n100% of every gift goes directly to patient care. Here\'s exactly how your donation makes a difference:',
        cards: 'tiers',
        options: lang === 'es'
          ? [
              { label: '¡Listo para donar! 💛', value: 'give', icon: '💛' },
              { label: 'Ver programas primero 🏥', value: 'programs_overview', icon: '🏥' },
              { label: 'Ver voluntariado 🤝', value: 'volunteer_overview', icon: '🤝' },
            ]
          : [
              { label: "I'm ready to give! 💛", value: 'give', icon: '💛' },
              { label: 'See programs first 🏥', value: 'programs_overview', icon: '🏥' },
              { label: 'See volunteer opportunities 🤝', value: 'volunteer_overview', icon: '🤝' },
            ],
      });
      break;

    case 'volunteer_overview':
      msgs.push({
        id: `volunteer_overview-0`,
        role: 'bot',
        text: lang === 'es'
          ? '🤝 **Oportunidades de Voluntariado**\n\nLos voluntarios son el corazón de PediPlace. Aquí hay varias formas de involucrarse:\n\n⚠️ **Importante:** Todas las donaciones de artículos deben venir ya ensambladas.\n📍 Entrega: 502 S. Old Orchard Lane, #126, Lewisville TX\n🕐 Lun–Vie: 9am–12pm y 2pm–4pm'
          : '🤝 **Volunteer Opportunities**\n\nVolunteers are the heart of PediPlace. Here are the ways you can get involved:\n\n⚠️ **Important:** All item donations must come already assembled.\n📍 Drop-off: 502 S. Old Orchard Lane, #126, Lewisville TX\n🕐 Mon–Fri: 9am–12pm & 2pm–4pm',
        cards: 'volunteer',
        options: lang === 'es'
          ? [
              { label: 'Quiero ser voluntario 🤝', value: 'start_volunteer', icon: '🤝' },
              { label: 'Apoyar financieramente 💛', value: 'give', icon: '💛' },
              { label: 'Ver nuestros programas 🏥', value: 'programs_overview', icon: '🏥' },
            ]
          : [
              { label: "I'd like to volunteer 🤝", value: 'start_volunteer', icon: '🤝' },
              { label: 'Support financially instead 💛', value: 'give', icon: '💛' },
              { label: 'See our programs 🏥', value: 'programs_overview', icon: '🏥' },
            ],
      });
      break;
  }
  return msgs;
}

/* ────────────────────────────────────────────────────
   SMART SCAN CONFIG
──────────────────────────────────────────────────── */

const NTEE_LABELS: Record<string, string> = {
  E: 'Health', F: 'Mental Health', P: 'Human Services', B: 'Education',
  Q: 'International', T: 'Philanthropy', W: 'Public Benefit', C: 'Environment',
  A: 'Arts', G: 'Disease-Specific', H: 'Medical Research', L: 'Housing',
};

function scoreOrg(org: ProPublicaOrg): { score: number; reasons: string[]; badge: string } {
  const name = (org.name || '').toLowerCase();
  const ntee = (org.ntee_code || '').toUpperCase();
  const city = (org.city || '').toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (/child|pediatr|kid|baby|infant|youth|newborn|toddler/.test(name)) { score += 4; reasons.push('Serves children'); }
  if (/health|medical|clinic|hospital|care|wellness|nurse|doctor/.test(name)) { score += 3; reasons.push('Healthcare focus'); }
  if (/mental|counsel|therapy|behavioral|psychology/.test(name)) { score += 2; reasons.push('Mental health'); }
  if (/vaccin|immuniz|prevent/.test(name)) { score += 2; reasons.push('Prevention/vaccines'); }
  if (/uninsur|underserv|low.income|poverty|at.risk/.test(name)) { score += 3; reasons.push('Serves underserved'); }

  const localCities = ['dallas', 'denton', 'lewisville', 'plano', 'frisco', 'fort worth', 'arlington', 'mckinney', 'garland', 'irving', 'carrollton', 'allen', 'flower mound', 'highland village'];
  if (localCities.some((c) => city.includes(c))) { score += 5; reasons.push(`${org.city} — local`); }
  else if (org.state === 'TX') { score += 2; reasons.push('Texas-based'); }

  if (/foundation|fund|trust|giving|charitable|philanthrop/.test(name)) { score += 2; reasons.push('Funding organization'); }
  if (/community/.test(name)) { score += 1; reasons.push('Community org'); }

  if (ntee && ['E', 'F', 'P', 'H', 'G'].includes(ntee[0])) {
    score += 3;
    reasons.push(`NTEE ${ntee[0]}: ${NTEE_LABELS[ntee[0]] || 'Health-related'}`);
  }

  if (org.asset_amount > 5_000_000) { score += 2; reasons.push('Large assets'); }
  else if (org.asset_amount > 500_000) { score += 1; reasons.push('Mid-size org'); }

  const badge = score >= 10 ? 'Top Match' : score >= 7 ? 'Strong Match' : score >= 4 ? 'Potential Match' : 'Low Match';
  return { score, reasons, badge };
}

/* ────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────── */
export default function DonorDiscovery({
  publicMode = false, darkMode = false, onToggleDark, onLoginClick,
}: DonorDiscoveryProps) {
  const [mainTab, setMainTab] = useState<'bot' | 'discover'>(publicMode ? 'bot' : 'discover');
  const [lang, setLang] = useState<Lang>('en');
  const t = useTranslation(lang);

  /* ── Secret logo tap counter ── */
  const [logoTaps, setLogoTaps] = useState(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (next >= 5) {
      setLogoTaps(0);
      onLoginClick?.();
    } else {
      logoTapTimer.current = setTimeout(() => setLogoTaps(0), 3000);
    }
  };

  /* ── Bot state ── */
  const [botStep, setBotStep] = useState<BotStep>('welcome');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [botState, setBotState] = useState({ name: '', email: '', interest: '', program: '', donationAmount: '', timeline: '', volunteerType: '' });
  const [textInput, setTextInput] = useState('');
  const [botLeads, setBotLeads] = useState<BotLead[]>(getStoredLeads());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const irsEmailStepRef = useRef<HTMLDivElement>(null);

  /* ── Discover state ── */
  const [discoverTab, setDiscoverTab] = useState<'curated' | 'irs'>('curated');
  const [curatedSearch, setCuratedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showFilters, setShowFilters] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([]);
  const [emailModal, setEmailModal] = useState<EmailModal>({ open: false, funder: null, loading: false, content: '', copied: false });
  /* ── Curated inline email (Step 2 below cards) ── */
  const [curatedEmailFunder, setCuratedEmailFunder] = useState<CuratedFunder | null>(null);
  const [curatedEmailContent, setCuratedEmailContent] = useState('');
  const [curatedEmailLoading, setCuratedEmailLoading] = useState(false);
  const [curatedEmailCopied, setCuratedEmailCopied] = useState(false);
  const curatedEmailRef = useRef<HTMLDivElement>(null);
  const [irsQuery, setIrsQuery] = useState('');
  const [irsResults, setIrsResults] = useState<ProPublicaOrg[]>([]);
  const [irsLoading, setIrsLoading] = useState(false);
  const [irsError, setIrsError] = useState('');
  const [irsSearched, setIrsSearched] = useState(false);

  /* ── Smart scan ── */

  /* ── IRS advanced filters ── */
  const [irsStateFilter, setIrsStateFilter] = useState('TX');
  const [irsNTEEFilter, setIrsNTEEFilter] = useState('');
  const [irsTypeFilter, setIrsTypeFilter] = useState('All Types');

  /* ── IRS pagination ── */
  const [irsPage, setIrsPage] = useState(1);
  const [irsTotalPages, setIrsTotalPages] = useState(0);
  const [irsTotalResults, setIrsTotalResults] = useState(0);
  const [irsLastQuery, setIrsLastQuery] = useState({ q: '', state: 'TX', ntee: '', type: 'All Types' });

  /* ── IRS pipeline (Step 3) ── */
  const [irsPipeline, setIrsPipeline] = useState<IRSPipelineEntry[]>([]);
  const [selectedOrgForEmail, setSelectedOrgForEmail] = useState<(ProPublicaOrg & { relevanceScore?: number }) | null>(null);
  const [irsEmailContent, setIrsEmailContent] = useState('');
  const [irsEmailLoading, setIrsEmailLoading] = useState(false);
  const [irsEmailCopied, setIrsEmailCopied] = useState(false);

  /* ── Init bot ── */
  useEffect(() => {
    const init = buildBotMessages('welcome', botState, lang);
    setMessages(init);
  }, []);

  /* ── Re-init bot on language change ── */
  useEffect(() => {
    resetBot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Bot: add user message and advance step ── */
  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', text },
    ]);
  };

  const addBotMessages = (step: BotStep, state: typeof botState) => {
    const next = buildBotMessages(step, state, lang);
    setTimeout(() => {
      setMessages((prev) => [...prev, ...next]);
    }, 500);
  };

  // ID of the last bot message — used to disable buttons on old messages
  const lastBotMsgId = useMemo(
    () => [...messages].reverse().find(m => m.role === 'bot')?.id,
    [messages],
  );

  const handleOption = (value: string, label: string) => {
    addUserMessage(label);
    const ns = { ...botState };

    if (botStep === 'welcome') {
      ns.name = textInput || label;
      setBotState(ns);
      setBotStep('interest');
      addBotMessages('interest', ns);
      return;
    }

    if (botStep === 'interest') {
      ns.interest = value;
      setBotState(ns);
      if (value === 'donation') {
        setBotStep('program');
        addBotMessages('program', ns);
      } else if (value === 'explore') {
        setBotStep('explore_menu');
        addBotMessages('explore_menu', ns);
      } else if (value === 'corporate') {
        setBotStep('corporate_check');
        addBotMessages('corporate_check', ns);
      } else if (value === 'volunteer') {
        setBotStep('volunteer_type');
        addBotMessages('volunteer_type', ns);
      } else if (value === 'inkind') {
        setBotStep('inkind');
        addBotMessages('inkind', ns);
      }
      return;
    }

    // Explore menu routing
    if (botStep === 'explore_menu' || botStep === 'programs_overview' || botStep === 'tiers_overview' || botStep === 'volunteer_overview') {
      if (value === 'programs_overview') {
        setBotStep('programs_overview');
        addBotMessages('programs_overview', ns);
      } else if (value === 'tiers_overview') {
        setBotStep('tiers_overview');
        addBotMessages('tiers_overview', ns);
      } else if (value === 'volunteer_overview') {
        setBotStep('volunteer_overview');
        addBotMessages('volunteer_overview', ns);
      } else if (value === 'support_program' || value === 'give') {
        // Route to donation flow
        ns.interest = 'donation';
        setBotState(ns);
        setBotStep('program');
        addBotMessages('program', ns);
      } else if (value === 'start_volunteer') {
        ns.interest = 'volunteer';
        setBotState(ns);
        setBotStep('volunteer_type');
        addBotMessages('volunteer_type', ns);
      } else if (value === 'usage') {
        const usageMsg = lang === 'es'
          ? 'El **100%** de cada donación va directamente a la atención del paciente — cero gastos generales. Cada año compartimos un informe detallado del impacto con todos nuestros donantes.\n\n¿Te gustaría apoyar a PediPlace?'
          : '**100%** of every donation goes directly to patient care — zero overhead taken from gifts. Every year we share a detailed impact report with all donors.\n\nWould you like to support PediPlace?';
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: `usage-answer-${Date.now()}`,
            role: 'bot' as const,
            text: usageMsg,
            options: lang === 'es'
              ? [{ label: '¡Sí, quiero donar! 💛', value: 'give', icon: '💛' }, { label: 'Ver más opciones 🔍', value: 'back_explore', icon: '🔍' }]
              : [{ label: "Yes, I'd like to give! 💛", value: 'give', icon: '💛' }, { label: 'See more options 🔍', value: 'back_explore', icon: '🔍' }],
          }]);
        }, 500);
        setBotStep('explore_menu');
      } else if (value === 'back_explore') {
        setBotStep('explore_menu');
        addBotMessages('explore_menu', ns);
      }
      return;
    }

    if (botStep === 'program') {
      ns.program = value;
      setBotState(ns);
      setBotStep('donation_tier');
      addBotMessages('donation_tier', ns);
      return;
    }

    if (botStep === 'donation_tier') {
      ns.donationAmount = value;
      setBotState(ns);
      setBotStep('email');
      addBotMessages('email', ns);
      return;
    }

    if (botStep === 'volunteer_type') {
      ns.volunteerType = value;
      ns.interest = value;
      setBotState(ns);
      setBotStep('volunteer_items');
      addBotMessages('volunteer_items', ns);
      return;
    }

    if (botStep === 'corporate_check') {
      ns.program = label;
      setBotState(ns);
      setBotStep('email');
      addBotMessages('email', ns);
      return;
    }

    if (botStep === 'timeline') {
      ns.timeline = label;
      setBotState(ns);
      setBotStep('follow_up');
      addBotMessages('follow_up', ns);
      return;
    }

    if (botStep === 'follow_up') {
      // "That's all, thank you!" — finish the bot immediately
      if (value === 'done') {
        finishBot(ns);
        return;
      }

      // Answer a follow-up question and loop back
      // Note: addUserMessage(label) already called at the top of handleOption — do NOT call it again
      const answers: Record<string, string> = lang === 'es'
        ? { usage: 'El 100% de tu donación va directamente a la atención del paciente.', tax: '¡Sí! PediPlace es una organización 501(c)(3) registrada.', school: 'Tenemos clínicas dentro de la Escuela Primaria Central (LISD) y la Escuela Secundaria Fred Moore (DISD).', matching: '¡Muchos empleadores igualan tu donación!', none: '¡No hay problema! Te enviaremos todo lo que necesitas.' }
        : { usage: "100% of your donation goes directly to patient care — we break it down in our annual report.", tax: "Yes! PediPlace is a registered 501(c)(3). Your receipt will be emailed within 24 hours.", school: "We have clinics inside Central Elementary (LISD) and Fred Moore High School (DISD).", matching: "Many employers will match your donation! Ask your HR department for a matching gift form.", none: "No problem! We'll send you everything you need via email." };
      const resp = answers[value] || (lang === 'es' ? 'Incluiremos esa información en tu correo.' : "We'll include that information in your follow-up email!");
      const moreQ = lang === 'es' ? '¿Alguna otra pregunta?' : 'Any other questions?';
      const doneLabel = lang === 'es' ? '¡Eso es todo, gracias!' : "That's all, thank you!";
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: `bot-followup-${Date.now()}`, role: 'bot',
          text: `${resp}\n\n${moreQ}`,
          options: [{ label: doneLabel, value: 'done', icon: '✅' }],
        }]);
      }, 500);
      return;
    }

    // Complete — also catches 'done' clicks that come from non-follow_up steps
    if (value === 'done' || botStep === 'complete') {
      finishBot(ns);
      return;
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    const val = textInput.trim();
    setTextInput('');
    addUserMessage(val);
    const ns = { ...botState };

    if (botStep === 'welcome') {
      ns.name = val;
      setBotState(ns);
      setBotStep('interest');
      addBotMessages('interest', ns);
    } else if (botStep === 'email' || botStep === 'inkind' || botStep === 'volunteer_items') {
      ns.email = val;
      setBotState(ns);
      if (botState.interest === 'volunteer' || botState.interest === 'inkind' || botStep === 'inkind' || botStep === 'volunteer_items') {
        finishBot(ns);
      } else {
        setBotStep('timeline');
        addBotMessages('timeline', ns);
      }
    }
  };

  const finishBot = (ns: typeof botState) => {
    setBotStep('complete');
    const lead: BotLead = {
      id: `lead-${Date.now()}`,
      timestamp: new Date().toISOString(),
      name: ns.name,
      email: ns.email,
      interest: ns.interest,
      program: ns.program,
      donationAmount: ns.donationAmount,
      timeline: ns.timeline,
      volunteerType: ns.volunteerType,
      notes: '',
    };
    saveLead(lead);
    setBotLeads(getStoredLeads());
    addBotMessages('complete', ns);

    // Fire-and-forget emails — won't break chat if they fail
    if (ns.email) {
      const emailParams = {
        toName:         ns.name,
        toEmail:        ns.email,
        interest:       ns.interest,
        program:        ns.program,
        donationAmount: ns.donationAmount,
      };
      sendThankYouEmail(emailParams);          // thank-you to the donor
      sendAdminLeadNotification(emailParams);  // new lead alert to PediPlace admin
    }
  };

  const resetBot = () => {
    const empty = { name: '', email: '', interest: '', program: '', donationAmount: '', timeline: '', volunteerType: '' };
    setBotStep('welcome');
    setBotState(empty);
    setTextInput('');
    setMessages(buildBotMessages('welcome', empty, lang));
  };

  /* ── Discover: IRS search ── */

  /* ── Core IRS fetch — proxied through /api/propublica to avoid CORS ── */
  const fetchIRS = async (q: string, state: string, ntee: string, type: string, page: number) => {
    const effectiveQuery = q.trim() || 'health';
    setIrsLoading(true);
    setIrsError('');
    setIrsSearched(true);
    try {
      // Routed through Vite proxy (dev) or Netlify redirect (prod) to avoid CORS
      // Brackets in state[id] / ntee[id] must be URL-encoded per ProPublica docs
      let url = `/api/propublica/search.json?q=${encodeURIComponent(effectiveQuery)}&page=${page - 1}`;
      if (state) url += `&state%5Bid%5D=${encodeURIComponent(state)}`;
      if (ntee)  url += `&ntee%5Bid%5D=${encodeURIComponent(ntee)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Normalise API fields: API returns `subseccd` and numeric `ein`
      let orgs: ProPublicaOrg[] = (data.organizations || []).map((o: any) => ({
        ein: String(o.ein),
        name: o.name || '',
        city: o.city || '',
        state: o.state || '',
        ntee_code: o.ntee_code || '',
        subsection_code: o.subseccd ?? 0,
        asset_amount: o.asset_amount ?? 0,
        income_amount: o.income_amount ?? 0,
        revenue_amount: o.revenue_amount ?? 0,
      }));

      // Client-side type filter (ProPublica has no type param, use subsection_code + name heuristic)
      if (type !== 'All Types') {
        orgs = orgs.filter((o) => {
          const name = o.name.toLowerCase();
          const code = o.subsection_code ?? 0;
          if (type === 'Foundations') return code === 3 && /foundation|fund|trust|endow/.test(name);
          if (type === 'Corporate') return /corporate|corp\b|inc\b|company/.test(name);
          if (type === 'Government') return /government|gov\b|county|city of |dept\b/.test(name);
          if (type === 'Community') return /community|united way|neighborhood|coalition/.test(name);
          return true;
        });
      }

      const total = data.total_results ?? orgs.length;
      const numPages = data.num_pages ?? Math.ceil(total / 25);
      setIrsTotalResults(total);
      setIrsTotalPages(numPages);
      setIrsPage(page);
      setIrsResults(orgs);
      setIrsLastQuery({ q: effectiveQuery, state, ntee, type });

      if (orgs.length === 0) {
        setIrsError(`No results for "${effectiveQuery}"${state ? ` in ${state}` : ''}. Try a broader keyword or remove filters.`);
      }
    } catch (err: any) {
      setIrsError(`Could not reach IRS database. ProPublica API error: ${err?.message || 'Network error'}. Please check your connection.`);
    }
    setIrsLoading(false);
  };

  const searchIRSWithFilters = (overrideQuery?: string) => {
    const q = overrideQuery ?? irsQuery;
    fetchIRS(q, irsStateFilter, irsNTEEFilter, irsTypeFilter, 1);
  };

  const goToIRSPage = (page: number) => {
    fetchIRS(irsLastQuery.q, irsLastQuery.state, irsLastQuery.ntee, irsLastQuery.type, page);
    irsEmailStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto-search on first render
  const irsAutoSearched = React.useRef(false);
  React.useEffect(() => {
    if (!irsAutoSearched.current) {
      irsAutoSearched.current = true;
      fetchIRS('pediatric health children', 'TX', '', 'All Types', 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Add org to IRS pipeline ── */
  const addToIRSPipeline = (org: ProPublicaOrg & { relevanceScore?: number; matchBadge?: string }) => {
    if (irsPipeline.some((p) => p.org.ein === org.ein)) return;
    setIrsPipeline((prev) => [
      ...prev,
      { id: `ipl-${Date.now()}`, org, status: 'new', notes: '', addedAt: new Date().toISOString() },
    ]);
  };

  const inIRSPipeline = (ein: string) => irsPipeline.some((p) => p.org.ein === ein);

  const updateIRSPipelineStatus = (id: string, status: IRSPipelineEntry['status']) =>
    setIrsPipeline((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));

  const updateIRSPipelineNotes = (id: string, notes: string) =>
    setIrsPipeline((prev) => prev.map((p) => p.id === id ? { ...p, notes } : p));

  const removeFromIRSPipeline = (id: string) =>
    setIrsPipeline((prev) => prev.filter((p) => p.id !== id));

  const exportIRSPipelineCSV = () => {
    const h = ['Organization', 'EIN', 'City', 'State', 'NTEE', 'Assets', 'Income', 'Score', 'Status', 'Notes', 'Date Added'];
    const rows = irsPipeline.map((p) => [
      `"${p.org.name}"`, p.org.ein, p.org.city, p.org.state,
      p.org.ntee_code, p.org.asset_amount, p.org.income_amount,
      p.org.relevanceScore || '', p.status, `"${p.notes}"`,
      new Date(p.addedAt).toLocaleDateString(),
    ]);
    const csv = [h, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'irs_pipeline.csv'; a.click();
  };

  /* ── Generate email for IRS org ── */
  const generateEmailForOrg = async (org: ProPublicaOrg) => {
    setSelectedOrgForEmail(org);
    setIrsEmailLoading(true);
    setIrsEmailContent('');
    const nteeCode = org.ntee_code ? org.ntee_code.charAt(0).toUpperCase() : '';
    const nteeDesc = NTEE_DESCRIPTIONS[nteeCode] || 'community benefit';
    const incomeStr = org.income_amount > 0 ? `$${(org.income_amount / 1_000_000).toFixed(1)}M annual income` : null;
    const assetStr = org.asset_amount > 0 ? `$${(org.asset_amount / 1_000_000).toFixed(1)}M in assets` : null;
    const financialScale = [incomeStr, assetStr].filter(Boolean).join(' and ');
    const location = [org.city, org.state].filter(Boolean).join(', ') || 'Texas';

    const prompt = `Write a professional grant outreach email from PediPlace to ${org.name}.

ABOUT THE PROSPECT:
- Organization: ${org.name}
- Location: ${location}
- Mission focus: ${nteeDesc} (NTEE code: ${org.ntee_code || 'N/A'})
${financialScale ? `- Financial scale: ${financialScale}` : ''}
- IRS EIN: ${org.ein}

ABOUT PEDIPLACE (the sender):
- Pediatric healthcare nonprofit in Denton/Lewisville, TX
- Serves uninsured and underinsured children 0–18 across Dallas & Denton County
- Programs: Preventive Care, Vaccinations, Mental Health (LPC counselors), School Clinics (LISD & DISD), Healthy Babies (0–15 months), Reach Out and Read (literacy), Family Care Fund
- Total raised: $542,233 from 97 donors

INSTRUCTIONS:
Write 3 focused paragraphs:
1. Open with why PediPlace is specifically reaching out to THIS organization — reference their mission focus (${nteeDesc}) and their scale/location
2. Explain PediPlace's impact numbers and how programs align with the prospect's work
3. Make a clear, confident ask for $10,000–$100,000 in partnership, with a call to action (brief call or email)

Format:
Subject: [subject line]

[3 paragraphs]

[Signature block with name placeholder, title, PediPlace contact info]

Keep it under 300 words. Tone: professional, warm, specific — not generic.`;

    // Scroll to email step immediately so user sees generation happening
    setTimeout(() => irsEmailStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    try {
      const reply = await sendChatMessage(prompt, [], '');
      setIrsEmailContent(reply);
    } catch {
      const fallbackMission = nteeDesc || 'community health and human services';
      setIrsEmailContent(
`Subject: Partnership Opportunity — PediPlace x ${org.name}

Dear ${org.name} Team,

I'm writing on behalf of PediPlace, a pediatric healthcare nonprofit serving uninsured children in Denton and Lewisville, Texas. We came across your organization's impactful work in ${fallbackMission}${financialScale ? ` — and your scale (${financialScale}) suggests an organization with the capacity and vision to make a meaningful difference` : ''} — and believe there is a natural alignment with our shared mission.

PediPlace provides preventive care, vaccinations, mental health counseling, school-based clinics in LISD and DISD, our Healthy Babies program (ages 0–15 months), and the Reach Out and Read literacy initiative. To date, we have raised $542,233 from 97 donors and served hundreds of children who would otherwise have no access to quality healthcare.

We would welcome the opportunity to discuss a partnership in the range of $10,000–$100,000. Even a modest grant would fund dozens of well-child visits for children who have never seen a doctor. Could we schedule a 20-minute call at your convenience?

Thank you for your time and for the work you do.

Warm regards,
[Your Name]
[Your Title]
PediPlace | 972-436-7962
502 S. Old Orchard Lane, #126, Lewisville, TX 75067
www.pediplace.org`
      );
    }
    setIrsEmailLoading(false);
  };

  /* ── Email generation ── */
  const generateEmail = async (funder: CuratedFunder) => {
    setCuratedEmailFunder(funder);
    setCuratedEmailLoading(true);
    setCuratedEmailContent('');
    setCuratedEmailCopied(false);
    // Scroll to Step 2 panel
    setTimeout(() => curatedEmailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    const prompt = `Write a professional grant inquiry email from PediPlace (a pediatric healthcare nonprofit in Denton/Lewisville, TX serving uninsured children) to ${funder.name}.

PediPlace programs: Preventive Care, Healthy Babies, Chronic Illness (asthma, ADHD), Mental Health (Licensed Professional Counselors), School Clinic Initiative (LISD & DISD), Reach Out and Read (literacy), Family Care Fund.
Total raised: $542,233 from 97 donors.

Funder: ${funder.name} — ${funder.location}
Focus areas: ${funder.tags.join(', ')}
Grant range: ${funder.grantRange}
Why matched: ${funder.matchReason}
Average grant: ${funder.avgGrant}

Write a compelling 3-paragraph professional email:
1. Introduction explaining why we specifically chose them (reference their focus: ${funder.tags.slice(0, 2).join(', ')})
2. PediPlace's impact and the specific program match
3. Clear funding ask in the range of ${funder.grantRange} + next step (call / letter of inquiry)

Add a subject line at the top. Under 300 words. Warm but professional.
End with: With gratitude,\n[Your Name]\nPediPlace | [Phone] | [Email] | pediplace.org`;

    try {
      const reply = await sendChatMessage(prompt, [], '');
      setCuratedEmailContent(reply);
    } catch {
      setCuratedEmailContent(
`Subject: Partnership Inquiry — PediPlace x ${funder.name}

Dear ${funder.name} Grants Team,

I am reaching out on behalf of PediPlace, a pediatric healthcare nonprofit serving uninsured children in Denton and Lewisville, Texas. Your foundation's commitment to ${funder.tags.slice(0, 2).join(' and ')} aligns deeply with our mission.

PediPlace operates preventive care clinics, school-based health centers, mental health services, and a Healthy Babies program for children ages 3 days to 15 months. Over the past three years, we have raised $542,233 from 97 donors and served hundreds of uninsured children in Denton County. ${funder.matchReason}

We are respectfully requesting a grant in the range of ${funder.grantRange} to expand our access-to-care programs. I would welcome the opportunity to share our latest impact report and discuss a partnership. Would you have 20 minutes for an introductory call?

Thank you for your dedication to children's health.

With gratitude,
[Your Name]
PediPlace | [Phone] | [Email] | pediplace.org`
      );
    }
    setCuratedEmailLoading(false);
  };

  /* ── Filtered curated ── */
  const filteredCurated = curatedFunders.filter((f) => {
    const q = curatedSearch.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)) || f.location.toLowerCase().includes(q);
    const matchType = typeFilter === 'All Types' || f.type === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  const pipelineCount = pipeline.filter((p) => p.pipelineStatus === 'pipeline').length;
  const contactedCount = pipeline.filter((p) => p.pipelineStatus === 'contacted').length;
  const inPipeline = (id: string) => pipeline.some((p) => p.id === id);
  const addToPipeline = (f: CuratedFunder) => { if (!inPipeline(f.id)) setPipeline((p) => [...p, { ...f, pipelineStatus: 'pipeline' }]); };

  const exportCSV = () => {
    const h = ['Name', 'Email', 'Interest', 'Program', 'Amount', 'Timeline', 'Date'];
    const rows = botLeads.map((l) => [l.name, l.email, l.interest, l.program, l.donationAmount, l.timeline, new Date(l.timestamp).toLocaleDateString()]);
    const csv = [h, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'pediplace_donor_leads.csv'; a.click();
  };

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors">

      {/* ═══ PUBLIC HEADER ═══ */}
      {publicMode && (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
          <div className="px-6 py-3.5 flex items-center justify-between max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-3">
              {/* Secret 5-tap logo to open staff login */}
              <button
                onClick={handleLogoClick}
                className="select-none focus:outline-none relative flex items-center"
                title=""
              >
                <img src="/pediplace-logo.png" alt="PediPlace" className="h-10 w-auto" />
                {logoTaps > 0 && logoTaps < 5 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {5 - logoTaps}
                  </span>
                )}
              </button>
              <div>
                <span className="hidden sm:inline text-sm font-semibold text-gray-500 dark:text-slate-400">{t.tagline}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> {t.realIRS}
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded-full">{t.nonprofits}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* EN / ESP language toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl p-0.5 border border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('es')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${lang === 'es' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
                >
                  ESP
                </button>
              </div>
              {onToggleDark && (
                <button onClick={onToggleDark} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-all">
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ═══ STATS BAR ═══ */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          {[
            { label: t.statLeads, value: botLeads.length, color: 'text-violet-600 dark:text-violet-400' },
            { label: t.statPipeline, value: pipelineCount, color: 'text-blue-600 dark:text-blue-400' },
            { label: t.statContacted, value: contactedCount, color: 'text-amber-600 dark:text-amber-400' },
            { label: t.statDonors, value: botLeads.filter((l) => l.donationAmount).length, color: 'text-emerald-600 dark:text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="text-center flex-1 border-r last:border-r-0 border-gray-100 dark:border-slate-800">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-600 tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
          <div className="flex items-center gap-2 pl-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> {t.exportLeads}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN TABS ═══ */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {([
            { id: 'bot', label: t.tabBot, icon: <Bot className="w-4 h-4" />, adminOnly: false },
            { id: 'discover', label: t.tabDiscover, icon: <Search className="w-4 h-4" />, adminOnly: false },
          ] as const).filter((tab) => publicMode || tab.id !== 'bot').map((tab) => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 transition-colors ${mainTab === tab.id ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">

        {/* ──────── DONOR BOT TAB ──────── */}
        {mainTab === 'bot' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Chat panel */}
            <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden" style={{ height: '680px' }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                    <img src="/pediplace-logo.png" alt="PediPlace" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.chatTitle}</p>
                    <p className="text-[11px] text-blue-100">{t.chatSubtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-blue-100">{t.chatOnline}</span>
                  <button onClick={resetBot} title="Start over" className="ml-2 text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 bg-white border border-gray-200 dark:border-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 overflow-hidden shadow-sm">
                        <img src="/pediplace-logo.png" alt="PediBot" className="w-full h-full object-contain p-0.5" />
                      </div>
                    )}
                    <div className={`max-w-[82%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      {msg.role === 'bot' ? (
                        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                          <p className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 dark:text-cyan-400 underline">$1</a>') }} />

                          {/* ── Inline Programs Cards ── */}
                          {msg.cards === 'programs' && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                              {PROGRAMS.map((prog) => (
                                <div key={prog.id} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${COLORS[prog.color]}`}>
                                    {prog.icon}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{lang === 'es' && (prog as any).titleEs ? (prog as any).titleEs : prog.title}</p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-500 leading-snug mt-0.5">{lang === 'es' && (prog as any).descriptionEs ? (prog as any).descriptionEs : prog.description}</p>
                                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">💡 {lang === 'es' && (prog as any).statEs ? (prog as any).statEs : prog.stat}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ── Inline Donation Tier Cards ── */}
                          {msg.cards === 'tiers' && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                              {DONATION_TIERS.map((tier) => (
                                <div key={tier.amount} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden">
                                  <div className={`h-1 bg-gradient-to-r ${tier.color}`} />
                                  <div className="px-3 py-2.5 flex items-center gap-3">
                                    <span className="text-xl flex-shrink-0">{tier.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">${tier.amount.toLocaleString()}</span>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 truncate">{lang === 'es' ? tier.labelEs : tier.label}</span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 dark:text-slate-500 leading-snug">{lang === 'es' ? tier.impactEs : tier.impact}</p>
                                    </div>
                                    <span className="text-[10px] font-semibold bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full flex-shrink-0">{tier.program}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ── Inline Volunteer Cards ── */}
                          {msg.cards === 'volunteer' && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                              {VOLUNTEER_OPTIONS.map((vol) => (
                                <div key={vol.id} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-lg">{vol.icon}</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{lang === 'es' && vol.titleEs ? vol.titleEs : vol.title}</p>
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-slate-500 leading-snug mb-1.5">{lang === 'es' && vol.descriptionEs ? vol.descriptionEs : vol.description}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {(lang === 'es' && vol.itemsEs ? vol.itemsEs : vol.items).slice(0, 4).map((item, i) => (
                                      <span key={i} className="text-[10px] bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                                        {item.includes('@') ? item : `✓ ${item}`}
                                      </span>
                                    ))}
                                    {(lang === 'es' && vol.itemsEs ? vol.itemsEs : vol.items).length > 4 && (
                                      <span className="text-[10px] text-gray-400 dark:text-slate-600 px-1">+{(lang === 'es' && vol.itemsEs ? vol.itemsEs : vol.items).length - 4} more</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.options && msg.options.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.options.map((opt) => (
                                <button key={opt.value}
                                  onClick={() => handleOption(opt.value, opt.label)}
                                  disabled={botStep === 'complete' || msg.id !== lastBotMsgId}
                                  className="text-xs font-semibold bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/40 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                  {opt.icon && <span className="mr-1.5">{opt.icon}</span>}{opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                          {msg.inputType && msg.inputType !== 'none' && botStep !== 'complete' && msg.id === lastBotMsgId && (
                            <div className="mt-3 flex gap-2">
                              <input
                                type={msg.inputType}
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                                placeholder={msg.inputType === 'email' ? 'your@email.com' : 'Type here...'}
                                className="flex-1 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500/60 placeholder-gray-400"
                              />
                              <button onClick={handleTextSubmit} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl rounded-br-sm px-4 py-2.5">
                          <p className="text-sm text-white">{msg.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              {botStep !== 'complete' && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                      placeholder={t.chatPlaceholder}
                      className="flex-1 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500/60 placeholder-gray-400 dark:placeholder-slate-600" />
                    <button onClick={handleTextSubmit} disabled={!textInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shadow-sm">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {botStep === 'complete' && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-xs text-gray-400 dark:text-slate-600">{t.chatComplete}</p>
                  <button onClick={resetBot} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 transition-colors">
                    <Repeat className="w-3.5 h-3.5" /> {t.chatStartNew}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar: Recent leads + quick info */}
            <div className="space-y-4">
              {/* Donate direct */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-blue-200" />
                  <span className="text-sm font-bold">Donate Now</span>
                </div>
                <p className="text-xs text-blue-100 mb-4 leading-relaxed">{t.donateDesc}</p>
                <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-blue-600 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
                  {t.visitSite} <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Contact */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">📍 {t.contactTitle}</p>
                <div className="space-y-2 text-xs text-gray-600 dark:text-slate-400">
                  <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />502 S. Old Orchard Lane, #126, Lewisville, TX 75067</div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /><a href="tel:9724367962" className="hover:text-blue-600 dark:hover:text-cyan-400">972-436-7962</a></div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /><a href="mailto:Cassandra.singleton@pediplace.org" className="hover:text-blue-600 dark:hover:text-cyan-400 text-[11px]">Medical volunteers: Cassandra</a></div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />Mon–Fri 8am–5pm (Tue until 8pm)</div>
                </div>
              </div>

              {/* Recent leads — admin only */}
              {!publicMode && <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t.recentLeads}</p>
                  <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">{botLeads.length} total</span>
                </div>
                {botLeads.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-4">{t.noLeads}</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {botLeads.slice(0, 6).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-b-0">
                        <div>
                          <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{lead.name || 'Anonymous'}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-600">{lead.interest} {lead.donationAmount && !isNaN(Number(lead.donationAmount)) && `· $${Number(lead.donationAmount).toLocaleString()}`}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-slate-600">{new Date(lead.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>}
            </div>
          </div>
        )}

        {/* ──────── DISCOVER FUNDERS TAB ──────── */}
        {mainTab === 'discover' && (
          <>
            {/* Sub-tabs */}
            <div className="flex items-center border-b border-gray-200 dark:border-slate-700 mb-5">
              <button onClick={() => setDiscoverTab('curated')}
                className={`pb-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${discoverTab === 'curated' ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-gray-500 dark:text-slate-500'}`}>
                Top Matched Funders ({curatedFunders.length})
              </button>
              <button onClick={() => setDiscoverTab('irs')}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${discoverTab === 'irs' ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400' : 'border-transparent text-gray-500 dark:text-slate-500'}`}>
                Live IRS Search
              </button>
            </div>

            {discoverTab === 'curated' && (
              <>
                {/* Info banner */}
                <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-bold">Powered by ProPublica IRS 990 + Curated Grant Database</span> — 25 pre-matched top funders for PediPlace's pediatric healthcare mission. Click "Generate Email" to create an AI-written outreach.
                </div>

                {/* Search bar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={curatedSearch} onChange={(e) => setCuratedSearch(e.target.value)}
                      placeholder="Search by name, focus area, location..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:border-blue-400" />
                  </div>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none w-36">
                    {['All Types', 'Foundation', 'Corporate', 'Government', 'Community', 'NGO'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <button onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showFilters ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-blue-500/30' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'}`}>
                    <Filter className="w-4 h-4" /> Filters {showFilters && <X className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Collapsible filters */}
                {showFilters && (
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Min Match Score</p>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 8, 9, 10].map((s) => <button key={s} className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 transition-all">{s === 0 ? 'All' : `${s}/10+`}</button>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Grant Size</p>
                      <div className="flex gap-2 flex-wrap">
                        {['Any', '$10K+', '$50K+', '$100K+'].map((s) => <button key={s} className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 transition-all">{s}</button>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Location</p>
                      <div className="flex gap-2 flex-wrap">
                        {['Any', 'Texas', 'National', 'Local'].map((s) => <button key={s} className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 transition-all">{s}</button>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">Pipeline</p>
                      <div className="flex gap-2 flex-wrap">
                        {['All', 'In Pipeline', 'Not Added'].map((s) => <button key={s} className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 transition-all">{s}</button>)}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 dark:text-slate-600 mb-4">Showing {filteredCurated.length} matched prospects</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {filteredCurated.map((f) => (
                    <FunderCard key={f.id} funder={f} inPipeline={inPipeline(f.id)} onAddPipeline={() => addToPipeline(f)} onGenerateEmail={() => generateEmail(f)} />
                  ))}
                </div>

                {/* ── STEP 2: GENERATE OUTREACH EMAIL (inline, matches reference) ── */}
                <div ref={curatedEmailRef} className="scroll-mt-4">
                  <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-5">
                    <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-5 py-3">
                      <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Step 2 — Generate Outreach Email</p>
                    </div>
                    <div className="p-5">
                      {!curatedEmailFunder && (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                          <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-1 border border-gray-200 dark:border-slate-700">
                            <Bot className="w-6 h-6 text-gray-300 dark:text-slate-600" />
                          </div>
                          <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">Click "Generate Email" on any funder card above</p>
                          <p className="text-xs text-gray-300 dark:text-slate-600">AI will write a personalized outreach email tailored to that funder's mission and grant focus</p>
                        </div>
                      )}

                      {curatedEmailFunder && (
                        <>
                          {/* Funder meta row */}
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mb-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                            {curatedEmailFunder.email && (
                              <p className="text-sm text-gray-700 dark:text-slate-300">
                                <span className="font-bold">To:</span>{' '}
                                <a href={`mailto:${curatedEmailFunder.email}`} className="text-blue-600 dark:text-cyan-400 hover:underline">{curatedEmailFunder.email}</a>
                              </p>
                            )}
                            <p className="text-sm text-gray-700 dark:text-slate-300">
                              <span className="font-bold">Organization:</span> {curatedEmailFunder.name}
                            </p>
                            {curatedEmailFunder.avgGrant && (
                              <p className="text-sm text-gray-700 dark:text-slate-300">
                                <span className="font-bold">Avg Grant:</span> {curatedEmailFunder.avgGrant}
                              </p>
                            )}
                          </div>
                          {curatedEmailFunder.website && (
                            <p className="text-xs text-gray-500 dark:text-slate-500 mb-4">
                              <span className="font-bold">How to Apply:</span>{' '}
                              <a href={curatedEmailFunder.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-cyan-400 hover:underline">{curatedEmailFunder.website.replace(/^https?:\/\//, '')}</a>
                            </p>
                          )}

                          {curatedEmailLoading ? (
                            <div className="flex flex-col items-center gap-3 py-12">
                              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Generating personalized email for <strong>{curatedEmailFunder.name}</strong>…</p>
                            </div>
                          ) : (
                            <>
                              <textarea
                                value={curatedEmailContent}
                                onChange={(e) => setCuratedEmailContent(e.target.value)}
                                rows={14}
                                className="w-full text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-blue-400 leading-relaxed mb-3"
                              />
                              <button
                                onClick={() => { navigator.clipboard.writeText(curatedEmailContent); setCuratedEmailCopied(true); setTimeout(() => setCuratedEmailCopied(false), 2000); }}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:border-blue-400 text-gray-700 dark:text-slate-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors mb-3"
                              >
                                {curatedEmailCopied ? <ClipboardCheck className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                                {curatedEmailCopied ? 'Copied!' : 'Copy Email'}
                              </button>
                              <button
                                onClick={() => addToPipeline(curatedEmailFunder)}
                                disabled={inPipeline(curatedEmailFunder.id)}
                                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl transition-colors mb-2"
                              >
                                {inPipeline(curatedEmailFunder.id)
                                  ? <><CheckCircle className="w-4 h-4" /> Already in Pipeline</>
                                  : <><Plus className="w-4 h-4" /> Add to Pipeline</>}
                              </button>
                              <p className="text-[11px] text-gray-400 dark:text-slate-600 text-center">
                                Replace [Your Name], [Phone], [Email] with real PediPlace details before sending.
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── STEP 3: PROSPECT PIPELINE ── */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-5 py-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Step 3 — Prospect Pipeline</p>
                    {pipeline.length > 0 && (
                      <button
                        onClick={() => {
                          const csv = ['Name,Location,Type,Grant Range,Status,Added'].concat(
                            pipeline.map((p) => `"${p.name}","${p.location}","${p.type}","${p.grantRange}","${p.pipelineStatus}","${p.addedAt}"`)
                          ).join('\n');
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                          a.download = 'pediplace_pipeline.csv';
                          a.click();
                        }}
                        className="text-xs font-semibold border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    {pipeline.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-slate-600 text-center py-8">No prospects in pipeline yet</p>
                    ) : (
                      <div className="space-y-2">
                        {pipeline.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-b-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{entry.name}</p>
                              <p className="text-[11px] text-gray-400 dark:text-slate-600">{entry.location} · {entry.grantRange}</p>
                            </div>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${entry.pipelineStatus === 'donated' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : entry.pipelineStatus === 'contacted' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                              {entry.pipelineStatus}
                            </span>
                            <button onClick={() => generateEmail(entry as unknown as CuratedFunder)} className="text-blue-600 dark:text-cyan-400 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Generate Email">
                              <Bot className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {discoverTab === 'irs' && (
              <>
                {/* IRS header badges */}
                <div className="flex items-center gap-2 justify-end mb-5 flex-wrap">
                  <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1.5 rounded-full flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" /> Real IRS 990 Data
                  </span>
                  <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1.5 rounded-full">
                    2M+ Nonprofits
                  </span>
                  <span className="text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 px-2.5 py-1.5 rounded-full">
                    No API Key Needed
                  </span>
                </div>

                {/* ── SEARCH IRS DATA (3-step) ── */}
                <div className="space-y-6">

                    {/* ── STEP 1: SEARCH ── */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">1</span>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Search Real Donor Prospects</h3>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full hidden md:flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> 2M+ Real Nonprofits
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-600 hidden lg:block">Source: IRS Form 990 via ProPublica API</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mb-3 leading-relaxed">
                        Searches <strong>2 million+</strong> real IRS-registered nonprofits from Form 990 filings — updated annually. Data sourced from{' '}
                        <a href="https://projects.propublica.org/nonprofits/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-cyan-400 hover:underline">ProPublica Nonprofit Explorer</a>, the leading free interface to IRS charitable organization data. No API key needed.
                      </p>

                      {/* Search input */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={irsQuery} onChange={(e) => setIrsQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchIRSWithFilters()}
                          placeholder="e.g. hospital, cancer research, children's health, Dallas foundation..."
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-400 text-gray-800 dark:text-slate-200 placeholder-gray-400" />
                      </div>

                      {/* Filter row 1: Type + State */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider block mb-1">Type</label>
                          <select value={irsTypeFilter} onChange={(e) => setIrsTypeFilter(e.target.value)}
                            className="w-full text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-400">
                            {['All Types','Foundations','Corporate','Government','Community'].map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider block mb-1">State</label>
                          <select value={irsStateFilter} onChange={(e) => setIrsStateFilter(e.target.value)}
                            className="w-full text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-400">
                            <option value="">All States</option>
                            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider block mb-1">Category</label>
                          <select value={irsNTEEFilter} onChange={(e) => setIrsNTEEFilter(e.target.value)}
                            className="w-full text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-400">
                            {NTEE_CATEGORIES.map((c) => <option key={c.label} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button onClick={searchIRSWithFilters} disabled={irsLoading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                            {irsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {irsLoading ? 'Searching...' : 'Search IRS Data'}
                          </button>
                        </div>
                      </div>

                      {/* Quick search pills — always shown so users can jump straight to relevant queries */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[11px] text-gray-400 dark:text-slate-600 self-center">Quick search:</span>
                        {['pediatric health','children foundation','dallas foundation','denton nonprofit','youth health','mental health tx','uninsured children','maternal child health'].map((q) => (
                          <button key={q} onClick={() => { setIrsQuery(q); setIrsStateFilter('TX'); setTimeout(() => searchIRSWithFilters(q), 0); }}
                            className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 px-3 py-1 rounded-full hover:border-blue-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                            {q}
                          </button>
                        ))}
                      </div>

                      {irsError && (
                        <div className="mt-3 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">{irsError}</div>
                      )}

                      {/* Loading */}
                      {irsLoading && (
                        <div className="flex flex-col items-center gap-3 mt-4 py-10">
                          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                          <span className="text-sm font-semibold text-gray-600 dark:text-slate-400">Querying IRS 990 database via ProPublica…</span>
                          <p className="text-xs text-gray-400 dark:text-slate-600">Searching 2M+ real nonprofit filings — free, no API key</p>
                        </div>
                      )}

                      {/* Results */}
                      {!irsLoading && irsResults.length > 0 && (
                        <>
                          {/* Result count + pagination info */}
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-4 mb-3">
                            Searches real IRS 990 filings via ProPublica Nonprofit Explorer API — results are actual registered nonprofits and foundations
                          </p>
                          {irsTotalResults > 0 && (
                            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-4">
                              Found {irsTotalResults.toLocaleString()} real nonprofits
                              {irsTotalPages > 1 && ` — page ${irsPage} of ${irsTotalPages}`}
                            </p>
                          )}

                          {/* Cards grid — matches reference screenshot layout */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {irsResults.map((org) => {
                              const { score } = scoreOrg(org);
                              const score10 = Math.min(10, Math.round((score / 15) * 10));
                              const enriched = { ...org, relevanceScore: score, matchBadge: score >= 10 ? 'Top Match' : score >= 7 ? 'Strong Match' : 'Potential Match', sourceId: 'manual', sourceCategory: 'IRS Search', relevanceReasons: [] };
                              const isInPipeline = inIRSPipeline(org.ein);
                              const scoreColor = score10 >= 8 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : score10 >= 6 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-800';
                              return (
                                <div key={org.ein} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all">
                                  {/* Header row */}
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1 min-w-0 pr-3">
                                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{org.name}</h3>
                                      <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
                                        {[org.city, org.state].filter(Boolean).join(', ')} · EIN: {org.ein}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${scoreColor}`}>
                                        Score {score10}/10
                                      </span>
                                      <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                                        IRS 990
                                      </span>
                                    </div>
                                  </div>

                                  {/* NTEE row */}
                                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 mt-2 mb-2.5">
                                    <p className="text-[11px] text-gray-600 dark:text-slate-400">
                                      <span className="font-semibold">NTEE Code:</span> {org.ntee_code || 'N/A'} ·{' '}
                                      {org.ntee_code ? NTEE_DESCRIPTIONS[org.ntee_code.charAt(0).toUpperCase()] || '' : ''}
                                    </p>
                                  </div>

                                  {/* Chips row */}
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {org.state && (
                                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                        {org.state}
                                      </span>
                                    )}
                                    {org.ntee_code && (
                                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                                        {org.ntee_code}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                                      <CheckCircle className="w-2.5 h-2.5" /> EIN Verified
                                    </span>
                                    {org.ruling && (
                                      <span className="text-[10px] text-gray-400 dark:text-slate-600 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        Est. {org.ruling}
                                      </span>
                                    )}
                                    {(org.asset_amount > 0 || org.income_amount > 0) && (
                                      <span className="text-[10px] text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        {org.asset_amount > 0
                                          ? `Assets: ${org.asset_amount >= 1_000_000 ? `$${(org.asset_amount/1_000_000).toFixed(1)}M` : `$${(org.asset_amount/1000).toFixed(0)}K`}`
                                          : `Income: ${org.income_amount >= 1_000_000 ? `$${(org.income_amount/1_000_000).toFixed(1)}M` : `$${(org.income_amount/1000).toFixed(0)}K`}`}
                                      </span>
                                    )}
                                  </div>

                                  {/* Action buttons — exactly 3 as in reference */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => generateEmailForOrg(org)}
                                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                                    >
                                      <Bot className="w-3 h-3" /> Generate Email
                                    </button>
                                    <button
                                      onClick={() => addToIRSPipeline(enriched)}
                                      disabled={isInPipeline}
                                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${isInPipeline ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600'}`}
                                    >
                                      {isInPipeline ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                      {isInPipeline ? 'In Pipeline' : 'Add to Pipeline'}
                                    </button>
                                    <a
                                      href={`https://projects.propublica.org/nonprofits/organizations/${org.ein}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" /> IRS Record
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Pagination */}
                          {irsTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-6">
                              <button
                                onClick={() => goToIRSPage(irsPage - 1)}
                                disabled={irsPage <= 1 || irsLoading}
                                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                ← Previous
                              </button>
                              <span className="text-sm text-gray-500 dark:text-slate-500">
                                Page <strong className="text-gray-800 dark:text-slate-200">{irsPage}</strong> of {irsTotalPages}
                              </span>
                              <button
                                onClick={() => goToIRSPage(irsPage + 1)}
                                disabled={irsPage >= irsTotalPages || irsLoading}
                                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* ── STEP 2: GENERATE EMAIL ── */}
                    <div ref={irsEmailStepRef} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 scroll-mt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">2</span>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Generate Outreach Email</h3>
                        <span className="text-[11px] text-gray-400 dark:text-slate-600 ml-1">— AI writes a personalized email for the selected prospect</span>
                        {selectedOrgForEmail && (
                          <span className="ml-auto text-xs font-semibold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded-lg truncate max-w-[180px]">{selectedOrgForEmail.name}</span>
                        )}
                      </div>
                      {!selectedOrgForEmail && (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                          <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-1">
                            <Bot className="w-6 h-6 text-gray-300 dark:text-slate-600" />
                          </div>
                          <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">Click any result card above</p>
                          <p className="text-xs text-gray-300 dark:text-slate-600">The AI will instantly write a personalized outreach email tailored to that nonprofit's mission, location, and financial scale</p>
                        </div>
                      )}
                      {irsEmailLoading && (
                        <div className="flex items-center gap-3 py-6 justify-center">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          <p className="text-sm text-gray-500 dark:text-slate-500">Generating personalized email for <strong>{selectedOrgForEmail?.name}</strong>...</p>
                        </div>
                      )}
                      {!irsEmailLoading && irsEmailContent && (
                        <>
                          <textarea value={irsEmailContent} onChange={(e) => setIrsEmailContent(e.target.value)}
                            rows={14}
                            className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-blue-400 font-mono leading-relaxed mb-3" />
                          <div className="flex items-center gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(irsEmailContent); setIrsEmailCopied(true); setTimeout(() => setIrsEmailCopied(false), 2000); }}
                              className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                              {irsEmailCopied ? <ClipboardCheck className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                              {irsEmailCopied ? 'Copied!' : 'Copy Email'}
                            </button>
                            {selectedOrgForEmail && (
                              <button onClick={() => addToIRSPipeline(selectedOrgForEmail)} disabled={inIRSPipeline(selectedOrgForEmail.ein)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                                <Plus className="w-4 h-4" /> {inIRSPipeline(selectedOrgForEmail.ein) ? 'Already in Pipeline' : 'Add to Pipeline'}
                              </button>
                            )}
                            <button onClick={() => setSelectedOrgForEmail(null)} className="ml-auto text-xs text-gray-400 dark:text-slate-600 hover:text-gray-600 transition-colors">Clear</button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* ── STEP 3: PIPELINE ── */}
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">3</span>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Prospect Pipeline</h3>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-slate-600 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{irsPipeline.length} prospects</span>
                        {irsPipeline.length > 0 && (
                          <button onClick={exportIRSPipelineCSV}
                            className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Export CSV
                          </button>
                        )}
                      </div>
                      {irsPipeline.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-slate-600 text-center py-6">No prospects in pipeline yet — search above and click "Add to Pipeline"</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 dark:border-slate-800">
                                {['Organization','Type','Contact','Score','Status','Notes','Action'].map((h) => (
                                  <th key={h} className="text-left text-[11px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-wider pb-2.5 pr-4 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {irsPipeline.map((entry) => (
                                <tr key={entry.id} className="border-b border-gray-50 dark:border-slate-800/60 last:border-b-0">
                                  <td className="py-3 pr-4">
                                    <p className="font-semibold text-gray-800 dark:text-slate-200 max-w-[160px] truncate">{entry.org.name}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-600">{entry.org.city}, {entry.org.state}</p>
                                  </td>
                                  <td className="py-3 pr-4 text-gray-500 dark:text-slate-500 whitespace-nowrap">{entry.org.ntee_code || '—'}</td>
                                  <td className="py-3 pr-4">
                                    <a href={`https://projects.propublica.org/nonprofits/organizations/${entry.org.ein}`} target="_blank" rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                                      <ExternalLink className="w-3 h-3" /> IRS
                                    </a>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <span className={`font-bold ${(entry.org.relevanceScore || 0) >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                      {entry.org.relevanceScore || '—'}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <select value={entry.status} onChange={(e) => updateIRSPipelineStatus(entry.id, e.target.value as IRSPipelineEntry['status'])}
                                      className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none ${
                                        entry.status === 'donated' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                        entry.status === 'responded' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400' :
                                        entry.status === 'contacted' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' :
                                        'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                                      }`}>
                                      <option value="new">New</option>
                                      <option value="contacted">Contacted</option>
                                      <option value="responded">Responded</option>
                                      <option value="donated">Donated</option>
                                    </select>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <input value={entry.notes} onChange={(e) => updateIRSPipelineNotes(entry.id, e.target.value)}
                                      placeholder="Add notes..."
                                      className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-lg focus:outline-none focus:border-blue-400 w-32" />
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => generateEmailForOrg(entry.org)}
                                        className="text-blue-600 dark:text-cyan-400 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Generate Email">
                                        <Bot className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => removeFromIRSPipeline(entry.id)}
                                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Remove">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
              </>
            )}
          </>
        )}

        {/* Programs & Giving content is now integrated into PediBot conversation */}
        {false && (
          <div className="space-y-10">

            {/* Programs grid */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.programsTitle}</h2>
                  <p className="text-xs text-gray-400 dark:text-slate-600">{t.programsSubtitle}</p>
                </div>
                <a href="https://www.pediplace.org/programs-and-services" target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline">
                  {t.viewPediPlace} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PROGRAMS.map((prog: any) => (
                  <div key={prog.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-slate-600">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${COLORS[prog.color]}`}>
                      {prog.icon}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{lang === 'es' && prog.titleEs ? prog.titleEs : prog.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed mb-3">{lang === 'es' && prog.descriptionEs ? prog.descriptionEs : prog.description}</p>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">💡 {lang === 'es' && prog.statEs ? prog.statEs : prog.stat}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Donation tiers */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.tiersTitle}</h2>
                  <p className="text-xs text-gray-400 dark:text-slate-600">{t.tiersSubtitle}</p>
                </div>
                <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline">
                  Donate Now <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DONATION_TIERS.map((tier: any) => (
                  <div key={tier.amount} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-md transition-all group">
                    <div className={`h-1.5 bg-gradient-to-r ${tier.color}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">${tier.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 dark:text-slate-600 ml-1">{t.perGift}</span>
                        </div>
                        <span className="text-2xl">{tier.icon}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1">{lang === 'es' && tier.labelEs ? tier.labelEs : tier.label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed mb-3">{lang === 'es' && tier.impactEs ? tier.impactEs : tier.impact}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500 px-2 py-0.5 rounded-full">{tier.program}</span>
                        <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                          {t.giveLink} <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Volunteer opportunities */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-violet-50 dark:bg-violet-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.volunteerTitle}</h2>
                  <p className="text-xs text-gray-400 dark:text-slate-600">{t.volunteerSubtitle}</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800 dark:text-amber-300">
                  <span className="font-bold">⚠️ {lang === 'es' ? 'Importante' : 'Important'}:</span> {t.volunteerWarning}
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {VOLUNTEER_OPTIONS.map((vol: any) => (
                  <div key={vol.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all hover:border-violet-200 dark:hover:border-slate-600">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{vol.icon}</span>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{lang === 'es' && vol.titleEs ? vol.titleEs : vol.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mb-3 leading-relaxed">{lang === 'es' && vol.descriptionEs ? vol.descriptionEs : vol.description}</p>
                    <ul className="space-y-1">
                      {(lang === 'es' && vol.itemsEs ? vol.itemsEs : vol.items).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {item.includes('@') ? <a href={`mailto:${item}`} className="text-blue-600 dark:text-cyan-400 hover:underline">{item}</a> : item}
                        </li>
                      ))}
                    </ul>
                    {vol.id === 'medical' && (
                      <a href="mailto:Cassandra.singleton@pediplace.org"
                        className="mt-3 flex items-center gap-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-2 rounded-xl hover:bg-violet-100 transition-colors w-full justify-center">
                        <Mail className="w-3.5 h-3.5" /> {t.emailCassandra}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* CTA banner */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 rounded-2xl p-8 text-white text-center shadow-xl shadow-blue-500/20">
              <p className="text-xl font-bold mb-2">{t.ctaTitle}</p>
              <p className="text-sm text-blue-100 mb-6">{t.ctaBody}</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-blue-600 text-sm font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
                  <Heart className="w-4 h-4" /> {t.ctaDonate}
                </a>
                <button onClick={() => setMainTab('bot')}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
                  <Bot className="w-4 h-4" /> {t.ctaBot}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EMAIL MODAL removed — curated email now shows inline below cards */}
    </div>
  );
}

/* ═══ FUNDER CARD ═══ */
function FunderCard({ funder, inPipeline, onAddPipeline, onGenerateEmail }: { funder: CuratedFunder; inPipeline: boolean; onAddPipeline: () => void; onGenerateEmail: () => void; }) {
  const sourceStyle = SOURCE_COLORS[funder.source] ?? 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400';
  const matchColor = funder.matchScore === 10 ? 'text-emerald-600 dark:text-emerald-400' : funder.matchScore === 9 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400';
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-slate-600">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{funder.name}</h3>
            <span className={`text-[11px] font-bold ${matchColor}`}>Match {funder.matchScore}/10</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-600 mt-0.5">{funder.location} · {funder.type}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${sourceStyle}`}>{funder.source}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed mb-3">{funder.description}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
        <div><span className="text-gray-400 dark:text-slate-600">Range: </span><span className="font-semibold text-gray-700 dark:text-slate-300">{funder.grantRange}</span></div>
        <div><span className="text-gray-400 dark:text-slate-600">Avg: </span><span className="font-semibold text-gray-700 dark:text-slate-300">{funder.avgGrant}</span></div>
        <div className="truncate"><span className="text-gray-400 dark:text-slate-600">Site: </span><a href={funder.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline">{funder.website}</a></div>
        {funder.email && <div className="truncate"><span className="text-gray-400 dark:text-slate-600">Email: </span><span className="font-semibold text-gray-700 dark:text-slate-300 text-[11px]">{funder.email}</span></div>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {funder.tags.map((t) => <span key={t} className="text-[10px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{t}</span>)}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onGenerateEmail} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"><Bot className="w-3.5 h-3.5" /> Generate Email</button>
        <button onClick={onAddPipeline} disabled={inPipeline} className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-colors ${inPipeline ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-blue-300'}`}>
          {inPipeline ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{inPipeline ? 'In Pipeline' : 'Add to Pipeline'}
        </button>
        <a href={funder.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 text-gray-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Visit Site</a>
      </div>
    </div>
  );
}

/* ═══ SCAN RESULT CARD ═══ */
const BADGE_COLORS: Record<string, string> = {
  'Top Match': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  'Strong Match': 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  'Potential Match': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
};

/* ═══ IRS ORG CARD ═══ */
function IRSOrgCard({ org }: { org: ProPublicaOrg }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{org.name}</h3>
          <p className="text-[11px] text-gray-400 dark:text-slate-600 mt-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{org.city}, {org.state}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">IRS 990</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
        <div><span className="text-gray-400">EIN: </span><span className="font-mono text-gray-700 dark:text-slate-300">{org.ein}</span></div>
        <div><span className="text-gray-400">NTEE: </span><span className="font-semibold text-gray-700 dark:text-slate-300">{org.ntee_code || 'N/A'}</span></div>
        {org.income_amount > 0 && <div><span className="text-gray-400">Income: </span><span className="font-semibold text-gray-700 dark:text-slate-300">${(org.income_amount / 1000).toFixed(0)}K</span></div>}
        {org.asset_amount > 0 && <div><span className="text-gray-400">Assets: </span><span className="font-semibold text-gray-700 dark:text-slate-300">${(org.asset_amount / 1000).toFixed(0)}K</span></div>}
      </div>
      <a href={`https://projects.propublica.org/nonprofits/organizations/${org.ein}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 text-gray-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors w-fit">
        <ExternalLink className="w-3.5 h-3.5" /> View IRS Filing
      </a>
    </div>
  );
}
