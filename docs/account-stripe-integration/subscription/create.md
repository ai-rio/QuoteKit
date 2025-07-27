# Create a subscription | Stripe API Reference
Creates a new subscription on an existing customer. Each customer can have up to 500 active or scheduled subscriptions.

When you create a subscription with `collection_method=charge_automatically`, the first invoice is finalized as part of the request. The `payment_behavior` parameter determines the exact behavior of the initial payment.

To start subscriptions where the first invoice always begins in a `draft` status, use [subscription schedules](about:/billing/subscriptions/subscription-schedules#managing) instead. Schedules provide the flexibility to model more complex billing configurations that change over time.

### Parameters

*   The identifier of the customer to subscribe.
    
*   Automatic tax settings for this subscription.
    

*   #### 
    
    default\_payment\_methodstring
    
    ID of the default payment method for the subscription. It must belong to the customer associated with the subscription. This takes precedence over `default_source`. If neither are set, invoices will use the customer’s [invoice\_settings.default\_payment\_method](about:/api/customers/object#customer_object-invoice_settings-default_payment_method) or [default\_source](about:/api/customers/object#customer_object-default_source).
    
*   The subscription’s description, meant to be displayable to the customer. Use this field to optionally store an explanation of the subscription for rendering in Stripe surfaces and certain local payment methods UIs.
    
*   #### 
    
    itemsarray of objectsRequired
    
    A list of up to 20 subscription items, each with an attached price.
    
*   Set of [key-value pairs](https://docs.stripe.com/api/metadata) that you can attach to an object. This can be useful for storing additional information about the object in a structured format. Individual keys can be unset by posting an empty value to them. All keys can be unset by posting an empty value to `metadata`.
    
*   Only applies to subscriptions with `collection_method=charge_automatically`.
    
    Use `allow_incomplete` to create Subscriptions with `status=incomplete` if the first invoice can’t be paid. Creating Subscriptions with this status allows you to manage scenarios where additional customer actions are needed to pay a subscription’s invoice. For example, SCA regulation may require 3DS authentication to complete payment. See the [SCA Migration Guide](https://docs.stripe.com/billing/migration/strong-customer-authentication) for Billing to learn more. This is the default behavior.
    
    Use `default_incomplete` to create Subscriptions with `status=incomplete` when the first invoice requires payment, otherwise start as active. Subscriptions transition to `status=active` when successfully confirming the PaymentIntent on the first invoice. This allows simpler management of scenarios where additional customer actions are needed to pay a subscription’s invoice, such as failed payments, [SCA regulation](https://docs.stripe.com/billing/migration/strong-customer-authentication), or collecting a mandate for a bank debit payment method. If the PaymentIntent is not confirmed within 23 hours Subscriptions transition to `status=incomplete_expired`, which is a terminal state.
    
    Use `error_if_incomplete` if you want Stripe to return an HTTP 402 status code if a subscription’s first invoice can’t be paid. For example, if a payment method requires 3DS authentication due to SCA regulation and further customer action is needed, this parameter doesn’t create a Subscription and returns an error instead. This was the default behavior for API versions prior to 2019-03-14. See the [changelog](about:/upgrades#2019-03-14) to learn more.
    
    `pending_if_incomplete` is only used with updates and cannot be passed when creating a Subscription.
    
    Subscriptions with `collection_method=send_invoice` are automatically activated regardless of the first Invoice status.
    
    Possible enum values
    
    
|allow_incomplete     |
|---------------------|
|default_incomplete   |
|error_if_incomplete  |
|pending_if_incomplete|

    

### More parameters

*   #### 
    
    add\_invoice\_itemsarray of objects
    
*   #### 
    
    application\_fee\_percentfloatConnect only
    
*   #### 
    
    backdate\_start\_datetimestamp
    
*   #### 
    
    billing\_cycle\_anchortimestamp
    
*   #### 
    
    billing\_cycle\_anchor\_configobject
    

*   #### 
    
    cancel\_at\_period\_endboolean
    

*   #### 
    
    default\_tax\_ratesarray of strings
    
*   #### 
    
    discountsarray of objects
    

*   #### 
    
    pending\_invoice\_item\_intervalobject
    

*   #### 
    
    transfer\_dataobjectConnect only
    
*   #### 
    
    trial\_endstring | timestamp
    

### Returns

The newly created `Subscription` object, if the call succeeded. If the attempted charge fails, the subscription is created in an `incomplete` status.

```

curl https://api.stripe.com/v1/subscriptions \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:" \
  -d customer=cus_Na6dX7aXxi11N4 \
  -d "items[0][price]"=price_1MowQULkdIwHu7ixraBm864M
```


```

{
  "id": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
  "object": "subscription",
  "application": null,
  "application_fee_percent": null,
  "automatic_tax": {
    "enabled": false,
    "liability": null
  },
  "billing_cycle_anchor": 1679609767,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": null
  },
  "collection_method": "charge_automatically",
  "created": 1679609767,
  "currency": "usd",
  "customer": "cus_Na6dX7aXxi11N4",
  "days_until_due": null,
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [],
  "description": null,
  "discounts": null,
  "ended_at": null,
  "invoice_settings": {
    "issuer": {
      "type": "self"
    }
  },
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_Na6dzxczY5fwHx",
        "object": "subscription_item",
        "created": 1679609768,
        "current_period_end": 1682288167,
        "current_period_start": 1679609767,
        "metadata": {},
        "plan": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "plan",
          "active": true,
          "amount": 1000,
          "amount_decimal": "1000",
          "billing_scheme": "per_unit",
          "created": 1679609766,
          "currency": "usd",
          "discounts": null,
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": null,
          "product": "prod_Na6dGcTsmU0I4R",
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1679609766,
          "currency": "usd",
          "custom_unit_amount": null,
          "livemode": false,
          "lookup_key": null,
          "metadata": {},
          "nickname": null,
          "product": "prod_Na6dGcTsmU0I4R",
          "recurring": {
            "interval": "month",
            "interval_count": 1,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "tax_behavior": "unspecified",
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 1000,
          "unit_amount_decimal": "1000"
        },
        "quantity": 1,
        "subscription": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
        "tax_rates": []
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_1MowQVLkdIwHu7ixeRlqHVzs"
  },
  "latest_invoice": "in_1MowQWLkdIwHu7ixuzkSPfKd",
  "livemode": false,
  "metadata": {},
  "next_pending_invoice_item_invoice": null,
  "on_behalf_of": null,
  "pause_collection": null,
  "payment_settings": {
    "payment_method_options": null,
    "payment_method_types": null,
    "save_default_payment_method": "off"
  },
  "pending_invoice_item_interval": null,
  "pending_setup_intent": null,
  "pending_update": null,
  "schedule": null,
  "start_date": 1679609767,
  "status": "active",
  "test_clock": null,
  "transfer_data": null,
  "trial_end": null,
  "trial_settings": {
    "end_behavior": {
      "missing_payment_method": "create_invoice"
    }
  },
  "trial_start": null
}
```


Updates an existing subscription to match the specified parameters. When changing prices or quantities, we optionally prorate the price we charge next month to make up for any price changes. To preview how the proration is calculated, use the [create preview](https://docs.stripe.com/api/invoices/create_preview) endpoint.

By default, we prorate subscription changes. For example, if a customer signs up on May 1 for a 100 EUR price, they’ll be billed 100 EUR immediately. If on May 15 they switch to a 200 EUR price, then on June 1 they’ll be billed 250 EUR (200 EUR for a renewal of her subscription, plus a 50 EUR prorating adjustment for half of the previous month’s 100 EUR difference). Similarly, a downgrade generates a credit that is applied to the next invoice. We also prorate when you make quantity changes.

Switching prices does not normally change the billing date or generate an immediate charge unless:

*   The billing interval is changed (for example, from monthly to yearly).
*   The subscription moves from free to paid.
*   A trial starts or ends.

In these cases, we apply a credit for the unused time on the previous price, immediately charge the customer using the new price, and reset the billing date. Learn about how [Stripe immediately attempts payment for subscription changes](about:/billing/subscriptions/upgrade-downgrade#immediate-payment).

If you want to charge for an upgrade immediately, pass `proration_behavior` as `always_invoice` to create prorations, automatically invoice the customer for those proration adjustments, and attempt to collect payment. If you pass `create_prorations`, the prorations are created but not automatically invoiced. If you want to bill the customer for the prorations before the subscription’s renewal date, you need to manually [invoice the customer](https://docs.stripe.com/api/invoices/create).

If you don’t want to prorate, set the `proration_behavior` option to `none`. With this option, the customer is billed 100 EUR on May 1 and 200 EUR on June 1. Similarly, if you set `proration_behavior` to `none` when switching between different billing intervals (for example, from monthly to yearly), we don’t generate any credits for the old subscription’s unused time. We still reset the billing date and bill immediately for the new subscription.

Updating the quantity on a subscription many times in an hour may result in [rate limiting](https://docs.stripe.com/rate-limits). If you need to bill for a frequently changing quantity, consider integrating [usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based) instead.

### Parameters

*   Automatic tax settings for this subscription. We recommend you only include this parameter when the existing value is being changed.
    
*   #### 
    
    default\_payment\_methodstring
    
    ID of the default payment method for the subscription. It must belong to the customer associated with the subscription. This takes precedence over `default_source`. If neither are set, invoices will use the customer’s [invoice\_settings.default\_payment\_method](about:/api/customers/object#customer_object-invoice_settings-default_payment_method) or [default\_source](about:/api/customers/object#customer_object-default_source).
    
*   The subscription’s description, meant to be displayable to the customer. Use this field to optionally store an explanation of the subscription for rendering in Stripe surfaces and certain local payment methods UIs.
    
*   A list of up to 20 subscription items, each with an attached price.
    
*   Set of [key-value pairs](https://docs.stripe.com/api/metadata) that you can attach to an object. This can be useful for storing additional information about the object in a structured format. Individual keys can be unset by posting an empty value to them. All keys can be unset by posting an empty value to `metadata`.
    
*   Use `allow_incomplete` to transition the subscription to `status=past_due` if a payment is required but cannot be paid. This allows you to manage scenarios where additional user actions are needed to pay a subscription’s invoice. For example, SCA regulation may require 3DS authentication to complete payment. See the [SCA Migration Guide](https://docs.stripe.com/billing/migration/strong-customer-authentication) for Billing to learn more. This is the default behavior.
    
    Use `default_incomplete` to transition the subscription to `status=past_due` when payment is required and await explicit confirmation of the invoice’s payment intent. This allows simpler management of scenarios where additional user actions are needed to pay a subscription’s invoice. Such as failed payments, [SCA regulation](https://docs.stripe.com/billing/migration/strong-customer-authentication), or collecting a mandate for a bank debit payment method.
    
    Use `pending_if_incomplete` to update the subscription using [pending updates](https://docs.stripe.com/billing/subscriptions/pending-updates). When you use `pending_if_incomplete` you can only pass the parameters [supported by pending updates](about:/billing/pending-updates-reference#supported-attributes).
    
    Use `error_if_incomplete` if you want Stripe to return an HTTP 402 status code if a subscription’s invoice cannot be paid. For example, if a payment method requires 3DS authentication due to SCA regulation and further user action is needed, this parameter does not update the subscription and returns an error instead. This was the default behavior for API versions prior to 2019-03-14. See the [changelog](about:/upgrades#2019-03-14) to learn more.
    
    Possible enum values
    
    
|allow_incomplete     |
|---------------------|
|default_incomplete   |
|error_if_incomplete  |
|pending_if_incomplete|

    
*   Determines how to handle [prorations](https://docs.stripe.com/billing/subscriptions/prorations) when the billing cycle changes (e.g., when switching plans, resetting `billing_cycle_anchor=now`, or starting a trial), or if an item’s `quantity` changes. The default value is `create_prorations`.
    
    Possible enum values
    
    

* always_invoiceAlways invoice immediately for prorations.: create_prorationsWill cause proration invoice items to be created when applicable. These proration items will only be invoiced immediately under certain conditions.
* always_invoiceAlways invoice immediately for prorations.: noneDisable creating prorations in this request.

    

### More parameters

*   #### 
    
    add\_invoice\_itemsarray of objects
    
*   #### 
    
    application\_fee\_percentfloatConnect only
    
*   #### 
    
    billing\_cycle\_anchorstring
    

*   #### 
    
    cancel\_at\_period\_endboolean
    
*   #### 
    
    cancellation\_detailsobject
    

*   #### 
    
    default\_tax\_ratesarray of strings
    
*   #### 
    
    discountsarray of objects
    

*   #### 
    
    pending\_invoice\_item\_intervalobject
    

*   #### 
    
    transfer\_dataobjectConnect only
    
*   #### 
    
    trial\_endstring | timestamp
    

### Returns

The newly updated `Subscription` object, if the call succeeded. If `payment_behavior` is `error_if_incomplete` and a charge is required for the update and it fails, this call raises [an error](https://docs.stripe.com/api/errors), and the subscription update does not go into effect.

POST /v1/subscriptions/:id

```

curl https://api.stripe.com/v1/subscriptions/sub_1MowQVLkdIwHu7ixeRlqHVzs \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:" \
  -d "metadata[order_id]"=6735
```


```

{
  "id": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
  "object": "subscription",
  "application": null,
  "application_fee_percent": null,
  "automatic_tax": {
    "enabled": false,
    "liability": null
  },
  "billing_cycle_anchor": 1679609767,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": null
  },
  "collection_method": "charge_automatically",
  "created": 1679609767,
  "currency": "usd",
  "customer": "cus_Na6dX7aXxi11N4",
  "days_until_due": null,
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [],
  "description": null,
  "discounts": null,
  "ended_at": null,
  "invoice_settings": {
    "issuer": {
      "type": "self"
    }
  },
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_Na6dzxczY5fwHx",
        "object": "subscription_item",
        "created": 1679609768,
        "current_period_end": 1682288167,
        "current_period_start": 1679609767,
        "metadata": {},
        "plan": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "plan",
          "active": true,
          "amount": 1000,
          "amount_decimal": "1000",
          "billing_scheme": "per_unit",
          "created": 1679609766,
          "currency": "usd",
          "discounts": null,
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": null,
          "product": "prod_Na6dGcTsmU0I4R",
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1679609766,
          "currency": "usd",
          "custom_unit_amount": null,
          "livemode": false,
          "lookup_key": null,
          "metadata": {},
          "nickname": null,
          "product": "prod_Na6dGcTsmU0I4R",
          "recurring": {
            "interval": "month",
            "interval_count": 1,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "tax_behavior": "unspecified",
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 1000,
          "unit_amount_decimal": "1000"
        },
        "quantity": 1,
        "subscription": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
        "tax_rates": []
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_1MowQVLkdIwHu7ixeRlqHVzs"
  },
  "latest_invoice": "in_1MowQWLkdIwHu7ixuzkSPfKd",
  "livemode": false,
  "metadata": {
    "order_id": "6735"
  },
  "next_pending_invoice_item_invoice": null,
  "on_behalf_of": null,
  "pause_collection": null,
  "payment_settings": {
    "payment_method_options": null,
    "payment_method_types": null,
    "save_default_payment_method": "off"
  },
  "pending_invoice_item_interval": null,
  "pending_setup_intent": null,
  "pending_update": null,
  "schedule": null,
  "start_date": 1679609767,
  "status": "active",
  "test_clock": null,
  "transfer_data": null,
  "trial_end": null,
  "trial_settings": {
    "end_behavior": {
      "missing_payment_method": "create_invoice"
    }
  },
  "trial_start": null
}
```


Retrieves the subscription with the given ID.

### Parameters

No parameters.

### Returns

Returns the subscription object.

GET /v1/subscriptions/:id

```

curl https://api.stripe.com/v1/subscriptions/sub_1MowQVLkdIwHu7ixeRlqHVzs \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:"
```


```

{
  "id": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
  "object": "subscription",
  "application": null,
  "application_fee_percent": null,
  "automatic_tax": {
    "enabled": false,
    "liability": null
  },
  "billing_cycle_anchor": 1679609767,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": null
  },
  "collection_method": "charge_automatically",
  "created": 1679609767,
  "currency": "usd",
  "customer": "cus_Na6dX7aXxi11N4",
  "days_until_due": null,
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [],
  "description": null,
  "discounts": null,
  "ended_at": null,
  "invoice_settings": {
    "issuer": {
      "type": "self"
    }
  },
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_Na6dzxczY5fwHx",
        "object": "subscription_item",
        "created": 1679609768,
        "current_period_end": 1682288167,
        "current_period_start": 1679609767,
        "metadata": {},
        "plan": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "plan",
          "active": true,
          "amount": 1000,
          "amount_decimal": "1000",
          "billing_scheme": "per_unit",
          "created": 1679609766,
          "currency": "usd",
          "discounts": null,
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": null,
          "product": "prod_Na6dGcTsmU0I4R",
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1679609766,
          "currency": "usd",
          "custom_unit_amount": null,
          "livemode": false,
          "lookup_key": null,
          "metadata": {},
          "nickname": null,
          "product": "prod_Na6dGcTsmU0I4R",
          "recurring": {
            "interval": "month",
            "interval_count": 1,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "tax_behavior": "unspecified",
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 1000,
          "unit_amount_decimal": "1000"
        },
        "quantity": 1,
        "subscription": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
        "tax_rates": []
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_1MowQVLkdIwHu7ixeRlqHVzs"
  },
  "latest_invoice": "in_1MowQWLkdIwHu7ixuzkSPfKd",
  "livemode": false,
  "metadata": {},
  "next_pending_invoice_item_invoice": null,
  "on_behalf_of": null,
  "pause_collection": null,
  "payment_settings": {
    "payment_method_options": null,
    "payment_method_types": null,
    "save_default_payment_method": "off"
  },
  "pending_invoice_item_interval": null,
  "pending_setup_intent": null,
  "pending_update": null,
  "schedule": null,
  "start_date": 1679609767,
  "status": "active",
  "test_clock": null,
  "transfer_data": null,
  "trial_end": null,
  "trial_settings": {
    "end_behavior": {
      "missing_payment_method": "create_invoice"
    }
  },
  "trial_start": null
}
```


By default, returns a list of subscriptions that have not been canceled. In order to list canceled subscriptions, specify `status=canceled`.

### Parameters

*   The ID of the customer whose subscriptions will be retrieved.
    
*   Filter for subscriptions that contain this recurring price ID.
    
*   The status of the subscriptions to retrieve. Passing in a value of `canceled` will return all canceled subscriptions, including those belonging to deleted customers. Pass `ended` to find subscriptions that are canceled and subscriptions that are expired due to [incomplete payment](about:/billing/subscriptions/overview#subscription-statuses). Passing in a value of `all` will return subscriptions of all statuses. If no value is supplied, all subscriptions that have not been canceled are returned.
    

### More parameters

*   #### 
    
    current\_period\_startobject
    

### Returns

Returns a list of subscriptions.

```

curl -G https://api.stripe.com/v1/subscriptions \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:" \
  -d limit=3
```


```

{
  "object": "list",
  "url": "/v1/subscriptions",
  "has_more": false,
  "data": [
    {
      "id": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1679609767,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1679609767,
      "currency": "usd",
      "customer": "cus_Na6dX7aXxi11N4",
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": null,
      "ended_at": null,
      "invoice_settings": {
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_Na6dzxczY5fwHx",
            "object": "subscription_item",
            "created": 1679609768,
            "current_period_end": 1682288167,
            "current_period_start": 1679609767,
            "metadata": {},
            "plan": {
              "id": "price_1MowQULkdIwHu7ixraBm864M",
              "object": "plan",
              "active": true,
              "amount": 1000,
              "amount_decimal": "1000",
              "billing_scheme": "per_unit",
              "created": 1679609766,
              "currency": "usd",
              "discounts": null,
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "nickname": null,
              "product": "prod_Na6dGcTsmU0I4R",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1MowQULkdIwHu7ixraBm864M",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1679609766,
              "currency": "usd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_Na6dGcTsmU0I4R",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 1000,
              "unit_amount_decimal": "1000"
            },
            "quantity": 1,
            "subscription": "sub_1MowQVLkdIwHu7ixeRlqHVzs",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1MowQVLkdIwHu7ixeRlqHVzs"
      },
      "latest_invoice": "in_1MowQWLkdIwHu7ixuzkSPfKd",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": null,
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "schedule": null,
      "start_date": 1679609767,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    }
  ]
}
```


Cancels a customer’s subscription immediately. The customer won’t be charged again for the subscription. After it’s canceled, you can no longer update the subscription or its [metadata](https://docs.stripe.com/metadata).

Any pending invoice items that you’ve created are still charged at the end of the period, unless manually [deleted](#delete_invoiceitem). If you’ve set the subscription to cancel at the end of the period, any pending prorations are also left in place and collected at the end of the period. But if the subscription is set to cancel immediately, pending prorations are removed if `invoice_now` and `prorate` are both set to true.

By default, upon subscription cancellation, Stripe stops automatic collection of all finalized invoices for the customer. This is intended to prevent unexpected payment attempts after the customer has canceled a subscription. However, you can resume automatic collection of the invoices manually after subscription cancellation to have us proceed. Or, you could check for unpaid invoices before allowing the customer to cancel the subscription at all.

### Parameters

No parameters.

### More parameters

*   #### 
    
    cancellation\_detailsobject
    

### Returns

The canceled `Subscription` object. Its subscription status will be set to `canceled`.

DELETE /v1/subscriptions/:id

```

curl -X DELETE https://api.stripe.com/v1/subscriptions/sub_1MlPf9LkdIwHu7ixB6VIYRyX \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:"
```


```

{
  "id": "sub_1MlPf9LkdIwHu7ixB6VIYRyX",
  "object": "subscription",
  "application": null,
  "application_fee_percent": null,
  "automatic_tax": {
    "enabled": false,
    "liability": null
  },
  "billing_cycle_anchor": 1678768838,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": 1678768842,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": "cancellation_requested"
  },
  "collection_method": "charge_automatically",
  "created": 1678768838,
  "currency": "usd",
  "customer": "cus_NWSaVkvdacCUi4",
  "days_until_due": null,
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [],
  "description": null,
  "discounts": null,
  "ended_at": 1678768842,
  "invoice_settings": {
    "issuer": {
      "type": "self"
    }
  },
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_NWSaWTp80M123q",
        "object": "subscription_item",
        "created": 1678768839,
        "current_period_end": 1681447238,
        "current_period_start": 1678768838,
        "metadata": {},
        "plan": {
          "id": "price_1MlPf7LkdIwHu7ixgcbP7cwE",
          "object": "plan",
          "active": true,
          "amount": 1099,
          "amount_decimal": "1099",
          "billing_scheme": "per_unit",
          "created": 1678768837,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": null,
          "product": "prod_NWSaMgipulx8IQ",
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1MlPf7LkdIwHu7ixgcbP7cwE",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1678768837,
          "currency": "usd",
          "custom_unit_amount": null,
          "livemode": false,
          "lookup_key": null,
          "metadata": {},
          "nickname": null,
          "product": "prod_NWSaMgipulx8IQ",
          "recurring": {
            "interval": "month",
            "interval_count": 1,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "tax_behavior": "unspecified",
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 1099,
          "unit_amount_decimal": "1099"
        },
        "quantity": 1,
        "subscription": "sub_1MlPf9LkdIwHu7ixB6VIYRyX",
        "tax_rates": []
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_1MlPf9LkdIwHu7ixB6VIYRyX"
  },
  "latest_invoice": "in_1MlPf9LkdIwHu7ixEo6hdgCw",
  "livemode": false,
  "metadata": {},
  "next_pending_invoice_item_invoice": null,
  "on_behalf_of": null,
  "pause_collection": null,
  "payment_settings": {
    "payment_method_options": null,
    "payment_method_types": null,
    "save_default_payment_method": "off"
  },
  "pending_invoice_item_interval": null,
  "pending_setup_intent": null,
  "pending_update": null,
  "plan": {
    "id": "price_1MlPf7LkdIwHu7ixgcbP7cwE",
    "object": "plan",
    "active": true,
    "amount": 1099,
    "amount_decimal": "1099",
    "billing_scheme": "per_unit",
    "created": 1678768837,
    "currency": "usd",
    "interval": "month",
    "interval_count": 1,
    "livemode": false,
    "metadata": {},
    "nickname": null,
    "product": "prod_NWSaMgipulx8IQ",
    "tiers_mode": null,
    "transform_usage": null,
    "trial_period_days": null,
    "usage_type": "licensed"
  },
  "quantity": 1,
  "schedule": null,
  "start_date": 1678768838,
  "status": "canceled",
  "test_clock": null,
  "transfer_data": null,
  "trial_end": null,
  "trial_settings": {
    "end_behavior": {
      "missing_payment_method": "create_invoice"
    }
  },
  "trial_start": null
}
```
