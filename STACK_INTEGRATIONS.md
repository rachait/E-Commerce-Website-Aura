# Stack Integration Status

## Implemented in this codebase

- React frontend with route-based UX and Zara-like white landing motion updates.
- PWA support via Vite plugin and service worker auto-registration.
- Google Tag Manager bootstrap from `VITE_GTM_ID`.
- Security headers in backend, including HSTS.
- PDF invoice endpoint in backend and PDF.js invoice preview in frontend orders page.
- Optional script hooks for OneTrust and Riskified using environment variables.

## Requires external enterprise setup

- HCL Commerce: full platform migration/rebuild.
- Akamai CDN and HTTP/3: edge and DNS configuration outside app code.
- Akamai Bot Manager: Akamai property and policy setup.
- OneTrust production consent model and cookie categories from OneTrust dashboard.
- Riskified production rules and merchant account onboarding.
- Jscrambler production obfuscation requires Jscrambler account and CI key configuration.

## Recommended deployment path

1. Configure environment variables from `frontend/.env.example`.
2. Set HTTPS at reverse proxy (Nginx/Cloudflare/Akamai) and keep HSTS enabled.
3. Add GTM container and OneTrust/Riskified IDs.
4. Enable Akamai and bot controls at edge.
5. Add Jscrambler CLI in CI after `npm run build`.
