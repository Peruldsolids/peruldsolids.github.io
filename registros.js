// Configuración
const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

// Variables globales
let registrosData = [];
let registroActual = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si hay usuario logueado
    if (!sessionStorage.getItem('usuario')) {
        window.location.href = 'index.html';  // Redirigir al login
        return;
    }

    try {
        await cargarRegistros();
    } catch (error) {
        console.error('Error al cargar registros:', error);
        alert('Error al cargar los registros');
    }
});

// Función para cargar datos usando JSONP
function loadJSONP(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'callback_' + Math.random().toString(36).substr(2, 9);

        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}`;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Error de red'));
        };

        document.body.appendChild(script);
    });
}

// Cargar registros
async function cargarRegistros() {
    const result = await loadJSONP(`${API_URL}?action=getRegistros`);
    if (result.error) throw new Error(result.message);
    
    registrosData = result.data;
    mostrarRegistros();
}

// Mostrar registros en la tabla
function mostrarRegistros() {
    const tbody = document.getElementById('registrosBody');
    tbody.innerHTML = registrosData.map((registro, index) => `
        <tr>
            <td>${formatearFecha(registro.fecha)}</td>
            <td>${registro.areaSolicitante}</td>
            <td>${registro.solicitante}</td>
            <td>${registro.sector}</td>
            <td>${registro.cliente}</td>
            <td>${registro.unidad}</td>
            <td>${registro.ciudad}</td>
            <td>
                <button class="btn btn-ver" onclick="verDetalle(${index})">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
            </td>
        </tr>
    `).join('');
}

// Formatear fecha
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Ver detalle y cotización
function verDetalle(index) {
    registroActual = registrosData[index];
    const modal = document.getElementById('detalleModal');
    const detallesGenerales = document.getElementById('detallesGenerales');
    const itemsBody = document.getElementById('itemsBody');

    // Mostrar datos generales
    detallesGenerales.innerHTML = `
        <p><strong>Área Solicitante:</strong> ${registroActual.areaSolicitante}</p>
        <p><strong>Solicitante:</strong> ${registroActual.solicitante}</p>
        <p><strong>Sector:</strong> ${registroActual.sector}</p>
        <p><strong>Cliente:</strong> ${registroActual.cliente}</p>
        <p><strong>Unidad:</strong> ${registroActual.unidad}</p>
        <p><strong>Ciudad:</strong> ${registroActual.ciudad}</p>
    `;

    // Mostrar items
    itemsBody.innerHTML = registroActual.items.map((item, idx) => `
        <tr>
            <td>${item.categoria}</td>
            <td>${item.item}</td>
            <td>${item.unidadMedida}</td>
            <td>${item.cantidad}</td>
            <td>${item.detalle}</td>
            <td>
                <input type="number" class="precio-input" 
                       value="${item.precio || ''}" 
                       onchange="actualizarPrecio(${idx}, this.value)"
                       placeholder="0.00">
            </td>
            <td class="subtotal">${calcularSubtotal(item)}</td>
        </tr>
    `).join('');

    actualizarTotal();
    modal.style.display = 'block';
}

// Actualizar precio y subtotal
function actualizarPrecio(index, precio) {
    registroActual.items[index].precio = parseFloat(precio) || 0;
    const tr = document.getElementById('itemsBody').children[index];
    tr.querySelector('.subtotal').textContent = 
        calcularSubtotal(registroActual.items[index]);
    actualizarTotal();
}

// Calcular subtotal
function calcularSubtotal(item) {
    const subtotal = (item.precio || 0) * item.cantidad;
    return `S/ ${subtotal.toFixed(2)}`;
}

// Actualizar totales
function actualizarTotal() {
    // Calcular subtotal
    const subtotal = registroActual.items.reduce((sum, item) => 
        sum + ((item.precio || 0) * item.cantidad), 0);
    
    // Calcular IGV
    const igv = subtotal * 0.18;
    
    // Calcular total final
    const totalFinal = subtotal + igv;
    
    // Actualizar los elementos en el DOM
    document.getElementById('subtotalCotizacion').textContent = 
        `S/ ${subtotal.toFixed(2)}`;
    document.getElementById('igvCotizacion').textContent = 
        `S/ ${igv.toFixed(2)}`;
    document.getElementById('totalFinalCotizacion').textContent = 
        `S/ ${totalFinal.toFixed(2)}`;
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('detalleModal').style.display = 'none';
}

// Generar PDF
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text('Cotización', 105, 20, { align: 'center' });

    // Datos del cliente
    doc.setFontSize(12);
    doc.text(`Fecha: ${formatearFecha(new Date())}`, 20, 40);
    doc.text(`Cliente: ${registroActual.cliente}`, 20, 50);
    doc.text(`Área Solicitante: ${registroActual.areaSolicitante}`, 20, 60);
    doc.text(`Solicitante: ${registroActual.solicitante}`, 20, 70);
    doc.text(`Unidad: ${registroActual.unidad}`, 20, 80);
    doc.text(`Ciudad: ${registroActual.ciudad}`, 20, 90);

    // Tabla de items
    const itemsData = registroActual.items.map(item => [
        item.categoria,
        item.item,
        item.unidadMedida,
        item.cantidad,
        `S/ ${(item.precio || 0).toFixed(2)}`,
        `S/ ${((item.precio || 0) * item.cantidad).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 100,
        head: [['Categoría', 'Item', 'U.M.', 'Cant.', 'P.Unit', 'Subtotal']],
        body: itemsData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [21, 101, 192] }
    });

    // Calcular totales
    const subtotal = registroActual.items.reduce((sum, item) => 
        sum + ((item.precio || 0) * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const totalFinal = subtotal + igv;

    // Agregar totales al PDF
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.text(`Subtotal: S/ ${subtotal.toFixed(2)}`, 190, finalY + 10, { align: 'right' });
    doc.text(`I.G.V. (18%): S/ ${igv.toFixed(2)}`, 190, finalY + 20, { align: 'right' });
    doc.text(`Total (Inc. I.G.V.): S/ ${totalFinal.toFixed(2)}`, 190, finalY + 30, { align: 'right' });

    // Guardar PDF
    doc.save(`Cotizacion_${registroActual.cliente}_${formatearFecha(new Date())}.pdf`);
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('detalleModal');
    if (event.target === modal) {
        cerrarModal();
    }
}



// Función para guardar cotización

function guardarCotizacion() {
    try {
        console.log('1. Botón presionado - Iniciando guardado de cotización');
        
        if (!registroActual || !registroActual.items) {
            console.log('2. Error: No hay datos para guardar');
            throw new Error('No hay datos para guardar');
        }

        console.log('3. registroActual:', registroActual);

        // Calcular totales
        const subtotal = registroActual.items.reduce((sum, item) => 
            sum + (Number(item.precio || 0) * Number(item.cantidad || 0)), 0);
        const igv = subtotal * 0.18;
        const totalFinal = subtotal + igv;

        // Preparar datos para enviar
        const datosParaEnviar = {
            fecha: new Date().toISOString(),
            areaSolicitante: registroActual.areaSolicitante || '',
            solicitante: registroActual.solicitante || '',
            sector: registroActual.sector || '',
            cliente: registroActual.cliente || '',
            unidad: registroActual.unidad || '',
            ciudad: registroActual.ciudad || '',
            items: registroActual.items.map(item => ({
                categoria: item.categoria || '',
                item: item.item || '',
                unidadMedida: item.unidadMedida || '',
                cantidad: Number(item.cantidad) || 0,
                detalle: item.detalle || '',
                precio: Number(item.precio) || 0,
                subtotal: (Number(item.precio) || 0) * (Number(item.cantidad) || 0)
            })),
            subtotal: subtotal,
            igv: igv,
            totalFinal: totalFinal,
            tipoPedido: 'cotizacion'
        };

        console.log('4. Datos preparados:', datosParaEnviar);
        
        // Crear un elemento script para JSONP
        const script = document.createElement('script');
        const callbackName = 'guardar_callback_' + Math.round(100000 * Math.random());
        console.log('5. Callback creado:', callbackName);

        // Definir el callback
        window[callbackName] = function(response) {
            console.log('6. Respuesta recibida:', response);
            delete window[callbackName];
            document.body.removeChild(script);
            
            if (response.error) {
                console.error('7. Error en respuesta:', response);
                alert('Error al guardar: ' + response.message);
            } else {
                console.log('7. Guardado exitoso');
                alert('Cotización guardada exitosamente');
                cerrarModal();
            }
        };

        // Construir la URL con los parámetros
        const params = new URLSearchParams({
            action: 'guardarRegistro',
            callback: callbackName,
            datos: JSON.stringify(datosParaEnviar)
        });

        console.log('8. URL params:', params.toString());
        
        // Agregar el script al documento
        script.src = `${API_URL}?${params.toString()}`;
        console.log('9. URL completa:', script.src);
        
        document.body.appendChild(script);
        console.log('10. Script agregado al documento');

    } catch (error) {
        console.error('Error al guardar cotización:', error);
        alert('Error al guardar la cotización: ' + error.message);
    }
}