# Administration Gift Notification — Decision 01

**Status:** Provisionally approved; documentation only; not implemented or activated.

## Decision
When an administration gift is successfully completed and credited, the recipient receives an immediate in-app notification.

## Notification content
- Clearly identify the sender as Administration.
- Show the conceptual NXC amount.
- Include the administration note when one is intended for the recipient.
- Link to the recipient's gift history or wallet activity.

## Delivery rules
- Send only after the gift is successfully completed and credited.
- Do not notify for drafts, pending, failed, cancelled, or skipped gifts.
- Prevent duplicate notifications when processing retries.
- This decision does not include push/mobile notifications.

## Activation boundary
Documentation only. No Appwrite schema, function, workflow, secret, or runtime changes; no wallet or gift operation is activated. NXC remains an internal conceptual unit, not cash or real-world monetary value.
