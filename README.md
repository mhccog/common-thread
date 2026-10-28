# Common Thread (working name)

**Live:** https://mhccog.github.io/common-thread/

*Connecting people to people, and solutions to problems.* One calm globe holding the five ideas of
"The foundation: five ways to connect the world", each as its own distinguishable layer:

| # | Layer | Looks like | Data (all public, keyless) | Licence / terms |
|---|---|---|---|---|
| 1 | **You're not the only one** | amber dots joined by arcs with travelling sparks | Weekly sweep published by [not-the-only-one](https://github.com/mhccog/not-the-only-one) (OpenAlex, arXiv, GitHub, Hacker News) | CC0 metadata / public pages, linked |
| 2 | **Solved somewhere else** | mint diamonds; dashed threads from a later case to an earlier written-up one abroad | [Participedia](https://participedia.net) case API | CC BY-NC-SA 3.0 (non-commercial, share-alike) |
| 3 | **The world's unfinished work** | violet rings, sized by stars | GitHub search for archived repositories on real-world topics, placed at the owner's public profile location (geocoded with Photon / OSM) | Repository metadata, linked |
| 4 | **Everything we're stuck on** | stars in the sky around the globe (a problem is not a place); quiet ones glow | Daily sky published by [stuck-on](https://github.com/mhccog/stuck-on) | per source, see that repo |
| 5 | **Leftovers and missing pieces** | coral boxes | OpenStreetMap via Overpass: give boxes, community fridges / food sharing, free shops, tool libraries, repair cafés | ODbL 1.0 |
| ✦ | **Gold threads** | gold arcs, and gold lines from a star down to the ground | `scripts/build_links.py`: conservative cross-layer matches, each with a written reason | – |

## Honesty rules
- Every mark is a real public record and links to it. Nothing is invented.
- When a source fails, the layer says so in the legend and the previous build is kept.
- Matches (pairs and gold threads) are suggestions from shared words or shared names, never claims.
- No logins, no contact, no personal data beyond what the public source shows. Introductions: later, with consent.

## Refreshing
`.github/workflows/refresh.yml` runs daily and commits `docs/data/*.json`. It uses only keyless public APIs and
the workflow's own short-lived `GITHUB_TOKEN` for GitHub search. No keys are stored in this repo.

```
cd scripts
python3 build_converging.py && python3 build_stuck.py && python3 build_solved.py \
  && python3 build_unfinished.py && python3 build_leftovers.py && python3 build_links.py
cd ../docs && python3 -m http.server 8000
```

Map: MapLibre GL JS (BSD-3), Natural Earth (public domain).
