import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
const MAX_CODE_LENGTH = 20_000;
const MAX_INPUT_LENGTH = 10_000;
const MAX_OUTPUT_LENGTH = 12_000;
const JUDGE0_SUBMISSION_TIMEOUT_MS = 8_000;
const JUDGE0_RESULT_TIMEOUT_MS = 4_000;
const ALLOWED_ORIGINS = new Set([
	"https://pylearn.ro",
	"https://www.pylearn.ro",
	"http://localhost:5173",
	"http://127.0.0.1:5173",
]);

type FinalizedAssignment = {
	id: number;
	title: string;
	classroom_id: number;
};

class HttpError extends Error {
	status: number;

	constructor(
		status: number,
		message: string
	) {
		super(message);
		this.status = status;
	}
}

async function findFinalizedAssignmentForStudent(
	supabase: SupabaseClient,
	userId: string,
	problemId: number
): Promise<FinalizedAssignment | null> {
	const {
		data: profile,
		error: profileError,
	} = await supabase
		.from("profiles")
		.select("role")
		.eq("id", userId)
		.maybeSingle();

	if (profileError) {
		throw new HttpError(
			500,
			"Nu am putut verifica profilul utilizatorului."
		);
	}

	const role =
		typeof profile?.role === "string"
			? profile.role.toLowerCase()
			: "";

	if (
		role !== "elev" &&
		role !== "student"
	) {
		return null;
	}

	const {
		data: assignmentLinks,
		error: assignmentLinksError,
	} = await supabase
		.from("assignment_problems")
		.select("assignment_id")
		.eq("problem_id", problemId);

	if (assignmentLinksError) {
		throw new HttpError(
			500,
			"Nu am putut verifica temele acestei probleme."
		);
	}

	const assignmentIds =
		(assignmentLinks || [])
			.map((link) => Number(link.assignment_id))
			.filter((assignmentId) =>
				Number.isInteger(assignmentId)
			);

	if (assignmentIds.length === 0) {
		return null;
	}

	const {
		data: finalizedAssignments,
		error: finalizedAssignmentsError,
	} = await supabase
		.from("assignments")
		.select("id, title, classroom_id")
		.in("id", assignmentIds)
		.eq("published", true)
		.eq("is_finalized", true);

	if (finalizedAssignmentsError) {
		throw new HttpError(
			500,
			"Nu am putut verifica starea temelor."
		);
	}

	const candidates =
		(finalizedAssignments || []) as FinalizedAssignment[];

	if (candidates.length === 0) {
		return null;
	}

	const classroomIds = [
		...new Set(
			candidates.map(
				(assignment) => assignment.classroom_id
			)
		),
	];

	const {
		data: memberships,
		error: membershipsError,
	} = await supabase
		.from("classroom_members")
		.select("classroom_id")
		.eq("student_id", userId)
		.in("classroom_id", classroomIds);

	if (membershipsError) {
		throw new HttpError(
			500,
			"Nu am putut verifica apartenența la clasă."
		);
	}

	const memberClassroomIds = new Set(
		(memberships || []).map(
			(membership) => Number(membership.classroom_id)
		)
	);

	return candidates.find((assignment) =>
		memberClassroomIds.has(
			assignment.classroom_id
		)
	) || null;
}

// ======================================================
// WORKER
// ======================================================

export default {
	async fetch(
		request: Request,
		env: Env
	): Promise<Response> {
		if (!isOriginAllowed(request)) {
			return jsonResponse(
				{
					success: false,
					error: "Origine neautorizată.",
				},
				403,
				request
			);
		}

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: createCorsHeaders(request),
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
			}, 200, request);
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
			404,
			request
		);
	},
};

// ======================================================
// POST /run
// ======================================================

async function handleRun(
	request: Request
): Promise<Response> {
	const respond = (
		data: unknown,
		status = 200
	) => jsonResponse(data, status, request);

	try {
		const body = await readJsonBody<{
			code?: string;
			input?: string;
		}>(request);

		const code =
			typeof body.code === "string"
				? body.code
				: "";
		const input =
			typeof body.input === "string"
				? body.input
				: "";

		if (!code || typeof code !== "string") {
			return respond(
				{
					success: false,
					output: "Nu a fost trimis cod Python.",
				},
				400
			);
		}

		if (code.length > MAX_CODE_LENGTH) {
			return respond(
				{
					success: false,
					output: "Codul este prea lung.",
				},
				400
			);
		}

		if (input.length > MAX_INPUT_LENGTH) {
			return respond(
				{
					success: false,
					output: "Inputul este prea lung.",
				},
				400
			);
		}

		const result = await executePython(
			code,
			input
		);

		if (result.success) {
			return respond({
				success: true,
				output: truncateOutput(
					result.output
				),
				time: result.time,
				memory: result.memory,
			});
		}

		return respond({
			success: false,
			output: truncateOutput(
				result.output
			),
			status: result.status,
		});

	} catch (error) {

		console.error("RUN ERROR:", error);

		const handledError =
			getHttpError(
				error,
				"Eroare necunoscută."
			);

		return respond(
			{
				success: false,
				output:
					handledError.message,
			},
			handledError.status
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
	const respond = (
		data: unknown,
		status = 200
	) => jsonResponse(data, status, request);

	try {

		// ==================================================
		// 1. Verificăm configurarea
		// ==================================================

		if (
			!env.SUPABASE_URL ||
			!env.SUPABASE_SERVICE_ROLE_KEY
		) {
			return respond(
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
			return respond(
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
			return respond(
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

			return respond(
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
			await readJsonBody<{
				code?: string;
				problemId?: string | number;
			}>(request);

		const code =
			typeof body.code === "string"
				? body.code
				: "";

		const problemId =
			Number(body.problemId);

		if (
			!code ||
			typeof code !== "string"
		) {
			return respond(
				{
					status: "error",
					error: "Codul lipsește.",
				},
				400
			);
		}

		if (code.length > MAX_CODE_LENGTH) {
			return respond(
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
			return respond(
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

			return respond(
				{
					status: "error",
					error:
						"Problema nu există.",
				},
				404
			);
		}

		const finalizedAssignment =
			await findFinalizedAssignmentForStudent(
				supabase,
				userId,
				problemId
			);

		if (finalizedAssignment) {
			return respond(
				{
					status: "error",
					error:
						`Tema „${finalizedAssignment.title}” este finalizată. Nu mai poți trimite soluții pentru problemele ei.`,
				},
				403
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

			return respond(
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
			return respond(
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

			return respond(
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

		const safeXpAwarded = Math.max(
			Number(xpAwarded) || 0,
			0
		);
		const safeTotalXp =
			totalXp === null
				? null
				: Math.max(Number(totalXp) || 0, 0);
		const previousTotalXp =
			safeTotalXp === null
				? null
				: Math.max(safeTotalXp - safeXpAwarded, 0);
		const calculatedCoinsAwarded =
			firstSolve
				&& safeTotalXp !== null
				&& previousTotalXp !== null
				? Math.max(
					Math.floor(safeTotalXp / 10)
						- Math.floor(previousTotalXp / 10),
					0
				)
				: 0;
		const oldLevel =
			previousTotalXp === null
				? null
				: Math.floor(previousTotalXp / 100);
		const newLevel =
			safeTotalXp === null
				? null
				: Math.floor(safeTotalXp / 100);
		const leveledUp =
			oldLevel !== null
				&& newLevel !== null
				&& newLevel > oldLevel;

		let coinBalance: number | null = null;
		let coinsAwarded = 0;
		if (firstSolve) {
			const {
				data: economyProfile,
				error: economyProfileError,
			} = await supabase
				.from("profiles")
				.select("coin_balance")
				.eq("id", userId)
				.maybeSingle();

			if (economyProfileError) {
				console.warn(
					"Could not load economy balance after submission:",
					economyProfileError.message
				);
			} else if (economyProfile) {
				coinBalance = Math.max(
					Number(economyProfile.coin_balance) || 0,
					0
				);
				coinsAwarded = calculatedCoinsAwarded;
			}
		}

		// ==================================================
		// 12. Returnăm rezultatul
		// ==================================================

		return respond({
			status:
				finalStatus,

			passedTests,
			totalTests,
			testResults,

			firstSolve,
			xpAwarded,
			totalXp,
			categoryProgress,
			coinsAwarded,
			coinBalance,
			oldLevel,
			newLevel,
			leveledUp,

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

		const handledError =
			getHttpError(
				error,
				"Eroare necunoscută."
			);

		return respond(
			{
				status: "error",
				error:
					handledError.message,
			},
			handledError.status
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

	const submission =
		await fetchJudge0Json<{
			token?: string;
		}>(
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
			},
			JUDGE0_SUBMISSION_TIMEOUT_MS,
			"Nu am putut porni execuția Python."
		);

	if (!submission.token) {
		throw new HttpError(
			502,
			"Serviciul de execuție nu a returnat un token valid."
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

		const result =
			await fetchJudge0Json<JudgeResult>(
				`${JUDGE0_URL}/submissions/${token}` +
				"?base64_encoded=true" +
				"&fields=stdout,stderr,compile_output,message,status,time,memory",
				undefined,
				JUDGE0_RESULT_TIMEOUT_MS,
				"Nu am putut obține rezultatul execuției."
			);

		// 1 = Queue
		// 2 = Processing
		// >=3 = finished

		if (
			result.status &&
			result.status.id >= 3
		) {
			return {
				...result,
				stdout: decodeJudge0Output(result.stdout),
				stderr: decodeJudge0Output(result.stderr),
				compile_output: decodeJudge0Output(result.compile_output),
				message: decodeJudge0Output(result.message),
			};
		}

		await sleep(250);
	}

	return null;
}

// Judge0 may reject plain JSON output when execution produces non-ASCII/binary
// bytes. Request Base64 and decode the bytes as UTF-8, rather than treating each
// byte as a character (which would corrupt Romanian diacritics).
function decodeJudge0Output(value: string | null | undefined): string | null {
	if (value == null) return null;
	try {
		const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	} catch {
		throw new HttpError(502, "Serviciul de execuție a returnat un rezultat codificat invalid.");
	}
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

function truncateOutput(
	value: string
): string {
	if (value.length <= MAX_OUTPUT_LENGTH) {
		return value;
	}

	return (
		value.slice(
			0,
			MAX_OUTPUT_LENGTH
		) +
		"\n\n...[output trunchiat]"
	);
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
	status = 200,
	request?: Request
): Response {

	return new Response(
		JSON.stringify(data),
		{
			status,

			headers: {
				"Content-Type":
					"application/json; charset=utf-8",

				...createCorsHeaders(
					request
				),
			},
		}
	);
}

function isOriginAllowed(
	request: Request
): boolean {
	const origin =
		request.headers.get("Origin");

	return (
		!origin ||
		ALLOWED_ORIGINS.has(origin)
	);
}

function createCorsHeaders(
	request?: Request
): Record<string, string> {
	const headers: Record<string, string> = {
		"Access-Control-Allow-Methods":
			"POST, GET, OPTIONS",
		"Access-Control-Allow-Headers":
			"Content-Type, Authorization",
		"Access-Control-Max-Age":
			"86400",
	};

	const origin =
		request?.headers.get("Origin");

	if (
		origin &&
		ALLOWED_ORIGINS.has(origin)
	) {
		headers[
			"Access-Control-Allow-Origin"
		] = origin;
		headers.Vary = "Origin";
	}

	return headers;
}

async function readJsonBody<T>(
	request: Request
): Promise<T> {
	try {
		return await request.json() as T;
	} catch {
		throw new HttpError(
			400,
			"Cererea nu conține JSON valid."
		);
	}
}

async function fetchJudge0Json<T>(
	input: string,
	init: RequestInit | undefined,
	timeoutMs: number,
	fallbackMessage: string
): Promise<T> {
	const response =
		await fetchWithTimeout(
			input,
			init,
			timeoutMs,
			fallbackMessage
		);

	if (!response.ok) {
		const errorText =
			await response.text();

		console.error(
			"JUDGE0 ERROR:",
			errorText
		);

		throw getJudge0HttpError(
			response.status,
			fallbackMessage
		);
	}

	try {
		return await response.json() as T;
	} catch {
		throw new HttpError(
			502,
			`${fallbackMessage} Serviciul a returnat un răspuns invalid.`
		);
	}
}

async function fetchWithTimeout(
	input: string,
	init: RequestInit | undefined,
	timeoutMs: number,
	fallbackMessage: string
): Promise<Response> {
	const controller =
		new AbortController();
	const timeoutId =
		setTimeout(
			() => controller.abort(),
			timeoutMs
		);

	try {
		return await fetch(input, {
			...init,
			signal: controller.signal,
		});
	} catch (error) {
		if (isAbortError(error)) {
			throw new HttpError(
				504,
				`${fallbackMessage} Serviciul a răspuns prea lent.`
			);
		}

		throw new HttpError(
			503,
			`${fallbackMessage} Nu ne-am putut conecta la Judge0.`
		);
	} finally {
		clearTimeout(timeoutId);
	}
}

function getJudge0HttpError(
	status: number,
	fallbackMessage: string
): HttpError {
	if (status === 429) {
		return new HttpError(
			429,
			"Serviciul de execuție este ocupat momentan. Încearcă din nou în câteva momente."
		);
	}

	if (status >= 500) {
		return new HttpError(
			503,
			"Serviciul de execuție este momentan indisponibil. Încearcă din nou puțin mai târziu."
		);
	}

	return new HttpError(
		502,
		`${fallbackMessage} Judge0 a răspuns cu HTTP ${status}.`
	);
}

function isAbortError(
	error: unknown
): boolean {
	return (
		error instanceof Error &&
		error.name === "AbortError"
	);
}

function getHttpError(
	error: unknown,
	fallbackMessage: string
): HttpError {
	if (error instanceof HttpError) {
		return error;
	}

	if (
		error instanceof Error &&
		error.message
	) {
		return new HttpError(
			500,
			`Eroare server: ${error.message}`
		);
	}

	return new HttpError(
		500,
		`Eroare server: ${fallbackMessage}`
	);
}
