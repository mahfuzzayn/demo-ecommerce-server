import Order from "../modules/order/order.model";

/**
 * Generates a human-friendly order id in the format:
 *   DE{DD}D{MM}M{0001}{U|G}
 *
 * Examples:
 *   DE07D08M0001U  → day 07, month 08, sequence 0001, placed by a user
 *   DE07D08M0002G  → day 07, month 08, sequence 0002, placed by a guest
 *
 * The sequence is derived from how many orders were already placed today
 * (same day + month) so ids increment naturally per day. A retry loop guards
 * against a rare collision when two orders are created at the exact same time.
 */
export const generateOrderId = async (isUser: boolean): Promise<string> => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const suffix = isUser ? "U" : "G";

    // Find the highest sequence used for today's prefix.
    const prefix = `DE${day}D${month}M`;
    const latest = await Order.findOne({
        orderId: { $regex: `^${prefix}` },
    }).sort({ orderId: -1 });

    let sequence = 1;
    if (latest?.orderId) {
        const match = latest.orderId.match(/(\d{4})(U|G)$/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }

    // Retry a few times in case of a concurrent duplicate (unique index races).
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = `${prefix}${String(sequence).padStart(4, "0")}${suffix}`;

        const exists = await Order.findOne({ orderId: candidate }).select("_id");
        if (!exists) {
            return candidate;
        }

        sequence += 1;
    }

    // Extremely unlikely — fall back to a timestamp-based id.
    return `${prefix}${now.getTime().toString().slice(-4)}${suffix}`;
};
