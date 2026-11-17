import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/auth/paths";

describe("isPublicPath", () => {
  it("só a página de login é pública", () => {
    expect(isPublicPath("/login")).toBe(true);
  });

  it.each(["/", "/casa/1", "/casa/2", "/login/extra", "/qualquer"])("%s exige sessão", (pathname) => {
    expect(isPublicPath(pathname)).toBe(false);
  });
});
