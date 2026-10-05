import { describe, it, expect } from "vitest";
import { normalizePhone, whatsappLink, smsLink, telLink, followUpDate, caseRef, firstContactMessage } from "./contact";

describe("contact helpers", () => {
  it("normalises the Zambian test number in all common formats", () => {
    expect(normalizePhone("+260975364673")).toBe("260975364673");
    expect(normalizePhone("0975 364 673")).toBe("260975364673");
    expect(normalizePhone("975364673")).toBe("260975364673");
  });
  it("builds device links with the case reference", () => {
    const msg = firstContactMessage("SC-2026-ABCD1234", "whatsapp");
    expect(whatsappLink("0975364673", msg)).toContain("https://wa.me/260975364673?text=");
    expect(decodeURIComponent(whatsappLink("0975364673", msg))).toContain("SC-2026-ABCD1234");
    expect(smsLink("0975364673", "hi")).toBe("sms:+260975364673?body=hi");
    expect(telLink("0975364673")).toBe("tel:+260975364673");
  });
  it("computes follow-up dates", () => {
    const from = new Date("2026-10-05T10:00:00Z");
    expect(followUpDate("24h", "", from)).toBe("2026-10-06");
    expect(followUpDate("48h", "", from)).toBe("2026-10-07");
    expect(followUpDate("7d", "", from)).toBe("2026-10-12");
    expect(followUpDate("none", "", from)).toBeNull();
    expect(followUpDate("custom", "2026-11-01", from)).toBe("2026-11-01");
  });
  it("formats case references", () => {
    expect(caseRef("1a2b3c4d-0000", "2026-03-01T00:00:00Z")).toBe("SC-2026-1A2B3C4D");
  });
});
