import { createClient } from "@supabase/supabase-js";

// ======================================================
// ENV
// ======================================================

interface Env {
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
}

// ======================================================
// CONFIG
// ======================================================

const JUDGE0_URL = "https://ce.judge0.com";
const PYTHON_LANGUAGE_ID = 100;

const corsHeaders = {
	"Access-Control-Allow-Origin": "https://pylearn.ro",
	"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ======================================================
// WORKER
// ======================================================

export default {
	async fetch(
		request: Request,
		env: Env
	): Promise<Response> {

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		const url = new URL(request.url);

		// GET /health
		if (
			url.pathname === "/health" &&
			request.method === "GET"
		) {
			return jsonResponse({
				success: true,
				message: "Code Runner API funcționează.",
				supabaseUrlLoaded: !!env.SUPABASE_URL,
				supabaseKeyLoaded: !!env.SUPABASE_SERVICE_ROLE_KEY,
			});
		}

		// POST /run
		if (
			url.pathname === "/run" &&
			request.method === "POST"
		) {
			return handleRun(request);
		}

		// POST /submit
		if (
			url.pathname === "/submit" &&
			request.method === "POST"
		) {
			return handleSubmit(request, env);
		}

		return jsonResponse(
			{
				success: false,
				error: "Endpoint inexistent.",
			},
			404
		);
	},
};

// ======================================================
// POST /run
// ======================================================

async function handleRun(
	request: Request
): Promise<Response> {

	try {
		const body = await request.json() as {
			code?: string;
			input?: string;
		};

		const code = body.code;
		const input = body.input ?? "";

		if (!code || typeof code !== "string") {
			return jsonResponse(
				{
					success: false,
					output: "Nu a fost trimis cod Python.",
				},
				400
			);
		}

		if (code.length > 20_000) {
			return jsonResponse(
				{
					success: false,
					output: "Codul este prea lung.",
				},
				400
			);
		}

		const result = await executePython(
			code,
			input
		);

		if (result.success) {
			return jsonResponse({
				success: true,
				output: result.output,
				time: result.time,
				memory: result.memory,
			});
		}

		return jsonResponse({
			success: false,
			output: result.output,
			status: result.status,
		});

	} catch (error) {

		console.error("RUN ERROR:", error);

		const message =
			error instanceof Error
				? error.message
				: "Eroare necunoscută";

		return jsonResponse(
			{
				success: false,
				output: `Eroare server: ${message}`,
			},
			500
		);
	}
}

// ======================================================
// POST /submit
// ======================================================

async function handleSubmit(
	request: Request,
	env: Env
): Promise<Response> {

	try {

		// ==================================================
		// 1. Verificăm configurarea
		// ==================================================

		if (
			!env.SUPABASE_URL ||
			!env.SUPABASE_SERVICE_ROLE_KEY
		) {
			return jsonResponse(
				{
					status: "error",
					error:
						"Serverul nu este configurat corect pentru Supabase.",
				},
				500
			);
		}

		// ==================================================
		// 2. Luăm token-ul utilizatorului
		// ==================================================

		const authorization =
			request.headers.get("Authorization");

		if (
			!authorization ||
			!authorization.startsWith("Bearer ")
		) {
			return jsonResponse(
				{
					status: "error",
					error:
						"Trebuie să fii autentificat pentru a trimite soluția.",
				},
				401
			);
		}

		const accessToken =
			authorization.substring(
				"Bearer ".length
			);

		if (!accessToken) {
			return jsonResponse(
				{
					status: "error",
					error:
						"Token de autentificare invalid.",
				},
				401
			);
		}

		// ==================================================
		// 3. Client Supabase server-side
		// ==================================================

		const supabase = createClient(
			env.SUPABASE_URL,
			env.SUPABASE_SERVICE_ROLE_KEY,
			{
				auth: {
					persistSession: false,
					autoRefreshToken: false,
				},
			}
		);

		// ==================================================
		// 4. Verificăm token-ul
		// ==================================================

		const {
			data: userData,
			error: userError,
		} = await supabase.auth.getUser(
			accessToken
		);

		if (
			userError ||
			!userData.user
		) {
			console.error(
				"AUTH ERROR:",
				userError
			);

			return jsonResponse(
				{
					status: "error",
					error:
						"Sesiunea a expirat sau nu este validă.",
				},
				401
			);
		}

		// Acesta este ID-ul real.
		// NU mai avem încredere în userId din frontend.
		const userId =
			userData.user.id;

		// ==================================================
		// 5. Citim body-ul
		// ==================================================

		const body =
			await request.json() as {
				code?: string;
				problemId?: string | number;
			};

		const code = body.code;

		const problemId =
			Number(body.problemId);

		if (
			!code ||
			typeof code !== "string"
		) {
			return jsonResponse(
				{
					status: "error",
					error: "Codul lipsește.",
				},
				400
			);
		}

		if (code.length > 20_000) {
			return jsonResponse(
				{
					status: "error",
					error:
						"Codul este prea lung.",
				},
				400
			);
		}

		if (
			!Number.isInteger(problemId) ||
			problemId <= 0
		) {
			return jsonResponse(
				{
					status: "error",
					error:
						"Problem ID invalid.",
				},
				400
			);
		}

		// ==================================================
		// 6. Verificăm că problema există
		// ==================================================

		const {
			data: problem,
			error: problemError,
		} = await supabase
			.from("problems")
			.select(
				"id, time_limit_ms, memory_limit_mb"
			)
			.eq("id", problemId)
			.single();

		if (
			problemError ||
			!problem
		) {
			console.error(
				"PROBLEM ERROR:",
				problemError
			);

			return jsonResponse(
				{
					status: "error",
					error:
						"Problema nu există.",
				},
				404
			);
		}

		// ==================================================
		// 7. Luăm toate testele
		// ==================================================

		const {
			data: tests,
			error: testsError,
		} = await supabase
			.from("test_cases")
			.select(
				"id, input, expected_output, is_sample"
			)
			.eq("problem_id", problemId)
			.order("id", {
				ascending: true,
			});

		if (testsError) {
			console.error(
				"TEST CASE ERROR:",
				testsError
			);

			return jsonResponse(
				{
					status: "error",
					error:
						"Nu am putut încărca testele problemei.",
				},
				500
			);
		}

		if (
			!tests ||
			tests.length === 0
		) {
			return jsonResponse(
				{
					status: "error",
					error:
						"Problema nu are teste configurate.",
				},
				400
			);
		}

		// ==================================================
		// 8. Executăm testele
		// ==================================================

		const testResults: Array<{
			passed: boolean;
		}> = [];

		let passedTests = 0;

		let maxRuntimeMs = 0;
		let maxMemoryKb = 0;

		for (const test of tests) {

			const input =
				normalizeStoredText(
					test.input ?? ""
				);

			const expectedOutput =
				normalizeOutput(
					normalizeStoredText(
						test.expected_output ?? ""
					)
				);

			const execution =
				await executePython(
					code,
					input
				);

			// ----------------------------------------------
			// runtime / memory statistics
			// ----------------------------------------------

			if (execution.time) {

				const seconds =
					Number(
						execution.time
					);

				if (
					Number.isFinite(seconds)
				) {
					const runtimeMs =
						Math.round(
							seconds * 1000
						);

					maxRuntimeMs =
						Math.max(
							maxRuntimeMs,
							runtimeMs
						);
				}
			}

			if (
				execution.memory &&
				Number.isFinite(
					execution.memory
				)
			) {
				maxMemoryKb =
					Math.max(
						maxMemoryKb,
						execution.memory
					);
			}

			// ----------------------------------------------
			// Eroare de execuție
			// ----------------------------------------------

			if (!execution.success) {

				testResults.push({
					passed: false,
				});

				continue;
			}

			// ----------------------------------------------
			// Comparăm output
			// ----------------------------------------------

			const actualOutput =
				normalizeOutput(
					execution.output
				);

			const passed =
				actualOutput ===
				expectedOutput;

			if (passed) {
				passedTests++;
			}

			testResults.push({
				passed,
			});
		}

		// ==================================================
		// 9. Stabilim verdictul
		// ==================================================

		const totalTests =
			tests.length;

		const accepted =
			passedTests === totalTests;

		const finalStatus =
			accepted
				? "accepted"
				: "wrong_answer";

		// ==================================================
		// 10. Salvăm submission + progres + XP
		// ==================================================

		const {
			data: progressData,
			error: progressError,
		} = await supabase.rpc(
			"record_problem_submission",
			{
				p_user_id:
					userId,

				p_problem_id:
					problemId,

				p_code:
					code,

				p_status:
					finalStatus,

				p_runtime_ms:
					maxRuntimeMs || null,

				p_memory_kb:
					maxMemoryKb || null,
			}
		);

		if (progressError) {

			console.error(
				"PROGRESS RPC ERROR:",
				progressError
			);

			return jsonResponse(
				{
					status: "error",
					error:
						"Soluția a fost verificată, dar progresul nu a putut fi salvat.",
				},
				500
			);
		}

		// ==================================================
		// 11. Extragem răspunsul RPC
		// ==================================================

		const firstSolve =
			progressData?.first_solve ??
			false;

		const xpAwarded =
			progressData?.xp_awarded ??
			0;

		const totalXp =
			progressData?.total_xp ??
			null;

		const categoryProgress =
			progressData?.category_progress ??
			null;

		// ==================================================
		// 12. Returnăm rezultatul
		// ==================================================

		return jsonResponse({
			status:
				finalStatus,

			passedTests,
			totalTests,
			testResults,

			firstSolve,
			xpAwarded,
			totalXp,
			categoryProgress,

			runtimeMs:
				maxRuntimeMs || null,

			memoryKb:
				maxMemoryKb || null,
		});

	} catch (error) {

		console.error(
			"SUBMIT ERROR:",
			error
		);

		const message =
			error instanceof Error
				? error.message
				: "Eroare necunoscută";

		return jsonResponse(
			{
				status: "error",
				error:
					`Eroare server: ${message}`,
			},
			500
		);
	}
}

// ======================================================
// EXECUTĂ PYTHON
// ======================================================

async function executePython(
	code: string,
	input: string
): Promise<{
	success: boolean;
	output: string;
	status: string;
	time: string | null;
	memory: number | null;
}> {

	const submissionResponse =
		await fetch(
			`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
			{
				method: "POST",

				headers: {
					"Content-Type":
						"application/json",
				},

				body: JSON.stringify({
					source_code:
						code,

					language_id:
						PYTHON_LANGUAGE_ID,

					stdin:
						input,

					cpu_time_limit:
						2,

					wall_time_limit:
						5,

					memory_limit:
						128000,

					enable_network:
						false,
				}),
			}
		);

	if (!submissionResponse.ok) {

		const errorText =
			await submissionResponse.text();

		console.error(
			"JUDGE0 SUBMISSION ERROR:",
			errorText
		);

		throw new Error(
			`Judge0 nu a putut porni execuția. HTTP ${submissionResponse.status}`
		);
	}

	const submission =
		await submissionResponse.json() as {
			token?: string;
		};

	if (!submission.token) {
		throw new Error(
			"Judge0 nu a returnat token."
		);
	}

	const result =
		await waitForResult(
			submission.token
		);

	if (!result) {
		return {
			success: false,
			output:
				"Execuția a depășit timpul maxim.",
			status:
				"Time Limit Exceeded",
			time: null,
			memory: null,
		};
	}

	if (result.status?.id === 3) {

		return {
			success: true,

			output:
				result.stdout ?? "",

			status:
				result.status.description,

			time:
				result.time ?? null,

			memory:
				result.memory ?? null,
		};
	}

	const errorOutput =
		result.stderr ||
		result.compile_output ||
		result.message ||
		result.status?.description ||
		"Eroare necunoscută.";

	return {
		success: false,

		output:
			errorOutput,

		status:
			result.status?.description ??
			"Error",

		time:
			result.time ?? null,

		memory:
			result.memory ?? null,
	};
}

// ======================================================
// JUDGE0 TYPES
// ======================================================

interface JudgeResult {
	stdout?: string | null;

	stderr?: string | null;

	compile_output?: string | null;

	message?: string | null;

	time?: string | null;

	memory?: number | null;

	status?: {
		id: number;
		description: string;
	};
}

// ======================================================
// WAIT FOR JUDGE0
// ======================================================

async function waitForResult(
	token: string
): Promise<JudgeResult | null> {

	const maxAttempts = 20;

	for (
		let attempt = 0;
		attempt < maxAttempts;
		attempt++
	) {

		const response =
			await fetch(
				`${JUDGE0_URL}/submissions/${token}` +
				"?base64_encoded=false" +
				"&fields=stdout,stderr,compile_output,message,status,time,memory"
			);

		if (!response.ok) {

			const text =
				await response.text();

			console.error(
				"JUDGE0 RESULT ERROR:",
				text
			);

			throw new Error(
				"Nu am putut obține rezultatul de la Judge0."
			);
		}

		const result = (await response.json()) as JudgeResult;

		// 1 = Queue
		// 2 = Processing
		// >=3 = finished

		if (
			result.status &&
			result.status.id >= 3
		) {
			return result;
		}

		await sleep(250);
	}

	return null;
}

// ======================================================
// NORMALIZARE TEXT DIN DB
// ======================================================

function normalizeStoredText(
	value: string
): string {

	return value
		.replace(
			/\\r\\n/g,
			"\n"
		)
		.replace(
			/\\n/g,
			"\n"
		);
}

// ======================================================
// NORMALIZARE OUTPUT
// ======================================================

function normalizeOutput(
	value: string
): string {

	return value
		.replace(
			/\r\n/g,
			"\n"
		)
		.trim();
}

// ======================================================
// SLEEP
// ======================================================

function sleep(
	ms: number
): Promise<void> {

	return new Promise(
		(resolve) =>
			setTimeout(
				resolve,
				ms
			)
	);
}

// ======================================================
// JSON RESPONSE
// ======================================================

function jsonResponse(
	data: unknown,
	status = 200
): Response {

	return new Response(
		JSON.stringify(data),
		{
			status,

			headers: {
				"Content-Type":
					"application/json; charset=utf-8",

				...corsHeaders,
			},
		}
	);
}