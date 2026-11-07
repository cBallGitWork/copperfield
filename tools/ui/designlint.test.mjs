import { describe, expect, it } from "vitest";
import { drawnText, lintPage, styleRules } from "./designlint.mjs";

const page = (body, css = "") => `<html><head><title>Board · one</title><style>${css}</style></head><body>${body}</body></html>`;

describe("designlint", () => {
  it("reads only what is drawn, entities decoded", () => {
    expect(drawnText(page("<p>Arsenal&nbsp;2</p><script>a · b</script>"))).toEqual(["Arsenal 2"]);
  });

  it("passes a clean board", () => {
    expect(lintPage(page("<td>Raccoons</td><td>42</td>", ".cm-index { background: linear-gradient(#335, #113) }"))).toEqual([]);
  });

  it("fails a middle-dot string, a key and a typed star", () => {
    const problems = lintPage(page("<p>Knee · GW10</p><h3>Difficulty key</h3><span>★★★</span>"));
    expect(problems).toHaveLength(3);
  });

  it("fails a source named in the screen, but not a way out of the app", () => {
    expect(lintPage(page("<p>Points from FPL</p>"))).toHaveLength(1);
    expect(lintPage(page("<a>Open on Fantrax ↗</a><a>FPL</a>"))).toEqual([]);
  });

  it("fails a radius, a gradient button, tracked caps, a blur and a soft shadow", () => {
    const css = [
      ".pill { border-radius: 999px }",
      ".go { background: linear-gradient(90deg, red, blue) }",
      ".label { text-transform: uppercase; letter-spacing: .12em }",
      ".glass { backdrop-filter: blur(8px) }",
      ".card { box-shadow: 0 12px 24px rgba(0,0,0,.4) }",
    ].join("\n");
    expect(lintPage(page("", css))).toHaveLength(5);
  });

  it("lets a crest keep its circle and a square stay square", () => {
    expect(lintPage(page("", ".crest { border-radius: 50% } .well { border-radius: 0 }"))).toEqual([]);
  });

  it("reads inline styles as rules", () => {
    expect(styleRules(`<div style="border-radius: 8px">x</div>`)).toEqual([["(inline)", "border-radius: 8px"]]);
  });
});
