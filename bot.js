const puppeteer = require('puppeteer');
const { checkInterval, base44ApiUrl } = require('./config');

async function checkCitas() {
    console.log("🤖 [Base44] Iniciando revisión de citas...");
    let browser = null;

    try {
        // Lanzamos el navegador
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // 1. Gestionar la alerta de "Welcome / Bienvenido"
        page.on('dialog', async dialog => {
            console.log(`🔔 Alerta detectada: ${dialog.message()} -> Aceptando...`);
            await dialog.accept(); 
        });

        // 2. Ir a la web (Damos tiempo extra por si va lenta)
        console.log("🌍 Entrando en la web del Consulado...");
        await page.goto(base44ApiUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // 3. Buscar el botón "Continue" y pulsarlo
        try {
            const boton = await page.waitForSelector('input[value*="Continuar"], input[value*="Continue"], button', { timeout: 6000 });
            if (boton) {
                console.log("point_right Pulsando botón 'Continuar'...");
                await boton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            }
        } catch (e) {
            // Si no hay botón, quizás ya estamos dentro. Seguimos.
        }

        // 4. ANÁLISIS INTELIGENTE (Basado en tu foto)
        const contenido = await page.content();
        const textoWeb = contenido.toLowerCase();

        // Frases exactas que confirman que NO hay cita
        const fraseRechazo1 = "no hay horas disponibles";
        const fraseRechazo2 = "inténtelo de nuevo";
        
        // Errores técnicos
        const errores = ["service unavailable", "504 gateway", "error"];

        if (textoWeb.includes(fraseRechazo1) || textoWeb.includes(fraseRechazo2)) {
            // CASO A: Está el cartel de tu foto. Falsa alarma.
            console.log("❌ SIN NOVEDAD: Detectado mensaje 'No hay horas disponibles'.");
        
        } else if (errores.some(e => textoWeb.includes(e)) || textoWeb.length < 200) {
            // CASO B: La página falló al cargar.
            console.log("⚠️ ERROR DE CARGA: La página salió en blanco o dio error. Ignorando.");
        
        } else {
            // CASO C: ¡El cartel de rechazo NO está! ¡CITA POSIBLE!
            console.log("🚨 ¡¡ATENCIÓN BASE44!! ¡POSIBLE CITA DETECTADA! 🚨");
            console.log("👉 El mensaje de 'No hay horas' ha desaparecido. ¡Revisa ya!");
        }

    } catch (error) {
        console.error("⚠️ Error en la revisión:", error.message);
    } finally {
        if (browser) await browser.close();
    }
}

// Iniciar el ciclo
console.log("🚀 Monitor Base44 Listo. Esperando instrucciones...");
// Ejecutar una vez al inicio
checkCitas();
// Repetir según el tiempo configurado
setInterval(checkCitas, checkInterval);


