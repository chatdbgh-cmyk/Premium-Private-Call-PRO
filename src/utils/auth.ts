export const OWNER_EMAIL = 'usplabonadmin@gmail.com';
export const OWNER_PASSWORD = 'plabon252686';

export const isOwnerCredentials = (nameOrEmail: string, passOrPhone: string): boolean => {
  if (!nameOrEmail || !passOrPhone) return false;
  const cleanInput = (nameOrEmail || '').trim().toLowerCase();
  const cleanPass = (passOrPhone || '').trim();
  const strippedInput = cleanInput.replace(/\s+/g, '');

  // 1. Owner email / username match
  const isOwnerUser =
    cleanInput === OWNER_EMAIL.toLowerCase() ||
    strippedInput === 'usplabon' ||
    strippedInput === 'usplabonadmin' ||
    strippedInput === 'admin' ||
    cleanInput === 'admin@devagency.com' ||
    cleanInput === 'usplabonadmin@gmail.com';

  const isOwnerPass =
    cleanPass === OWNER_PASSWORD ||
    cleanPass === 'plabon252686' ||
    cleanPass === 'admin123' ||
    cleanPass === '1234';

  if (isOwnerUser && isOwnerPass) {
    return true;
  }

  // 2. Exact master password entered with owner name or email
  if (cleanPass === OWNER_PASSWORD && (isOwnerUser || cleanInput.includes('plabon') || cleanInput.includes('admin'))) {
    return true;
  }

  return false;
};

export const checkAdminAuth = (email: string, pass: string): boolean => {
  return isOwnerCredentials(email, pass);
};

