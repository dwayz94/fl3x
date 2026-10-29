import { renderShareImage, shareImageSize, shareImageType } from "./share-image";

export const alt = "FL3X profile";
export const size = shareImageSize;
export const contentType = shareImageType;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  return renderShareImage((await params).username);
}
