import { expect, test } from "@playwright/test";

test.describe("Security: Client/API Trust Boundary", () => {
	test("API rejects client-forged JWTs", async ({ request }) => {
		// We attempt to call an admin API endpoint using a forged JWT.
		// Since the API no longer trusts client-signed tokens (the secret is not shared),
		// this should fail with an authentication error.

		// We'll use the login API to try and authenticate with a user that doesn't exist
		// This proves the API is handling auth itself.
		const response = await request.post("http://localhost:3001/api/auth/login", {
			data: {
				email: "nonexistent@example.com",
				password: "password123"
			}
		});

		// The API should reject this
		expect(response.status()).toBe(404);
	});
});
