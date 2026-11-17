import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadHouses } from "@/lib/content/loader";
import { moduleId, parseHouse, questionId } from "@/lib/content/schema";

type RawHouse = {
  quiz: { options: string[]; correct_option_index: number }[];
  modules: { level: string; order_index: number }[];
  philosophers: { slug: string }[];
};

const raw = () => JSON.parse(readFileSync("content/houses/casa-01.json", "utf8")) as RawHouse;

describe("parseHouse", () => {
  it("aceita a Casa 1 real", () => {
    const house = parseHouse(raw());
    expect(house.order_index).toBe(1);
    expect(house.quiz).toHaveLength(3);
    expect(house.modules).toHaveLength(5);
  });

  it("rejeita questão com número de opções diferente de 4", () => {
    const data = raw();
    data.quiz[0].options = data.quiz[0].options.slice(0, 3);
    expect(() => parseHouse(data)).toThrow();
  });

  it.each([4, -1])("rejeita correct_option_index %i", (index) => {
    const data = raw();
    data.quiz[0].correct_option_index = index;
    expect(() => parseHouse(data)).toThrow();
  });

  it("rejeita prova com menos de 3 questões", () => {
    const data = raw();
    data.quiz = data.quiz.slice(0, 2);
    expect(() => parseHouse(data)).toThrow();
  });

  it("rejeita módulos com o mesmo nível e a mesma ordem", () => {
    const data = raw();
    data.modules[1].level = data.modules[0].level;
    data.modules[1].order_index = data.modules[0].order_index;
    expect(() => parseHouse(data)).toThrow();
  });

  it("rejeita filósofos com slug repetido", () => {
    const data = raw();
    data.philosophers[1].slug = data.philosophers[0].slug;
    expect(() => parseHouse(data)).toThrow();
  });

  it("rejeita nível de módulo desconhecido", () => {
    const data = raw();
    data.modules[0].level = "expert";
    expect(() => parseHouse(data)).toThrow();
  });
});

describe("ids derivados", () => {
  it("monta o id do módulo e da questão", () => {
    const house = parseHouse(raw());
    expect(moduleId(house.modules[0])).toBe("beginner-1");
    expect(questionId(house.quiz[2])).toBe("q3");
  });
});

describe("loadHouses", () => {
  it("lê os arquivos de content/houses ordenados por order_index", () => {
    const houses = loadHouses();
    expect(houses.length).toBeGreaterThanOrEqual(1);
    expect(houses[0].title).toBe("Casa I: A Centelha do Logos");
    const indexes = houses.map((house) => house.order_index);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });
});
