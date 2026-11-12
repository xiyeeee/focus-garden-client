import { visualAssets } from "@/config/visual-assets";
export const LoginArtwork = () => (
  <div className="fg-login-artwork">
    <img
      src={visualAssets.loginGarden}
      width="1280"
      height="1280"
      alt="温暖的浮空花园：小屋、树木、向日葵与溪流，陪伴每一次专注"
      fetchPriority="high"
    />
    <span className="fg-login-firefly firefly-one" aria-hidden="true" />
    <span className="fg-login-firefly firefly-two" aria-hidden="true" />
    <span className="fg-login-firefly firefly-three" aria-hidden="true" />
  </div>
);
