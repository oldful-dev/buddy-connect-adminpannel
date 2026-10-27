// Shared input rules — the same ones the backend enforces.

/**
 * Letters (any script), spaces, dots, apostrophes, hyphens; at least 3 letters,
 * and no obvious dummy text ("aa", "bbb", "aa b").
 */
export function isValidName(value) {
    const name = String(value || '').trim().replace(/\s+/g, ' ');
    if (!/^[\p{L}][\p{L}\p{M} .'-]{1,59}$/u.test(name)) return false;
    const letters = name.replace(/[^\p{L}]/gu, '');
    if (letters.length < 3) return false;
    if (new Set(letters.toLowerCase()).size === 1) return false;
    return !name.split(/[ .'-]+/).filter(Boolean).some((w) => w.length >= 2 && new Set(w.toLowerCase()).size === 1);
}

export const NAME_MESSAGE = 'Please enter a real name using letters only (at least 3 letters, no repeated-letter dummy text).';
