import type { ReactNode } from "react";
import { Sprout } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { IcpBeian } from "@/components/layout/IcpBeian";
import { SeedlingPreview } from "@/components/garden/SeedlingPreview";
import { LoginArtwork } from "./LoginArtwork";
import "./login.css";
export const AuthCardHeading = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="fg-login-card-heading">
    <span className="fg-login-seedling">
      <SeedlingPreview />
    </span>
    <h2 id="login-form-title">{title}</h2>
    <p>{description}</p>
  </div>
);
export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="fg-login-page">
    <a className="fg-skip-link" href="#login-form-region">
      跳到表单
    </a>
    <header className="fg-login-header">
      <Brand interactive={false} />
    </header>
    <main className="fg-login-main">
      <section className="fg-login-story" aria-labelledby="login-story-title">
        <div className="fg-login-story-copy">
          <h1 id="login-story-title">
            种下一份专注，
            <wbr />
            收获更好的自己。
          </h1>
          <p>让每一次投入，都在花园里留下成长的痕迹。</p>
        </div>
        <LoginArtwork />
      </section>
      <section
        className="fg-login-card"
        aria-labelledby="login-form-title"
        id="login-form-region"
        tabIndex={-1}
      >
        {children}
        <p className="fg-login-encouragement">
          <Sprout size={19} aria-hidden="true" />
          <span>温柔积累，每一天都算数。</span>
          <Sprout size={19} aria-hidden="true" />
        </p>
      </section>
    </main>
    <footer className="fg-login-footer">
      <span aria-hidden="true" />
      <div className="fg-login-footer-copy">
        <p>专注花园 · 让专注自然生长</p>
        <IcpBeian className="fg-icp-beian" />
      </div>
      <span aria-hidden="true" />
    </footer>
  </div>
);
