import { Link } from "react-router";
import { ArrowLeft, Flower2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/PageHeading";
import { SeedlingPreview } from "@/components/garden/SeedlingPreview";
export const CollectionScaffoldPage = () => (
  <>
    <PageHeading
      title="植物收藏"
      description="每一株植物，都将记录你认真投入的时光。"
      eyebrow="THE THINGS YOU GROW"
      action={
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft size={16} aria-hidden="true" />
            返回今日任务
          </Link>
        </Button>
      }
    />
    <div className="fg-collection-intro">
      <Flower2 size={20} aria-hidden="true" />
      <p>收藏与解锁功能即将开放，下方为植物卡片预览。</p>
    </div>
    <div className="fg-collection-preview">
      {[
        { name: "向日葵", description: "把每一份认真，长成明亮的模样。" },
        { name: "薰衣草", description: "在安静的时光里，找到自己的节奏。" },
        { name: "绣球花", description: "一点一滴的积累，也会开成一簇花。" },
      ].map((plant) => (
        <article className="fg-card fg-plant-preview" key={plant.name}>
          <div className="fg-plant-image">
            <SeedlingPreview />
            <span>素材占位</span>
          </div>
          <div className="fg-plant-info">
            <h2>{plant.name}</h2>
            <p>{plant.description}</p>
            <span>
              <Sprout size={15} aria-hidden="true" />
              收藏数据待接入
            </span>
          </div>
        </article>
      ))}
    </div>
    <p className="fg-page-quote">先享受生长，再期待花开。</p>
  </>
);
