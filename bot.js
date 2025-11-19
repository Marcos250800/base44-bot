const puppeteer = require('puppeteer');
const { checkInterval, base44ApiUrl } = require('./config');

async function checkCitas() {
    console.log("🤖 Iniciando revisión...");
    let browser = null;

    try {
        // Lanzamos el navegador (modo oculto para servidores)
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 1. Manejar la alerta de "Welcome / Bienvenido" automáticamente
        page.on('dialog', async dialog => {
            console.log(`🔔 Alerta detectada: ${dialog.message()}`);
            await dialog.accept(); // Le da a "Aceptar"
        });

        // 2. Ir a la web
        console.log("🌍 Entrando a la web...");
        await page.goto(base44ApiUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // 3. Buscar el botón "Continue / Continuar" y darle clic
        console.log("point_right Buscando botón Continuar...");
        
        // Esperamos a que aparezca el botón verde
        const botonContinuar = await page.waitForSelector('input[value="Continue / Continuar"], button:contains("Continuar")', { timeout: 10000 }).catch(() => null);

        if (botonContinuar) {
            await botonContinuar.click();
            console.log("✅ Clic en Continuar realizado.");
            
            // Esperamos a que cargue la siguiente pantalla
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        } else {
            // A veces el botón tiene otro ID o forma, intentamos buscar por texto si lo anterior falló
            const botones = await page.$x("//input[contains(@value, 'Continuar')] | //button[contains(., 'Continuar')]");
            if (botones.length > 0) {
                await botones[0].click();
                console.log("✅ Clic en Continuar (método 2) realizado.");
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            }
        }

        // 4. Leer el resultado final
        // Aquí buscamos si hay texto que diga que NO hay citas para saber el estado
        const contenido = await page.content();
        
        if (contenido.includes("No hay citas") || contenido.includes("no availability") || contenido.includes("no hay disponibilidad")) {
            console.log("❌ No hay citas disponibles por ahora.");
        } else {
            // Si NO encuentra el mensaje de error, es que ¡HAY ALGO!
            console.log("🚨 ¡ATENCIÓN! POSIBLE CITA DETECTADA 🚨");
            console.log("Revisa la web manualmente.");
        }

    } catch (error) {
        console.error("⚠️ Error durante la revisión:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Iniciar el bucle
console.log("🚀 Bot de Citas (Puppeteer) Arrancado");
checkCitas();
setInterval(checkCitas, checkInterval);

