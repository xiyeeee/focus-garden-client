import type { GardenService } from "@/types";
import { mockService } from "./mock";
// 接口确认后在此替换成实现同一 GardenService 的 HTTP adapter。
export const gardenService: GardenService = mockService;
