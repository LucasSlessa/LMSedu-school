import { api } from '../lib/api';

export interface PaymentProvider {
  name: string;
  createPayment: (data: PaymentData) => Promise<PaymentResponse>;
  verifyPayment: (paymentId: string) => Promise<PaymentStatus>;
}

export interface PaymentData {
  courseId: string;
  userId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  paymentId: string;
  paymentUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  expiresAt?: Date;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}

// Stripe Payment Provider via API REST
class StripeProvider implements PaymentProvider {
  name = 'stripe';

  async createPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await api.post('/stripe/create-session', {
        courseId: data.courseId,
        amount: data.amount,
        currency: data.currency,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
        metadata: data.metadata,
      });

      return {
        paymentId: response.data.paymentId,
        paymentUrl: response.data.paymentUrl,
        status: 'pending',
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Erro ao criar pagamento Stripe:', error);
      throw new Error('Falha ao processar pagamento');
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await api.get(`/stripe/verify-session/${paymentId}`);
      
      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        paidAt: response.data.paidAt ? new Date(response.data.paidAt) : undefined,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error('Erro ao verificar pagamento Stripe:', error);
      throw new Error('Falha ao verificar pagamento');
    }
  }
}

// Mock Provider para desenvolvimento
class MockProvider implements PaymentProvider {
  name = 'mock';

  async createPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await api.post('/stripe/mock-payment', {
        courseId: data.courseId,
        amount: data.amount,
        currency: data.currency,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
        metadata: data.metadata,
      });

      return {
        paymentId: response.data.paymentId,
        paymentUrl: response.data.paymentUrl,
        status: 'pending',
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Erro ao criar pagamento mock:', error);
      throw new Error('Falha ao processar pagamento');
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await api.get(`/stripe/mock-verify/${paymentId}`);
      
      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        paidAt: response.data.paidAt ? new Date(response.data.paidAt) : undefined,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error('Erro ao verificar pagamento mock:', error);
      throw new Error('Falha ao verificar pagamento');
    }
  }
}

// Payment Service Principal
export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProvider: string = 'stripe';

  constructor() {
    // Configurar provedores baseado nas variáveis de ambiente
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (stripeKey) {
      this.providers.set('stripe', new StripeProvider());
    } else {
      // Fallback para simulação em desenvolvimento
      this.providers.set('mock', new MockProvider());
      this.defaultProvider = 'mock';
    }
  }

  async createPayment(
    courseId: string,
    userId: string,
    amount: number,
    customerEmail: string,
    customerName: string,
    courseName: string,
    provider?: string
  ): Promise<PaymentResponse> {
    const selectedProvider = this.providers.get(provider || this.defaultProvider);
    
    if (!selectedProvider) {
      throw new Error(`Provedor de pagamento não encontrado: ${provider}`);
    }

    const paymentData: PaymentData = {
      courseId,
      userId,
      amount,
      currency: 'BRL',
      customerEmail,
      customerName,
      successUrl: `${window.location.origin}/payment/success?course_id=${courseId}`,
      cancelUrl: `${window.location.origin}/payment/cancel?course_id=${courseId}`,
      metadata: {
        courseName,
        courseId,
        userId,
      },
    };

    return selectedProvider.createPayment(paymentData);
  }

  async verifyPayment(paymentId: string, provider?: string): Promise<PaymentStatus> {
    const selectedProvider = this.providers.get(provider || this.defaultProvider);
    
    if (!selectedProvider) {
      throw new Error(`Provedor de pagamento não encontrado: ${provider}`);
    }

    return selectedProvider.verifyPayment(paymentId);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Instância singleton
export const paymentService = new PaymentService();
