// scrapers/tj_rj.js
// Esta é uma versão consolidada do código que discutimos.

import puppeteer from 'puppeteer';

export const checkTJRJ = async (processNumber) => {
    let browser;
    let result = {
        status: 'erro',
        message: 'Ocorreu um erro ao buscar o processo.',
        system: null,
        parteAtiva: null,
        partePassiva: null,
        movimentacoes: []
    };

    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto('http://www4.tjrj.jus.br/consultaProcessoConjel/nova/conjel.do?index=1', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Digita o número do processo
        await page.waitForSelector('input[name="numProcesso"]', { timeout: 10000 });
        await page.type('input[name="numProcesso"]', processNumber);

        // Clica no botão de consulta
        await page.click('input[type="button"][value="Consultar"]');

        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const content = await page.content();

        // Verifica se o processo foi encontrado
        if (content.includes('NÃO FORAM LOCALIZADOS')) {
            result.status = 'nao_encontrado';
            result.message = `❌ Processo ${processNumber} não encontrado no TJ-RJ.`;
            return result;
        }

        // Tenta extrair as movimentações
        const movimentacoes = await page.$$eval('.dadosMovimentacao li', elements => {
            return elements.map(el => el.innerText.trim());
        });
        result.movimentacoes = movimentacoes;

        // Tenta extrair o sistema e as partes do PJE
        if (content.includes('PROCESSO JUDICIAL ELETRÔNICO')) {
            result.system = 'PJe';
            
            const partes = await page.$$eval('.bloco-partes-dados li', elements => {
                const partesText = {};
                elements.forEach(el => {
                    const text = el.innerText.trim();
                    if (text.includes('Polo Ativo:')) {
                        partesText.ativa = text.replace('Polo Ativo:', '').trim();
                    } else if (text.includes('Polo Passivo:')) {
                        partesText.passiva = text.replace('Polo Passivo:', '').trim();
                    }
                });
                return partesText;
            });
            result.parteAtiva = partes.ativa || 'N/A';
            result.partePassiva = partes.passiva || 'N/A';

        } else if (content.includes('Processo Eletrônico')) {
            result.system = 'E-Proc';

            const partes = await page.$$eval('.bloco-partes-dados li', elements => {
                const partesText = {};
                elements.forEach(el => {
                    const text = el.innerText.trim();
                    if (text.includes('Polo Ativo:')) {
                        partesText.ativa = text.replace('Polo Ativo:', '').trim();
                    } else if (text.includes('Polo Passivo:')) {
                        partesText.passiva = text.replace('Polo Passivo:', '').trim();
                    }
                });
                return partesText;
            });
            result.parteAtiva = partes.ativa || 'N/A';
            result.partePassiva = partes.passiva || 'N/A';

        } else {
            result.system = 'Sistema Desconhecido';
        }

        result.status = 'encontrado';
        result.message = `✅ Processo ${processNumber} encontrado com sucesso.`;
    } catch (error) {
        console.error('❌ Erro no scraper do TJ-RJ:', error);
        result.message = `❌ Ocorreu um erro no scraper do TJ-RJ: ${error.message}`;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return result;
};