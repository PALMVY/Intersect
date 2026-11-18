const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const channelLuminance = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex: string): number => {
  if (!HEX_COLOR.test(hex)) throw new Error(`cor inválida, use #RRGGBB: ${hex}`);
  const [red, green, blue] = [1, 3, 5].map((start) =>
    channelLuminance(parseInt(hex.slice(start, start + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/** Razão de contraste da WCAG 2.x entre duas cores #RRGGBB (de 1 a 21). */
export const contrastRatio = (foreground: string, background: string): number => {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
};

/** Lê as variáveis `--nome: #hex;` do primeiro bloco `:root`; ignora valores que não são hex. */
export const readCssColorTokens = (css: string): Record<string, string> => {
  const rootBlock = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const declarations = rootBlock.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g);
  return Object.fromEntries([...declarations].map(([, name, value]) => [name, value]));
};
