import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Gera um PDF com a pauta do dia contendo audiências e perícias.
 * @param {Object[]} audiencias - Lista de audiências.
 * @param {Object[]} pericias - Lista de perícias.
 * @param {string} fileName - Nome do arquivo PDF a ser gerado.
 * @returns {string} Caminho completo do arquivo gerado.
 */
export function generatePdfFromData(audiencias = [], pericias = [], fileName = 'pauta-do-dia.pdf') {
  const doc = new PDFDocument({ margin: 50 });
  const filePath = path.resolve('./pdfs', fileName);

  // Garante que a pasta ./pdfs exista
  if (!fs.existsSync('./pdfs')) {
    fs.mkdirSync('./pdfs');
  }

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(20).text('📅 Pauta do Dia', { align: 'center' });
  doc.moveDown();

  // === Audiências ===
  if (audiencias.length > 0) {
    doc.fontSize(16).text('⚖️ Audiências', { underline: true });
    doc.moveDown(0.5);

    audiencias.forEach((aud, index) => {
      doc.fontSize(12).text(`🔹 ${index + 1}. ${aud.autor} x ${aud.reu}`);
      doc.text(`   🧑‍💼 Parte Representada: ${aud.parteRepresentada}`);
      doc.text(`   📅 Data: ${aud.data} ⏰ ${aud.hora}`);
      doc.text(`   🏛️ Comarca: ${aud.comarca}`);
      doc.moveDown(0.5);
    });
    doc.moveDown();
  }

  // === Perícias ===
  if (pericias.length > 0) {
    doc.fontSize(16).text('🧪 Perícias', { underline: true });
    doc.moveDown(0.5);

    pericias.forEach((per, index) => {
      doc.fontSize(12).text(`🔹 ${index + 1}. ${per.nomeParte}`);
      doc.text(`   📅 Data: ${per.data} ⏰ ${per.hora}`);
      doc.moveDown(0.5);
    });
  }

  if (audiencias.length === 0 && pericias.length === 0) {
    doc.fontSize(14).text('Nenhuma audiência ou perícia marcada para hoje.');
  }

  doc.end();

  return filePath;
}
