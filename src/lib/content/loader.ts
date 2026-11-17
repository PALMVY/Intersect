import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseHouse, type House } from "./schema";

const HOUSES_DIR = path.join(process.cwd(), "content", "houses");

const readHouse = (fileName: string): House => {
  try {
    const raw: unknown = JSON.parse(readFileSync(path.join(HOUSES_DIR, fileName), "utf8"));
    return parseHouse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Conteúdo inválido em content/houses/${fileName}: ${reason}`);
  }
};

/** Só no servidor. Falha de forma clara se qualquer arquivo de Casa estiver inválido. */
export const loadHouses = (): House[] => {
  const houses = readdirSync(HOUSES_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map(readHouse)
    .sort((a, b) => a.order_index - b.order_index);

  const seen = new Set<number>();
  for (const house of houses) {
    if (seen.has(house.order_index)) {
      throw new Error(`Duas Casas com order_index ${house.order_index} em content/houses`);
    }
    seen.add(house.order_index);
  }
  return houses;
};
