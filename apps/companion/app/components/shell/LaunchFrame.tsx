import type { CSSProperties } from "react";
import { LEAGUE_NAME, SEASON } from "@epl/core";
import LaunchCurtain from "./LaunchCurtain";
import LeagueCrest from "./LeagueCrest";
import { TOKEN_SRGB } from "../../config";
import { LAUNCH_FRAME, LAUNCH_STAMP, launchSize } from "../../launchFrame";
import { DESIGN_WIDTH, LAUNCH } from "../../launchLayout";
import "../../launchFrame.css";

// CM's loading screen over the installed app's first paint, as `launchScreen.tsx` draws iOS's launch image. It is in
// the server's HTML and shown by CSS, so the first paint is the loader whether or not JavaScript has run.

/** A length in the frame's points: one of a 390-point phone's, scaled to this screen. */
const pt = (points: number) => `calc(${points} * var(--launch-pt))`;

export default function LaunchFrame() {
  const { shadow: cast, title, season, caption, bar } = LAUNCH;
  const shadow = `${pt(cast.offset)} ${pt(cast.offset)} ${pt(cast.blur)} rgb(0 0 0 / ${cast.alpha})`;
  const frame = {
    "--launch-pt": launchSize(),
    "--launch-run": `${LAUNCH_FRAME.minimum}ms`,
    "--launch-fade": `${LAUNCH_FRAME.fade}ms`,
    "--launch-stall": `${LAUNCH_FRAME.stall}ms`,
    "--launch-loaded": `${bar.loaded * 100}%`,
  } as CSSProperties;
  const plate = { borderWidth: pt(LAUNCH.bevel), textShadow: shadow };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LAUNCH_STAMP }} />
      <LaunchCurtain style={frame}>
        <div
          className="cm-launch-column"
          style={{ width: pt(DESIGN_WIDTH), paddingBlock: `${LAUNCH.inset * 100}svh`, paddingInline: pt(LAUNCH.gutter) }}
        >
          <div
            className="cm-bevel cm-primary cm-launch-plate"
            style={{ ...plate, width: "100%", height: pt(title.height), fontSize: pt(title.type), color: "var(--color-ink)" }}
          >
            {LEAGUE_NAME}
          </div>
          <div
            className="cm-bevel cm-bevel-pressed cm-primary cm-launch-plate"
            style={{
              ...plate,
              marginTop: pt(season.gap),
              width: `${season.span * 100}%`,
              height: pt(season.height),
              fontSize: pt(season.type),
            }}
          >
            {`Season ${SEASON}`}
          </div>
          <div className="cm-launch-crest">
            <div style={{ width: pt(DESIGN_WIDTH * LAUNCH.crest) }}>
              <LeagueCrest />
            </div>
          </div>
          <div
            style={{
              color: "var(--color-muted)",
              fontSize: pt(caption.type),
              letterSpacing: pt(caption.track),
              marginBottom: pt(caption.gap),
            }}
          >
            {caption.words}
          </div>
          <div className="cm-launch-well" style={{ height: pt(bar.height), borderWidth: pt(bar.edge), padding: pt(bar.inset) }}>
            <div
              className="cm-launch-fill"
              style={{ background: `linear-gradient(180deg, ${TOKEN_SRGB.indexTop}, ${TOKEN_SRGB.indexFoot})` }}
            />
          </div>
        </div>
      </LaunchCurtain>
    </>
  );
}
