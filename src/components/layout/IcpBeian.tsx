const ICP_BEIAN_NO = "浙ICP备2024134749号-1";
const ICP_BEIAN_URL = "https://beian.miit.gov.cn/";

export const IcpBeian = ({ className }: { className?: string }) => (
  <a
    className={className}
    href={ICP_BEIAN_URL}
    target="_blank"
    rel="noreferrer"
  >
    {ICP_BEIAN_NO}
  </a>
);
