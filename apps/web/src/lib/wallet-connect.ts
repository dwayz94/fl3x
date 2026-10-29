"use client";

/**
 * Our own wallet connection, no connect kit: we only need an address and a
 * signature on a one-time message.
 * - EVM: EIP-6963 (every modern extension announces itself), window.ethereum as fallback.
 * - Solana: Wallet Standard, with the legacy window.phantom / solflare / backpack objects as fallback.
 */

export type WalletChain = "solana" | "evm";

export interface DetectedWallet {
  id: string;
  name: string;
  icon: string | null;
  chain: WalletChain;
  connect: () => Promise<string>;
  sign: (address: string, message: string) => Promise<string>;
}

/** Wallets we show even when not installed, with where to get them. */
export const KNOWN_WALLETS: { name: string; chain: WalletChain; url: string; match: RegExp }[] = [
  { name: "Phantom", chain: "solana", url: "https://phantom.com/download", match: /phantom/i },
  { name: "Solflare", chain: "solana", url: "https://solflare.com/download", match: /solflare/i },
  { name: "Backpack", chain: "solana", url: "https://backpack.app/download", match: /backpack/i },
  { name: "MetaMask", chain: "evm", url: "https://metamask.io/download", match: /metamask/i },
  { name: "Rabby", chain: "evm", url: "https://rabby.io", match: /rabby/i },
  { name: "Coinbase Wallet", chain: "evm", url: "https://www.coinbase.com/wallet/downloads", match: /coinbase/i },
  { name: "Trust Wallet", chain: "evm", url: "https://trustwallet.com/download", match: /trust/i },
  { name: "OKX Wallet", chain: "evm", url: "https://www.okx.com/web3", match: /okx/i },
  { name: "Rainbow", chain: "evm", url: "https://rainbow.me/download", match: /rainbow/i },
];

/* ---------------------------------------------------------------- EVM */

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
interface Eip6963Detail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193;
}

const toHex = (s: string) => `0x${Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("")}`;

function evmWallet(id: string, name: string, icon: string | null, provider: Eip1193): DetectedWallet {
  return {
    id,
    name,
    icon,
    chain: "evm",
    connect: async () => {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts[0]) throw new Error("No account selected");
      return accounts[0];
    },
    sign: async (address, message) => (await provider.request({ method: "personal_sign", params: [toHex(message), address] })) as string,
  };
}

function detectEvm(): Promise<DetectedWallet[]> {
  return new Promise((resolve) => {
    const found = new Map<string, DetectedWallet>();
    const onAnnounce = (e: Event) => {
      const { info, provider } = (e as CustomEvent<Eip6963Detail>).detail;
      found.set(info.rdns, evmWallet(info.rdns, info.name, info.icon, provider));
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    // Announcements are synchronous in practice; a short wait covers slow extensions.
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      const legacy = (window as unknown as { ethereum?: Eip1193 & { isMetaMask?: boolean } }).ethereum;
      if (found.size === 0 && legacy) found.set("injected", evmWallet("injected", legacy.isMetaMask ? "MetaMask" : "Browser wallet", null, legacy));
      resolve([...found.values()]);
    }, 300);
  });
}

/* ------------------------------------------------------------- Solana */

interface StandardAccount {
  address: string;
}
interface StandardWallet {
  name: string;
  icon: string;
  chains: readonly string[];
  features: {
    "standard:connect"?: { connect(): Promise<{ accounts: readonly StandardAccount[] }> };
    "solana:signMessage"?: { signMessage(input: { account: StandardAccount; message: Uint8Array }): Promise<{ signature: Uint8Array }[]> };
  };
  accounts: readonly StandardAccount[];
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

function standardWallet(w: StandardWallet): DetectedWallet {
  return {
    id: `sol:${w.name}`,
    name: w.name,
    icon: w.icon,
    chain: "solana",
    connect: async () => {
      const { accounts } = await w.features["standard:connect"]!.connect();
      if (!accounts[0]) throw new Error("No account selected");
      return accounts[0].address;
    },
    sign: async (address, message) => {
      const account = w.accounts.find((a) => a.address === address) ?? { address };
      const [out] = await w.features["solana:signMessage"]!.signMessage({ account, message: new TextEncoder().encode(message) });
      return toBase64(out!.signature);
    },
  };
}

interface LegacySolana {
  connect(): Promise<{ publicKey: { toString(): string } }>;
  signMessage(msg: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array } | Uint8Array>;
}

function detectSolana(): DetectedWallet[] {
  const found = new Map<string, DetectedWallet>();
  // Wallet Standard handshake: wallets register into the object we hand them.
  const api = {
    register: (...wallets: StandardWallet[]) => {
      for (const w of wallets) {
        if (w.chains.some((c) => c.startsWith("solana:")) && w.features["standard:connect"] && w.features["solana:signMessage"]) {
          found.set(w.name, standardWallet(w));
        }
      }
      return () => {};
    },
  };
  const onRegister = (e: Event) => (e as CustomEvent<(a: typeof api) => void>).detail(api);
  window.addEventListener("wallet-standard:register-wallet", onRegister);
  window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: api }));
  window.removeEventListener("wallet-standard:register-wallet", onRegister);

  const w = window as unknown as { phantom?: { solana?: LegacySolana }; solflare?: LegacySolana; backpack?: LegacySolana };
  const legacy: [string, LegacySolana | undefined][] = [["Phantom", w.phantom?.solana], ["Solflare", w.solflare], ["Backpack", w.backpack]];
  for (const [name, p] of legacy) {
    if (!p || found.has(name)) continue;
    found.set(name, {
      id: `sol:${name}`,
      name,
      icon: null,
      chain: "solana",
      connect: async () => (await p.connect()).publicKey.toString(),
      sign: async (_address, message) => {
        const out = await p.signMessage(new TextEncoder().encode(message), "utf8");
        return toBase64(out instanceof Uint8Array ? out : out.signature);
      },
    });
  }
  return [...found.values()];
}

export async function detectWallets(): Promise<DetectedWallet[]> {
  const evm = await detectEvm();
  return [...detectSolana(), ...evm];
}
