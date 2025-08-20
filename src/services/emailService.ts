export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface CourseAccessEmailData {
  studentName: string;
  courseName: string;
  courseUrl: string;
  instructor: string;
  duration: number;
  accessExpiresAt?: Date;
}

export interface PaymentConfirmationEmailData {
  studentName: string;
  courseName: string;
  amount: number;
  paymentId: string;
  paymentDate: Date;
  courseUrl: string;
}

export interface CertificateEmailData {
  studentName: string;
  courseName: string;
  certificateUrl: string;
  completionDate: Date;
  instructor: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor() {
    // Configurar baseado no provedor escolhido
    this.apiKey = import.meta.env.VITE_SENDGRID_API_KEY || '';
    this.fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@eduplatform.com';
    this.fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'EduPlatform';
    this.baseUrl = 'https://api.sendgrid.com/v3'; // SendGrid por padrão
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.log('📧 Email simulado (desenvolvimento):', emailData);
        return true;
      }

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: emailData.to }],
              subject: emailData.subject,
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          content: [
            {
              type: 'text/html',
              value: emailData.html,
            },
            ...(emailData.text ? [{
              type: 'text/plain',
              value: emailData.text,
            }] : []),
          ],
          ...(emailData.attachments && {
            attachments: emailData.attachments.map(att => ({
              content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
              filename: att.filename,
              type: att.contentType || 'application/octet-stream',
              disposition: 'attachment',
            })),
          }),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  async sendCourseAccessEmail(email: string, data: CourseAccessEmailData): Promise<boolean> {
    const template = this.getCourseAccessTemplate(data);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPaymentConfirmationEmail(email: string, data: PaymentConfirmationEmailData): Promise<boolean> {
    const template = this.getPaymentConfirmationTemplate(data);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendCertificateEmail(email: string, data: CertificateEmailData): Promise<boolean> {
    const template = this.getCertificateTemplate(data);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcomeEmail(email: string, name: string, verificationUrl?: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(name, verificationUrl);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(name, resetUrl);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getCourseAccessTemplate(data: CourseAccessEmailData): EmailTemplate {
    const subject = `🎉 Acesso liberado: ${data.courseName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Parabéns, ${data.studentName}!</h1>
            <p>Seu acesso ao curso foi liberado</p>
          </div>
          
          <div class="content">
            <h2>Bem-vindo ao seu novo curso!</h2>
            <p>Estamos muito felizes em tê-lo conosco. Seu pagamento foi confirmado e agora você tem acesso completo ao curso.</p>
            
            <div class="course-info">
              <h3>📚 ${data.courseName}</h3>
              <p><strong>Instrutor:</strong> ${data.instructor}</p>
              <p><strong>Duração:</strong> ${data.duration} horas</p>
              ${data.accessExpiresAt ? `<p><strong>Acesso válido até:</strong> ${data.accessExpiresAt.toLocaleDateString('pt-BR')}</p>` : '<p><strong>Acesso:</strong> Vitalício</p>'}
            </div>
            
            <div style="text-align: center;">
              <a href="${data.courseUrl}" class="button">🚀 Começar Agora</a>
            </div>
            
            <h3>💡 Dicas para aproveitar melhor:</h3>
            <ul>
              <li>Assista às aulas em ordem sequencial</li>
              <li>Faça anotações durante o aprendizado</li>
              <li>Pratique os exercícios propostos</li>
              <li>Tire suas dúvidas nos comentários</li>
              <li>Complete 100% para receber seu certificado</li>
            </ul>
            
            <p><strong>Precisa de ajuda?</strong> Nossa equipe de suporte está sempre disponível para ajudá-lo. Basta responder este email.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 EduPlatform - Transformando vidas através da educação</p>
            <p>Este email foi enviado para ${data.studentName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Parabéns, ${data.studentName}!
      
      Seu acesso ao curso "${data.courseName}" foi liberado.
      
      Detalhes do curso:
      - Instrutor: ${data.instructor}
      - Duração: ${data.duration} horas
      ${data.accessExpiresAt ? `- Acesso válido até: ${data.accessExpiresAt.toLocaleDateString('pt-BR')}` : '- Acesso: Vitalício'}
      
      Acesse seu curso: ${data.courseUrl}
      
      Bons estudos!
      Equipe EduPlatform
    `;

    return { subject, html, text };
  }

  private getPaymentConfirmationTemplate(data: PaymentConfirmationEmailData): EmailTemplate {
    const subject = `✅ Pagamento confirmado - ${data.courseName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
            <p>Obrigado pela sua compra, ${data.studentName}</p>
          </div>
          
          <div class="content">
            <h2>Seu pagamento foi processado com sucesso!</h2>
            <p>Recebemos a confirmação do seu pagamento e seu acesso ao curso já foi liberado.</p>
            
            <div class="payment-details">
              <h3>📋 Detalhes da Compra</h3>
              <p><strong>Curso:</strong> ${data.courseName}</p>
              <p><strong>Valor:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount)}</p>
              <p><strong>Data do Pagamento:</strong> ${data.paymentDate.toLocaleDateString('pt-BR')}</p>
              <p><strong>ID da Transação:</strong> ${data.paymentId}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.courseUrl}" class="button">🎓 Acessar Meu Curso</a>
            </div>
            
            <h3>📧 Próximos Passos:</h3>
            <ol>
              <li>Acesse seu curso através do link acima</li>
              <li>Complete seu perfil na plataforma</li>
              <li>Comece a primeira aula</li>
              <li>Aproveite todo o conteúdo disponível</li>
            </ol>
            
            <p><strong>Nota:</strong> Guarde este email como comprovante da sua compra. Você pode precisar dele para suporte futuro.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 EduPlatform - Sua jornada de aprendizado começa aqui</p>
            <p>Dúvidas? Entre em contato conosco respondendo este email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Pagamento Confirmado!
      
      Olá ${data.studentName},
      
      Seu pagamento foi processado com sucesso!
      
      Detalhes da compra:
      - Curso: ${data.courseName}
      - Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount)}
      - Data: ${data.paymentDate.toLocaleDateString('pt-BR')}
      - ID: ${data.paymentId}
      
      Acesse seu curso: ${data.courseUrl}
      
      Obrigado pela confiança!
      Equipe EduPlatform
    `;

    return { subject, html, text };
  }

  private getCertificateTemplate(data: CertificateEmailData): EmailTemplate {
    const subject = `🏆 Parabéns! Seu certificado está pronto - ${data.courseName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .certificate-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ffd700; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Parabéns, ${data.studentName}!</h1>
            <p>Você concluiu o curso com sucesso!</p>
          </div>
          
          <div class="content">
            <h2>Seu certificado está pronto! 🎉</h2>
            <p>É com grande satisfação que informamos que você completou com êxito o curso e seu certificado de conclusão já está disponível para download.</p>
            
            <div class="certificate-info">
              <h3>📜 Certificado de Conclusão</h3>
              <p><strong>Curso:</strong> ${data.courseName}</p>
              <p><strong>Aluno:</strong> ${data.studentName}</p>
              <p><strong>Instrutor:</strong> ${data.instructor}</p>
              <p><strong>Data de Conclusão:</strong> ${data.completionDate.toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.certificateUrl}" class="button">📥 Baixar Certificado</a>
            </div>
            
            <h3>🌟 Sobre seu certificado:</h3>
            <ul>
              <li>Válido em todo território nacional</li>
              <li>Pode ser usado para comprovação de horas complementares</li>
              <li>Reconhecido por empresas e instituições</li>
              <li>Disponível para download a qualquer momento</li>
              <li>Possui código de verificação único</li>
            </ul>
            
            <h3>🚀 Continue sua jornada:</h3>
            <p>Agora que você domina este assunto, que tal explorar nossos outros cursos? Temos uma ampla variedade de conteúdos para continuar seu desenvolvimento profissional.</p>
            
            <p><strong>Compartilhe sua conquista!</strong> Mostre seu certificado nas redes sociais e inspire outros a começarem sua jornada de aprendizado.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 EduPlatform - Celebrando seu sucesso!</p>
            <p>Orgulhosos de fazer parte da sua jornada de crescimento</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Parabéns, ${data.studentName}!
      
      Você concluiu o curso "${data.courseName}" com sucesso!
      
      Detalhes do certificado:
      - Curso: ${data.courseName}
      - Instrutor: ${data.instructor}
      - Data de conclusão: ${data.completionDate.toLocaleDateString('pt-BR')}
      
      Baixe seu certificado: ${data.certificateUrl}
      
      Continue aprendendo conosco!
      Equipe EduPlatform
    `;

    return { subject, html, text };
  }

  private getWelcomeTemplate(name: string, verificationUrl?: string): EmailTemplate {
    const subject = `🎉 Bem-vindo à EduPlatform, ${name}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Bem-vindo, ${name}!</h1>
            <p>Sua jornada de aprendizado começa aqui</p>
          </div>
          
          <div class="content">
            <h2>Obrigado por se juntar à nossa comunidade!</h2>
            <p>Estamos muito felizes em tê-lo conosco na EduPlatform. Aqui você encontrará cursos de alta qualidade para impulsionar sua carreira.</p>
            
            ${verificationUrl ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>📧 Confirme seu email</h3>
                <p>Para ativar sua conta e ter acesso completo à plataforma, confirme seu email clicando no botão abaixo:</p>
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button" style="background: #28a745;">Confirmar Email</a>
                </div>
              </div>
            ` : ''}
            
            <div class="features">
              <h3>🌟 O que você pode fazer na EduPlatform:</h3>
              <ul>
                <li>📚 Acesso a centenas de cursos online</li>
                <li>🏆 Certificados reconhecidos</li>
                <li>👨‍🏫 Instrutores especialistas</li>
                <li>📱 Aprenda no seu ritmo, onde quiser</li>
                <li>💬 Comunidade ativa de estudantes</li>
                <li>🎯 Trilhas de aprendizado personalizadas</li>
              </ul>
            </div>
            
            <h3>🚀 Primeiros passos:</h3>
            <ol>
              <li>Complete seu perfil</li>
              <li>Explore nosso catálogo de cursos</li>
              <li>Escolha seu primeiro curso</li>
              <li>Comece a aprender!</li>
            </ol>
            
            <p><strong>Dica:</strong> Comece pelos cursos gratuitos para conhecer nossa metodologia!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 EduPlatform - Transformando vidas através da educação</p>
            <p>Precisa de ajuda? Responda este email que nossa equipe te ajudará!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo à EduPlatform, ${name}!
      
      Obrigado por se juntar à nossa comunidade de aprendizado.
      
      ${verificationUrl ? `Confirme seu email: ${verificationUrl}` : ''}
      
      O que você pode fazer:
      - Acesso a centenas de cursos
      - Certificados reconhecidos
      - Instrutores especialistas
      - Aprenda no seu ritmo
      
      Comece sua jornada hoje mesmo!
      
      Equipe EduPlatform
    `;

    return { subject, html, text };
  }

  private getPasswordResetTemplate(name: string, resetUrl: string): EmailTemplate {
    const subject = `🔐 Redefinir senha - EduPlatform`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinir Senha</h1>
            <p>Solicitação de nova senha</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na EduPlatform.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
            </div>
            
            <div class="warning">
              <h3>⚠️ Importante:</h3>
              <ul>
                <li>Este link é válido por apenas 1 hora</li>
                <li>Use apenas se você solicitou a redefinição</li>
                <li>Nunca compartilhe este link com outras pessoas</li>
                <li>Se não foi você, ignore este email</li>
              </ul>
            </div>
            
            <p><strong>Não solicitou esta redefinição?</strong> Sua conta está segura. Você pode ignorar este email com tranquilidade.</p>
            
            <p>Se você continuar tendo problemas para acessar sua conta, entre em contato conosco respondendo este email.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 EduPlatform - Mantendo sua conta segura</p>
            <p>Este email foi enviado para ${name}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Redefinir Senha - EduPlatform
      
      Olá ${name},
      
      Recebemos uma solicitação para redefinir sua senha.
      
      Clique no link para criar uma nova senha: ${resetUrl}
      
      IMPORTANTE:
      - Link válido por 1 hora
      - Não compartilhe com ninguém
      - Se não foi você, ignore este email
      
      Equipe EduPlatform
    `;

    return { subject, html, text };
  }
}

// Instância singleton
export const emailService = new EmailService();