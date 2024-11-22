const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

let cotizacionesData = []; // Variable global para almacenar los datos

// Cargar cotizaciones al iniciar la página
document.addEventListener('DOMContentLoaded', cargarCotizaciones);

function cargarCotizaciones() {
    console.log('Iniciando carga de cotizaciones...');
    
    // Verificar que los elementos existen
    const elementos = ['fechaDesde', 'fechaHasta', 'filtroCliente', 'filtroEstado', 'tablaSeguimiento'];
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (!elemento) {
            console.error(`Elemento ${id} no encontrado`);
        }
    });
    
    const script = document.createElement('script');
    const callbackName = 'callback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(response) {
        console.log('Respuesta recibida:', response);
        delete window[callbackName];
        document.body.removeChild(script);
        
        if (response.error) {
            console.error('Error:', response.message);
            alert('Error al cargar las cotizaciones: ' + response.message);
            return;
        }
        
        cotizacionesData = response; // Guardar datos
        aplicarFiltros(); // Aplicar filtros y mostrar
    };

    const params = new URLSearchParams({
        action: 'obtenerCotizaciones',
        callback: callbackName
    });

    console.log('URL:', `${API_URL}?${params.toString()}`);
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

function mostrarCotizaciones(cotizaciones) {
    console.log('Mostrando cotizaciones:', cotizaciones);
    const tbody = document.getElementById('tablaSeguimiento');
    tbody.innerHTML = '';

    if (!Array.isArray(cotizaciones)) {
        console.error('Los datos no son un array:', cotizaciones);
        return;
    }

    cotizaciones.forEach(cot => {
        console.log('Procesando cotización:', cot);
        const tr = document.createElement('tr');
        tr.className = `estado-${(cot.estado || '').toLowerCase().replace(' ', '-')}`;
        
        tr.innerHTML = `
            <td>${cot.id || ''}</td>
            <td>${cot.fecha || ''}</td>
            <td>${cot.cliente || ''}</td>
            <td>${cot.solicitante || ''}</td>
            <td class="monto">${cot.total ? 'S/ ' + Number(cot.total).toFixed(2) : ''}</td>
            <td class="text-center">
                <span class="badge bg-${getEstadoColor(cot.estado)}">${cot.estado || 'Pendiente'}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" onclick="cambiarEstado('${cot.id}', 'Enviada')" title="Enviada">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="cambiarEstado('${cot.id}', 'En proceso')" title="En proceso">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="cambiarEstado('${cot.id}', 'Atendida')" title="Atendida">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="cambiarEstado('${cot.id}', 'Anulada')" title="Anulada">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función auxiliar para obtener el color del badge según el estado
function getEstadoColor(estado) {
    switch(estado?.toLowerCase()) {
        case 'enviada': return 'primary';
        case 'en proceso': return 'warning';
        case 'atendida': return 'success';
        case 'anulada': return 'danger';
        default: return 'secondary';
    }
}

function cambiarEstado(id, estado) {
    const script = document.createElement('script');
    const callbackName = 'callback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(response) {
        delete window[callbackName];
        document.body.removeChild(script);
        if (response.success) {
            cargarCotizaciones();
        } else {
            alert('Error al actualizar el estado');
        }
    };

    const params = new URLSearchParams({
        action: 'actualizarEstadoCotizacion',
        callback: callbackName,
        id: id,
        estado: estado
    });

    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}

function aplicarFiltros() {
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;

    const datosFiltrados = cotizacionesData.filter(cot => {
        const fechaCot = new Date(cot.fecha);
        const cumpleFecha = (!fechaDesde || fechaCot >= new Date(fechaDesde)) &&
                           (!fechaHasta || fechaCot <= new Date(fechaHasta));
        const cumpleCliente = !cliente || cot.cliente.toLowerCase().includes(cliente);
        const cumpleEstado = !estado || cot.estado === estado;

        return cumpleFecha && cumpleCliente && cumpleEstado;
    });

    actualizarResumen(datosFiltrados);
    mostrarCotizaciones(datosFiltrados);
}

function actualizarResumen(datos) {
    const totalCotizaciones = datos.length;
    const totalAtendidas = datos.filter(c => c.estado === 'Atendida').length;
    const totalProceso = datos.filter(c => c.estado === 'En proceso').length;
    const totalPendientes = datos.filter(c => c.estado === 'Pendiente').length;
    const totalAnuladas = datos.filter(c => c.estado === 'Anulada').length;
    
    // Calcular monto total excluyendo anuladas
    const montoTotal = datos
        .filter(c => c.estado !== 'Anulada')
        .reduce((sum, c) => sum + Number(c.total || 0), 0);

    document.getElementById('totalCotizaciones').textContent = totalCotizaciones;
    document.getElementById('totalAtendidas').textContent = totalAtendidas;
    document.getElementById('totalProceso').textContent = totalProceso;
    document.getElementById('totalPendientes').textContent = totalPendientes;
    document.getElementById('totalAnuladas').textContent = totalAnuladas;
    document.getElementById('montoTotal').textContent = `S/ ${montoTotal.toFixed(2)}`;
}

// Agregar event listeners para los filtros
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fechaDesde').addEventListener('change', aplicarFiltros);
    document.getElementById('fechaHasta').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroCliente').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
    
    cargarCotizaciones();
});

function exportarExcel() {
    // Obtener los datos filtrados actuales
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;

    // Aplicar filtros
    const datosFiltrados = cotizacionesData.filter(cot => {
        const fechaCot = new Date(cot.fecha);
        const cumpleFecha = (!fechaDesde || fechaCot >= new Date(fechaDesde)) &&
                           (!fechaHasta || fechaCot <= new Date(fechaHasta));
        const cumpleCliente = !cliente || cot.cliente.toLowerCase().includes(cliente);
        const cumpleEstado = !estado || cot.estado === estado;

        return cumpleFecha && cumpleCliente && cumpleEstado;
    });

    // Crear el contenido del Excel
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Agregar BOM para caracteres especiales
    
    // Agregar título y fecha
    const fechaActual = new Date().toLocaleDateString('es-PE');
    csvContent += "SEGUIMIENTO DE COTIZACIONES\n";
    csvContent += `Fecha de exportación: ${fechaActual}\n\n`;

    // Agregar filtros aplicados
    csvContent += "FILTROS APLICADOS\n";
    if (fechaDesde) csvContent += `Desde: ${fechaDesde}\n`;
    if (fechaHasta) csvContent += `Hasta: ${fechaHasta}\n`;
    if (cliente) csvContent += `Cliente: ${cliente}\n`;
    if (estado) csvContent += `Estado: ${estado}\n`;
    csvContent += "\n";

    // Agregar encabezados de la tabla
    csvContent += [
        "ID Cotización",
        "Fecha",
        "Cliente",
        "Solicitante",
        "Total Final",
        "Estado"
    ].join(";") + "\n";

    // Agregar datos
    datosFiltrados.forEach(row => {
        const fecha = row.fecha;
        const total = typeof row.total === 'number' ? 
            row.total.toFixed(2).replace('.', ',') : '0,00';
        
        const rowArray = [
            row.id || '',
            fecha || '',
            (row.cliente || '').replace(/;/g, ','),
            (row.solicitante || '').replace(/;/g, ','),
            `S/ ${total}`,
            row.estado || ''
        ];
        
        csvContent += rowArray.join(";") + "\n";
    });

    // Agregar línea en blanco
    csvContent += "\n";

    // Agregar resumen
    csvContent += "RESUMEN\n";
    csvContent += `Total Cotizaciones;${datosFiltrados.length}\n`;
    csvContent += `Atendidas;${datosFiltrados.filter(c => c.estado === 'Atendida').length}\n`;
    csvContent += `En Proceso;${datosFiltrados.filter(c => c.estado === 'En proceso').length}\n`;
    csvContent += `Enviadas;${datosFiltrados.filter(c => c.estado === 'Enviada').length}\n`;
    csvContent += `Pendientes;${datosFiltrados.filter(c => c.estado === 'Pendiente').length}\n`;
    csvContent += `Anuladas;${datosFiltrados.filter(c => c.estado === 'Anulada').length}\n`;
    const montoTotalSinAnuladas = datosFiltrados
        .filter(c => c.estado !== 'Anulada')
        .reduce((sum, c) => sum + Number(c.total || 0), 0);
    csvContent += `Monto Total (Sin anuladas);S/ ${montoTotalSinAnuladas.toFixed(2).replace('.', ',')}\n`;

    // Crear el enlace de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Generar nombre del archivo con la fecha actual
    const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    link.setAttribute("download", `Seguimiento_Cotizaciones_${fecha}.csv`);
    
    // Simular clic y eliminar el enlace
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
