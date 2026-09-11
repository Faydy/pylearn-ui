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
				stdout: "MQo=", time: "0.01", memory: 1000,
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

	it("reads Romanian multiline output through Base64 without changing code or execution limits", async () => {
		const code = 'for i in range(1, 6):\n    print("Numărul:", i)';
		const output = Array.from({ length: 5 }, (_, i) => `Numărul: ${i + 1}\n`).join("");
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
			if (init?.method === "POST") {
				expect(JSON.parse(String(init.body))).toMatchObject({
					source_code: code, stdin: "", language_id: 100,
					cpu_time_limit: 2, wall_time_limit: 5, memory_limit: 128000, enable_network: false,
				});
				return Response.json({ token: "unicode-token" });
			}
			// Reproduce Judge0's documented failure for unencoded result attributes.
			if (new URL(String(url)).searchParams.get("base64_encoded") !== "true") {
				return Response.json({ error: "some attributes for this submission cannot be converted to UTF-8, use base64_encoded=true query parameter" }, { status: 400 });
			}
			return Response.json({ stdout: Buffer.from(output).toString("base64"), status: { id: 3, description: "Accepted" } });
		});
		try {
			const ctx = createExecutionContext();
			const response = await worker.fetch(new IncomingRequest("https://example.com/run", {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, input: "" }),
			}), env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toMatchObject({ success: true, output });
		} finally { fetchSpy.mockRestore(); }
	});

	it.each(["stderr", "compile_output", "message"])("decodes %s and preserves Python errors", async (field) => {
		const output = 'Traceback\n  print("Numărul:", 1 / 0)\nZeroDivisionError: division by zero\n';
		const fetchSpy = vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(Response.json({ token: "error-token" }))
			.mockResolvedValueOnce(Response.json({
				[field]: Buffer.from(output).toString("base64"),
				status: { id: 11, description: "Runtime Error (NZEC)" },
			}));
		try {
			const ctx = createExecutionContext();
			const response = await worker.fetch(new IncomingRequest("https://example.com/run", {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: "1 / 0" }),
			}), env, ctx);
			await waitOnExecutionContext(ctx);
			await expect(response.json()).resolves.toMatchObject({ success: false, output });
		} finally { fetchSpy.mockRestore(); }
	});

	it.each([
		[null, ""], ["", ""], ["/wo=", "�\n"],
		[Buffer.from("șțăîâ 😀\n").toString("base64") + "\n", "șțăîâ 😀\n"],
		[Buffer.from("x".repeat(13000)).toString("base64"), "x".repeat(12000) + "\n\n...[output trunchiat]"],
	])("handles empty, non-UTF8 and long output (%#)", async (encoded, expected) => {
		const fetchSpy = vi.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(Response.json({ token: "output-token" }))
			.mockResolvedValueOnce(Response.json({ stdout: encoded, status: { id: 3, description: "Accepted" } }));
		try {
			const ctx = createExecutionContext();
			const response = await worker.fetch(new IncomingRequest("https://example.com/run", {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: "print(1)" }),
			}), env, ctx);
			await waitOnExecutionContext(ctx);
			const data = await response.json() as { success: boolean; output: string };
			expect(data.success).toBe(true);
			expect(data.output).toBe(expected);
		} finally { fetchSpy.mockRestore(); }
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
