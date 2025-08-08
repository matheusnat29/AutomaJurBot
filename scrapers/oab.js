import puppeteer from 'puppeteer';

export async function checkOAB(numero, uf = 'RJ', tipo = 'ADVOGADO') {
    let browser;
    try {
        console.log('🔎 Acessando site da OAB...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();
        await page.goto('https://cna.oab.org.br/', { waitUntil: 'domcontentloaded' });

        console.log('✏️ Preenchendo número de inscrição...');
        await page.waitForSelector('#txtInsc', { timeout: 15000 });
        await page.type('#txtInsc', numero);
        
        console.log('🖱️ Clicando em Pesquisar...');
        await page.click('#btnFind');

        console.log('⏳ Aguardando resultados...');
        await page.waitForSelector('#divResult > .row', { visible: true, timeout: 60000 });

        const resultados = await page.$$eval('#divResult > .row', divs => {
            return divs.map(div => {
                const nameElement = div.querySelector('.rowName span:last-child');
                const inscriptionElement = div.querySelector('.rowInsc span:last-child');
                
                const name = nameElement ? nameElement.innerText.trim() : 'Nome não encontrado';
                const inscription = inscriptionElement ? inscriptionElement.innerText.trim() : 'Inscrição não encontrada';

                return {
                    name: name,
                    inscription: inscription
                };
            });
        });
        
        console.log(`✅ Resultados encontrados: ${resultados.length}`);
        return resultados;
    } catch (error) {
        console.error('❌ Erro em checkOAB:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}