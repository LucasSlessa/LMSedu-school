import jsPDF from 'jspdf';

interface CertificateData {
  studentName: string;
  courseName: string;
  courseDuration: number;
  completionDate: string;
  instructor: string;
}

export const generateCertificatePDF = async (data: CertificateData): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Configurações
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  // Fundo decorativo
  pdf.setFillColor(248, 250, 252); // Blue-50
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Borda decorativa
  pdf.setDrawColor(59, 130, 246); // Blue-500
  pdf.setLineWidth(2);
  pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

  // Borda interna
  pdf.setDrawColor(147, 197, 253); // Blue-300
  pdf.setLineWidth(1);
  pdf.rect(margin + 5, margin + 5, pageWidth - 2 * margin - 10, pageHeight - 2 * margin - 10);

  // Logo/Ícone (simulado com texto)
  pdf.setFillColor(30, 64, 175); // Blue-700
  pdf.circle(pageWidth / 2, margin + 25, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🎓', pageWidth / 2 - 3, margin + 28);

  // Título principal
  pdf.setTextColor(30, 64, 175); // Blue-700
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'CERTIFICADO DE CONCLUSÃO';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, margin + 50);

  // Linha decorativa
  pdf.setDrawColor(59, 130, 246); // Blue-500
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 40, margin + 55, pageWidth / 2 + 40, margin + 55);

  // Texto de certificação
  pdf.setTextColor(31, 41, 55); // Gray-800
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const certificationText = 'Certificamos que';
  const certificationWidth = pdf.getTextWidth(certificationText);
  pdf.text(certificationText, (pageWidth - certificationWidth) / 2, margin + 75);

  // Nome do aluno
  pdf.setTextColor(30, 64, 175); // Blue-700
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const nameWidth = pdf.getTextWidth(data.studentName);
  pdf.text(data.studentName, (pageWidth - nameWidth) / 2, margin + 95);

  // Linha sob o nome
  pdf.setDrawColor(147, 197, 253); // Blue-300
  pdf.setLineWidth(0.5);
  pdf.line((pageWidth - nameWidth) / 2, margin + 98, (pageWidth + nameWidth) / 2, margin + 98);

  // Texto de conclusão
  pdf.setTextColor(31, 41, 55); // Gray-800
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const completionText = 'concluiu com êxito o curso';
  const completionWidth = pdf.getTextWidth(completionText);
  pdf.text(completionText, (pageWidth - completionWidth) / 2, margin + 115);

  // Nome do curso
  pdf.setTextColor(30, 64, 175); // Blue-700
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  
  // Quebrar o nome do curso em múltiplas linhas se necessário
  const maxWidth = pageWidth - 2 * margin - 40;
  const courseLines = pdf.splitTextToSize(`"${data.courseName}"`, maxWidth);
  const courseStartY = margin + 135;
  
  courseLines.forEach((line: string, index: number) => {
    const lineWidth = pdf.getTextWidth(line);
    pdf.text(line, (pageWidth - lineWidth) / 2, courseStartY + (index * 8));
  });

  // Informações do curso
  const infoStartY = courseStartY + (courseLines.length * 8) + 20;
  
  pdf.setTextColor(31, 41, 55); // Gray-800
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // Carga horária
  const durationText = `Carga horária: ${data.courseDuration} horas`;
  const durationWidth = pdf.getTextWidth(durationText);
  pdf.text(durationText, (pageWidth - durationWidth) / 2, infoStartY);

  // Data de conclusão
  const dateText = `Data de conclusão: ${data.completionDate}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, (pageWidth - dateWidth) / 2, infoStartY + 10);

  // Instrutor
  const instructorText = `Instrutor: ${data.instructor}`;
  const instructorWidth = pdf.getTextWidth(instructorText);
  pdf.text(instructorText, (pageWidth - instructorWidth) / 2, infoStartY + 20);

  // Texto de validação
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  const validationText = 'Este certificado atesta que o aluno completou todos os módulos e avaliações do curso com aproveitamento satisfatório.';
  const validationLines = pdf.splitTextToSize(validationText, maxWidth);
  const validationStartY = infoStartY + 40;
  
  validationLines.forEach((line: string, index: number) => {
    const lineWidth = pdf.getTextWidth(line);
    pdf.text(line, (pageWidth - lineWidth) / 2, validationStartY + (index * 5));
  });

  // Assinatura digital (simulada)
  const signatureY = pageHeight - margin - 30;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99); // Gray-600
  
  const platformText = 'EduPlatform - Ensino Online de Qualidade';
  const platformWidth = pdf.getTextWidth(platformText);
  pdf.text(platformText, (pageWidth - platformWidth) / 2, signatureY);

  // ID do certificado
  const certificateId = `Certificado ID: EDU-${Date.now()}`;
  const idWidth = pdf.getTextWidth(certificateId);
  pdf.text(certificateId, (pageWidth - idWidth) / 2, signatureY + 8);

  // URL de verificação
  const verificationUrl = 'www.eduplatform.com/verificar-certificado';
  const urlWidth = pdf.getTextWidth(verificationUrl);
  pdf.text(verificationUrl, (pageWidth - urlWidth) / 2, signatureY + 16);

  // Salvar o PDF
  const fileName = `certificado-${data.courseName.replace(/\s+/g, '-').toLowerCase()}-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  pdf.save(fileName);
};
