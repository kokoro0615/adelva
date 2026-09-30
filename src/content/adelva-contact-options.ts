/**
 * Server-side derivation of the /contact challenge options, kept apart from
 * `adelva-contact.ts` so the client bundle never pulls in the challenges page
 * data. The domain of each challenge is the one the challenges page links it to.
 */
import { challengeBands } from "@/content/adelva-challenges";
import { challenges, serviceDomains } from "@/content/adelva-navigation";
import { undecidedOption, type ChallengeOption } from "@/content/adelva-contact";

export const challengeOptions: readonly ChallengeOption[] = [
  ...challenges.map((item, index) => ({
    id: item.href.split("#")[1] ?? `challenge-${index}`,
    label: item.label,
    domain: serviceDomains.findIndex((d) => d.href === challengeBands[index]?.href),
  })),
  undecidedOption,
];
