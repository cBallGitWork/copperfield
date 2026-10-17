import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { LEAGUE_NAME, SEASON } from "@epl/core";
import { Crest } from "./appIcon";
import { TOKEN_SRGB } from "./config";
import { DESIGN_WIDTH, LAUNCH } from "./launchLayout";

// The installed app's launch screen as Championship Manager 99/00 opens: the title on a raised royal-blue plate, the
// season on a pressed one in the accent, the crest, and a still loading bar in a sunken well.

/** A two-pixel CM bevel: light top-left and dark bottom-right, or the two swapped when the plate is pressed. */
function bevel(pressed: boolean, edge: number) {
  const [lit, shade] = pressed ? [TOKEN_SRGB.chromeShade, TOKEN_SRGB.chromeLit] : [TOKEN_SRGB.chromeLit, TOKEN_SRGB.chromeShade];
  return {
    borderStyle: "solid" as const,
    borderWidth: edge,
    borderTopColor: lit,
    borderLeftColor: lit,
    borderBottomColor: shade,
    borderRightColor: shade,
  };
}

export async function cmLoader(size: { width: number; height: number }): Promise<ImageResponse> {
  const pt = size.width / DESIGN_WIDTH;
  const chrome = await readFile(join(process.cwd(), "app/fonts/oxanium/card-700.ttf"));
  const { shadow: cast, title, season, caption, bar } = LAUNCH;
  const shadow = `${cast.offset * pt}px ${cast.offset * pt}px ${cast.blur * pt}px rgba(0,0,0,${cast.alpha})`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: TOKEN_SRGB.bg,
          fontFamily: "Oxanium",
          paddingTop: size.height * LAUNCH.inset,
          paddingBottom: size.height * LAUNCH.inset,
          paddingLeft: LAUNCH.gutter * pt,
          paddingRight: LAUNCH.gutter * pt,
        }}
      >
        <div
          style={{
            ...bevel(false, LAUNCH.bevel * pt),
            width: "100%",
            height: title.height * pt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: TOKEN_SRGB.chrome,
            color: TOKEN_SRGB.ink,
            fontSize: title.type * pt,
            textShadow: shadow,
          }}
        >
          {LEAGUE_NAME}
        </div>
        <div
          style={{
            ...bevel(true, LAUNCH.bevel * pt),
            marginTop: season.gap * pt,
            width: `${season.span * 100}%`,
            height: season.height * pt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: TOKEN_SRGB.chrome,
            color: TOKEN_SRGB.accent,
            fontSize: season.type * pt,
            textShadow: shadow,
          }}
        >
          {`Season ${SEASON}`}
        </div>
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Crest width={Math.round(size.width * LAUNCH.crest)} />
        </div>
        <div
          style={{
            color: TOKEN_SRGB.muted,
            fontSize: caption.type * pt,
            letterSpacing: caption.track * pt,
            marginBottom: caption.gap * pt,
          }}
        >
          {caption.words}
        </div>
        <div
          style={{
            width: "100%",
            height: bar.height * pt,
            display: "flex",
            background: TOKEN_SRGB.well,
            borderStyle: "solid",
            borderWidth: bar.edge * pt,
            borderColor: TOKEN_SRGB.wellEdge,
            padding: bar.inset * pt,
          }}
        >
          <div
            style={{
              width: `${bar.loaded * 100}%`,
              height: "100%",
              background: `linear-gradient(180deg, ${TOKEN_SRGB.indexTop}, ${TOKEN_SRGB.indexFoot})`,
            }}
          />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Oxanium", data: chrome, weight: 700, style: "normal" }] },
  );
}
