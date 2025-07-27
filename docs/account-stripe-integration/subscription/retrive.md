# Retrieve a subscription | Stripe API Reference
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


Upgrade the billing\_mode of an existing subscription.

### Parameters

*   #### 
    
    billing\_modeobjectRequired
    
    Controls how prorations and invoices for subscriptions are calculated and orchestrated.
    

### Returns

The newly migrated `Subscription` object, if the call succeeded.

POST /v1/subscriptions/:id/migrate

```

curl https://api.stripe.com/v1/subscriptions/sub_1MowQVLkdIwHu7ixeRlqHVzs/migrate \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:" \
  -d "billing_mode[type]"=flexible
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
  "billing_mode": "flexible",
  "billing_mode_details": {
    "updated_at": 1679609768
  },
  "billing_thresholds": null,
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
        "billing_thresholds": null,
        "created": 1679609768,
        "current_period_end": 1682288167,
        "current_period_start": 1679609767,
        "metadata": {},
        "plan": {
          "id": "price_1MowQULkdIwHu7ixraBm864M",
          "object": "plan",
          "active": true,
          "aggregate_usage": null,
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
            "aggregate_usage": null,
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


Initiates resumption of a paused subscription, optionally resetting the billing cycle anchor and creating prorations. If a resumption invoice is generated, it must be paid or marked uncollectible before the subscription will be unpaused. If payment succeeds the subscription will become `active`, and if payment fails the subscription will be `past_due`. The resumption invoice will void automatically if not paid by the expiration date.

### Parameters

*   The billing cycle anchor that applies when the subscription is resumed. Either `now` or `unchanged`. The default is `now`. For more information, see the billing cycle [documentation](https://docs.stripe.com/billing/subscriptions/billing-cycle).
    
    Possible enum values
    
    

* nowReset the subscription’s billing cycle anchor to the current time (in UTC) and start a new billing period.: unchangedAdvance the subscription to the period that surrounds the current time without resetting the billing cycle anchor.

    
*   Determines how to handle [prorations](https://docs.stripe.com/billing/subscriptions/prorations) resulting from the `billing_cycle_anchor` being `unchanged`. When the `billing_cycle_anchor` is set to `now` (default value), no prorations are generated. If no value is passed, the default is `create_prorations`.
    
    Possible enum values
    
    

* always_invoiceAlways invoice immediately for prorations.: create_prorationsWill cause proration invoice items to be created when applicable. These proration items will only be invoiced immediately under certain conditions.
* always_invoiceAlways invoice immediately for prorations.: noneDisable creating prorations in this request.

    

### More parameters

### Returns

The subscription object.

POST /v1/subscriptions/:id/resume

```

curl https://api.stripe.com/v1/subscriptions/sub_1MoGGtLkdIwHu7ixk5CfdiqC/resume \
  -u "sk_test_zzPhAh8...I4JDtzTNnhGlsk_test_zzPhAh8sZkhmI4JDtzTNnhGl:" \
  -d billing_cycle_anchor=now
```


```

{
  "id": "sub_1MoGGtLkdIwHu7ixk5CfdiqC",
  "object": "subscription",
  "application": null,
  "application_fee_percent": null,
  "automatic_tax": {
    "enabled": false,
    "liability": null
  },
  "billing_cycle_anchor": 1679447726,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": null
  },
  "collection_method": "charge_automatically",
  "created": 1679447723,
  "currency": "usd",
  "customer": "cus_NZP5i1diUz55jp",
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
        "id": "si_NZP5BhUIuWzXDG",
        "object": "subscription_item",
        "created": 1679447724,
        "current_period_end": 1682126126,
        "current_period_start": 1679447726,
        "metadata": {},
        "plan": {
          "id": "price_1MoGGsLkdIwHu7ixA9yHsq2N",
          "object": "plan",
          "active": true,
          "amount": 1099,
          "amount_decimal": "1099",
          "billing_scheme": "per_unit",
          "created": 1679447722,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": null,
          "product": "prod_NZP5rEATBlScM9",
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1MoGGsLkdIwHu7ixA9yHsq2N",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1679447722,
          "currency": "usd",
          "custom_unit_amount": null,
          "livemode": false,
          "lookup_key": null,
          "metadata": {},
          "nickname": null,
          "product": "prod_NZP5rEATBlScM9",
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
        "subscription": "sub_1MoGGtLkdIwHu7ixk5CfdiqC",
        "tax_rates": []
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_1MoGGtLkdIwHu7ixk5CfdiqC"
  },
  "latest_invoice": "in_1MoGGwLkdIwHu7ixHSrelo8X",
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
    "id": "price_1MoGGsLkdIwHu7ixA9yHsq2N",
    "object": "plan",
    "active": true,
    "amount": 1099,
    "amount_decimal": "1099",
    "billing_scheme": "per_unit",
    "created": 1679447722,
    "currency": "usd",
    "interval": "month",
    "interval_count": 1,
    "livemode": false,
    "metadata": {},
    "nickname": null,
    "product": "prod_NZP5rEATBlScM9",
    "tiers_mode": null,
    "transform_usage": null,
    "trial_period_days": null,
    "usage_type": "licensed"
  },
  "quantity": 1,
  "schedule": null,
  "start_date": 1679447723,
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
