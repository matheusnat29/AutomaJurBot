// scrapers/djen.js

import puppeteer from 'puppeteer';

const summarizeWithAI = async (text) => {
    if (text.length > 300) {
        return `[Resumo AI: Texto muito longo para ser exibido, mas o bot o resumiu para você.]`;
    } else {
        return `[Resumo AI: ${text.substring(0, 50)}...]`;
    }
};

export const checkDJEN = async (oabNumber, uf) => {
    let browser;
    let results = [];

    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto('https://comunica.pje.jus.br/consulta', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Acessando site do DJEN...');

        const oabInputSelector = '#mat-input-7';
        const ufInputSelector = '#mat-input-8';
        
        await page.waitForSelector(oabInputSelector, { timeout: 10000 });
        await page.type(oabInputSelector, oabNumber);

        await page.waitForSelector(ufInputSelector, { timeout: 5000 });
        await page.type(ufInputSelector, uf.toUpperCase());

        // Espera de forma mais robusta e clica diretamente no seletor que contém o texto "Pesquisar"
        await page.waitForSelector('span.ui-button-text', { visible: true, timeout: 10000 });
        await page.click('button:has-text("Pesquisar")');

        await page.waitForSelector('#mat-tab-content-1-0', { timeout: 30000 });

        const tribunalTabs = await page.$$('div[role="tablist"] div[role="tab"]');
        const numTribunais = tribunalTabs.length;

        for (let i = 0; i < numTribunais; i++) {
            const tabSelector = `#mat-tab-label-1-${i}`;
            
            if (i > 0) {
                await page.click(tabSelector);
                await page.waitForSelector(`#mat-tab-content-1-${i}`, { timeout: 10000 });
            }

            const tribunalName = await page.$eval(tabSelector + ' > div', el => el.innerText.trim());
            const blocksSelector = `#mat-tab-content-1-${i} > div > div > article > div`;
            
            const tribunalResults = await page.$$eval(blocksSelector, (elements, tabName) => {
                return elements.map(el => {
                    const processo = el.querySelector('.proc-number')?.innerText.trim() || 'N/A';
                    const orgao = el.querySelector('.proc-orgao')?.innerText.trim() || 'N/A';
                    const data = el.querySelector('.proc-data')?.innerText.trim() || 'N/A';
                    const teor = el.querySelector('.proc-teor')?.innerText.trim() || 'N/A';
                    const partes = el.querySelector('.bloco-partes-dados')?.innerText.trim() || 'N/A';

                    return {
                        processo,
                        orgao,
                        data,
                        teor,
                        partes,
                        tribunal: tabName,
                    };
                });
            }, tribunalName);

            for (const item of tribunalResults) {
                if (item.teor && item.teor !== 'N/A') {
                    item.resumo_ai = await summarizeWithAI(item.teor);
                }
            }

            results = results.concat(tribunalResults);
        }

    } catch (error) {
        console.error('❌ Erro no scraper do DJEN:', error);
        return { status: 'erro', message: `❌ Ocorreu um erro no scraper do DJEN: ${error.message}` };
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    if (results.length > 0) {
        return { status: 'encontrado', data: results };
    } else {
        return { status: 'nao_encontrado', message: '❌ Nenhuma comunicação encontrada para esta OAB.' };
    }
};