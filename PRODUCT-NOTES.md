# Wishnest — Product Notes

## Purchase integrity

A claim should never be treated as evidence that a gift was bought. Wishnest will use a staged item lifecycle:

1. **Available** — anyone may reserve it.
2. **Reserved** — a short, expiring hold while a guest decides or checks out.
3. **Purchased (guest-confirmed)** — the guest has confirmed a purchase; this is not proof.
4. **Verified purchase** — Wishnest has a qualifying retailer confirmation, a verified receipt, or processed the payment itself.
5. **Received / closed** — the recipient confirms it arrived, or the event has passed.

### Principle

For an item purchased at any arbitrary shop, the platform cannot guarantee a purchase unless it controls the payment or receives a reliable retailer confirmation. The product must say this plainly internally, while keeping the recipient's experience reassuring.

### Recommended first-release behaviour

- Guests reserve an item rather than permanently claim it.
- A reservation expires automatically (for example, after 24 hours) unless the guest confirms they bought it.
- Wishnest sends a gentle reminder before expiry; the guest can extend once if necessary.
- After a guest says they bought it, ask for an optional receipt or order-confirmation email upload/forward. Mark it **verified** only after validation.
- After the celebration, ask the recipient privately whether it was received. If not, reopen the item or notify the buyer without revealing their identity.

### Strongest verification paths, in order

1. Wishnest processes a group contribution or cash fund itself.
2. A participating retailer sends an order-confirmation webhook/API response.
3. A retailer-verified email receipt or validated receipt upload.
4. Guest self-confirmation only (useful, but never proof).

### Privacy rule

The recipient sees only that an item is being handled; they do not see receipts, order IDs, price paid, or buyer identity unless the buyer chooses to reveal it.

