import Stripe from 'stripe';

export async function post({ request }) {
	const res = await request.json();
	const { stripe_secret, quantity, price_data, price_id, priceData } = res;
	console.log(res);
	const stripe = Stripe(stripe_secret);

	if (priceData) {
		const session = await stripe.checkout.sessions.create({
			line_items: [
				{
					price_data,
					quantity: quantity
				}
			],
			mode: 'payment',
			success_url: `https://stripeplayground.vercel.app?success=true`,
			cancel_url: `https://stripeplayground.vercel.app?canceled=true`
		});

		const sessionId = session.id;
		return {
			headers: { 'Content-Type': 'application/json' },
			body: { sessionId }
		};
	}

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				price: price_id,
				quantity: quantity
			}
		],
		mode: 'payment',
		success_url: `http://localhost:3000/tutorials/stripe/checkout-test?success=true`,
		cancel_url: `http://localhost:3000/tutorials/stripe/checkout-test?canceled=true`
	});

	const sessionId = session.id;
	return {
		headers: { 'Content-Type': 'application/json' },
		body: { sessionId }
	};
}
