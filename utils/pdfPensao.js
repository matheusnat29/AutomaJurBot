// utils/pdfPensao.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function gerarPdfPensao(dados, resultadoFinal) {
  return new Promise((resolve, reject) => {
    const nomeArquivo = `pensao_${Date.now()}.pdf`;
    const caminho = path.resolve('./', nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });

    const stream = fs.createWriteStream(caminho);
    doc.pipe(stream);

    doc.fontSize(16).text('Relatório de Cálculo de Pensão Alimentícia', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Período: ${dados.periodo.inicio} a ${dados.periodo.fim}`);
    doc.text(`Percentual: ${dados.percentual}%`);
    doc.text(`Base de cálculo: ${dados.baseCalculo}`);
    if (dados.salarioBruto) doc.text(`Salário bruto informado: R$ ${dados.salarioBruto.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(12).text('Resumo mês a mês:');
    doc.moveDown();
    doc.font('Courier');

    doc.fontSize(10).text(resultadoFinal);

    doc.end();

    stream.on('finish', () => resolve(caminho));
    stream.on('error', reject);
  });
}