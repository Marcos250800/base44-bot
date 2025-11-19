const fetch = require('node-fetch');
const { checkInterval, base44ApiUrl, apiKey } = require('./config');

async function checkCitas() {
  try {
    const response = await fetch(base44ApiUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();

    if (data && data.disponibles && data.disponibles.length > 0) {
      data.disponibles.forEach(cita => {
        console.log(`Alerta: Nueva cita disponible para ${cita.usuario}`);
      });
    } else {
      console.log("No hay citas disponibles en este momento.");
    }
  } catch (error) {
    console.error("Error revisando citas:", error);
  }
}

setInterval(checkCitas, checkInterval);
checkCitas();
