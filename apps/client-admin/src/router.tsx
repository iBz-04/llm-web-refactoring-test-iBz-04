/**
 * @file apps/client-admin/src/router.tsx
 * @contents TanStack Router instance and route tree wiring.
 * @use Application router bootstrap for the client app.
 */

import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const router = createRouter({
		routeTree,
		context: {},

		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
	});

	return router;
};
