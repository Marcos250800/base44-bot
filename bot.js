const puppeteer = require('puppeteer');
const { checkInterval, base44ApiUrl } = require('./config');

async function checkCitas() {
    console.log("🤖 [Base44] Iniciando revisión...");
    let browser = null;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 1. Gestión de alertas (Bienvenido)
        page.on('dialog', async dialog => {
            console.log(`🔔 Alerta: ${dialog.message()} -> Aceptando.`);
            await dialog.accept(); 
        });

        // 2. Ir a la web
        await page.goto(base44ApiUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // 3. Pulsar Continuar
        try {
            const boton = await page.waitForSelector('input[value*="Continuar"], input[value*="Continue"], button', { timeout: 8000 });
            if (boton) {
                console.log("👉 Botón Continuar pulsado.");
                await boton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            }
        } catch (e) {}

        // --- 4. LA LÓGICA INTELIGENTE ---
        const contenido = await page.content();
        const textoWeb = contenido.toLowerCase();

        // Palabras de ÉXITO (Lo que sale cuando hay cita)
        const frasesExito = ["hueco", "libre", "reservar", "seleccionar"];
        
        // Palabras de FRACASO
        const frasesRechazo = ["no hay horas disponibles", "inténtelo de nuevo", "no availability"];

        if (frasesExito.some(p => textoWeb.includes(p))) {
            // ¡BINGO!
            console.log("🚨 ¡¡CITA DETECTADA!! 🚨");
            console.log("He leído la palabra 'HUECO' o 'LIBRE' en la pantalla.");
            // Aquí Base44 detectará la alerta en los logs
        
        } else if (frasesRechazo.some(f => textoWeb.includes(f))) {
            console.log("❌ Sin novedad. Mensaje: 'No hay horas disponibles'.");
        
        } else if (textoWeb.length < 500) {
            console.log("⚠️ Página en blanco o error de carga. Ignorando.");
        } else {
            console.log("❓ Pantalla desconocida. Ni sí, ni no.");
        }

    } catch (error) {
        console.error("⚠️ Error:", error.message);
    } finally {
        if (browser) await browser.close();
    }
}

console.log("🚀 Monitor Base44 v3.0 Listo");
checkCitas();
setInterval(checkCitas, checkInterval);



