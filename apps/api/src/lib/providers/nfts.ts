import type { NftData } from "@fl3x/shared";
import { cached } from "../cache";
import { env } from "../../env";

type Asset = {
  id: string;
  interface: string;
  compression?: { compressed?: boolean };
  content?: { metadata?: { name?: string }; links?: { image?: string }; files?: { uri?: string; cdn_uri?: string; mime?: string }[] };
  grouping?: { group_key: string; collection_metadata?: { name?: string } }[];
  burnt?: boolean;
};

const NFT_INTERFACES = new Set(["V1_NFT", "ProgrammableNFT", "MplCoreAsset", "V2_NFT"]);

/**
 * One wallet's NFTs through the DAS API (searchAssets, served by Helius and most
 * Solana RPC providers). Compressed NFTs are filtered out by the provider: that's
 * where airdropped spam lives, with images inlined as base64 (getAssetsByOwner
 * returned 350 MB for one wallet). Cached 10 min.
 */
function walletNfts(owner: string) {
  return cached<NftData["items"]>(`nfts:${owner}`, 600, async () => {
    const res = await fetch(env.SOLANA_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "searchAssets",
        params: { ownerAddress: owner, compressed: false, tokenType: "nonFungible", page: 1, limit: 50, displayOptions: { showCollectionMetadata: true } },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`DAS responded ${res.status}`);
    const json = (await res.json()) as { result?: { items: Asset[] }; error?: { message: string } };
    if (!json.result) throw new Error(json.error?.message ?? "DAS unavailable on this RPC");
    return json.result.items.flatMap((a) => {
      if (!NFT_INTERFACES.has(a.interface) || a.compression?.compressed || a.burnt) return [];
      const file = a.content?.files?.find((f) => f.mime?.startsWith("image/")) ?? a.content?.files?.[0];
      const image = file?.cdn_uri || a.content?.links?.image || file?.uri;
      // Only web images: data: URIs can weigh megabytes.
      if (!image || !/^https?:\/\//.test(image)) return [];
      const collection = a.grouping?.find((g) => g.group_key === "collection")?.collection_metadata?.name || null;
      return [{ id: a.id, name: a.content?.metadata?.name?.trim() || "Untitled", image, collection }];
    });
  });
}

/** NFTs across a member's wallets. EVM addresses are ignored for now (Solana only). */
export async function getNfts(wallets: string[]): Promise<NftData> {
  const solana = wallets.filter((w) => !w.startsWith("0x"));
  const lists = await Promise.all(solana.map((w) => walletNfts(w).catch(() => [])));
  const all = lists.flat();
  return { items: all.slice(0, 12), total: all.length, wallets: solana.length };
}
