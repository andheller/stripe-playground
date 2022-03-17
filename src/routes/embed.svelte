<script>
	import { loadStripe } from '@stripe/stripe-js';
	import { onMount } from 'svelte';
	import { browser } from '$app/env';

	let stripe;
	let promise;
	let error = false;
	let showAllPaymentMethods = false;
	let stripe_secret = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
	let stripe_perishable = 'pk_test_TYooMQauvdEDq54NiTphI7jx';
	let success_url, cancel_url;
	let payment_method_types = [];
	let mode = 'payment';

	let line_items = [
		{
			priceData: true,
			price_id: '',
			price_data: {
				currency: 'usd',
				unit_amount: '1000',
				product_data: {
					name: 'Stripe Playground',
					description: 'This is a playground to check out Stripe Checkout',
					images: ['']
				}
			},
			quantity: '1'
		}
	];

	function addNewLineItem() {
		line_items.push({
			priceData: true,
			price_id: '',
			price_data: {
				currency: 'usd',
				unit_amount: '1000',
				product_data: {
					name: 'Another Product',
					description: 'This is another product!',
					images: ['']
				}
			},
			quantity: '1'
		});
		line_items = line_items;
	}
	function handle_submit() {
		promise = stripeCheckout();
	}

	async function stripeCheckout() {
		stripe = await loadStripe(stripe_perishable);
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		let checkout_session = line_items.reduce(
			(total, current) => {
				if (current.priceData) {
					if (current.price_data.product_data.images[0] == '') {
						delete current.price_data.product_data.images;
					}
					total.line_items.push({
						price_data: current.price_data,
						quantity: current.quantity
					});
				} else {
					total.line_items.push({
						price: current.price_id,
						quantity: current.quantity
					});
				}
				return total;
			},
			{
				success_url,
				cancel_url,
				mode,
				line_items: []
			}
		);

		if (payment_method_types.length > 0)
			checkout_session['payment_method_types'] = payment_method_types;

		const res = await fetch('/stripe/checkout', {
			method: 'POST',
			headers,
			body: JSON.stringify({ checkout_session, stripe_secret })
		});

		const json = await res.json();
		//return console.log(json.error);
		if (res.ok) {
			const { sessionId } = json;
			return stripe.redirectToCheckout({
				sessionId
			});
		} else {
			error = true;
			throw new Error(json.error);
		}
	}
	onMount(async () => {
		if (browser) {
			stripe = await loadStripe(stripe_perishable);
			success_url = `${window.location.href}?success=true`;
			cancel_url = `${window.location.href}?cancel=true`;
		}
	});
</script>

<svelte:head>
	<title>Stripe Checkout Playground Embed</title>
	<meta property="og:title" content="Stripe Checkout Playground Embed" />
	<meta property="og:site_name" content="Svelte Board" />
	<meta property="og:url" content="https://stripeplayground.vercel.app/embed" />
	<meta property="og:description" content="Try out Stripe Checkout with this playground." />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://stripeplayground.vercel.app/stripe_playground.png" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="max-w-3xl m-auto mt-20 px-4">
	<div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-2 max-w-xl md:max-w-3xl m-auto">
		<div>
			<label for="stripe-sk" class="block text-sm font-medium text-slate-700">
				Stripe Secret Key <span class="text-sm text-slate-600 font-normal"
					>(<a href="https://dashboard.stripe.com/register" target="_blank" class="text-blue-600"
						>Sign Up</a
					>
					and get our own
					<a
						href="https://dashboard.stripe.com/test/developers"
						target="_blank"
						class="text-blue-600">API Keys</a
					>)</span
				>
			</label>
			<div class="mt-1">
				<input
					type="text"
					name="stripe-sk"
					bind:value={stripe_secret}
					class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
				/>
			</div>
		</div>

		<div>
			<label for="stripe-pk" class="block text-sm font-medium text-slate-700">
				Stripe Perishable Key
			</label>
			<div class="mt-1">
				<input
					type="text"
					name="stripe-pk"
					bind:value={stripe_perishable}
					class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
				/>
			</div>
		</div>
	</div>
	{#each line_items as { priceData, price_id, price_data, quantity }, i}
		<div
			class="border border-slate-300 rounded-md w-full max-w-2xl m-auto col-span-6 p-4 sm:p-12 my-8 relative"
		>
			<button
				on:click={() => (line_items = line_items.splice(i, 1))}
				class="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-md"
			>
				<span class="sr-only">Remove Line Item</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			<div>
				<div class="flex items-center">
					<button
						on:click={() => (priceData = !priceData)}
						type="button"
						class="{priceData
							? 'bg-blue-600'
							: 'bg-slate-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						role="switch"
						aria-checked="false"
						aria-labelledby="price-data-label"
					>
						<span
							aria-hidden="true"
							class="{priceData
								? 'translate-x-5'
								: 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
						/>
					</button>
					<span class="ml-3" id="price-data-label leading-none" style="line-height:1">
						<span class="text-sm font-medium {priceData ? 'text-slate-900' : 'text-slate-500'}"
							>Price Data</span
						>/<span class="text-sm font-medium {priceData ? 'text-slate-500' : 'text-slate-900'}"
							>Price ID</span
						><br />
						<span class="text-sm text-slate-500"
							>({priceData ? 'Create products on the fly' : 'Create products ahead of time.'})</span
						>
					</span>
				</div>
			</div>
			{#if priceData}
				<div class="my-8 sm:flex sm:space-x-4">
					<div class="grow">
						<label for="currency" class="block text-sm font-medium text-slate-700">
							Currency
						</label>
						<div class="mt-1">
							<input
								type="text"
								name="currency"
								bind:value={price_data.currency}
								class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
							/>
						</div>
					</div>

					<div class="grow">
						<label for="unit_amount" class="block text-sm font-medium text-slate-700">
							Unit Amount (Price in Cents)
						</label>
						<div class="mt-1">
							<input
								type="number"
								name="unit_amount"
								bind:value={price_data.unit_amount}
								min="0"
								class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
							/>
						</div>
					</div>
					<div>
						<label for="quantity" class="block text-sm font-medium text-slate-700">
							Quantity
						</label>
						<div class="mt-1">
							<input
								name="quantity"
								type="number"
								min="1"
								bind:value={quantity}
								class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-20 sm:text-sm border-slate-300 rounded-md"
							/>
						</div>
					</div>
				</div>

				<div class="sm:col-span-4 mb-6">
					<label for="name" class="block text-sm font-medium text-slate-700">Name</label>
					<div class="mt-1">
						<input
							type="text"
							name="name"
							bind:value={price_data.product_data.name}
							class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
						/>
					</div>
				</div>

				<div class="sm:col-span-4 mb-6">
					<label for="description" class="block text-sm font-medium text-slate-700"
						>Description
					</label>
					<div class="mt-1">
						<textarea
							type="text"
							name="description"
							bind:value={price_data.product_data.description}
							class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
						/>
					</div>
				</div>

				<div class="sm:col-span-4">
					<label for="images" class="block text-sm font-medium text-slate-700"> Image URL </label>
					<div class="mt-1">
						<input
							type="text"
							name="images"
							bind:value={price_data.product_data.images[0]}
							class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
						/>
					</div>
				</div>
			{:else}
				<div class="sm:col-span-4 mt-8">
					<label for="price_id" class="block text-sm font-medium text-slate-700"> Price ID </label>
					<div class="mt-1">
						<input
							type="text"
							name="price_id"
							placeholder="price_..."
							bind:value={price_id}
							class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
						/>
					</div>
				</div>
			{/if}
		</div>
	{/each}
	<div class="max-w-2xl m-auto">
		<button
			on:click={addNewLineItem}
			class="text-slate-600 float-right -mt-4 hover:text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-md"
		>
			<span class="sr-only">Add Line Item</span>
			Add New Line Item</button
		>
	</div>

	<div class="mt-16 grid grid-cols-1 gap-y-6 sm:gap-x-8 sm:grid-cols-2 w-full">
		<div class="w-full">
			<label for="method" class="block text-sm font-medium text-slate-700 sm:mt-px sm:pt -mb-2">
				Payment Methods
			</label>
			<fieldset class="space-y-5 -mt-3">
				<legend class="sr-only">Payment Methods</legend>
				<div class="border border-slate-300 shadow-sm rounded-md p-2">
					<div class="relative flex items-start {showAllPaymentMethods ? 'pt-1 pb-3' : ''}">
						<div class="flex items-center h-5">
							<input
								id="card"
								bind:group={payment_method_types}
								aria-describedby="card-description"
								name="card"
								value="card"
								type="checkbox"
								class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
							/>
						</div>
						<div class="ml-3 text-sm">
							<label
								for="card"
								class="font-medium text-slate-700 font-mono bg-slate-50 p-1 border rounded"
								>card</label
							>
							<button
								on:click={() => (showAllPaymentMethods = !showAllPaymentMethods)}
								class="absolute right-0 text-slate-500"
							>
								<span class="sr-only">Show all payment methods</span>
								{showAllPaymentMethods ? 'Hide' : 'Show All'}</button
							>
						</div>
					</div>
					{#if showAllPaymentMethods}
						{#each ['acss_debit', 'afterpay_clearpay', 'alipay', 'au_becs_debit', 'bacs_debit', 'bancontact', 'boleto', 'card_present', 'eps', 'fpx', 'giropay', 'grabpay', 'ideal', 'interac_present', 'klarna', 'konbini', 'oxxo', 'p24', 'sepa_debit', 'sofort', 'wechat_pay'] as payment_method}
							<div class="relative flex items-start border-t py-3">
								<div class="flex items-center h-5">
									<input
										bind:group={payment_method_types}
										id={payment_method}
										value={payment_method}
										aria-describedby={payment_method}
										name={payment_method}
										type="checkbox"
										class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded"
									/>
								</div>
								<div class="ml-3 text-sm">
									<label
										for={payment_method}
										class="font-medium text-slate-700 font-mono bg-slate-50 p-1 border rounded"
										>{payment_method}</label
									>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</fieldset>
		</div>
		<div>
			<label for="mode" class="block text-sm font-medium text-slate-700 sm:mt-px sm:pt-2">
				Mode
			</label>
			<select
				bind:value={mode}
				name="mode"
				class="block focus:ring-blue-500 focus:border-blue-500 w-full shadow-sm sm:text-sm border-slate-300 rounded-md"
			>
				<option value="payment">Payment</option>
				<option value="subscription">Subscription</option>
				<option value="setup">Setup</option>
			</select>
		</div>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-y-6 sm:gap-x-8 sm:grid-cols-2">
		<div>
			<label for="stripe-sk" class="block text-sm font-medium text-slate-700"> Success URL </label>
			<div class="mt-1">
				<input
					type="text"
					name="stripe-sk"
					bind:value={success_url}
					class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
				/>
			</div>
		</div>

		<div>
			<label for="stripe-pk" class="block text-sm font-medium text-slate-700"> Cancel URL </label>
			<div class="mt-1">
				<input
					type="text"
					name="stripe-pk"
					bind:value={cancel_url}
					class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
				/>
			</div>
		</div>
	</div>
	<div class="w-full h-20 py-8">
		<button
			on:click={handle_submit}
			type="submit"
			class="clear-both float-right mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			><svg
				class="animate-spin -ml-1 mr-3 h-5 w-5 text-white {promise ? '' : 'hidden'} {error
					? 'hidden'
					: ''}"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg> Check me out!
		</button>
	</div>
	{#if promise}
		{#await promise then}
			Redirecting to Stripe Checkout...
		{:catch error}
			<div class="max-w-2xl text-lg p-4 my-4 m-auto bg-red-50 rounded-md border border-red-300">
				<p class="text-red-600">{error}</p>
			</div>
		{/await}
	{/if}
</div>
<div
	class="bg-slate-900 text-slate-300 max-w-3xl m-auto mt-8 p-8 font-mono md:rounded-md shadow text-sm"
>
	<p>
		const <span class="text-white">session</span> = await stripe.checkout.sessions.create({'{'}<br
		/>{#if payment_method_types.length > 0}
			&emsp;payment_method_types: <span
				class="text-[#7dd3fc]"
			/>[{#each payment_method_types as payment_method}<span class="text-[#7dd3fc]"
					>'{payment_method}'</span
				>,
			{/each}] <br />{/if}
		&emsp;line_items: [&lbrace;<br />
		{#each line_items as { price_data, quantity, price_id, priceData }, i}
			{#if priceData}
				&emsp;&emsp;price_data: &lbrace;<br />
				&emsp;&emsp;&emsp;currency:
				<span class="text-[#7dd3fc]">'{price_data.currency}'</span>,<br />
				&emsp;&emsp;&emsp;unit_amount:
				<span class="text-[#7dd3fc]">{price_data.unit_amount}</span>,<br />
				&emsp;&emsp;&emsp;product_data:&lbrace;<br />
				&emsp;&emsp;&emsp;&emsp;name:
				<span class="text-[#7dd3fc]">'{price_data.product_data.name}'</span>,<br />
				&emsp;&emsp;&emsp;&emsp;description:
				<span class="text-[#7dd3fc]">'{price_data.product_data.description}'</span>,<br />
				{#if price_data.product_data.images[0] !== ''}
					&emsp;&emsp;&emsp;&emsp;images: [<span class="text-[#7dd3fc]"
						>'{price_data.product_data.images}'</span
					>],<br />
				{/if}
				&emsp;&emsp;&emsp;&rbrace;,<br />
				&emsp;&emsp;&rbrace;,
			{:else}
				&emsp;&emsp;price: <span class="text-[#7dd3fc]">'{price_id}'</span>
			{/if}
			<br />
			&emsp;quantity:
			<span class="text-[#7dd3fc]">{quantity},</span><br />
			&emsp;}{i < line_items.length - 1 ? ',' : '],'}<br />
		{/each}
		mode: <span class="text-[#7dd3fc]">'{mode}'</span>,<br />
		success_url: <span class="text-[#7dd3fc]">'{success_url}'</span>,<br />
		cancel_url: <span class="text-[#7dd3fc]">'{cancel_url}'</span>,<br />
		{'});'}
	</p>
</div>
