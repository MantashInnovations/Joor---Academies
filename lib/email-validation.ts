/**
 * A more comprehensive list of common disposable/dummy email domains.
 * In production, the Abstract API (or similar) will provide deeper verification 
 * (MX records, SMTP checks, etc.) via the server-side API route.
 */
export const DISPOSABLE_DOMAINS = [
  // Common disposable services
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  '10minutemail.com', 'temp-mail.org', 'sharklasers.com', 'getairmail.com',
  'dispostable.com', 'yopmail.com', 'discard.email', 'trashmail.com',
  'jetable.org', 'maildrop.cc', 'mailnesia.com', 'mintemail.com',
  'mytrashmail.com', 'mail-trash.com', 'tempmail.com', 'temp-mail.com',
  'throwawaymail.com', 'fakeinbox.com', 'mailforspam.com', 'spambox.us',
  // Added common garbage/placeholder domains
  'ww.com', 'aa.com', 'bb.com', 'cc.com', 'dd.com', 'ee.com', 'ff.com', 
  'gg.com', 'hh.com', 'ii.com', 'jj.com', 'kk.com', 'll.com', 'mm.com',
  'nn.com', 'oo.com', 'pp.com', 'qq.com', 'rr.com', 'ss.com', 'tt.com',
  'uu.com', 'vv.com', 'xx.com', 'yy.com', 'zz.com',
  '123.com', '1234.com', 'abc.com', 'abcd.com',
];

/**
 * Common trusted providers that are known to be real.
 * Emails from these domains are generally exempted from stricter heuristics.
 */
export const TRUSTED_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 
  'me.com', 'live.com', 'msn.com', 'aol.com', 'yandex.com', 'protonmail.com',
  'proton.me', 'mail.ru', 'gmx.com', 'zoho.com', 'rocketmail.com'
];

/**
 * Validates if an email is from a known disposable or dummy source.
 * This is used for immediate client-side feedback.
 */
export function validateEmailSource(email: string): { isValid: boolean; error?: string } {
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return { isValid: false, error: 'Invalid email format' };
  }

  const normalizedDomain = domain.toLowerCase();

  // 1. Check if it's a known disposable or test domain
  if (DISPOSABLE_DOMAINS.includes(normalizedDomain)) {
    return { 
      isValid: false, 
      error: 'Signup with disposable or dummy email addresses is not allowed. Please use a real personal or business email.' 
    };
  }

  // 2. Strict heuristics for untrusted domains (garbage check)
  if (!TRUSTED_DOMAINS.includes(normalizedDomain)) {
    // a. Block repeating single characters like "ww", "aaa", etc. in local part or domain name
    const domainName = normalizedDomain.split('.')[0];
    const isRepeating = (str: string) => str.length > 1 && /^(\w)\1+$/.test(str);

    if (isRepeating(localPart) || (domainName && isRepeating(domainName))) {
      return { 
        isValid: false, 
        error: 'This email address looks like dummy data. Please use an authentic email address.' 
      };
    }

    // b. Block very short "suspicious" domains that aren't trusted
    if (domainName && domainName.length < 3) {
      return { 
        isValid: false, 
        error: 'The email domain you entered is not recognized. Please use a valid email provider.' 
      };
    }

    // c. Block obviously keyboard-mashing local parts (asdf, qwerty, etc.)
    const garbagePatterns = ['asdf', 'qwerty', '123456', 'zxcv'];
    if (garbagePatterns.some(pattern => localPart.toLowerCase().includes(pattern))) {
      return { 
        isValid: false, 
        error: 'This email address appears to be dummy test data. Please provide a real email.' 
      };
    }
  }

  return { isValid: true };
}


