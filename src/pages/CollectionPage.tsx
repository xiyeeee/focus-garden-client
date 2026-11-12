import { LockKeyhole, Sprout } from "lucide-react";
import { useGarden } from "@/hooks/useGarden";
import { plantCatalog, plantTypes } from "@/features/garden/catalog";
import { PlantArt } from "@/features/garden/PlantArt";
export const CollectionPage = () => {
  const { data } = useGarden();
  if (!data) return null;
  const unlocked = plantTypes.filter((type) =>
    data.plants.some((plant) => plant.type === type),
  ).length;
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">THE THINGS YOU GROW</div>
          <h1>收藏一座小小的自然。</h1>
          <p>每一株植物，都来自一段只属于你的专注时光。</p>
        </div>
        <span className="collection-count">
          <Sprout size={18} />
          {unlocked} / {plantTypes.length} 种已解锁
        </span>
      </section>
      <section className="collection-grid">
        {plantTypes.map((type) => {
          const plants = data.plants.filter((plant) => plant.type === type);
          return (
            <article
              className={`collection-card ${plants.length ? "" : "locked"}`}
              key={type}
            >
              <div className="collection-art">
                <PlantArt type={type} />
                <span className="collection-badge">
                  {plants.length ? (
                    `× ${plants.length}`
                  ) : (
                    <>
                      <LockKeyhole size={12} />
                      未解锁
                    </>
                  )}
                </span>
              </div>
              <div className="collection-info">
                <span className="eyebrow">
                  {plants.length ? "GROWN WITH FOCUS" : "WAITING TO BLOOM"}
                </span>
                <h2>{plantCatalog[type].name}</h2>
                <p>{plantCatalog[type].description}</p>
                <small>
                  {plants.length
                    ? `首次获得 · ${new Date(Math.min(...plants.map((plant) => plant.obtainedAt))).toLocaleDateString("zh-CN")}`
                    : "选择它，完成一轮专注即可解锁"}
                </small>
                {plants.length > 0 && (
                  <small>
                    最近获得 ·{" "}
                    {new Date(
                      Math.max(...plants.map((plant) => plant.obtainedAt)),
                    ).toLocaleString("zh-CN")}
                  </small>
                )}
              </div>
            </article>
          );
        })}
      </section>
      <p className="collection-note">
        不必集齐所有植物，享受每一次生长就很好。
      </p>
    </>
  );
};
