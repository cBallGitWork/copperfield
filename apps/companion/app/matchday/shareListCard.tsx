import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { TOKEN_SRGB } from "../config";
import { SHARE_LAYOUT, type ShareList, type ShareSide } from "./shareList";

// The gameweek's ties as a PNG in the desk's dress: navy ground, grey wells, CM's blue index blocks, cyan scores.
// Literal colours: a PNG cannot read a token.

const INDEX = 74;
const SCORE = 168;

export async function shareListCard(list: ShareList): Promise<ImageResponse> {
  const chrome = await readFile(join(process.cwd(), "app/fonts/oxanium/card-700.ttf"));
  const { pad, title, stamp, gap, groupHead, groupFoot, row } = SHARE_LAYOUT;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: pad,
          background: TOKEN_SRGB.bg,
          color: TOKEN_SRGB.ink,
          fontFamily: "Oxanium",
        }}
      >
        <div style={{ display: "flex", height: title, alignItems: "center", fontSize: 44 }}>{list.title}</div>
        <div style={{ display: "flex", height: stamp, alignItems: "flex-start", fontSize: 26, color: TOKEN_SRGB.muted }}>
          {list.stamp}
        </div>
        {list.groups.map((group) => (
          <div
            key={group.title}
            style={{ display: "flex", flexDirection: "column", marginTop: gap, background: TOKEN_SRGB.well, padding: `0 20px ${groupFoot}px` }}
          >
            <div
              style={{
                display: "flex",
                height: groupHead,
                alignItems: "center",
                fontSize: 22,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: TOKEN_SRGB.muted,
                borderBottom: `2px solid ${TOKEN_SRGB.line}`,
              }}
            >
              {group.title}
            </div>
            {group.rows.map((each, at) => (
              <div
                key={at}
                style={{ display: "flex", height: row, alignItems: "stretch", borderBottom: `2px solid ${TOKEN_SRGB.bg}` }}
              >
                <Block place={each.home.place} />
                <Name side={each.home} at="home" />
                <div style={{ display: "flex", width: SCORE, alignItems: "center", justifyContent: "center", fontSize: 44, color: TOKEN_SRGB.info }}>
                  {figure(each.score.home)}
                  <span style={{ margin: "0 10px", color: TOKEN_SRGB.muted }}>:</span>
                  {figure(each.score.away)}
                </div>
                <Name side={each.away} at="away" />
                <Block place={each.away.place} />
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
    { ...list.size, fonts: [{ name: "Oxanium", data: chrome, weight: 700, style: "normal" }] },
  );
}

/** Absence is the dash; a nought prints. */
function figure(points: number | null): string {
  return points === null ? "—" : String(points);
}

/** CM's blue block: his place, or empty for a side not yet drawn. */
function Block({ place }: { place: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        width: INDEX,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        background: `linear-gradient(180deg, ${TOKEN_SRGB.indexTop}, ${TOKEN_SRGB.indexFoot})`,
      }}
    >
      {place ?? ""}
    </div>
  );
}

/** The name, with his men still to play under it; the away side reads from the right. */
function Name({ side, at }: { side: ShareSide; at: "home" | "away" }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: at === "home" ? "flex-start" : "flex-end",
        padding: "0 12px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", fontSize: 32, whiteSpace: "nowrap" }}>{side.name}</div>
      {side.left ? <div style={{ display: "flex", fontSize: 22, color: TOKEN_SRGB.faint }}>{side.left}</div> : null}
    </div>
  );
}
