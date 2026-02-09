import { config } from '@/config';
import { PaymentResult } from '@/types';

export class PaymentService {
  /**
   * Simulates payment processing
   * Returns success based on configured success rate
   */
  static async processPayment(amount: number, paymentMethod: string = 'credit_card'): Promise<PaymentResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const isSuccess = Math.random() * 100 <= config.paymentSuccessRate;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      const errorMessages = [
        'Insufficient funds',
        'Card declined',
        'Invalid card details',
        'Payment gateway error',
        'Transaction timeout',
      ];

      return {
        success: false,
        error: errorMessages[Math.floor(Math.random() * errorMessages.length)],
      };
    }
  }

  /**
   * Validates payment amount
   */
  static validatePaymentAmount(amount: number): boolean {
    return amount > 0 && amount <= 999999.99;
  }

  /**
   * Formats payment amount for display
   */
  static formatAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}