import { Order } from '../types';

/**
 * Formats a clean, high-visibility WhatsApp message for Admin Satyam Singh.
 */
export function formatWhatsAppOrderMessage(order: Order, helplineName: string = 'SATYAM SINGH'): string {
  const itemsList = order.items
    .map((item, idx) => `  ${idx + 1}. *${item.name}* x${item.quantity} = ₹${item.price * item.quantity}`)
    .join('\n');

  const message = 
`🔔 *NEW ORDER RECEIVED - HELLO BITE* 🔔
----------------------------------------
📋 *Order ID:* #${order.orderNumber}
🕒 *Time:* ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

👤 *CUSTOMER DETAILS:*
• *Name:* ${order.customerName}
• *Phone:* ${order.phone}
• *Address:* ${order.address}
${order.landmark ? `• *Landmark:* ${order.landmark}\n` : ''}• *Delivery Area:* ${order.areaName}

🍔 *ITEMS ORDERED:*
${itemsList}

💰 *PAYMENT & BILL BREAKDOWN:*
• *Item Subtotal:* ₹${order.subtotal}
• *GST & Packing (5%):* ₹${order.tax}
• *Delivery Charge (${order.areaName}):* ₹${order.deliveryCharge}
${order.discount > 0 ? `• *Discount Applied:* -₹${order.discount}\n` : ''}• *GRAND TOTAL:* *₹${order.total}*
• *Payment Mode:* ${order.paymentMethod}

${order.customerNotes ? `📝 *Special Instructions:* "${order.customerNotes}"\n` : ''}
📍 *Admin Contact:* ${helplineName} (Helpline: 7091472879)
----------------------------------------
Please confirm and prepare immediately!`;

  return message;
}

/**
 * Returns a direct WhatsApp URL to message the admin
 */
export function getWhatsAppOrderUrl(order: Order, phone: string = '7091472879'): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const message = formatWhatsAppOrderMessage(order);
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Sends order notification to Telegram Bot / Group via API Webhook
 */
export async function sendTelegramOrderNotification(
  order: Order,
  botToken?: string,
  chatId?: string
): Promise<{ success: boolean; message: string }> {
  if (!botToken || !chatId) {
    return { success: false, message: 'Telegram bot token or Chat ID not configured' };
  }

  const text = formatWhatsAppOrderMessage(order);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Notification delivered to Telegram Group!' };
    } else {
      return { success: false, message: data.description || 'Failed to send to Telegram' };
    }
  } catch (error) {
    return { success: false, message: 'Network error pushing to Telegram' };
  }
}
