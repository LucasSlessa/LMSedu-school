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
      // Usa a rota real de criação de sessão de checkout do backend
      const response = await api.post('/stripe/create-checkout-session', {
        courseId: data.courseId,
      });

      // Backend retorna { sessionId, url, orderId }
      return {
        paymentId: response.data.sessionId,
        paymentUrl: response.data.url,
        status: 'pending',
      };
    } catch (error) {
      console.error('Erro ao criar pagamento Stripe:', error);
      throw new Error('Falha ao processar pagamento');
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    try {
      // Consulta o status real da sessão no backend
      const response = await api.get(`/stripe/payment-status/${paymentId}`);
      
      return {
        id: response.data.sessionId || paymentId,
        status: mapStripeStatusToGeneric(response.data.paymentStatus, response.data.orderStatus),
        amount: response.data.amount,
        paidAt: response.data.paidAt ? new Date(response.data.paidAt) : undefined,
        metadata: {
          currency: response.data.currency,
          customerEmail: response.data.customerEmail,
          orderStatus: response.data.orderStatus,
        },
      };
    } catch (error) {
      console.error('Erro ao verificar pagamento Stripe:', error);
      throw new Error('Falha ao verificar pagamento');
    }
  }
}

// Converte status do Stripe/ordem para o enum genérico do app
function mapStripeStatusToGeneric(paymentStatus?: string, orderStatus?: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
  // Prioriza status da ordem no nosso banco quando disponível
  if (orderStatus) {
    if (orderStatus === 'completed') return 'completed';
    if (orderStatus === 'pending') return 'pending';
    if (orderStatus === 'failed') return 'failed';
    if (orderStatus === 'cancelled') return 'cancelled';
    if (orderStatus === 'refunded') return 'refunded';
  }

  // Fallback para status da sessão do Stripe
  switch (paymentStatus) {
    case 'paid':
    case 'complete':
      return 'completed';
    case 'unpaid':
    case 'no_payment_required':
      return 'pending';
    case 'expired':
      return 'failed';
    case 'open':
      return 'processing';
    default:
      return 'pending';
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
