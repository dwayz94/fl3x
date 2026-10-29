import { renderSiteImage, shareImageSize, shareImageType } from "./u/[username]/share-image";

export const alt = "FL3X: your on-chain identity";
export const size = shareImageSize;
export const contentType = shareImageType;

export default function Image() {
  return renderSiteImage();
}
