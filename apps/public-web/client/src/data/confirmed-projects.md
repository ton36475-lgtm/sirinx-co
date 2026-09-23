# Confirmed portfolio source

The public page uses `confirmed-projects.json` for the 3 user-confirmed projects, 27 photos, and 1 residential drone video. Unknown technical values are omitted. Originals, source metadata and unassigned media are excluded from the public catalog. Local derivatives live under `/assets/real-installations/`.

## Delivery modes

- Default / `VITE_PORTFOLIO_SOURCE=static`: uses the reviewed local catalog. No project API request is sent. Suitable for static Cloudflare Pages. This does not claim that a CMS or production database has been populated.
- `VITE_PORTFOLIO_SOURCE=backend`: queries existing `project.list`. Only published rows with an exact confirmed title appear. A successful empty list displays an empty state. Loading and API failure show a loading/error state, never a flash of the static catalog. The existing CMS therefore controls publication and descending `sortOrder`.

Backend mode is a build-time setting and requires a deployed working project API and populated project records. No database write, deployment or schema migration is performed by this frontend change.

## Content boundary

CMS cover selection is accepted only when the URL matches one of that same project's reviewed local derivative paths, including the equivalent `https://www.sirinx.co` URL. Forge/CDN uploads are deliberately ignored until an asset-ID or content-hash mapping is supplied. CMS free text, capacities, savings and unreviewed images never replace the confirmed copy. All reviewed images and the project's video remain available within each published project's gallery.

Do not enable backend mode until the project API is verified on the deployment. The preview HTML files are explicitly marked for review and do not represent production publication.
