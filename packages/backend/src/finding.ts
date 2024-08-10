import type { SDK } from "caido:plugin";

import type { Finding } from "./analyse";

export async function createFinding(sdk: SDK, finding: Finding) {
  let description = "Found reflected parameters in reponse:\n";
  for (let p of finding.parameters) {
    description += `- ${p.key}: ${p.value} (${p.cookieName})\n`;
  }

  const result = await sdk.findings.create({
    dedupeKey: finding.dedupeKey,
    description,
    reporter: "Reflector Cookie",
    request: finding.request,
    title: "Reflected parameters in cookie",
  });

  sdk.console.log(`Finding created with ID ${result.getId()}`);
}
