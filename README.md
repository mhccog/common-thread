# Common Thread (working name)

**Live:** https://mhccog.github.io/common-thread/

*Connecting people to people, and solutions to problems.* One calm globe holding the five ideas of
"The foundation: five ways to connect the world", each as its own distinguishable layer:

| # | Layer | Looks like | Data (all public, keyless) | Licence / terms |
|---|---|---|---|---|
| 1 | **You're not the only one** | ochre dots joined by arcs | Weekly sweep published by [not-the-only-one](https://github.com/mhccog/not-the-only-one) (OpenAlex, arXiv, GitHub, Hacker News) | CC0 metadata / public pages, linked |
| 2 | **Solved somewhere else** | green diamonds: **outlined** = Participedia, **solid** = World Bank | [Participedia](https://participedia.net) case API; [IEG World Bank Project Performance Ratings](https://ieg.worldbankgroup.org/ratings) (projects rated Satisfactory or Highly Satisfactory, evaluated FY2008+) joined to the World Bank Projects API | Participedia CC BY-NC-SA 3.0 (**non-commercial**); World Bank CC BY 4.0 |
| 3 | **The world's unfinished work** | violet rings: plain = GitHub, **ring with a dot** = stopped clinical study | GitHub archived repositories on real-world topics; [ClinicalTrials.gov API v2](https://clinicaltrials.gov/data-api/api) studies terminated / withdrawn / suspended in the last 3 years for money, recruitment, staff, sponsor or pandemic reasons (safety and efficacy stops excluded) | Repo metadata, linked; ClinicalTrials.gov public domain (NLM attribution) |
| 4 | **Everything we're stuck on** | slate dots in the air around the globe; quiet ones wear a halo; automated (OpenAlex-extracted) problems are drawn fainter | Daily sky published by [stuck-on](https://github.com/mhccog/stuck-on) | per source |
| 5 | **Leftovers and missing pieces** | coral boxes: **solid** = spare (offers), **dashed hollow** = short of (needs), dotted coral lines = a surplus near a shortage | Offers: OpenStreetMap via Overpass (give boxes, community fridges, free shops, tool libraries, repair cafés, libraries of things, seed libraries). Needs: [Give Food](https://www.givefood.org.uk/api/) UK food bank shopping lists (lists older than 120 days not drawn) | ODbL 1.0; Give Food CC BY 4.0 (credit, link, never reorder lists, no bulk contact) |
| ✦ | **Common threads** | gold arcs, and gold curves from the air down to the ground | `scripts/build_links.py`: conservative cross-layer matches (stemmed TF-IDF + small synonym list), each with a written reason | – |

Close-up basemap (zoom 4+): [OpenFreeMap](https://openfreemap.org) vector tiles, © OpenMapTiles, data © OpenStreetMap contributors. No key.

## Sources & trust
`scripts/check_data.py` runs after every refresh and writes `docs/data/trust.json`: publisher, licence, update frequency,
caveats, record validation, freshness against each source's expected cadence, and a daily random **spot check** that
re-reads records from the original publisher (ClinicalTrials.gov, World Bank, Participedia, GitHub, OSM, Give Food,
OpenAlex/arXiv APIs). A source that is stale, malformed or no longer matches its originals is **held back** (the page hides
it). The workflow also runs [lychee](https://github.com/lycheeverse/lychee) over the page's own links. The page shows a
trust note and an "Open the original record" link on every item, and a "Sources & trust" panel.
"Commercial-safe data only" in the legend hides Participedia, the one non-commercial source.

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
python3 build_converging.py && python3 build_stuck.py && python3 build_solved.py && python3 build_solved_wb.py \
  && python3 build_unfinished.py && python3 build_trials.py && python3 build_leftovers.py && python3 build_needs.py \
  && python3 build_links.py && python3 check_data.py
cd ../docs && python3 -m http.server 8000
```

Map: MapLibre GL JS (BSD-3), Natural Earth (public domain).
