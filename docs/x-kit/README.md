# Kit X : @fl3xdotlol

Tweets prêts à poster, tweet épinglé, article et images. Les textes sont en anglais (langue du produit), les notes en français.

Tout en une page, avec boutons Copier : ouvrir `docs/x-kit/kit.html` dans un navigateur (régénérée par `python3 scripts/x-kit-page.py` après une modification de ce fichier).

Images : `docs/x-kit/images/` (PNG 2x, logo en bas à gauche, `fl3x.lol` en bas à droite). Pour les régénérer : lancer le site (`localhost:3000`), puis `sh scripts/x-kit.sh` (ou `sh scripts/x-kit.sh launch` pour une seule). Les visuels sont dans `apps/web/src/components/x-kit/visuals.tsx` et utilisent les vrais composants du site (carte de profil, widgets, badges) avec les données de démo (`lib/demo.ts`). Pas de lueur rose en fond : noir plat ou les images FL3X.

| Image | Format | Usage |
|---|---|---|
| `avatar.png`, `avatar-pink.png` | 800×800 | Photo de profil X : sac rose sur noir, ou noir sur rose |
| `banner.png`, `banner-url.png`, `banner-pink.png` | 1500×500 | Trois bannières au choix (pluie de sacs, URL géante, version rose). Le logo est à droite du centre : la photo de profil cache le bas à gauche et le mobile rogne le haut et le bas |
| `launch.png` | 1200×675 | Tweet épinglé |
| `article-cover.png` | 1500×600 (5:2) | Couverture de l'article |
| Les autres | 1200×675 (16:9) | Tweets. Le profil montré est celui de FL3X. Tokens (WIF, JUP, POPCAT), chaînes (Bankless sur YouTube, kaicenat sur Twitch) et titre (Kendrick Lamar, « HUMBLE. ») sont réels, copiés le 31/10/2026 dans `public/images/demo/real`. Les montants du P&L restent des exemples |
| `giveaway.png`, `invite-codes.png`, `claim.png`, `tiers.png` | 1200×675 | Giveaways, drops de codes, réservation du nom, tiers (limites réelles de `TIER_LIMITS`) |

---

## 1. Ce que dit l'algorithme X (repo `xai-org/x-algorithm`)

Le fil « For You » prédit, pour chaque lecteur, la probabilité de chaque action sur un post, puis fait une somme pondérée (`home-mixer/params/param.rs`). Les poids de production :

| Action | Poids | Ce que ça veut dire pour nous |
|---|---|---|
| Copier le lien du post | **20** | La plus forte action positive. Un post qu'on a envie d'envoyer à un pote gagne. |
| Réponse | **5** (×15 de bonus entre comptes qui se suivent mutuellement) | Les questions qui font répondre valent bien plus que des likes. Répondre à tout le monde. |
| Citation (quote) | **5** | Donner une raison de citer : « quote avec ton profil ». |
| Partage en DM | **5** | « Envoie ça à un pote qui mérite son profil ». Le lien d'invitation s'y prête parfaitement. |
| Suivre l'auteur | **4** | Chaque post doit donner une raison de suivre la suite. |
| Partage | 2 | |
| Repost | 1 | |
| Like | **0,66** | Les likes pèsent peu. |
| Clic sur un lien | 0,2 | Faible. D'où le domaine écrit sur chaque image : il marque sans dépendre du lien. |
| Pas intéressé / masquer / bloquer / signaler | **-52 / -59 / -31 / -234** | Une seule réaction négative efface des dizaines de likes prédits. Pas de spam, pas de tags en masse, pas de réponses agressives chez des inconnus. |

Autres règles utiles trouvées dans le code :

- **Un post vit 48 h** dans le For You (`AgeFilter`), et un post déjà vu ne revient pas. Il faut poster régulièrement, jamais reposter le même texte.
- **Boost des nouveaux comptes** : un auteur à moins de 200 impressions, avec moins de 50 000 abonnés, voit ses posts de moins de 2 h placés plus haut dans le fil (`ColdStart*`). Au début, poster souvent : chaque post frais a sa chance.
- **Temps de lecture** : depuis octobre 2026, le modèle est entraîné à remonter les posts **lus jusqu'au bout** et prédit mieux le temps passé. Un article clair et un post qui se lit en entier sont récompensés ; le remplissage est puni (« not dwelled », poids négatif).
- **Vidéo** : aucun bonus pour les vues vidéo (poids 0), et les vidéos de moins de 10 s sont écartées de certains formats. Les images suffisent.
- Les réponses et reposts de comptes qu'on ne suit pas sont filtrés : ce sont **nos propres posts** qui portent la portée, pas les réponses chez les autres.

## 2. Plan de publication

- **Pré-lancement (sur invitation)** : 3 posts par jour, espacés de quelques heures (le boost des nouveaux comptes joue sur des posts de moins de 2 h). Un widget, un giveaway ou un drop de codes, une question. Chaque post renvoie vers la même idée : réserve ton nom.
- **Giveaways** : 1 à 2 par semaine, pas plus (sinon ça sent la ferme et les gens ne répondent plus). Toujours une vraie récompense livrée, et on cite publiquement les gagnants.
- **Drops de codes** : 2 à 3 par semaine, 5 codes à chaque fois, avec 4 caractères cachés : il faut répondre ou venir en DM pour avoir le reste. Les codes viennent de `/admin` (Invite codes).
- **Ouverture** : le tweet épinglé, puis 3 ou 4 posts dans la journée. Republier les plus beaux profils des membres (avec leur accord).
- **Après** : 2 posts par jour minimum, en alternant widget, badge, giveaway, vrais profils.
- **Toujours** : répondre à chaque réponse dans la première heure. Pas de hashtags, pas de tags en masse, jamais « tag 3 friends » (signalements = -234 dans l'algorithme).
- **Le lien** `fl3x.lol` dans le texte une fois sur deux ou trois, pas plus : le domaine est déjà sur chaque image. `fl3x.lol/@you` mène à l'inscription (et au dashboard pour un membre).
- Le token n'est pas lancé : aucun ticker à acheter, aucune adresse de contrat, aucune promesse de prix. On vend le profil.

---

## 3. Tweet épinglé

Image : `launch.png`

```
FL3X is your crypto profile, live.

P&L, wallets, your token, your Discord, your stream, your music. One link that updates itself.

Invite-only for now. Claim your name before someone else does: fl3x.lol/@you
```

Variante plus courte (même image `launch.png`) :

```
One link for everything you are onchain.

fl3x.lol/@you
```

## 4. Bio du compte X

Nom affiché : `FL3X` (ou `FL3X | invite-only` pendant le pré-lancement). Lien : `fl3x.lol`. Localisation : `onchain` ou `fl3x.lol/@you`.

Bio (une au choix) :

```
Your crypto profile, live. Wallets, P&L, token, community, music: one link.
Invite-only. Claim your name 👇
```

```
The link in bio for onchain people.
Live widgets, verified wallets, badges. Invite-only for now.
```

```
fl3x.lol/@you
Your bio link, but it moves. Hold $FL3X for Premium.
```

## 5. Giveaways et codes d'invitation

Pour livrer un giveaway Premium : copier les adresses gagnantes dans `/admin` → **Wallet grants** (Premium, note « Giveaway #1 »). Le gagnant est Premium dès qu'il a lié ce wallet (signature dans Settings ou à l'inscription), même s'il n'avait pas encore de compte. Pendant le pré-lancement, lui envoyer aussi un code d'invitation, sinon il ne peut pas s'inscrire.

**G1.** Image : `giveaway.png`
```
Drop your Solana address below.

We're picking wallets from the replies for FL3X Premium: 12 widgets, the checkmark, animated backgrounds, 90-day analytics.

Winners announced tomorrow.
```

**G2.** Image : `giveaway.png` (deuxième édition, texte différent)
```
Premium giveaway #2.

Reply with your SOL wallet. 10 winners, picked tonight.
Already on FL3X? It shows up on your profile as soon as we pick you.
```

**G3.** Sans image (réponse aux gagnants, à adapter)
```
Congrats, you're FL3X Premium.

Sign in at fl3x.lol/join with code XXXX-XXXX and link this wallet in Settings. The checkmark is yours.
```

**G4.** Sans image (annonce des gagnants, en citant le post G1)
```
Winners are in. 10 wallets just got Premium.

Check your replies. Didn't win? Next round on Friday.
```

**G5.** Image : `invite-codes.png`
```
5 invite codes. First come, first served.

K7Q2-••••
M4XW-••••
P9ZD-••••
T3HN-••••
V8RC-••••

Reply "FL3X" and we'll DM you the rest.
```

**G6.** Sans image
```
Like this and we'll drop 10 invite codes in the replies at 1K.
```

**G7.** Image : `claim.png`
```
Reply with the handle you want on FL3X.

We'll tell you if it's still free. Best ones get an invite.
```

**G8.** Sans image
```
Every FL3X member gets their own invite link: fl3x.lol/invite/yourname

Bring 3 friends: Contributor badge. 10: Recruiter. 25: Ambassador. 50: Legend.
```

**G9.** Image : `tiers.png`
```
Free profile: 4 widgets.
Hold $FL3X: Starter.
Hold more: Premium, 12 widgets and the checkmark.

Or win it. Drop your SOL address under our pinned giveaway.
```

## 6. Avant le lancement (sur invitation)

**1.** Image : `invite-only.png`
```
FL3X is invite-only for now.

Got an invite? Claim your name.
No invite? Sign in with X and you're on the waitlist.
```

**2.** Image : `widgets.png`
```
Your bio link, but it moves.

P&L, token, Telegram, Twitch, YouTube, local time.
Every widget updates on its own.
```

**3.** Sans image (réponses)
```
What would you put on your profile first?

P&L, your token, your Discord, your stream?
```

**4.** Image : `wallets.png`
```
Linking a wallet on FL3X = one free signature.

No transaction. No approval. No connect kit.
Solana and EVM, as many wallets as you want.
```

**5.** Image : `customize.png`
```
Drag a widget. The others make room.

Building your profile should feel like your home screen, not a form.
```

**6.** Image : `badges.png`
```
Badges live under your name.

Early Adopter if you joined before launch. OG for the first 100. Contributor if you brought 3 friends.
```

**7.** Sans image (citations)
```
Quote this with the handle you want. We'll tell you if it's still free.
```

**8.** Image : `spotify.png`
```
Your card can show what you're listening to.

Connect Spotify once. Not playing? It shows the last track.
Apple Music, Deezer and TIDAL links work too.
```

**9.** Sans image
```
Screenshots of a wallet get old the second you post them.

A FL3X widget reads the chain every time someone opens your page.
```

**10.** Sans image (réponses)
```
Wrong answers only: what's in your wallet right now?
```

**11.** Sans image
```
Your Linktree doesn't know you're up 40% this month.
```

## 7. Ouverture (après le tweet épinglé)

**12.** Image : `referral.png`
```
Your handle is your invite link.

fl3x.lol/invite/yourname
No code to remember. Badges at 3, 10, 25 and 50 friends.
```

**13.** Image : `verified.png`
```
The FL3X checkmark is for Premium holders.

It follows your wallet, not a subscription.
```

**14.** Image : `analytics.png`
```
Your profile comes with analytics.

Views, link clicks, countries, devices, and the site each visitor came from.
```

**15.** Image : `before-after.png`
```
Send this to the friend whose bio is still a Linktree.
```

**16.** Image : `phone.png`
```
One link. Every screen.

Built for the phone your visitors tap it on.
```

**17.** Image : `tiers.png`
```
Hold $FL3X, unlock more.

Starter, then Premium: more widgets, more links, longer analytics, the checkmark.
Your tier is checked from your wallet every few minutes.
```

## 8. Après l'ouverture (à recycler, jamais le même texte deux fois)

**18.** (de vrais profils de membres, avec leur accord)
```
Profile of the day.

Reply with yours, we'll quote the best ones.
```

**19.**
```
Your P&L widget is built from snapshots we take ourselves, every hour.

No screenshots. No editing.
```

**20.**
```
Twitch or YouTube on your profile?

Put your channel in once. Live now? It shows the live. Offline? Your latest video.
```

**21.**
```
Reply with the widget you want next.
```

**22.**
```
Wallet addresses never reach your public profile.

Visitors see the numbers, not where they come from.
```

**23.**
```
New on FL3X: Hyperliquid, Polymarket, P&L Calendar, Recent Trades, Watchlist.

Your whole trading life on one link.
```

**24.**
```
Put your Axiom, GMGN, Padre or Proxima referral link on your profile.

People who like your P&L can trade with your link.
```

**25.**
```
Your NFTs, on your profile. Pulled from your Solana wallets, updated on their own.
```

**26.**
```
Rate this profile from 1 to 10.

[quote d'un profil membre]
```

**27.**
```
Name a crypto person whose bio link deserves better. We'll send them an invite.
```

**28.**
```
Premium profiles can use a video background. Up to 30 seconds, MP4 or GIF.
```

**29.**
```
Stop sending people to 6 different links.

fl3x.lol/@you
```

**30.** (chaque semaine, à partir des articles du blog)
```
New on the FL3X blog: [titre]

fl3x.lol/blog/[slug]
```

---

## 9. Compte perso du founder

Ton compte, ta voix : à la première personne, sans ton marketing. Les gens suivent quelqu'un qui construit, pas un logo. Règles :
- Raconter ce que tu fais **vraiment** (une feature finie, un bug, une décision). Les `[crochets]` sont à remplacer par tes vrais chiffres, ou à retirer : ne jamais inventer un nombre.
- Quote-tweeter les posts de @fl3xdotlol avec ton avis perso, plutôt que les retweeter.
- Répondre toi-même aux gens sous les giveaways : un founder qui répond, ça fait revenir.
- 1 à 2 posts par jour. Une capture d'écran du site ou du code vaut mieux qu'une belle image.

Bio (une au choix) :

```
Building @fl3xdotlol: your crypto profile, live.
Founder & dev. Shipping every day.
```

```
Founder of @fl3xdotlol. I write the code too.
Onchain since [année].
```

**F1.** Le premier, à épingler sur ton compte (image : `launch.png`)
```
I've been building something for crypto people.

Your bio link, but live: your P&L, your wallets, your token, your Discord, your stream. One page that updates itself.

It's called FL3X. Invite-only for now. Reply and I'll send you a code.
```

**F2.**
```
Why I'm building FL3X:

Every crypto bio is the same Linktree with 6 buttons. Meanwhile the interesting stuff (what you hold, what you trade, the community you run) lives nowhere.

So I made a profile that shows it. Live.
```

**F3.**
```
Solo founder, I write most of the code myself.

Today I shipped: [feature].
Tomorrow: [feature].

Building in public from now on.
```

**F4.** (avec une capture du dashboard ou de Customize)
```
Spent the whole day on one thing: making the widgets move when you drag one, like your phone's home screen.

Worth it.
```

**F5.**
```
Rule I set on day one for FL3X: your wallet addresses never reach your public page.

Visitors see the numbers. Not where they come from.
Felt obvious. Most sites don't do it.
```

**F6.**
```
No connect kit on FL3X. No transaction to link a wallet.

You sign one plain-text message that says "signing is free". That's it.

If a site asks you to approve something just to "verify" your wallet, close the tab.
```

**F7.** (réponses)
```
Building FL3X, I need your honest take:

What's the one thing you'd want on your crypto profile that no site does yet?
```

**F8.**
```
I'm giving FL3X Premium to people who reply to this with their Solana address.

Not a bot, I read every reply myself.
```

**F9.**
```
I have [X] invite codes left for FL3X.

Quote this with the handle you'd claim. Best ones get one.
```

**F10.** (avec une capture d'un vrai bug, si ça arrive)
```
Shipped a bug yesterday. [Ce qui s'est passé, en une phrase.]

Fixed in [durée]. Sorry to the [X] people who hit it.

Building in public means showing these too.
```

**F11.**
```
Things I didn't expect building a crypto profile site:

- one wallet's NFT list came back at 350 MB (spam NFTs with images inlined)
- Safari won't play a video background without byte ranges
- every RPC has a different idea of "rate limit"
```

**F12.**
```
FL3X stats, week [N]:

[X] profiles
[X] wallets linked
[X] widgets on cards

Small. Growing. Every number is real.
```

**F13.** (en quote d'un post de @fl3xdotlol)
```
This one took me [X] days. Glad it's out.
```

**F14.**
```
The FL3X checkmark isn't for sale.

It comes with Premium, and Premium comes from holding. Sell, and it goes away.
```

**F15.**
```
I check every new FL3X profile myself.

Today's favorite: @[membre]. Go look.
```

**F16.**
```
What I've learned shipping fast as a solo dev:

1. Ship the boring version first
2. Real users find bugs you never will
3. Answer every reply, even the mean ones
```

**F17.**
```
If you're a trader, put your Axiom or GMGN ref link right under your P&L.

People click links next to proof, not links in a list. That's the whole idea behind FL3X.
```

**F18.**
```
Day [N] of building FL3X.

Still no VC, still no team page, still shipping.
```

---

## 10. Article X

Couverture : `article-cover.png`. Images dans le texte, aux endroits marqués : `widgets.png`, `wallets.png`, `badges.png`, `referral.png`.

### Your crypto profile, live

Your bio link says who you are. It doesn't show what you do. FL3X is a profile made for crypto people: one link, and widgets that update on their own.

Here is what goes on it.

#### Widgets that move

*[image : widgets.png]*

Your P&L for the month, a token you follow, your Telegram or Discord with its member count, your Twitch live or your latest YouTube video, the track you're playing on Spotify, your local time, a countdown, a link card. You drag them where you want on your card; the others make room.

#### Wallets, without the connect kit

*[image : wallets.png]*

You link a wallet with one free signature. No transaction, nothing to approve. Solana and EVM wallets work, as many as you want, and wallet widgets add them up into one total.

Your addresses never reach the public page: visitors see the numbers, not the wallets.

#### Badges and the checkmark

*[image : badges.png]*

Badges sit under your name. Some are earned (Early Adopter, OG, Contributor), some are handed out by the team (Builder, Creator). The checkmark is for Premium holders and follows your wallet.

#### Invite-only, for now

*[image : referral.png]*

FL3X opens with invites. Each member gets a link with their own handle in it, and a leaderboard shows who brought the most people. No invite yet? Sign in with X and you're on the waitlist.

Claim your name before someone else does.

fl3x.lol
