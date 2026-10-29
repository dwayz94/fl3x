import { env } from "../env";

interface ParsedTokenAccounts {
  result?: { value: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } } }[] };
  error?: { message: string };
}

/** Sum of $TOKEN held by an owner across all its token accounts (SPL + Token-2022). */
async function balanceOf(owner: string, mint: string): Promise<number> {
  const res = await fetch(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [owner, { mint }, { encoding: "jsonParsed", commitment: "confirmed" }],
    }),
    // A hung RPC must not hang sign-in and /me.
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Solana RPC: HTTP ${res.status}`);
  const json = (await res.json()) as ParsedTokenAccounts;
  if (json.error) throw new Error(`Solana RPC: ${json.error.message}`);
  return (json.result?.value ?? []).reduce(
    (sum, a) => sum + (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0),
    0,
  );
}

export async function totalTokenBalance(wallets: string[]): Promise<number> {
  if (!env.TOKEN_MINT || wallets.length === 0) return 0;
  const balances = await Promise.all(wallets.map((w) => balanceOf(w, env.TOKEN_MINT!)));
  return balances.reduce((a, b) => a + b, 0);
}
