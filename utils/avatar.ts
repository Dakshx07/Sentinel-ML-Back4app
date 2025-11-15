// A simple hashing function for a string
const getHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// A set of vibrant, accessible colors for the avatar backgrounds
const AVATAR_COLORS = [
  '#9F54FF', // brand-purple
  '#00D4FF', // brand-cyan
  '#FF7B72', // A coral red
  '#F5D547', // A warm yellow
  '#54FFBD', // A sea green
  '#FF6AC1', // A bright pink
];

/**
 * Generates a unique, deterministic SVG avatar based on a user's ID (e.g., email).
 * The avatar displays the first letter of the ID on a colored background.
 * @param id - A unique string identifier for the user.
 * @returns A base64-encoded SVG data URL.
 */
export const generateAvatar = (id: string): string => {
  if (!id) return '';

  const hash = getHash(id);
  const backgroundColor = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const firstLetter = id.charAt(0).toUpperCase();

  const svgContent = `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${backgroundColor}" />
      <text
        x="50%"
        y="52%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Syne, sans-serif"
        font-size="36"
        font-weight="bold"
        fill="#FFFFFF"
      >
        ${firstLetter}
      </text>
    </svg>
  `.trim();

  // Use btoa for browser environment.
  const base64 = btoa(svgContent);
  return `data:image/svg+xml;base64,${base64}`;
};