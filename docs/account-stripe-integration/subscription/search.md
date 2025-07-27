# Search subscriptions | Stripe API Reference
```

{
  "object": "search_result",
  "url": "/v1/subscriptions/search",
  "has_more": false,
  "data": [
    {
      "id": "sub_1MoG3CLkdIwHu7ixd86qvAfe",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1679446874,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1679446874,
      "currency": "usd",
      "customer": "cus_NZOq6LNU39H6ZI",
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
            "id": "si_NZOqmziODmZt2v",
            "object": "subscription_item",
            "created": 1679446875,
            "current_period_end": 1682125274,
            "current_period_start": 1679446874,
            "metadata": {},
            "plan": {
              "id": "price_1MoG3BLkdIwHu7ixrHMcmj3f",
              "object": "plan",
              "active": true,
              "amount": 1099,
              "amount_decimal": "1099",
              "billing_scheme": "per_unit",
              "created": 1679446873,
              "currency": "usd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "nickname": null,
              "product": "prod_NZOqsBJfaRYI1M",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1MoG3BLkdIwHu7ixrHMcmj3f",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1679446873,
              "currency": "usd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_NZOqsBJfaRYI1M",
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
            "subscription": "sub_1MoG3CLkdIwHu7ixd86qvAfe",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1MoG3CLkdIwHu7ixd86qvAfe"
      },
      "latest_invoice": "in_1MoG3CLkdIwHu7ixuBm2QIyW",
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
      "plan": {
        "id": "price_1MoG3BLkdIwHu7ixrHMcmj3f",
        "object": "plan",
        "active": true,
        "amount": 1099,
        "amount_decimal": "1099",
        "billing_scheme": "per_unit",
        "created": 1679446873,
        "currency": "usd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "nickname": null,
        "product": "prod_NZOqsBJfaRYI1M",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1679446874,
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
