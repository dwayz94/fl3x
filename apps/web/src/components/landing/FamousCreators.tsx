import Image from "next/image";
import { Icon, Verified } from "@/components/ui";

const creators = [
  { name: "SOLAMIES", image: "/images/creators/solamies.jpg", description: "Building the future of Solana one degen at a time" },
  { name: "SWIFZUI", image: "/images/creators/swifzui.jpg", description: "NFT artist & creative mind behind viral collections" },
  { name: "YASH", image: "/images/creators/yash.jpg", description: "DeFi builder shipping products that matter" },
  { name: "BI0", image: "/images/creators/bi0.jpg", description: "Web3 dev crafting the next generation of dApps" },
];

export function FamousCreators() {
  // Two identical halves so translateX(-50%) loops seamlessly at any width.
  const loop = [...creators, ...creators, ...creators, ...creators];
  return (
    <section className="overflow-hidden py-24 md:py-40">
      <div className="px-gutter">
        <h2 className="mb-4 text-5xl md:text-6xl">FAMOUS CReATORS</h2>
        <p className="mb-12 max-w-2xl text-lg text-fg-2">
          Top creators on X showcasing their web3 presence like never before. Click to explore their fl3x.
        </p>
      </div>
      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
          {loop.map((c, i) => (
            <div key={i} className="flex h-[312px] w-[208px] shrink-0 flex-col rounded-[32px] bg-surface p-3" aria-hidden={i >= creators.length}>
              <div className="relative size-[184px] overflow-hidden rounded-[32px] bg-surface-2">
                <Image src={c.image} alt={c.name} fill sizes="184px" className="object-cover" />
              </div>
              <div className="flex items-center gap-1 px-3 pt-2">
                <span className="font-primary text-[36px] leading-tight">{c.name}</span>
                <Verified size={24} />
              </div>
              <p className="px-3 text-[11px] leading-tight font-normal text-fg-2">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
