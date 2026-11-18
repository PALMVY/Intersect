import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, readCssColorTokens } from "@/lib/theme/contrast";

const tokens = readCssColorTokens(readFileSync("src/app/globals.css", "utf8"));

const token = (name: string): string => {
  const value = tokens[name];
  if (!value) throw new Error(`token ausente em globals.css: ${name}`);
  return value;
};

describe("contraste dos tokens", () => {
  it("calcula a razão conhecida de preto sobre branco", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("reprova o cinza original do Stitch", () => {
    expect(contrastRatio("#64748B", "#090A0F")).toBeLessThan(4.5);
  });

  it.each(["--text", "--text-muted", "--gold", "--danger", "--success"])(
    "%s passa 4,5:1 sobre o fundo e sobre o vidro elevado",
    (name) => {
      expect(contrastRatio(token(name), token("--bg"))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(token(name), token("--surface-solid"))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("o texto escuro passa 4,5:1 sobre o dourado (nó concluído)", () => {
    expect(contrastRatio(token("--bg"), token("--gold"))).toBeGreaterThanOrEqual(4.5);
  });
});
