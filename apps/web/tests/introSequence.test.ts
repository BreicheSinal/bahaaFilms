import { describe, expect, it } from "vitest";
import { getIntroSequencePhase } from "@/components/intro/introSequence";

describe("getIntroSequencePhase", () => {
  it("switches from readable greetings to the blur burst before the logo", () => {
    expect(getIntroSequencePhase(3900, 4600)).toBe("greetings");
    expect(getIntroSequencePhase(4100, 4600)).toBe("burst");
  });
});
