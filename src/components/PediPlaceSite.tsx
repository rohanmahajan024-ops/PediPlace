import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Phone, Mail, MapPin, Clock, X, Send, ChevronDown,
  Heart, Baby, Brain, Stethoscope, BookOpen, Users,
  MessageCircle, Bot, Repeat, Instagram, Facebook, Twitter,
} from 'lucide-react';
import { buildBotMessages, saveLead } from './DonorDiscovery';
import type { BotStep, BotLead, ChatMsg } from './DonorDiscovery';
import { sendThankYouEmail, sendAdminLeadNotification } from '../utils/emailService';

/* ─── NAV LINKS ─── */
const NAV_LINKS = [
  { label: 'Home',              href: 'https://www.pediplace.org/' },
  { label: 'About Us',          href: 'https://www.pediplace.org/about-us' },
  { label: 'Patient Resources', href: 'https://www.pediplace.org/patient-resources' },
  { label: 'Events',            href: 'https://www.pediplace.org/events' },
  { label: 'Programs & Services', href: '#programs', current: true },
  { label: 'Get Involved',      href: 'https://www.pediplace.org/get-involved' },
  { label: 'Contact Us',        href: 'https://www.pediplace.org/contact' },
];

/* ─── PROGRAMS DATA ─── */
const PROGRAMS = [
  {
    id: 'patient-care',
    heading: 'Patient Care',
    icon: <Stethoscope className="w-8 h-8" />,
    color: '#0d2240',
    intro: 'By caring for children with acute and chronic conditions, PediPlace:',
    bullets: [
      'Prevents acute illness',
      'Improves long-term health',
      'Decreases hospitalization',
      'Keeps children in school',
      'Becomes your family\'s medical home',
    ],
    subsections: [
      { title: 'Preventive Care', body: 'Creating long-term health and success. Alongside all the vital vaccinations children need at a young age, PediPlace provides affordable screenings for hearing and vision.' },
      { title: 'Managing Chronic Illnesses & Complex Medical Conditions', body: 'We have over 30 years of experience caring for children, and much of that work involves comprehensive treatment for illnesses like asthma, ADHD, and obesity.' },
      { title: 'Addressing Mental Health Needs', body: "PediPlace utilizes APA-approved mental health screenings to assess our patients' emotional well-being. We also offer in-clinic therapy with Licensed Professional Counselors." },
    ],
  },
  {
    id: 'healthy-babies',
    heading: 'Healthy Babies',
    icon: <Baby className="w-8 h-8" />,
    color: '#4a9fd8',
    intro: 'Without preventive exams or well visits, babies are at risk of going untreated for developmental delays, and hearing and vision problems. That is why our Healthy Babies Program strives to increase the number of well-child visits among our community\'s children ages 3 days to 15 months. With this program, babies can become healthy, thriving kids. For our uninsured patients, there are no fees for these recommended visits.',
    quickFact: 'Preventative exams recommended for children at: 3 days, 2 weeks, and months 1, 2, 4, 6, 9, 12, & 15',
    subsections: [
      { title: 'Healthy Kids', body: 'Through regularly scheduled visits, our clinic team establishes a partnership with parents, caretakers and their growing kids. The initial focus is preventive care, which includes annual physicals for children ages 2 and up.' },
      { title: 'Illness to Wellness', body: 'This initiative addresses the acute care needs of PediPlace patients, including illnesses such as the flu, sore throat, viruses, and ear infections, as well as follow-up care for children with chronic illnesses like asthma, ADHD, and obesity.' },
      { title: 'School Clinic Initiative', body: 'Through unique partnerships with the Lewisville Independent School District and Denton Independent School District, PediPlace has established pediatric clinics on-site at Central Elementary School (Lewisville) and Fred Moore High School (Denton).' },
    ],
  },
  {
    id: 'mental-health',
    heading: 'Integrated Mental Health Services',
    icon: <Brain className="w-8 h-8" />,
    color: '#0d2240',
    intro: 'PediPlace provides integrated mental health services within our primary care framework to address risk factors specific to our patient population. This program places Licensed Professional Counselors (LPC) at PediPlace and provides services that assist patients and their families with navigating the complex medical and mental healthcare system.',
    subsections: [
      { title: 'Parent Education', body: 'Engaging and educating parents is a cornerstone of PediPlace. We focus on developing partnerships and relationships with parents and caretakers so we can teach them about medicine, their child\'s health, and the steps they can take to raise happy, healthy kids.' },
    ],
  },
  {
    id: 'reach-out',
    heading: 'Reach Out and Read',
    icon: <BookOpen className="w-8 h-8" />,
    color: '#4a9fd8',
    intro: 'Designed to prepare children for school, Reach Out and Read builds upon the unique partnership between parent and medical provider. Starting at age six months, each patient receives an age-appropriate book at the beginning of every well visit. By the time the child is six years old, they have a full library of 18 books designed to expand and enhance their vocabulary and their cognitive skills.',
    subsections: [],
  },
  {
    id: 'family-care',
    heading: 'Family Care Fund',
    icon: <Heart className="w-8 h-8" />,
    color: '#0d2240',
    intro: 'This program was created to help uninsured patients who were unable to afford prescription medications and lab tests required for their prescribed medical care. With the Family Care Fund, PediPlace patients can receive financial assistance for their prescriptions and labs to complete their full cycle of care.',
    subsections: [],
  },
];

/* ─── BOT HELPERS (self-contained, no import from DonorDiscovery) ─── */
type BotStateShape = { name: string; email: string; interest: string; program: string; donationAmount: string; timeline: string; volunteerType: string };
const EMPTY_BOT_STATE: BotStateShape = { name: '', email: '', interest: '', program: '', donationAmount: '', timeline: '', volunteerType: '' };

function useBot() {
  const [step, setStep]       = useState<BotStep>('welcome');
  const [msgs, setMsgs]       = useState<ChatMsg[]>([]);
  const [state, setState]     = useState<BotStateShape>(EMPTY_BOT_STATE);
  const [input, setInput]     = useState('');
  const chatEndRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs(buildBotMessages('welcome', EMPTY_BOT_STATE));
  }, []);

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [msgs]);

  const addUser = (text: string) =>
    setMsgs((p) => [...p, { id: `u-${Date.now()}`, role: 'user', text }]);

  const addBot = (s: BotStep, ns: BotStateShape) => {
    const next = buildBotMessages(s, ns);
    setTimeout(() => setMsgs((p) => [...p, ...next]), 400);
  };

  const finish = (ns: BotStateShape) => {
    setStep('complete');
    const lead: BotLead = {
      id: `lead-${Date.now()}`, timestamp: new Date().toISOString(),
      name: ns.name, email: ns.email, interest: ns.interest,
      program: ns.program, donationAmount: ns.donationAmount,
      timeline: ns.timeline, volunteerType: ns.volunteerType, notes: '',
    };
    saveLead(lead);
    addBot('complete', ns);
    if (ns.email) {
      const p = { toName: ns.name, toEmail: ns.email, interest: ns.interest, program: ns.program, donationAmount: ns.donationAmount };
      sendThankYouEmail(p);
      sendAdminLeadNotification(p);
    }
  };

  const handleOption = (value: string, label: string) => {
    if (step === 'complete') return;
    addUser(label);
    const ns = { ...state };

    if (step === 'welcome')         { ns.name = label; setState(ns); setStep('interest'); addBot('interest', ns); return; }
    if (step === 'interest')        { ns.interest = value; setState(ns);
      if (value === 'donation')     { setStep('program');       addBot('program', ns); }
      else if (value === 'explore') { setStep('explore_menu');  addBot('explore_menu', ns); }
      else if (value === 'corporate'){ setStep('corporate_check'); addBot('corporate_check', ns); }
      else if (value === 'volunteer'){ setStep('volunteer_type'); addBot('volunteer_type', ns); }
      else if (value === 'inkind')   { setStep('inkind');        addBot('inkind', ns); }
      return;
    }
    if (['explore_menu','programs_overview','tiers_overview','volunteer_overview'].includes(step)) {
      if (value === 'programs_overview') { setStep('programs_overview'); addBot('programs_overview', ns); }
      else if (value === 'tiers_overview') { setStep('tiers_overview'); addBot('tiers_overview', ns); }
      else if (value === 'volunteer_overview') { setStep('volunteer_overview'); addBot('volunteer_overview', ns); }
      else if (value === 'support_program' || value === 'give') { setStep('program'); addBot('program', ns); }
      else if (value === 'start_volunteer') { ns.interest = 'volunteer'; setState(ns); setStep('volunteer_type'); addBot('volunteer_type', ns); }
      else { setStep('explore_menu'); addBot('explore_menu', ns); }
      return;
    }
    if (step === 'program')         { ns.program = value; setState(ns); setStep('donation_tier'); addBot('donation_tier', ns); return; }
    if (step === 'donation_tier')   { ns.donationAmount = value; setState(ns); setStep('email'); addBot('email', ns); return; }
    if (step === 'volunteer_type')  { ns.volunteerType = value; ns.interest = value; setState(ns); setStep('volunteer_items'); addBot('volunteer_items', ns); return; }
    if (step === 'corporate_check') { ns.program = label; setState(ns); setStep('email'); addBot('email', ns); return; }
    if (step === 'timeline')        { ns.timeline = label; setState(ns); setStep('follow_up'); addBot('follow_up', ns); return; }
    if (step === 'follow_up')       { finish(ns); return; }
    if (value === 'done')           { finish(ns); return; }
  };

  const handleText = () => {
    if (!input.trim()) return;
    const val = input.trim();
    setInput('');
    addUser(val);
    const ns = { ...state };
    if (step === 'welcome')          { ns.name = val; setState(ns); setStep('interest'); addBot('interest', ns); }
    else if (['email','inkind','volunteer_items'].includes(step)) {
      ns.email = val; setState(ns);
      if (['inkind','volunteer_items'].includes(step) || state.interest === 'volunteer' || state.interest === 'inkind') { finish(ns); }
      else { setStep('timeline'); addBot('timeline', ns); }
    }
  };

  const reset = () => {
    setStep('welcome'); setState(EMPTY_BOT_STATE); setInput('');
    setMsgs(buildBotMessages('welcome', EMPTY_BOT_STATE));
  };

  const lastBotId = useMemo(
    () => [...msgs].reverse().find(m => m.role === 'bot')?.id,
    [msgs],
  );

  return { step, msgs, input, setInput, handleOption, handleText, reset, chatEndRef, lastBotId };
}

/* ─── PROPS ─── */
interface PediPlaceSiteProps {
  onLoginClick?: () => void;
}

export default function PediPlaceSite({ onLoginClick }: PediPlaceSiteProps) {
  const [lang, setLang]           = useState<'en' | 'es'>('en');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [chatOpen, setChatOpen]   = useState(false);
  const [logoTaps, setLogoTaps]   = useState(0);
  const logoTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bot = useBot();

  const handleLogoTap = () => {
    const n = logoTaps + 1;
    setLogoTaps(n);
    if (logoTimer.current) clearTimeout(logoTimer.current);
    if (n >= 5) { setLogoTaps(0); onLoginClick?.(); }
    else logoTimer.current = setTimeout(() => setLogoTaps(0), 3000);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════ NAVBAR ══════════ */}
      <header style={{ backgroundColor: '#0d2240' }} className="sticky top-0 z-50 shadow-lg">
        {/* Top strip: phone + donate */}
        <div style={{ backgroundColor: '#4a9fd8' }} className="px-6 py-1.5 flex items-center justify-end gap-6">
          <a href="tel:9724367962" className="flex items-center gap-1.5 text-white text-xs font-semibold hover:text-blue-100 transition-colors">
            <Phone className="w-3 h-3" /> 972-436-7962
          </a>
          <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
            className="bg-white text-[#0d2240] text-xs font-bold px-3 py-1 rounded-full hover:bg-blue-50 transition-colors">
            Donate Today
          </a>
        </div>

        {/* Main nav */}
        <div className="px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <button onClick={handleLogoTap} className="focus:outline-none relative select-none">
            <img src="/pediplace-logo.png" alt="PediPlace" className="h-12 w-auto brightness-0 invert" />
            {logoTaps > 0 && logoTaps < 5 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {5 - logoTaps}
              </span>
            )}
          </button>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  l.current
                    ? 'text-white bg-white/15'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex bg-white/10 rounded-lg overflow-hidden border border-white/20">
              {(['en','es'] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 text-xs font-bold transition-colors ${lang === l ? 'bg-white text-[#0d2240]' : 'text-white hover:bg-white/10'}`}>
                  {l === 'en' ? 'EN' : 'ESP'}
                </button>
              ))}
            </div>
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden text-white p-1">
              <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div style={{ backgroundColor: '#0d2240' }} className="lg:hidden border-t border-white/10 px-6 py-3 space-y-1">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section style={{ background: 'linear-gradient(135deg, #0d2240 0%, #1a3a6e 60%, #4a9fd8 100%)' }}
        className="py-16 px-6 text-center text-white">
        <p className="text-sm font-bold tracking-widest text-blue-300 uppercase mb-3">PediPlace</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Programs &amp; Services</h1>
        <p className="text-blue-200 max-w-2xl mx-auto text-lg leading-relaxed">
          Making healthcare a reality for every kid in Denton &amp; Lewisville, TX
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href="tel:9724367962"
            className="flex items-center gap-2 bg-white text-[#0d2240] font-bold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors shadow-lg">
            <Phone className="w-4 h-4" /> Schedule Appointment
          </a>
          <button onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 border-2 border-white text-white font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
            <MessageCircle className="w-4 h-4" /> Chat with PediBot
          </button>
        </div>
      </section>

      {/* ══════════ OUR APPROACH ══════════ */}
      <section className="py-14 px-6 max-w-5xl mx-auto" id="programs">
        <div className="text-center mb-10">
          <span style={{ color: '#4a9fd8' }} className="text-sm font-bold uppercase tracking-widest">Our Approach</span>
          <h2 style={{ color: '#0d2240' }} className="text-3xl font-extrabold mt-2">
            Friendly, Welcoming, Comprehensive Care
          </h2>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            At PediPlace, you can expect a friendly, welcoming community of healthcare professionals dedicated to you and the health of your family. To provide your child with the best care possible, <strong>appointments are required</strong>. Our team treats illnesses and provides holistic preventative care. When necessary, we also provide referrals for specialized treatment.
          </p>
          <a href="tel:9724367962"
            style={{ backgroundColor: '#0d2240' }}
            className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-full mt-6 hover:opacity-90 transition-opacity">
            <Phone className="w-4 h-4" /> Schedule an Appointment
          </a>
        </div>
      </section>

      {/* ══════════ PROGRAMS ══════════ */}
      <section className="pb-16 px-6 max-w-5xl mx-auto space-y-16">
        {PROGRAMS.map((prog, i) => (
          <div key={prog.id} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 items-start`}>
            {/* Icon column */}
            <div className="flex-shrink-0 flex flex-col items-center lg:items-start gap-4 lg:w-64">
              <div style={{ backgroundColor: prog.color }} className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg">
                {prog.icon}
              </div>
              <h2 style={{ color: prog.color }} className="text-2xl font-extrabold leading-tight text-center lg:text-left">
                {prog.heading}
              </h2>
            </div>

            {/* Content column */}
            <div className="flex-1">
              <p className="text-gray-700 text-base leading-relaxed mb-6">{prog.intro}</p>

              {prog.bullets && (
                <ul className="space-y-2 mb-6">
                  {prog.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-gray-700">
                      <span style={{ color: '#4a9fd8' }} className="font-bold text-lg">✓</span> {b}
                    </li>
                  ))}
                </ul>
              )}

              {prog.quickFact && (
                <div style={{ borderLeftColor: '#4a9fd8', backgroundColor: '#eff8ff' }}
                  className="border-l-4 rounded-r-xl px-5 py-4 mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Quick Facts</p>
                  <p style={{ color: '#0d2240' }} className="font-semibold">{prog.quickFact}</p>
                </div>
              )}

              {prog.subsections.length > 0 && (
                <div className="space-y-5">
                  {prog.subsections.map((sub) => (
                    <div key={sub.title} className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                      <h3 style={{ color: '#0d2240' }} className="font-bold text-base mb-2">{sub.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{sub.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* ══════════ DONATE STRIP ══════════ */}
      <section style={{ backgroundColor: '#4a9fd8' }} className="py-12 px-6 text-center text-white">
        <h2 className="text-2xl font-extrabold mb-2">Support Our Mission</h2>
        <p className="text-blue-100 mb-6 max-w-xl mx-auto">
          Every gift directly funds care for uninsured children in Denton &amp; Lewisville, TX.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[50,75,100,200,500,2500].map((amt) => (
            <a key={amt} href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
              className="bg-white text-[#0d2240] font-bold px-5 py-2 rounded-full hover:bg-blue-50 transition-colors shadow">
              ${amt.toLocaleString()}
            </a>
          ))}
        </div>
        <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer"
          style={{ backgroundColor: '#0d2240' }}
          className="inline-block text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg">
          Contribute Today →
        </a>
      </section>

      {/* ══════════ NEWSLETTER ══════════ */}
      <section className="py-12 px-6 bg-gray-50 text-center">
        <h2 style={{ color: '#0d2240' }} className="text-2xl font-extrabold mb-2">Subscribe to Our Newsletter</h2>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">
          Stay up to date on events, achievements, and volunteer opportunities.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
          onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="your@email.com"
            className="flex-1 border border-gray-300 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          <button type="submit" style={{ backgroundColor: '#4a9fd8' }}
            className="text-white font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Subscribe
          </button>
        </form>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ backgroundColor: '#0d2240' }} className="text-white py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo + social */}
          <div>
            <img src="/pediplace-logo.png" alt="PediPlace" className="h-14 w-auto brightness-0 invert mb-4" />
            <p className="text-blue-200 text-sm leading-relaxed">Making healthcare a reality for every kid.</p>
            <div className="flex gap-3 mt-4">
              {[
                { icon: <Instagram className="w-4 h-4" />, href: 'https://www.instagram.com/pediplacetx/' },
                { icon: <Facebook className="w-4 h-4" />,  href: 'https://www.facebook.com/PediPlaceTX/' },
                { icon: <Twitter className="w-4 h-4" />,   href: 'https://twitter.com/PediPlaceTX' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-blue-300 mb-4">Address</h4>
            <div className="space-y-3 text-sm text-blue-100">
              <div className="flex gap-2"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                <span>Park Lane Village<br />502 S. Old Orchard Lane, #126<br />Lewisville, TX 75067</span>
              </div>
              <div className="flex gap-2"><Phone className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <a href="tel:9724367962" className="hover:text-white">972-436-7962</a>
              </div>
              <div className="flex gap-2"><Mail className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <a href="mailto:info@pediplace.org" className="hover:text-white">info@pediplace.org</a>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-blue-300 mb-4">Hours</h4>
            <div className="space-y-2 text-sm text-blue-100">
              <div className="flex gap-2"><Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <p>Monday – Friday: 8:00 a.m. – 5:00 p.m.</p>
                  <p className="mt-1">Open until 8:00 p.m. on Tuesdays</p>
                  <p className="mt-1 text-blue-300">Closed for lunch 12:30 – 1:30 p.m.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-xs text-blue-400">
          © {new Date().getFullYear()} PediPlace. All rights reserved.
          <span className="mx-2">·</span>
          <a href="https://www.pediplace.org" target="_blank" rel="noopener noreferrer" className="hover:text-white">pediplace.org</a>
        </div>
      </footer>

      {/* ══════════ FLOATING PEDIBOT BUTTON ══════════ */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)}
          style={{ backgroundColor: '#4a9fd8' }}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center text-white hover:scale-105 transition-transform group">
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          <span className="absolute bottom-full right-0 mb-2 bg-[#0d2240] text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            Chat with PediBot
          </span>
        </button>
      )}

      {/* ══════════ PEDIBOT CHAT PANEL ══════════ */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[370px] max-h-[600px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          style={{ maxHeight: '85vh' }}>

          {/* Chat header */}
          <div style={{ background: 'linear-gradient(135deg, #0d2240, #1a3a6e)' }}
            className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                <img src="/pediplace-logo.png" alt="PediBot" className="w-full h-full object-contain p-0.5" />
              </div>
              <div>
                <p className="text-sm font-bold">PediBot</p>
                <p className="text-[11px] text-blue-200">PediPlace Donor Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <button onClick={bot.reset} title="Start over" className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <Repeat className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {bot.msgs.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {msg.role === 'bot' && (
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 overflow-hidden">
                      <img src="/pediplace-logo.png" alt="" className="w-full h-full object-contain p-0.5" />
                    </div>
                  )}
                  <div className="max-w-[82%]">
                    {msg.role === 'bot' ? (
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline">$1</a>') }} />
                        {msg.options && msg.options.length > 0 && msg.id === bot.lastBotId && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.options.map((opt) => (
                              <button key={opt.value}
                                onClick={() => bot.handleOption(opt.value, opt.label)}
                                disabled={bot.step === 'complete'}
                                style={{ borderColor: '#4a9fd8', color: '#0d2240' }}
                                className="text-xs font-semibold bg-white border px-2.5 py-1.5 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                {opt.icon && <span className="mr-1">{opt.icon}</span>}{opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {msg.inputType && msg.inputType !== 'none' && bot.step !== 'complete' && msg.id === bot.lastBotId && (
                          <div className="mt-2 flex gap-2">
                            <input type={msg.inputType} value={bot.input}
                              onChange={(e) => bot.setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && bot.handleText()}
                              placeholder={msg.inputType === 'email' ? 'your@email.com' : 'Type here...'}
                              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400" />
                            <button onClick={bot.handleText} style={{ backgroundColor: '#4a9fd8' }} className="text-white p-2 rounded-xl">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: 'linear-gradient(135deg, #4a9fd8, #0d2240)' }}
                        className="rounded-2xl rounded-br-sm px-3 py-2.5">
                        <p className="text-sm text-white">{msg.text}</p>
                      </div>
                    )}
                  </div>
                </div>
            ))}
            <div ref={bot.chatEndRef} />
          </div>

          {/* Input bar */}
          {bot.step !== 'complete' && (
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex gap-2">
                <input value={bot.input} onChange={(e) => bot.setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && bot.handleText()}
                  placeholder="Type a message..."
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400" />
                <button onClick={bot.handleText} disabled={!bot.input.trim()}
                  style={{ backgroundColor: '#4a9fd8' }}
                  className="text-white p-2.5 rounded-xl disabled:opacity-40 transition-opacity">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {bot.step === 'complete' && (
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-gray-400">Conversation complete</p>
              <button onClick={bot.reset} style={{ color: '#4a9fd8' }} className="flex items-center gap-1 text-xs font-semibold hover:opacity-80">
                <Repeat className="w-3 h-3" /> Start New
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
