import test from "node:test";
import assert from "node:assert/strict";
import { generateContractPdf } from "../lib/contracts/pdf.js";
import { DEFAULT_TEMPLATE } from "../lib/contracts/defaultTemplate.js";

for (const count of [1, 2, 3]) {
  for (const signed of [false, true]) {
    test(`${signed ? "signed" : "unsigned"} PDF keeps all content inside the page for ${count} equipment item(s)`, () => {
      const contract = fixture(count);
      const pdf = generateContractPdf(contract, { signed });
      const binary = pdf.toString("binary");
      assert.equal((binary.match(/\/Type \/Page\b/g) || []).length, 8);
      for (let index = 1; index <= count; index++) assert.match(binary, new RegExp(`QA-MODEL-${index}`));
      assert.match(binary, /ESSENTIAL PURPOSE/);
      assert.match(binary, /EACH OF THE PARTIES CERTIFIES/);
      assertLegalTextStaysAboveFooter(binary);
    });
  }
}

function assertLegalTextStaysAboveFooter(binary) {
  const streams = [...binary.matchAll(/stream\n([\s\S]*?)\nendstream/g)].slice(0, 8).map(match => match[1]);
  assert.equal(streams.length, 8);
  for (const pageIndex of [3, 4, 5, 6]) {
    const textY = [...streams[pageIndex].matchAll(/1 0 0 1 [-\d.]+ ([-\d.]+) Tm/g)].map(match => Number(match[1]));
    const bodyY = textY.filter(value => value > 20);
    assert.ok(bodyY.length, `page ${pageIndex + 1} has no text`);
    assert.ok(Math.min(...bodyY) >= 35, `page ${pageIndex + 1} text crossed the safe footer margin`);
  }
}

function fixture(count) {
  const equipmentItems = Array.from({ length: count }, (_, index) => ({
    make: "QA Make",
    model: `QA-MODEL-${index + 1}`,
    year: String(2020 + index),
    serialNumber: `QA-SERIAL-${index + 1}`,
    hours: String(100 + index),
    descriptionHtml: `<p><strong>Equipment ${index + 1}</strong></p><ul><li>First line</li><li>Second line</li></ul>`,
    price: 10000 + index * 1000,
  }));
  const subtotal = equipmentItems.reduce((sum, item) => sum + item.price, 0);
  return {
    orderNumber: `QA-${count}`,
    orderDate: new Date("2026-11-16T00:00:00Z"),
    deliveryDate: new Date("2026-11-20T00:00:00Z"),
    buyer: { name: "PDF Test Buyer", company: "Buyer Company", address: "100 Test Street", cityStateZip: "Mesa, AZ 85206", phonePrimary: "602-555-0100", email: "buyer@example.com" },
    seller: { name: "Sellers Trading Post", legalName: "Fazur Inc. DBA Sellers Trading Post", address: "2151 US-412 E", cityStateZip: "Siloam Springs, AR 72761", phone: "(479) 373-9708", email: "sales@sellerstradingpost.net", representativeName: "Ryan Fagan" },
    deliveryAddress: "200 Delivery Street, Mesa, AZ 85207",
    equipment: equipmentItems[0],
    equipmentItems,
    pricing: { subtotal, taxes: 0, shipping: 900, total: subtotal + 900, currency: "USD", equipmentPricingMode: count > 1 ? "per_item" : "subtotal" },
    deliveryChecks: { deliveryCompleted: true, buyerInspected: true, manualsGiven: true, safetyExplained: true, maintenanceExplained: true },
    warranty: { type: "Other", other: true, text: "Full seller warranty applies." },
    templateSnapshot: { ...structuredClone(DEFAULT_TEMPLATE), company: { ...DEFAULT_TEMPLATE.company, name: "Sellers Trading Post", legalName: "Fazur Inc. DBA Sellers Trading Post" }, sellerRepresentative: { name: "Ryan Fagan", signatureUrl: "/contract-seller-signature.png", signedDate: "2026-11-16" } },
    signedAt: new Date("2026-11-17T00:00:00Z"),
    signerName: "PDF Test Buyer",
    signatureMethod: "drawn",
    signature: [[[0.05, 0.7], [0.3, 0.2], [0.55, 0.65], [0.9, 0.25]]],
    acceptedTerms: true,
  };
}
