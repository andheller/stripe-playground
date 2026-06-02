import Stripe from 'stripe';
import { json } from '@sveltejs/kit';

const modes = new Set(['payment', 'setup', 'subscription']);

function badRequest(error) {
	return json({ error }, { status: 400 });
}

function isRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isHttpUrl(value) {
	if (typeof value !== 'string') {
		return false;
	}

	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

function validateCheckoutRequest(body) {
	if (!isRecord(body)) {
		return 'Request body must be a JSON object';
	}

	const { stripe_secret, checkout_session } = body;

	if (typeof stripe_secret !== 'string' || !stripe_secret.startsWith('sk_test_')) {
		return 'A Stripe test secret key is required';
	}

	if (!isRecord(checkout_session)) {
		return 'A checkout session payload is required';
	}

	if (!Array.isArray(checkout_session.line_items) || checkout_session.line_items.length === 0) {
		return 'At least one line item is required';
	}

	if (!modes.has(checkout_session.mode)) {
		return 'Checkout mode must be payment, setup, or subscription';
	}

	if (!isHttpUrl(checkout_session.success_url) || !isHttpUrl(checkout_session.cancel_url)) {
		return 'Success and cancel URLs must be absolute HTTP(S) URLs';
	}
}

export async function POST({ request }) {
	let body;

	try {
		body = await request.json();
	} catch {
		return badRequest('Request body must be valid JSON');
	}

	const error = validateCheckoutRequest(body);
	if (error) {
		return badRequest(error);
	}

	const { stripe_secret, checkout_session } = body;

	try {
		const stripe = new Stripe(stripe_secret);
		const session = await stripe.checkout.sessions.create(checkout_session);
		return json({ sessionId: session.id });
	} catch (err) {
		const message = err?.raw?.message ?? err?.message ?? 'Unable to create checkout session';
		const status =
			Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 500
				? err.statusCode
				: 500;

		console.error('Stripe checkout session failed:', message);
		return json({ error: message }, { status });
	}
}
