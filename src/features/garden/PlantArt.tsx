import { getGrowthStage } from "./growth";
import type { PlantType } from "@/types";
import { plantCatalog } from "./catalog";
export const PlantArt = ({
  type = "fern",
  progress = 1,
  className = "",
}: {
  type?: PlantType;
  progress?: number;
  className?: string;
}) => {
  const color = plantCatalog[type].color;
  const { index: stage, name: stageName } = getGrowthStage(progress);
  return (
    <svg
      className={`plant-art ${className}`}
      viewBox="0 0 200 210"
      role="img"
      aria-label={`${plantCatalog[type].name} · ${stageName}`}
    >
      <ellipse cx="100" cy="192" rx="57" ry="9" fill="#3c513e" opacity=".08" />
      <path d="M64 151h72l-10 34q-26 13-52 0z" fill="#ceaa87" />
      <path d="M60 148q40-10 80 0v10q-40 9-80 0z" fill="#e0c1a2" />
      <ellipse cx="100" cy="149" rx="31" ry="5" fill="#79674c" />
      {stage === 0 ? (
        <ellipse cx="100" cy="145" rx="6" ry="4" fill="#ad945d" />
      ) : (
        <g className="plant-stem" style={{ transformOrigin: "100px 150px" }}>
          <path
            d={`M100 148Q91 110 101 ${stage === 1 ? 116 : 62}`}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          {type === "cactus" && stage > 1 ? (
            <>
              <path
                d="M99 145V58M99 112H77V83M101 100h23V74"
                stroke={color}
                strokeWidth="18"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M99 65v74"
                stroke="#adc4a0"
                strokeWidth="2"
                strokeDasharray="3 6"
              />
            </>
          ) : (
            <>
              <path d="M98 130Q62 134 65 107Q93 105 98 130" fill={color} />
              <path d="M99 115q33 3 35-25q-29-3-35 25" fill="#91ad70" />
              {stage > 1 && (
                <>
                  <path d="M99 98Q57 99 59 66q32 0 40 32" fill={color} />
                  <path d="M101 80q35 0 35-29q-28-2-35 29" fill="#a5ba7b" />
                </>
              )}
              {stage === 3 && type === "fern" && (
                <>
                  <path d="M101 64Q77 56 88 32q22 10 13 32" fill="#91ad70" />
                  <path d="M96 115Q39 120 43 86q31-1 53 29" fill="#7b9d5f" />
                </>
              )}
              {stage === 3 && type === "daisy" && (
                <g transform="translate(102 49)">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <ellipse
                      key={angle}
                      cy="-14"
                      rx="7"
                      ry="14"
                      fill="#fff9e9"
                      stroke="#e5ddc3"
                      strokeWidth="1"
                      transform={`rotate(${angle})`}
                    />
                  ))}
                  <circle r="10" fill="#e2ba4b" />
                </g>
              )}
              {stage === 3 && type === "tulip" && (
                <path
                  d="M101 66Q72 53 80 28l15 9 8-16 9 15 15-9q8 31-26 39"
                  fill={color}
                />
              )}
            </>
          )}
        </g>
      )}
    </svg>
  );
};
