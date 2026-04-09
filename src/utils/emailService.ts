import emailjs from '@emailjs/browser';

const SERVICE_ID        = import.meta.env.VITE_EMAILJS_SERVICE_ID        as string;
const TEMPLATE_ID       = import.meta.env.VITE_EMAILJS_TEMPLATE_ID       as string;
const ADMIN_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY        = import.meta.env.VITE_EMAILJS_PUBLIC_KEY        as string;

// Initialize EmailJS once with the public key
if (PUBLIC_KEY) {
  emailjs.init({ publicKey: PUBLIC_KEY });
}

// Admin email that receives new lead notifications
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

function isConfigured(): boolean {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[EmailJS] Missing env vars. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY to enable auto-emails.');
    return false;
  }
  return true;
}

/**
 * Sends an automatic thank-you email to a PediBot lead via EmailJS.
 *
 * IMPORTANT: In your EmailJS template (template_q4un36i), the "To Email"
 * field MUST be set to {{to_email}} so the email goes to the donor.
 * If it's set to a static address, all emails go there instead.
 */
export async function sendThankYouEmail(params: ThankYouParams): Promise<void> {
  if (!isConfigured()) return;
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
    to_email:        params.toEmail,          // template "To Email" field must be {{to_email}}
    interest_area:   interestLabel,
    program:         params.program  || 'our pediatric programs',
    donation_amount: donationDisplay,
    reply_to:        'info@pediplace.org',
  };

  console.log('[EmailJS] Sending thank-you email →', templateParams.to_email, templateParams);

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('[EmailJS] Thank-you email sent ✓', result.status, result.text);
  } catch (err: any) {
    console.error('[EmailJS] Thank-you email FAILED:', err?.text || err?.message || err);
  }
}

/**
 * Sends a new lead notification to the PediPlace admin.
 * Uses VITE_EMAILJS_ADMIN_TEMPLATE_ID if set, otherwise falls back to the
 * same template (admin must set {{to_email}} = admin address in that template).
 */
export async function sendAdminLeadNotification(params: ThankYouParams): Promise<void> {
  if (!isConfigured()) return;

  const templateId = ADMIN_TEMPLATE_ID || TEMPLATE_ID;
  const interestLabel = INTEREST_LABEL[params.interest] ?? params.interest;
  const donationDisplay = params.donationAmount && !isNaN(Number(params.donationAmount))
    ? `$${Number(params.donationAmount).toLocaleString()}`
    : 'Not specified';

  try {
    await emailjs.send(
      SERVICE_ID,
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
    );
    console.log('[EmailJS] Admin notification sent for lead:', params.toEmail);
  } catch (err) {
    console.error('[EmailJS] Failed to send admin notification:', err);
  }
}
