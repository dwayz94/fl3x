# Kit X : @fl3xdotlol

Tweets prêts à poster, tweet épinglé, article et images. Les textes sont en anglais (langue du produit), les notes en français.

Tout en une page, avec boutons Copier : ouvrir `docs/x-kit/kit.html` dans un navigateur (régénérée par `python3 scripts/x-kit-page.py` après une modification de ce fichier).

Images : `docs/x-kit/images/` (PNG 2x, logo en bas à gauche, `fl3x.lol` en bas à droite). Pour les régénérer : lancer le site (`localhost:3000`), puis `sh scripts/x-kit.sh` (ou `sh scripts/x-kit.sh launch` pour une seule). Les visuels sont dans `apps/web/src/components/x-kit/visuals.tsx` et utilisent les vrais composants du site (carte de profil, widgets, badges) avec les données de démo : ce sont des illustrations, pas des vrais membres ni des vrais chiffres.

| Image | Format | Usage |
|---|---|---|
| `avatar.png`, `avatar-pink.png` | 800×800 | Photo de profil X : sac rose sur noir, ou noir sur rose |
| `banner.png` | 1500×500 | Bannière du profil, coins du bas laissés vides (photo de profil à gauche, boutons sur mobile à droite) |
| `launch.png` | 1200×675 | Tweet épinglé |
| `article-cover.png` | 1500×600 (5:2) | Couverture de l'article |
| Les autres | 1200×675 (16:9) | Tweets, voir ci-dessous |

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

- **Pré-lancement (sur invitation)** : 2 à 3 posts par jour, espacés de quelques heures (le boost des nouveaux comptes joue sur des posts de moins de 2 h). On montre le produit, widget par widget. Chaque post renvoie vers la même idée : réserve ton nom, avec une invitation ou via la waitlist (connexion X).
- **Ouverture** : le tweet épinglé, puis 3 ou 4 posts dans la journée. Republier les plus beaux profils des membres (avec leur accord), c'est la meilleure démo possible.
- **Après** : 2 posts par jour minimum, en alternant un widget, un badge, le classement des parrains et des vrais profils.
- **Toujours** : répondre à chaque réponse dans la première heure, citer les profils que les membres partagent. Pas de hashtags, pas de tags en masse.
- **Le lien** `fl3x.lol` dans le texte une fois sur deux ou trois, pas plus : le domaine est déjà sur chaque image.
- Le token n'est pas lancé : aucun ticker, aucune adresse, aucune promesse de prix. On vend le profil, pas le token.

---

## 3. Tweet épinglé

Image : `launch.png`

```
FL3X is open.

Your crypto profile, live.
P&L, wallets, token, community, stream, music. All on one link.

Claim your name: fl3x.lol
```

Variante plus courte (même image `launch.png`) :

```
One link for everything you are onchain.

fl3x.lol/@you
```

## 4. Avant le lancement (sur invitation)

**1.** Image : `invite-only.png`
```
FL3X is invite-only for now.

Got an invite? Claim your name.
No invite? Sign in with X and you're on the waitlist.
```

**2.** Image : `widgets.png`
```
Your bio link, but it moves.

P&L, token, Telegram, Twitch live, local time.
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
Solana and EVM, as many wallets as you want, added up in one widget.
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
Quote this with your handle. We'll tell you if it's still free.
```

**8.** Image : `spotify.png`
```
Your card can show what you're listening to.

Connect Spotify once. Not playing? It shows the last track.
```

## 5. Ouverture (après le tweet épinglé)

**9.** Image : `referral.png`
```
Your handle is your invite link.

fl3x.lol/invite/yourname
No code to remember. The leaderboard shows who brought the most people.
```

**10.** Image : `verified.png`
```
The FL3X checkmark is for Premium holders.

It follows your wallet, not a subscription.
```

**11.** Image : `analytics.png`
```
Your profile comes with analytics.

Views, link clicks, countries, devices, and the site each visitor came from.
```

**12.** Sans image
```
Send this to the friend whose bio is still a Linktree.
```

## 6. Après l'ouverture (à recycler, jamais le même texte deux fois)

**13.** Image : `widgets.png` (puis de vrais profils de membres, avec leur accord)
```
Profile of the day.

Reply with yours, we'll quote the best ones.
```

**14.**
```
Your P&L widget is built from snapshots we take ourselves, every hour.

No screenshots. No editing.
```

**15.**
```
Twitch or YouTube on your profile?

Put your channel in once. Live now? It shows the live. Offline? Your latest video.
```

**16.**
```
Reply with the widget you want next.
```

**17.**
```
Wallet addresses never reach your public profile.

Visitors see the numbers, not where they come from.
```

---

## 7. Article X

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
