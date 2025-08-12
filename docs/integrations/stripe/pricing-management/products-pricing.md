You can create and update products and prices in the Dashboard or through the
API.

Some advanced use cases, such as
[creating variable prices](https://docs.stripe.com/products-prices/how-products-and-prices-work#variable-pricing),
require you to use the API. Use the API if you have a large number of products
and prices or if you’re
[building a custom integration](https://docs.stripe.com/billing/subscriptions/build-subscriptions?ui=elements)
with Elements.

- Use the [Dashboard](https://dashboard.stripe.com/test/products) to create and
  manage products and prices if you want to avoid writing code or if you only
  have a few products and prices. Set up your
  [pricing model](https://docs.stripe.com/products-prices/pricing-models) in a
  sandbox and click the **Copy to live mode** button on the product details
  page.
- Use the [API](https://docs.stripe.com/api) or the
  [Stripe CLI](https://docs.stripe.com/stripe-cli) to create and manage products
  and prices. The API is a direct method that you use for production
  implementations. The Stripe CLI is a developer tool that helps you build,
  test, and manage your integration with Stripe directly from your terminal.

The following API steps use a fictional SaaS collaboration tool (Togethere) as
an example, where the basic product is a project management dashboard.

## Create a product

### Create a product and price

#### Create a product

To create a product in the Dashboard:

1. Go to **More** > **Product catalog**.
2. Click **+Add product**.
3. Enter the **Name** of your product.
4. (Optional) Add a **Description**. The description appears at checkout, on the
   [customer portal](https://docs.stripe.com/customer-management), and in
   [quotes](https://docs.stripe.com/quotes).
5. (Optional) Add an **Image** of your product. Use a JPEG, PNG, or WEBP file
   that’s smaller than 2MB. The image appears at checkout.
6. (Optional) If you’re using [Stripe Tax](https://docs.stripe.com/tax), select
   a **Tax code** for your product. See
   [tax codes](https://docs.stripe.com/tax/tax-codes) for more information about
   the appropriate category for your product.
7. (Optional) Enter a **Statement descriptor**. This descriptor overrides any
   account descriptors for recurring payments. Choose something that your
   customers would recognize on a bank statement.
8. (Optional) Enter a **Unit label**. This describes how you sell your product.
   For example, if you charge by the seat, enter “seat” so the line item
   includes “per seat” for the price. Unit labels appear at checkout, and in
   invoices, receipts, and the
   [customer portal](https://docs.stripe.com/billing/subscriptions/customer-portal).

#### Create a price for the product

To save a product in the Dashboard, you must also add at least one price.

The product editor shows the flat-rate pricing model by default. You can create
multiple prices or use a different pricing model with the **Advanced pricing
options**.

1. Select a **Pricing model**. For more details about recurring pricing models,
   read the
   [pricing model guide](https://docs.stripe.com/products-prices/pricing-models).

   - **Flat-rate pricing**: Charge the same price for each unit. If you use this
     option, select **One time** or **Recurring**.
   - **Package pricing**: Charge by the package, or group of units, such as
     charging 25 BRL for every 5 units. Purchases are rounded up by default, so
     a customer buying 8 units pays 50 BRL.
   - **Graduated pricing**: Use pricing tiers that might result in a different
     price for some units in an order. For example, you might charge 10 BRL per
     unit for the first 100 units and then 5 BRL per unit for the next 50. If
     you use this option, select the currency for the price and fill in the tier
     table.
   - **Volume pricing**: Charge the same price for each unit based on the total
     number of units sold. For example, you might charge 10 BRL per unit for 50
     units, and 7 BRL per unit for 100 units. If you use this option, select the
     currency for the price and fill in the tier table.

   - **Customer chooses price**: Let the payer decide on the amount to pay for
     your product, service, or cause. **Customer chooses price** is only
     compatible with Checkout and Payment Links.

   - **Usage-based pricing**: Charge your customers based on how much of your
     service they use during the billing cycle.
2. (Optional) If you’re selling in multiple currencies, click **Add another
   currency** to set how much to charge in each currency.

3. Select a **Billing period** for recurring prices. You can add a custom period
   if none of the drop-down options are what you want.

4. Select whether to **Include tax in price**. Learn more about
   [taxes and subscriptions](https://docs.stripe.com/billing/taxes).

5. (Optional) Enter a **Price description**. Customers don’t see this
   description.

6. (Optional) Click **Advanced pricing options** if you want to create multiple
   prices for your product.
7. Click **Add product** to save the product and price. You can
   [edit both](https://docs.stripe.com/products-prices/manage-prices#edit-product)
   later.

## Edit a product

To modify a product in the Dashboard:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu (), then click
   **Edit product**.
3. Make your changes to the product.
4. Click **Save product**.

You can also edit products from within the product information page by clicking
the overflow menu () or **Edit**.

## Archive a product

If you want to disable a product so that it can’t be added to new invoices or
subscriptions, you can archive it. If you archive a product, any existing
subscriptions that use the product remain active until they’re canceled and any
existing payment links that use the product are deactivated. You can’t delete
products that have an associated price, but you can archive them.

To archive a product:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu (), then click
   **Archive product**.

To unarchive a product:

1. Go to the **Archived** tab on the **Product catalog**\>**Overview** page.
2. Find the product you want to modify, click the overflow menu (), then click
   **Unarchive product**.

You can also unarchive a product from the product information page.

## Delete a product

You can only delete products that have no prices associated with them.
Alternatively, you can
[archive a product](https://docs.stripe.com/products-prices/manage-prices#archive-product).

If a product has a price associated with it, you have to
[delete](https://docs.stripe.com/products-prices/manage-prices#delete-price) or
[archive](https://docs.stripe.com/products-prices/manage-prices#archive-price)
the price before you can delete the product. Stripe keeps a record of the price
and product for historical transactions.

To permanently delete a product:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu (), then click
   **Delete product**.

## Create a price

You can create single or multiple prices for a product. For example, Togethere
may have a “starter” level offered at 10 USD per month, 100 USD per year, or 9
EUR as a one-time purchase.

#### Observação

After you create a price, you can only update its `metadata`, `nickname`, and
`active` fields.

To create a price in the Dashboard, you have to
[create a product](https://docs.stripe.com/products-prices/manage-prices#create-product)
first. Then you can create a price:

1. Select a **Pricing model**. For more details about recurring pricing models,
   read the
   [pricing model guide](https://docs.stripe.com/products-prices/pricing-models).

   - **Flat-rate pricing**: Charge the same price for each unit. If you use this
     option, select **One time** or **Recurring**.
   - **Package pricing**: Charge by the package, or group of units, such as
     charging 25 BRL for every 5 units. Purchases are rounded up by default, so
     a customer buying 8 units pays 50 BRL.
   - **Graduated pricing**: Use pricing tiers that might result in a different
     price for some units in an order. For example, you might charge 10 BRL per
     unit for the first 100 units and then 5 BRL per unit for the next 50. If
     you use this option, select the currency for the price and fill in the tier
     table.
   - **Volume pricing**: Charge the same price for each unit based on the total
     number of units sold. For example, you might charge 10 BRL per unit for 50
     units, and 7 BRL per unit for 100 units. If you use this option, select the
     currency for the price and fill in the tier table.

   - **Customer chooses price**: Let the payer decide on the amount to pay for
     your product, service, or cause. **Customer chooses price** is only
     compatible with Checkout and Payment Links.

   - **Usage-based pricing**: Charge your customers based on how much of your
     service they use during the billing cycle.
2. (Optional) If you’re selling in multiple currencies, click **Add another
   currency** to set how much to charge in each currency.

3. Select a **Billing period** for recurring prices. You can add a custom period
   if none of the drop-down options are what you want.

4. Select whether to **Include tax in price**. Learn more about
   [taxes and subscriptions](https://docs.stripe.com/billing/taxes).

5. (Optional) Enter a **Price description**. Customers don’t see this
   description.

6. Click **Create price** to save the price. You can
   [edit the price](https://docs.stripe.com/products-prices/manage-prices#edit-price)
   later.

### Set a default price

A product’s default price is the most common price you want to present to
customers. For example, a product could have multiple prices for seasonal sales,
but the default is the regular (non-sale) price. If your product only has one
price, that is its default price. The default price must be an
[active](https://docs.stripe.com/api/prices/object#price_object-active) Price.

To change your product’s default price in the Dashboard:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu (), then click
   **Edit product**.
3. Under the **Price information** section, find the price you want to set as
   the new default price, then click **Set as default price**.
4. Click **Save product**.

To create a new price and make it the new default price in the Dashboard:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify and click on it to open the product
   information page.
3. In the **Pricing** section, click the **Add another price** button.
4. Enter your pricing details and select **Set as default price**. Read more
   about the fields available when you
   [create a price](https://docs.stripe.com/products-prices/manage-prices#create-price).
5. Click **Add price**.

### Create an inline price

To create an
[inline price](https://docs.stripe.com/products-prices/how-products-and-prices-work#inline-pricing),
pass in `price_data` instead of a `price.id` when you create a one-time payment
or subscription. For example, to subscribe a customer to a monthly subscription
with an inline price:

```
<p><code><span>curl</span><span> </span><span>https://api.stripe.com/v1/subscriptions</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>customer</span><span>=</span><span></span><span><div><p><span>{{CUSTOMER_ID}}</span></p></div></span><span> \
</span><span>  -d</span><span> </span><span>"items[0][price_data][unit_amount]"</span><span>=</span><span>5000</span><span> \
</span><span>  -d</span><span> </span><span>"items[0][price_data][currency]"</span><span>=</span><span>usd</span><span> \
</span><span>  -d</span><span> </span><span>"items[0][price_data][product]"</span><span>=</span><span></span><span><div><p><span>{{PRODUCT_ID}}</span></p></div></span><span> \
</span><span>  -d</span><span> </span><span>"items[0][price_data][recurring][interval]"</span><span>=</span><span>month</span></code><p></p>
```

This creates a monthly recurring price of 50 USD for the basic service offering.
You can’t update or reuse inline prices after you create them. By default,
prices created with `price_data` are effectively archived (they’re marked as
`active=false`). You can also use `price_data` with
[Checkout Sessions](https://docs.stripe.com/api/checkout/sessions),
[Payment Links](https://docs.stripe.com/api/payment-link),
[Invoice Items](https://docs.stripe.com/api/invoiceitems), and
[Subscription Schedules](https://docs.stripe.com/api/subscription_schedules).

### Create multi-currency prices

You can create
[multi-currency Prices](https://docs.stripe.com/products-prices/how-products-and-prices-work#multiple-currencies)
in the [API](https://docs.stripe.com/api/prices/create) or the Dashboard.

To create a multi-currency Price through the Dashboard:

1. Go to the [Product catalog](https://dashboard.stripe.com/test/products) and
   select a product.
2. Click **Edit product**.
3. Click **\+ Add another price** to create a new price. The default currency is
   the first currency on your Price. All your Prices must have the same default
   currency.
4. To add a new currency option to your price, click **\+ Add a price by
   currency**. Search and select from the list of supported currencies.
   - Stripe suggests an exchange rate based on currency values at 12:00 PM EST,
     but you can pick your own. For currencies that are subject to larger
     fluctuations, we recommend adding more of a buffer.
5. To save the new price, click **Next** > **Update product**.

[Coupons](https://docs.stripe.com/billing/subscriptions/coupons#coupons),
[promotion codes](https://docs.stripe.com/billing/subscriptions/coupons#promotion-codes),
and
[shipping rates](https://docs.stripe.com/payments/during-payment/charge-shipping)
also support multi-currency in a similar way to prices.

#### Render multi-currency prices

To show your customer the price in their currency, you can retrieve the
multi-currency price and view its
[currency\_options.<currency>.unit\_amount](https://docs.stripe.com/api/prices/object#price_object-currency_options-unit_amount)
field. The API response won’t include `currency_options` by default. To include
it in the response, [expand](https://docs.stripe.com/api/expanding_objects) the
`currency_options` field:

```
<p><code><span>curl</span><span> -G</span><span> </span><span>https://api.stripe.com/v1/prices/{{PRICE_ID}}</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>"expand[]"</span><span>=</span><span>currency_options</span></code><p></p>
```

#### Observação

To improve latency and avoid problems with rate-limiting, cache the price
instead of re-fetching it every time a customer visits your site.

#### Use multi-currency prices

Each purchase uses one of the multi-currency Price’s supported currencies,
depending on how you use the Price in your integration.

Checkout automatically determines the customer’s local currency from their IP
address, as long as the price supports that currency. If the customer’s local
currency isn’t supported, Checkout uses the default currency for the price.

If a Checkout Session uses multiple prices, coupons, promotion codes, or
shipping rates, then they must all support the customer’s local currency, or
else Checkout uses the default currency. They must all have the same default
currency, or else Stripe returns an error when you create the Checkout Session.

Alternatively, you can use the
[currency](https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-currency)
parameter to explicitly tell Checkout which currency to use.

Learn more about defining
[manual currency prices](https://docs.stripe.com/payments/currencies/localize-prices/manual-currency-prices)
in Checkout.

#### Migrate from single-currency prices to multi-currency

If you have an existing single-currency price, you can retroactively add
multiple currencies to it in the Dashboard.

If you use Checkout or Payment Links, then multi-currency prices take effect
automatically. If Stripe detects that the price supports the customer’s local
currency, then it automatically uses that currency. If you use multiple prices,
coupons, promotion codes, or shipping rates in a single purchase, then they must
all support the customer’s local currency, and they must all have the same
default currency.

If you create subscriptions directly, the multi-currency prices don’t take
effect until you pass the `currency` parameter. If you don’t pass the `currency`
parameter, the subscription always uses the default currency for the price.

### Lookup keys

Most businesses display pricing information on their website. If these prices
are hard-coded and you want to change them, the process is often manual and
requires you to deploy new code. To better manage these scenarios, you can use
the
[lookup\_key](https://docs.stripe.com/api/prices/create#create_price-lookup_key)
attribute on the
[Price object](https://docs.stripe.com/api/prices/object#price_object). This key
allows you to:

- Render different prices in your frontend.
- Use the rendered price to bill customers.

You can pass a `lookup_key` when you create a price:

```
<p><code><span>curl</span><span> </span><span>https://api.stripe.com/v1/prices</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>product</span><span>=</span><span></span><span><div><p><span>{{PRODUCT_ID}}</span></p></div></span><span> \
</span><span>  -d</span><span> </span><span>unit_amount</span><span>=</span><span>1000</span><span> \
</span><span>  -d</span><span> </span><span>currency</span><span>=</span><span>usd</span><span> \
</span><span>  -d</span><span> </span><span>"recurring[interval]"</span><span>=</span><span>month</span><span> \
</span><span>  -d</span><span> </span><span>lookup_key</span><span>=</span><span>standard_monthly</span></code><p></p>
```

Instead of hard-coding text like **10 USD per month** on your pricing page and
using a price ID on your backend, you can query for the price using the
`standard_monthly` key and then render that in your frontend:

```
<p><code><span>curl</span><span> -G</span><span> </span><span>https://api.stripe.com/v1/prices</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>"lookup_keys[]"</span><span>=</span><span>standard_monthly</span></code><p></p>
```

#### Observação

To improve performance, you might want to add a caching layer to only reload the
price occasionally.

When a customer clicks your subscribe or pay button, you pass the price from the
`GET` request above into the Subscriptions API.

Now that you can render different prices, if you decide that you want to start
charging new users 20 USD per month rather than 10 USD per month, you only need
to create a new price and transfer the lookup key to that new price using
[transfer\_lookup\_key=true](https://docs.stripe.com/api/prices/create#create_price-transfer_lookup_key):

#### Rounding

Rounding occurs on the line item level of your
[invoices](https://docs.stripe.com/api/invoices). For example, if you create a
price with `unit_amount_decimal = 0.05` and a monthly subscription for that
\[price\] with `quantity = 30`, rounding occurs after multiplying the quantity
by the decimal amount. In this case, the calculated amount for the line item
would be `0.05 * 30 = 1.5`, which rounds up to 2 cents. If you have multiple
line items, each is rounded up before summing up the total amount for the
invoice. This ensures that customers are still charged an integer minor unit
amount, as decimal amounts only apply for pricing.

Exclusive taxes are added to each line item amount, depending on the tax rate.
If you enable [automatic taxes](https://docs.stripe.com/tax/invoicing),
exclusive taxes are applied and rounded on the total of the invoice, including
invoice level discounts. If you use manual taxes on either the line item level
or the invoice level, you can choose how to apply rounding. Use the
[invoice settings](https://dashboard.stripe.com/settings/billing/invoice) page
in the Dashboard to apply and round taxes for each line item, or apply and round
taxes on the invoice subtotal.

```
<p><code><span>curl</span><span> </span><span>https://api.stripe.com/v1/prices</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>product</span><span>=</span><span></span><span><div><p><span>{{PRODUCT_ID}}</span></p></div></span><span> \
</span><span>  -d</span><span> </span><span>unit_amount</span><span>=</span><span>2000</span><span> \
</span><span>  -d</span><span> </span><span>currency</span><span>=</span><span>usd</span><span> \
</span><span>  -d</span><span> </span><span>"recurring[interval]"</span><span>=</span><span>month</span><span> \
</span><span>  -d</span><span> </span><span>lookup_key</span><span>=</span><span>standard_monthly</span><span> \
</span><span>  -d</span><span> </span><span>transfer_lookup_key</span><span>=</span><span>true</span></code><p></p>
```

## Edit a price

Multiple properties can be updated on a price, either in the Dashboard or the
API. For example, you can change whether the price is active, or modify its
metadata.

Note that you can not change a price’s amount in the API. Instead, we recommend
creating a new price for the new amount, switch to the new price’s ID, then
update the old price to be inactive.

To modify a price in the Dashboard:

1. Go to **More** > **Product catalog**.
2. Find the product for the price you want to modify, and click on it
3. Find the price you want to modify, click the overflow menu (), then click
   **Edit price**.
4. Make your changes to the price. You can add another price at this point.
5. Click **Save**.

## Archive a price

If you want to disable a price so that it can’t be added to new invoices or
subscriptions, you can archive it. If you archive a price, any existing
subscriptions that use the price remain active until they’re canceled and any
existing payment links that use the product are deactivated.

To archive a price through the Dashboard:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu ().
3. On the product information page, find the price you want to modify, then
   click the overflow menu () next to it and click **Archive price**.

To unarchive a price:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu ().
3. On the product information page, find the price you want to modify, then
   click the overflow menu () next to it and click **Unarchive price**.

## Delete a price

You can only delete prices that you’ve never used. Otherwise, you can
[archive them](https://docs.stripe.com/products-prices/manage-prices#archive-price).

To permanently delete a price in the Dashboard:

1. Go to **More** > **Product catalog**.
2. Find the product you want to modify, click the overflow menu ().
3. On the product information page, find the price you want to modify, then
   click the overflow menu () next to it and click **Delete price**.

## Display pricing information

After creating products and prices, you can embed a
[pricing table](https://docs.stripe.com/payments/checkout/pricing-table) on your
website to display pricing information to your customers. When customers choose
a subscription option, they’re taken directly to checkout. Configure, customize,
and update directly in the
[Dashboard](https://dashboard.stripe.com/test/pricing-tables) without writing
any code.

## Import products and prices

If you have a very large product catalog, use the
[Products](https://docs.stripe.com/api/products) API to import your catalog
programmatically. If you’re importing your product catalog to Stripe, you can
use anything as your starting data source, like a product management system or
CSV file.

Use the [Products](https://docs.stripe.com/api/products) API to create a product
in Stripe for each product in your system. To map products in your system to
products in Stripe, assign each product that you import a unique
[id](https://docs.stripe.com/api/products/create#create_product-id). For each
product, use the [Prices](https://docs.stripe.com/api/prices) API to make a
corresponding price. Make sure to store the `id` of the newly created price. You
need to pass this `id` when you
[use the products and prices](https://docs.stripe.com/products-prices/manage-prices#use-products-and-prices)
in your integration.

Confirm the import by checking the
[Dashboard](https://dashboard.stripe.com/products) or using the API to
[list all products](https://docs.stripe.com/api/products/list).

### Delete imported prices

During development, you might need to run this script multiple times for
testing. If you use the same Product ID, you’ll see an error stating that a
Product with that ID already exists. If you haven’t used the Product yet, you
can delete it using the Stripe Dashboard:

1. Go to the Products [Dashboard](https://dashboard.stripe.com/products) and
   find your Product.

2. In the **Pricing** section, click the overflow menu () next to the Price and
   select **Delete Price**.

3. Click the overflow menu () at the top of the page, and select **Delete
   Product**.

### Synchronize products and prices

You might need to run through an import multiple times. You can create a script
to test the import and, if you want to, synch your original data source with
Stripe. To make your script idempotent and resilient to errors, you can safely
try to create the product first, then update it if the product already exists.

To keep your product catalog synchronized with Stripe, use webhooks or other
mechanisms to trigger product updates in Stripe. To
[update a product](https://docs.stripe.com/api/products/update)
programmatically, use the following pattern.

First, find the existing price associated with the product with
[list all prices](https://docs.stripe.com/api/prices/list) API to make sure the
price still matches your data source. Each product should have exactly one
active price.

```
<p><code><span>curl</span><span> -G</span><span> </span><span>https://api.stripe.com/v1/prices</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>product</span><span>=</span><span></span><span><div><p><span>{{PRODUCT_ID}}</span></p></div></span><span> \
</span><span>  -d</span><span> </span><span>active</span><span>=</span><span>true</span></code><p></p>
```

Next, check whether the decimal amount of the price has changed. The
`unit_amount_decimal`
[field](https://docs.stripe.com/api/prices/object#price_object-unit_amount_decimal)
displays the unit amount in cents.

If the amount doesn’t match, you have to create a new price. When you
[create a new price](https://docs.stripe.com/api/prices/create), specify the
`product` ID of the original product, the `currency`, and the updated
`unit_amount` price.

```
<p><code><span>curl</span><span> </span><span>https://api.stripe.com/v1/prices</span><span> \
</span><span>  -u</span><span> </span><span></span><span>"</span></code></p><div><p><code><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></code></p></div><code>:"<span> \
</span><span>  -d</span><span> </span><span>product</span><span>=</span><span></span><span><div><p><span>{{PRODUCT_ID}}</span></p></div></span><span> \
</span><span>  -d</span><span> </span><span>unit_amount</span><span>=</span><span>2000</span><span> \
</span><span>  -d</span><span> </span><span>currency</span><span>=</span><span>usd</span></code><p></p>
```

[Update the old price](https://docs.stripe.com/api/prices/update) to mark it as
`active=false`.

```
<p><code><span>curl</span><span> </span><span>https://api.stripe.com/v1/prices/</span></code></p><div><p><code><span>{{PRICE_ID}}</span></code></p></div><code><span> \
</span><span>  -u</span><span> </span><span></span><span>"<div><p><span data-key-type="secret" data-testid="keytoken-secret" role="button">sk_test_Ho24N7La5CVDtbmpjc377lJI</span></p></div>:"</span><span> \
</span><span>  -d</span><span> </span><span>active</span><span>=</span><span>false</span></code><p></p>
```

## Use products and prices in your integration

You can use products and prices across several different Stripe integration
paths.

## Testing

You can copy products from a testing environment to live mode so that you don’t
need to recreate them. Prices associated with the product are also copied over.
In the product details page in the Dashboard, click **Copy to live mode** in the
upper right corner.

You can only copy test products to live mode once. If you make updates to the
test product after the copy, the live product won’t reflect the changes.
