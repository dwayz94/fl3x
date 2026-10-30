import { normalizeUsername } from "@fl3x/shared";
import { renderShareImage } from "../share-image";

/**
 * The profile card as a PNG download ("Download card" in Settings): same image as
 * link previews, rendered fresh so it matches the profile right now.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const username = normalizeUsername((await params).username);
  const image = await renderShareImage(username, true);
  return new Response(image.body, {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="fl3x-${username}.png"`,
      "cache-control": "private, max-age=60",
    },
  });
}
