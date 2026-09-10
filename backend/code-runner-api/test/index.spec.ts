import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Code Runner API worker", () => {
	it("successful /run contacts only Judge0 and never writes activity or progression", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(Response.json({ token: "fixture-token" }))
			.mockResolvedValueOnce(Response.json({
				status: { id: 3, description: "Accepted" },
				stdout: "1\n", time: "0.01", memory: 1000,
			}));
		try {
			const request = new IncomingRequest("http://example.com/run", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: "print(1)", activity_date: "2099-01-01" }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toMatchObject({ success: true, output: "1\n" });
			expect(fetchSpy).toHaveBeenCalledTimes(2);
			for (const [url] of fetchSpy.mock.calls) {
				expect(new URL(String(url)).origin).toBe("https://ce.judge0.com");
			}
		} finally {
			fetchSpy.mockRestore();
		}
	});

	it("returns health metadata (unit style)", async () => {
		const request = new IncomingRequest(
			"http://example.com/health"
		);
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			success: true,
			message: "Code Runner API funcționează.",
			supabaseUrlLoaded: expect.any(Boolean),
			supabaseKeyLoaded: expect.any(Boolean),
		});
	});

	it("returns 404 JSON for unknown routes (integration style)", async () => {
		const response = await SELF.fetch(
			"https://example.com/unknown"
		);

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			success: false,
			error: "Endpoint inexistent.",
		});
	});

	it("handles CORS preflight for allowed origins", async () => {
		const request = new IncomingRequest(
			"http://example.com/submit",
			{
				method: "OPTIONS",
				headers: {
					Origin: "https://pylearn.ro",
					"Access-Control-Request-Method":
						"POST",
				},
			}
		);
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			env,
			ctx
		);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(204);
		expect(
			response.headers.get(
				"Access-Control-Allow-Origin"
			)
		).toBe("https://pylearn.ro");
		expect(
			response.headers.get(
				"Access-Control-Allow-Methods"
			)
		).toContain("POST");
	});

	it("validates run payload before contacting Judge0", async () => {
		const request = new IncomingRequest(
			"http://example.com/run",
			{
				method: "POST",
				headers: {
					"Content-Type":
						"application/json",
				},
				body: JSON.stringify({}),
			}
		);
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			request,
			env,
			ctx
		);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			success: false,
			output: "Nu a fost trimis cod Python.",
		});
	});
});
