# Metrics OpenAPI and client

Files added:

- `docs/openapi.yaml` — OpenAPI 3.0 spec for metrics endpoints.
- `src/clients/metricsClient.ts` — minimal TypeScript client using `fetch` and `@resbar/shared` DTOs.

Usage (frontend or scripts):

```ts
import metricsClient from './clients/metricsClient';

const token = '...';
const overview = await metricsClient.overview(token);
console.log(overview);
```

To validate the OpenAPI spec locally, use `swagger-ui` or `redoc` pointing to `docs/openapi.yaml`.

To validate the OpenAPI spec locallyi need to use the swagger