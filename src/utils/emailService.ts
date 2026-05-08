import emailjs from '@emailjs/browser';

/* ──────────────────────────────────────────────────────────────────────────
   EmailJS credential resolution
   ────────────────────────────────────────────────────────────────────────
   Credentials can come from two sources:
     1. Vite env vars (VITE_EMAILJS_*) baked in at build time.
     2. localStorage values entered by the user via the in-app setup panel
        — useful for demo / staging where rebuilding isn't an option.

   localStorage takes precedence so users can override env credentials live.
   Reading happens at call-time (not module load) so changes apply instantly.
─────────────────────────────────────────────────────────────────────────── */

const ENV_SERVICE_ID           = import.meta.env.VITE_EMAILJS_SERVICE_ID           as string | undefined;
const ENV_TEMPLATE_ID          = import.meta.env.VITE_EMAILJS_TEMPLATE_ID          as string | undefined;
const ENV_ADMIN_TEMPLATE_ID    = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID    as string | undefined;
const ENV_OUTREACH_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_OUTREACH_TEMPLATE_ID as string | undefined;
const ENV_PUBLIC_KEY           = import.meta.env.VITE_EMAILJS_PUBLIC_KEY           as string | undefined;

const LS_KEYS = {
  service:  'pediplace_emailjs_service_id',
  template: 'pediplace_emailjs_template_id',
  outreach: 'pediplace_emailjs_outreach_template_id',
  publicKey:'pediplace_emailjs_public_key',
} as const;

function lsGet(key: string): string | undefined {
  try {
    const v = localStorage.getItem(key);
    return v && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

export interface EmailJSCredentials {
  serviceId:         string;
  templateId:        string;
  publicKey:         string;
  outreachTemplateId?: string;
}

/** Resolve the active credentials (localStorage overrides env). */
export function getEmailJSCredentials(): EmailJSCredentials {
  return {
    serviceId:         lsGet(LS_KEYS.service)   ?? ENV_SERVICE_ID           ?? '',
    templateId:        lsGet(LS_KEYS.template)  ?? ENV_TEMPLATE_ID          ?? '',
    publicKey:         lsGet(LS_KEYS.publicKey) ?? ENV_PUBLIC_KEY           ?? '',
    outreachTemplateId:lsGet(LS_KEYS.outreach)  ?? ENV_OUTREACH_TEMPLATE_ID ?? undefined,
  };
}

/** Persist credentials entered through the in-app setup panel. */
export function saveEmailJSCredentials(creds: Partial<EmailJSCredentials>): void {
  try {
    if (creds.serviceId   !== undefined) localStorage.setItem(LS_KEYS.service,   creds.serviceId);
    if (creds.templateId  !== undefined) localStorage.setItem(LS_KEYS.template,  creds.templateId);
    if (creds.publicKey   !== undefined) localStorage.setItem(LS_KEYS.publicKey, creds.publicKey);
    if (creds.outreachTemplateId !== undefined) localStorage.setItem(LS_KEYS.outreach, creds.outreachTemplateId);
    // (Re-)init with the new key so subsequent send() calls work.
    if (creds.publicKey) emailjs.init({ publicKey: creds.publicKey });
  } catch (err) {
    console.warn('[EmailJS] Could not persist credentials:', err);
  }
}

/** Clear UI-supplied credentials and fall back to env vars (or empty). */
export function clearEmailJSCredentials(): void {
  try {
    Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function isEmailJSConfigured(): boolean {
  const c = getEmailJSCredentials();
  return Boolean(c.serviceId && c.templateId && c.publicKey);
}

// One-time init at module load if env credentials exist; localStorage creds
// will re-init when saveEmailJSCredentials is called.
{
  const initial = getEmailJSCredentials();
  if (initial.publicKey) {
    try { emailjs.init({ publicKey: initial.publicKey }); } catch { /* no-op */ }
  }
}

/* ──────────────────────────────────────────────────────────────────────── */

const ADMIN_EMAIL = 'Cassandra.singleton@pediplace.org';

export interface ThankYouParams {
  toName:        string;
  toEmail:       string;
  interest:      string;
  program:       string;
  donationAmount?: string;
}

const INTEREST_LABEL: Record<string, string> = {
  donation:    'making a donation',
  volunteer:   'volunteering with us',
  corporate:   'corporate partnership',
  inkind:      'in-kind giving',
  explore:     'learning more about PediPlace',
};

function ensureConfigured(): EmailJSCredentials | null {
  const c = getEmailJSCredentials();
  if (!c.serviceId || !c.templateId || !c.publicKey) {
    console.warn('[EmailJS] Not configured. Use the in-app setup panel or set VITE_EMAILJS_* env vars.');
    return null;
  }
  return c;
}

export interface OutreachEmailParams {
  toEmail:     string;
  toName?:     string;
  subject:     string;
  body:        string;
  fromName?:   string;  // defaults to "PediPlace"
  replyTo?:    string;  // defaults to info@pediplace.org
  organization?: string;
}

export interface OutreachEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Sends an outreach / grant inquiry email to a prospect organization via EmailJS.
 *
 * Uses the optional outreach template if configured (recommended — its body
 * should include {{subject}} and {{message}} placeholders), otherwise falls
 * back to the main template. The "To Email" field of whichever template you
 * pick MUST be set to {{to_email}} so the email reaches the prospect.
 */
export async function sendOutreachEmail(params: OutreachEmailParams): Promise<OutreachEmailResult> {
  const creds = ensureConfigured();
  if (!creds) {
    return { ok: false, error: 'EmailJS is not configured. Open the setup panel above to add credentials.' };
  }
  const toEmail = (params.toEmail || '').trim();
  if (!toEmail || !/^\S+@\S+\.\S+$/.test(toEmail)) {
    return { ok: false, error: 'A valid recipient email is required.' };
  }

  const templateId = creds.outreachTemplateId || creds.templateId;
  const templateParams = {
    to_email:     toEmail,
    to_name:      params.toName     || params.organization || 'Grants Team',
    from_name:    params.fromName   || 'PediPlace',
    reply_to:     params.replyTo    || 'info@pediplace.org',
    subject:      params.subject    || 'Partnership Inquiry — PediPlace',
    message:      params.body,
    organization: params.organization || params.toName || '',
  };

  try {
    const result = await emailjs.send(
      creds.serviceId,
      templateId,
      templateParams,
      { publicKey: creds.publicKey },
    );
    console.log('[EmailJS] Outreach email sent ✓', result.status, result.text, '→', toEmail);
    return { ok: true };
  } catch (err: any) {
    const msg =
      err?.text ||
      err?.message ||
      (typeof err === 'string' ? err : null) ||
      'Unknown EmailJS error (check service/template IDs & public key).';
    console.error('[EmailJS] Outreach email FAILED:', err);
    return { ok: false, error: msg };
  }
}

/**
 * Sends an automatic thank-you email to a PediBot lead via EmailJS.
 *
 * IMPORTANT: In your EmailJS template, the "To Email" field MUST be set to
 * {{to_email}} so the email goes to the donor.
 */
export async function sendThankYouEmail(params: ThankYouParams): Promise<void> {
  const creds = ensureConfigured();
  if (!creds) return;
  if (!params.toEmail) {
    console.warn('[EmailJS] No recipient email — skipping thank-you send.');
    return;
  }

  const interestLabel = INTEREST_LABEL[params.interest] ?? 'supporting PediPlace';
  const donationDisplay = params.donationAmount && !isNaN(Number(params.donationAmount))
    ? `$${Number(params.donationAmount).toLocaleString()}`
    : '';

  const templateParams = {
    to_name:         params.toName   || 'Friend',
    to_email:        params.toEmail,
    interest_area:   interestLabel,
    program:         params.program  || 'our pediatric programs',
    donation_amount: donationDisplay,
    reply_to:        'info@pediplace.org',
  };

  console.log('[EmailJS] Sending thank-you email →', templateParams.to_email);

  try {
    const result = await emailjs.send(
      creds.serviceId,
      creds.templateId,
      templateParams,
      { publicKey: creds.publicKey },
    );
    console.log('[EmailJS] Thank-you email sent ✓', result.status, result.text);
  } catch (err: any) {
    console.error('[EmailJS] Thank-you email FAILED:', err?.text || err?.message || err);
  }
}

/**
 * Sends a new lead notification to the PediPlace admin.
 */
export async function sendAdminLeadNotification(params: ThankYouParams): Promise<void> {
  const creds = ensureConfigured();
  if (!creds) return;

  const templateId = ENV_ADMIN_TEMPLATE_ID || creds.templateId;
  const interestLabel = INTEREST_LABEL[params.interest] ?? params.interest;
  const donationDisplay = params.donationAmount && !isNaN(Number(params.donationAmount))
    ? `$${Number(params.donationAmount).toLocaleString()}`
    : 'Not specified';

  try {
    await emailjs.send(
      creds.serviceId,
      templateId,
      {
        to_name:         'PediPlace Team',
        to_email:        ADMIN_EMAIL,
        interest_area:   interestLabel,
        program:         params.program  || 'Not specified',
        donation_amount: donationDisplay,
        lead_name:       params.toName   || 'Anonymous',
        lead_email:      params.toEmail,
        reply_to:        params.toEmail  || 'info@pediplace.org',
      },
      { publicKey: creds.publicKey },
    );
    console.log('[EmailJS] Admin notification sent for lead:', params.toEmail);
  } catch (err) {
    console.error('[EmailJS] Failed to send admin notification:', err);
  }
}
