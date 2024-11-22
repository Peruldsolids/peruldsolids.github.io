const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

// Datos de presupuesto hardcodeados
const PRESUPUESTOS = {
    'LP SOLIDS': 145000,
    'BBVA': 80000,
    'RIPLEY': 65000
};


//Agregar la función loadJSONP que falta
function loadJSONP(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        const script = document.createElement('script');
        script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Agregar logs para depuración
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Cargado');
    const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    console.log('Usuario:', userData);
    
    if (!userData.usuario) {
        window.location.href = 'index.html';
        return;
    }
    
    cargarCotizaciones();
});

function cargarCotizaciones() {
    console.log('Cargando cotizaciones...');
    
    // Obtener y validar datos del usuario
    const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    console.log('Datos de usuario:', userData);

    if (!userData || !userData.usuario) {
        console.error('No hay datos de usuario válidos');
        mostrarMensajeError('No hay datos de usuario válidos');
        return;
    }

    // Preparar datos del usuario
    const usuarioData = {
        empresaId: userData.empresaId,
        rol: userData.rol,
        usuario: userData.usuario
    };
    console.log('Datos de usuario a enviar:', usuarioData);

    // Preparar parámetros
    const params = new URLSearchParams({
        action: 'obtenerCotizaciones',
        usuarioData: JSON.stringify(usuarioData)
    });

    // Crear y configurar script
    const script = document.createElement('script');
    const callbackName = 'cotizaciones_callback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(response) {
        try {
            console.log('Respuesta del servidor:', response);
            delete window[callbackName];
            document.body.removeChild(script);
            handleCotizaciones(response);
        } catch (error) {
            console.error('Error en callback:', error);
            mostrarMensajeError('Error al procesar la respuesta: ' + error.message);
        }
    };

    const urlCompleta = `${API_URL}?${params.toString()}&callback=${callbackName}`;
    console.log('URL completa:', urlCompleta);
    script.src = urlCompleta;
    document.body.appendChild(script);
}

// Función para mostrar mensajes de error
function mostrarMensajeError(mensaje) {
    const tbody = document.querySelector('#tablaCotizaciones tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle"></i> ${mensaje}
                </td>
            </tr>
        `;
    } else {
        alert(mensaje);
    }
}

// Función para manejar la respuesta
window.handleCotizaciones = function(response) {
    console.log('Procesando respuesta en handleCotizaciones:', response);

    const tbody = document.querySelector('#tablaCotizaciones tbody');
    if (!tbody) {
        console.error('No se encontró la tabla de cotizaciones');
        return;
    }

    // Limpiar tabla
    tbody.innerHTML = '';

    // Verificar errores en la respuesta
    if (!response || response.error) {
        const mensaje = response?.message || 'Error al cargar las cotizaciones';
        mostrarMensajeError(mensaje);
        return;
    }

    // Verificar si hay datos
    if (!response.data || response.data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-info-circle"></i> No hay cotizaciones disponibles
                </td>
            </tr>
        `;
        return;
    }

    // Renderizar datos
    response.data.forEach(cotizacion => {
        try {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cotizacion.id_pedido || '-'}</td>
                <td>${cotizacion.fecha_cotizacion || '-'}</td>
                <td>S/ ${parseFloat(cotizacion.subtotal || 0).toFixed(2)}</td>
                <td>S/ ${parseFloat(cotizacion.igv || 0).toFixed(2)}</td>
                <td>S/ ${parseFloat(cotizacion.total || 0).toFixed(2)}</td>
                <td>${cotizacion.estado || 'Sin estado'}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="verDetalle('${cotizacion.id_pedido}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${cotizacion.estado === 'Pendiente' ? `
                        <button class="btn btn-success btn-sm" onclick="aceptarCotizacion('${cotizacion.id_pedido}')">
                            <i class="fas fa-check"></i> Aceptar    
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="rechazarCotizacion('${cotizacion.id_pedido}')">
                            <i class="fas fa-times"></i> Rechazar
                        </button>   
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        } catch (error) {
            console.error('Error al procesar cotización:', error, cotizacion);
        }
    });
    actualizarDashboard(response.data);
};

function verDetalle(idPedido) {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const params = new URLSearchParams({
        action: 'obtenerCotizacion',  // Cambiado de 'obtenerDetalleCotizacion'
        id: idPedido,
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol
        })
    });

    loadJSONP(`${API_URL}?${params.toString()}&callback=mostrarDetalle`);
}

function mostrarDetalle(response) {
    if (response.error) {
        alert('Error al cargar detalles: ' + response.message);
        return;
    }

    console.log('Datos recibidos:', response.data); // Debug

    const cotizacion = response.data;
    const modalBody = document.getElementById('detalleModalBody');
    
    // Procesar items con mejor manejo de datos
    console.log('Items recibidos:', cotizacion.items);
    
    const itemsHTML = Array.isArray(cotizacion.items) && cotizacion.items.length > 0 
        ? cotizacion.items.map(item => {
            console.log('Procesando item:', item);
            return `
                <tr>
                    <td>${item.item || item.nombre || item.descripcion || '-'}</td>
                    <td>${item.cantidad || '0'}</td>
                    <td>S/ ${parseFloat(item.precio_unitario || item.precio || 0).toFixed(2)}</td>
                    <td>S/ ${parseFloat(item.subtotal || (item.cantidad * (item.precio_unitario || item.precio)) || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('')
        : '<tr><td colspan="4" class="text-center text-muted">No hay items disponibles</td></tr>';
    
    modalBody.innerHTML = `
        <div class="container">
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label">ID Pedido</label>
                    <input type="text" class="form-control" value="${cotizacion.id_pedido || '-'}" readonly>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Fecha Cotización</label>
                    <input type="text" class="form-control" value="${cotizacion.fecha_cotizacion || '-'}" readonly>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Usuario</label>
                    <input type="text" class="form-control" value="${cotizacion.nombre_usuario || '-'}" readonly>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Empresa</label>
                    <input type="text" class="form-control" value="${cotizacion.nombre_empresa || '-'}" readonly>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label">Unidad</label>
                    <input type="text" class="form-control" value="${cotizacion.unidad || '-'}" readonly>
                </div>
            </div>

            <h4>Items Cotizados</h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead class="table-light">
                        <tr>
                            <th>Item</th> 
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>

            <div class="row mt-3">
                <div class="col-md-6 offset-md-6">
                    <table class="table table-bordered">
                        <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td class="text-end">S/ ${parseFloat(cotizacion.subtotal || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>IGV (18%):</strong></td>
                            <td class="text-end">S/ ${parseFloat(cotizacion.igv || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total:</strong></td>
                            <td class="text-end">S/ ${parseFloat(cotizacion.total || 0).toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detalleModal'));
    modal.show();
}

function aceptarCotizacion(idPedido) {
    if (!confirm('¿Está seguro de aceptar esta cotización?')) {
        return;
    }

    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    if (!userData || !userData.empresaId) {
        alert('Error: No se encontraron datos del usuario');
        return;
    }

    const params = {
        action: 'actualizarEstadoCotizacion',
        datos: JSON.stringify({
            ID_Pedido: idPedido,
            Estado: 'Aceptada'      // Cambiado de 'estado' a 'Estado'
        }),
        usuarioData: JSON.stringify({
            ID_Empresa: userData.empresaId,
            rol: userData.rol
        })
    };

    console.log('Enviando parámetros:', params);

    const url = `${API_URL}?${new URLSearchParams(params).toString()}`;
    loadJSONP(url + '&callback=handleActualizacionEstado');
}

function rechazarCotizacion(idPedido) {
    if (!confirm('¿Está seguro de rechazar esta cotización?')) {
        return;
    }

    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    if (!userData || !userData.empresaId) {
        alert('Error: No se encontraron datos del usuario');
        return;
    }

    const params = {
        action: 'actualizarEstadoCotizacion',
        datos: JSON.stringify({
            ID_Pedido: idPedido,
            Estado: 'Rechazada'     // Cambiado de 'estado' a 'Estado'
        }),
        usuarioData: JSON.stringify({
            ID_Empresa: userData.empresaId,
            rol: userData.rol
        })
    };

    console.log('Enviando parámetros:', params);

    const url = `${API_URL}?${new URLSearchParams(params).toString()}`;
    loadJSONP(url + '&callback=handleActualizacionEstado');
}

function handleActualizacionEstado(response) {
    // Debug: Ver respuesta completa
    console.log('Respuesta completa del servidor:', response);
    
    if (response.error) {
        console.error('Error del servidor:', response);
        alert('Error al actualizar estado: ' + response.message);
        return;
    }

    alert('Estado actualizado exitosamente');
    cargarCotizaciones();
}

function actualizarDashboard(cotizaciones) {
    if (!cotizaciones || !Array.isArray(cotizaciones)) return;

    // Obtener empresa del usuario actual
    const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    const empresaActual = userData.nombreEmpresa || 'LP SOLIDS'; // Valor por defecto
    
    // Calcular valores
    const aceptadas = cotizaciones.filter(c => c.estado === 'Aceptada').length;
    const rechazadas = cotizaciones.filter(c => c.estado === 'Rechazada').length;
    const presupuestoInicial = PRESUPUESTOS[empresaActual] || 0;
    const gastoTotal = cotizaciones
        .filter(c => c.estado === 'Aceptada')
        .reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    const disponible = presupuestoInicial - gastoTotal;

    // Actualizar los contadores en el DOM
    document.getElementById('cotizacionesAceptadas').textContent = aceptadas;
    document.getElementById('cotizacionesRechazadas').textContent = rechazadas;
    document.getElementById('totalConsumido').textContent = 
        `S/. ${gastoTotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}`;
    document.getElementById('presupuestoDisponible').textContent = 
        `S/. ${disponible.toLocaleString('es-PE', {minimumFractionDigits: 2})}`;

    // Actualizar gráficas
    actualizarGraficas(cotizaciones, presupuestoInicial, gastoTotal, disponible);
}

function actualizarGraficas(cotizaciones, presupuestoInicial, gastoTotal, disponible) {
    // Limpiar gráficas existentes si las hay
    const histogramaCtx = document.getElementById('histogramaCotizaciones');
    const presupuestoCtx = document.getElementById('presupuestoGrafico');
    
    if (window.histogramaChart) window.histogramaChart.destroy();
    if (window.presupuestoChart) window.presupuestoChart.destroy();

    // Crear datos para el histograma
    const cotizacionesPorFecha = {};
    cotizaciones
        .filter(c => c.estado === 'Aceptada')
        .forEach(c => {
            const fecha = new Date(c.fecha_cotizacion).toLocaleDateString('es-PE');
            cotizacionesPorFecha[fecha] = (cotizacionesPorFecha[fecha] || 0) + parseFloat(c.total || 0);
        });

    // Crear histograma
    window.histogramaChart = new Chart(histogramaCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(cotizacionesPorFecha),
            datasets: [{
                label: 'Total Cotizado (S/.)',
                data: Object.values(cotizacionesPorFecha),
                backgroundColor: '#1565C0',
                borderColor: '#1565C0',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => 'S/. ' + value.toLocaleString('es-PE')
                    }
                }
            }
        }
    });

    // Crear gráfico de presupuesto
    window.presupuestoChart = new Chart(presupuestoCtx, {
        type: 'doughnut',
        data: {
            labels: ['Gastado', 'Disponible'],
            datasets: [{
                data: [gastoTotal, disponible],
                backgroundColor: ['#dc3545', '#28a745'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = context.raw;
                            const percentage = ((value / presupuestoInicial) * 100).toFixed(1);
                            return `${context.label}: S/. ${value.toLocaleString('es-PE')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
