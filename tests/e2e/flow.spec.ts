import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

type RawHouse = {
  title: string;
  modules: { title: string }[];
  quiz: { options: string[]; correct_option_index: number }[];
};
const casa1: RawHouse = JSON.parse(readFileSync("content/houses/casa-01.json", "utf8"));

test("sem sessão, qualquer rota protegida leva ao login", async ({ page }) => {
  for (const path of ["/", "/casa/1", "/casa/2"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

// Este teste grava progresso de verdade: use uma conta de teste só para ele.
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("com a conta de teste", () => {
  test.skip(!email || !password, "defina E2E_EMAIL e E2E_PASSWORD (conta de teste dedicada)");

  test("login, checklist, prova e conclusão da Casa 1", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Senha").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("heading", { name: "Fase 1" })).toBeVisible();
    await page.getByRole("link", { name: new RegExp(casa1.title) }).click();

    for (const studyModule of casa1.modules) {
      await page.getByRole("checkbox", { name: new RegExp(studyModule.title) }).check();
    }

    for (const [index, question] of casa1.quiz.entries()) {
      await page.getByRole("radio", { name: question.options[question.correct_option_index] }).check();
      await page.getByRole("button", { name: "Responder" }).click();
      const last = index === casa1.quiz.length - 1;
      await page.getByRole("button", { name: last ? "Ver resultado" : "Próxima" }).click();
    }

    await expect(page.getByText("aprovado!")).toBeVisible();
    await expect(page.getByText("Casa concluída!")).toBeVisible();
  });
});
