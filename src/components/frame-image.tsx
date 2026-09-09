import Image from "next/image";

import { getAsset, type AssetId } from "@/content/assets";

interface FrameImageProps {
  readonly assetId: AssetId;
  readonly sizes: string;
  readonly priority?: boolean;
  /**
   * Decorative media sits behind a heading that already names the scene, so it
   * is exposed with an empty accessible name rather than duplicating the copy.
   */
  readonly decorative?: boolean;
}

/**
 * The only production image surface.
 *
 * Every source resolves through the approved asset registry, so no target
 * photograph, remote URL or unrecorded file can reach the bundle.
 */
export function FrameImage({
  assetId,
  sizes,
  priority = false,
  decorative = false,
}: FrameImageProps) {
  const asset = getAsset(assetId);

  return (
    <Image
      className="frame-image"
      src={asset.src}
      alt={decorative ? "" : asset.alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      style={{ objectPosition: asset.focal }}
    />
  );
}
