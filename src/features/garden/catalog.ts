import type { PlantType } from "@/types";
export const plantCatalog: Record<
  PlantType,
  { name: string; description: string; color: string }
> = {
  fern: {
    name: "小蕨",
    description: "把耐心，长成一片绿意。",
    color: "#668b53",
  },
  daisy: {
    name: "小雏菊",
    description: "每一份专注，都值得盛开。",
    color: "#dbb44c",
  },
  cactus: {
    name: "仙人掌",
    description: "慢一点，也有自己的力量。",
    color: "#558b7c",
  },
  tulip: {
    name: "郁金香",
    description: "让认真生活的日子开花。",
    color: "#c78889",
  },
};
export const plantTypes = Object.keys(plantCatalog) as PlantType[];
