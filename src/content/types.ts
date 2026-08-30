import type { AssetId } from "@/content/assets";
import type { RouteFamily, RoutePath } from "@/content/route-manifest";

export type BandTone = "ice" | "mushroom" | "navy" | "deep";

export interface HeroTab {
  readonly href: RoutePath;
  readonly label: string;
}

export interface MetaEntry {
  readonly label: string;
  readonly value: string;
}

export interface Hero {
  /** Small tracked label or serif italic kicker above the title. */
  readonly eyebrow?: string;
  readonly eyebrowStyle?: "tracked" | "serif";
  readonly title: string;
  readonly titleStyle: "condensed" | "serif" | "serif-italic";
  /** `center` matches the measured index/detail heroes; `anchor` the homepage. */
  readonly align: "center" | "anchor";
  readonly lede?: string;
  readonly ledeStyle?: "sans" | "serif";
  readonly meta?: readonly MetaEntry[];
  readonly assetId: AssetId;
  /** Bottom hero tab strip, present where the measured template requires it. */
  readonly tabs?: readonly HeroTab[];
}

export interface CardRef {
  readonly href: RoutePath;
  readonly kicker: string;
  readonly title: string;
  readonly body: string;
  readonly assetId: AssetId;
}

export interface OwnerRow {
  readonly label: string;
  readonly hint: string;
}

export type DocumentBlock =
  | { readonly kind: "heading"; readonly text: string }
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "list"; readonly items: readonly string[] };

export type Section =
  | {
      readonly kind: "statement";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly body: readonly string[];
    }
  | {
      readonly kind: "story";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly body: readonly string[];
      readonly assetId: AssetId;
      readonly caption: string;
      readonly flip?: boolean;
    }
  | {
      readonly kind: "facts";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly intro?: string;
      readonly items: readonly {
        readonly label: string;
        readonly value: string;
        readonly note: string;
      }[];
    }
  | {
      readonly kind: "sequence";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly intro?: string;
      readonly steps: readonly {
        readonly label: string;
        readonly heading: string;
        readonly body: string;
      }[];
    }
  | {
      readonly kind: "banner";
      readonly id: string;
      readonly assetId: AssetId;
      readonly caption: string;
    }
  | {
      readonly kind: "rail";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly intro?: string;
      readonly cards: readonly CardRef[];
    }
  | {
      readonly kind: "ownerContent";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly description: string;
      readonly rows: readonly OwnerRow[];
    }
  | {
      readonly kind: "document";
      readonly id: string;
      readonly tone: BandTone;
      readonly heading: string;
      readonly blocks: readonly DocumentBlock[];
    }
  | { readonly kind: "rates"; readonly id: string; readonly tone: BandTone }
  | { readonly kind: "enquiry"; readonly id: string; readonly tone: BandTone };

export interface CallToAction {
  readonly heading: string;
  readonly body: string;
  readonly href: RoutePath;
  readonly label: string;
  readonly tone: BandTone;
}

export interface PageDocument {
  readonly path: RoutePath;
  readonly family: RouteFamily;
  readonly title: string;
  readonly description: string;
  readonly hero: Hero;
  readonly sections: readonly Section[];
  readonly cta: CallToAction | null;
}
