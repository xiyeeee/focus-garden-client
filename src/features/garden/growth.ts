const growthStages = [
  { until: 0.08, index: 0, name: "种子", message: "种子 · 刚刚开始" },
  { until: 0.35, index: 1, name: "发芽", message: "发芽 · 一点点向上" },
  { until: 0.75, index: 2, name: "幼苗", message: "幼苗 · 正在成长" },
  { until: Infinity, index: 3, name: "成熟", message: "即将成熟" },
];
export const getGrowthStage = (progress: number) =>
  growthStages.find((stage) => progress < stage.until) ?? growthStages[3];
