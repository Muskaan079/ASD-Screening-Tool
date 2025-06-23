import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClinicalReport, PDFExportConfig, ExplainabilityData } from '../types';

class PDFExportService {
  private doc: jsPDF;
  private config: PDFExportConfig;

  constructor(config: PDFExportConfig) {
    this.config = config;
    this.doc = new jsPDF('p', 'mm', 'a4');
  }

  // Generate clinical report PDF
  public async generateClinicalReportPDF(report: ClinicalReport): Promise<Blob> {
    try {
      this.doc = new jsPDF('p', 'mm', 'a4');
      
      // Add header
      this.addHeader();
      
      // Add patient information
      this.addPatientInfo(report);
      
      // Add executive summary
      this.addExecutiveSummary(report);
      
      // Add DSM-5 criteria assessment
      this.addDSM5Assessment(report);
      
      // Add ICD-11 criteria assessment
      this.addICD11Assessment(report);
      
      // Add test results
      this.addTestResults(report);
      
      // Add AI analysis
      this.addAIAnalysis(report);
      
      // Add recommendations
      this.addRecommendations(report);
      
      // Add explainability data if requested
      if (this.config.includeExplainability) {
        this.addExplainabilitySection(report);
      }
      
      // Add charts if requested
      if (this.config.includeCharts) {
        this.addCharts(report);
      }
      
      // Add footer with signature
      this.addFooter();
      
      return this.doc.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  private addHeader(): void {
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ASD Screening Clinical Report', 105, 20, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.config.clinicInfo.name, 105, 30, { align: 'center' });
    this.doc.text(this.config.clinicInfo.address, 105, 35, { align: 'center' });
    this.doc.text(`Phone: ${this.config.clinicInfo.phone} | Email: ${this.config.clinicInfo.email}`, 105, 40, { align: 'center' });
    
    // Add line separator
    this.doc.line(20, 45, 190, 45);
  }

  private addPatientInfo(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Patient Information', 20, 60);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Patient ID: ${report.patientId}`, 20, 70);
    this.doc.text(`Session ID: ${report.sessionId}`, 20, 75);
    this.doc.text(`Assessment Date: ${report.date.toLocaleDateString()}`, 20, 80);
    this.doc.text(`Practitioner ID: ${report.practitionerId}`, 20, 85);
    
    // Add line separator
    this.doc.line(20, 90, 190, 90);
  }

  private addExecutiveSummary(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', 20, 105);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const summaryLines = this.wrapText(report.aiAnalysis.summary, 170);
    let yPosition = 115;
    
    summaryLines.forEach(line => {
      this.doc.text(line, 20, yPosition);
      yPosition += 5;
    });
    
    // Add line separator
    this.doc.line(20, yPosition + 5, 190, yPosition + 5);
  }

  private addDSM5Assessment(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DSM-5 Criteria Assessment', 20, 140);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Social Communication
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Social Communication:', 20, 150);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`• Social-Emotional Reciprocity: ${(report.dsm5Criteria.socialCommunication.socialEmotionalReciprocity * 100).toFixed(1)}%`, 25, 155);
    this.doc.text(`• Nonverbal Communication: ${(report.dsm5Criteria.socialCommunication.nonverbalCommunication * 100).toFixed(1)}%`, 25, 160);
    this.doc.text(`• Relationships: ${(report.dsm5Criteria.socialCommunication.relationships * 100).toFixed(1)}%`, 25, 165);
    
    // Restricted/Repetitive Behaviors
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Restricted/Repetitive Behaviors:', 20, 175);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`• Stereotyped/Repetitive: ${(report.dsm5Criteria.restrictedRepetitive.stereotypedRepetitive * 100).toFixed(1)}%`, 25, 180);
    this.doc.text(`• Insistence on Sameness: ${(report.dsm5Criteria.restrictedRepetitive.insistenceOnSameness * 100).toFixed(1)}%`, 25, 185);
    this.doc.text(`• Restricted Interests: ${(report.dsm5Criteria.restrictedRepetitive.restrictedInterests * 100).toFixed(1)}%`, 25, 190);
    this.doc.text(`• Sensory Hyperreactivity: ${(report.dsm5Criteria.restrictedRepetitive.sensoryHyperreactivity * 100).toFixed(1)}%`, 25, 195);
    
    // Add line separator
    this.doc.line(20, 200, 190, 200);
  }

  private addICD11Assessment(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ICD-11 Criteria Assessment', 20, 215);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`• Social Interaction: ${(report.icd11Criteria.socialInteraction * 100).toFixed(1)}%`, 25, 225);
    this.doc.text(`• Communication: ${(report.icd11Criteria.communication * 100).toFixed(1)}%`, 25, 230);
    this.doc.text(`• Repetitive Behaviors: ${(report.icd11Criteria.repetitiveBehaviors * 100).toFixed(1)}%`, 25, 235);
    this.doc.text(`• Sensory Issues: ${(report.icd11Criteria.sensoryIssues * 100).toFixed(1)}%`, 25, 240);
    
    // Add line separator
    this.doc.line(20, 245, 190, 245);
  }

  private addTestResults(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Test Results', 20, 260);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Emotion Recognition
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Emotion Recognition Test:', 20, 270);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Score: ${report.testResults.emotionRecognition.score}/${report.testResults.emotionRecognition.maxScore} (${report.testResults.emotionRecognition.percentage}%)`, 25, 275);
    this.doc.text(`Percentile: ${report.testResults.emotionRecognition.percentile}`, 25, 280);
    
    // Pattern Recognition
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Pattern Recognition Test:', 20, 290);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Score: ${report.testResults.patternRecognition.score}/${report.testResults.patternRecognition.maxScore} (${report.testResults.patternRecognition.percentage}%)`, 25, 295);
    this.doc.text(`Percentile: ${report.testResults.patternRecognition.percentile}`, 25, 300);
    
    // Reaction Time
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Reaction Time Test:', 20, 310);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Score: ${report.testResults.reactionTime.score}/${report.testResults.reactionTime.maxScore} (${report.testResults.reactionTime.percentage}%)`, 25, 315);
    this.doc.text(`Percentile: ${report.testResults.reactionTime.percentile}`, 25, 320);
    
    // Add line separator
    this.doc.line(20, 325, 190, 325);
  }

  private addAIAnalysis(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AI Analysis', 20, 340);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    // Observations
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Observations:', 20, 350);
    this.doc.setFont('helvetica', 'normal');
    
    let yPosition = 355;
    report.aiAnalysis.observations.forEach(observation => {
      this.doc.text(`• ${observation}`, 25, yPosition);
      yPosition += 5;
    });
    
    // Risk Factors
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Risk Factors:', 20, yPosition + 5);
    this.doc.setFont('helvetica', 'normal');
    
    yPosition += 10;
    report.aiAnalysis.riskFactors.forEach(factor => {
      this.doc.text(`• ${factor}`, 25, yPosition);
      yPosition += 5;
    });
    
    // Add line separator
    this.doc.line(20, yPosition + 5, 190, yPosition + 5);
  }

  private addRecommendations(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Recommendations', 20, 380);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    let yPosition = 390;
    report.aiAnalysis.recommendations.forEach(recommendation => {
      this.doc.text(`• ${recommendation}`, 25, yPosition);
      yPosition += 5;
    });
    
    // Add line separator
    this.doc.line(20, yPosition + 5, 190, yPosition + 5);
  }

  private addExplainabilitySection(report: ClinicalReport): void {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Model Explainability', 20, 420);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text('This report was generated using AI analysis with the following confidence levels:', 20, 430);
    this.doc.text(`Overall Confidence: ${(report.aiAnalysis.confidence * 100).toFixed(1)}%`, 25, 435);
    
    // Add feature importance if available
    if (report.metadata) {
      this.doc.text(`Questions Answered: ${report.metadata.questionsAnswered}`, 25, 440);
      this.doc.text(`Adaptive Adjustments: ${report.metadata.adaptiveAdjustments}`, 25, 445);
    }
  }

  private addCharts(report: ClinicalReport): void {
    // This would generate charts using Chart.js or D3.js
    // For now, we'll add a placeholder
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Charts and Visualizations', 20, 460);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Detailed charts and visualizations are available in the digital version of this report.', 20, 470);
  }

  private addFooter(): void {
    const pageHeight = this.doc.internal.pageSize.height;
    
    // Add disclaimer
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('This report is generated by an AI system and should be reviewed by qualified healthcare professionals.', 20, pageHeight - 30);
    this.doc.text('The results are based on screening data and do not constitute a formal diagnosis.', 20, pageHeight - 25);
    
    // Add signature line
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.line(20, pageHeight - 15, 80, pageHeight - 15);
    this.doc.text('Practitioner Signature', 35, pageHeight - 10);
    
    // Add date
    this.doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, pageHeight - 10);
    
    // Add page number
    this.doc.text(`Page ${this.doc.getCurrentPageInfo().pageNumber}`, 190, pageHeight - 10, { align: 'right' });
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const testWidth = this.doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }

  // Export HTML element as PDF
  public async exportElementAsPDF(element: HTMLElement, filename: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      this.doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        this.doc.addPage();
        this.doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      this.doc.save(filename);
    } catch (error) {
      console.error('Error exporting element as PDF:', error);
      throw error;
    }
  }

  // Generate summary PDF
  public async generateSummaryPDF(report: ClinicalReport): Promise<Blob> {
    this.doc = new jsPDF('p', 'mm', 'a4');
    
    this.addHeader();
    this.addPatientInfo(report);
    this.addExecutiveSummary(report);
    
    // Add key metrics
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Metrics', 20, 140);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Overall Confidence: ${(report.aiAnalysis.confidence * 100).toFixed(1)}%`, 25, 150);
    this.doc.text(`Total Duration: ${Math.round(report.metadata.totalDuration / 60000)} minutes`, 25, 155);
    this.doc.text(`Questions Answered: ${report.metadata.questionsAnswered}`, 25, 160);
    
    this.addFooter();
    
    return this.doc.output('blob');
  }
}

export const createPDFExportService = (config: PDFExportConfig) => new PDFExportService(config); 