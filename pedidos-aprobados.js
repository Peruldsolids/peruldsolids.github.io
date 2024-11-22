const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

// Función para cargar JSONP
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

document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    if (!userData.usuario) {
        window.location.href = 'index.html';
        return;
    }
    
    cargarPedidosAprobados();
});

function cargarPedidosAprobados() {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const params = new URLSearchParams({
        action: 'obtenerAprobados',
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol
        })
    });

    loadJSONP(`${API_URL}?${params.toString()}&callback=handlePedidosAprobados`);
}

function handlePedidosAprobados(response) {
    if (response.error) {
        alert('Error al cargar pedidos: ' + response.message);
        return;
    }

    const tbody = document.querySelector('#tablaPedidosAprobados tbody');
    tbody.innerHTML = '';

    if (!response.data || response.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay pedidos aprobados</td></tr>';
        return;
    }

    response.data.forEach(pedido => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.fecha}</td>
            <td>${pedido.nombre_empresa}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="verPedido('${pedido.id}')">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn btn-primary btn-sm" onclick="cotizarPedido('${pedido.id}')">
                    <i class="fas fa-calculator"></i> Cotizar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


function mostrarFormularioCotizacion(response) {
    if (response.error) {
        alert('Error al cargar detalles del pedido: ' + response.message);
        return;
    }

    console.log('Datos recibidos:', response.data); // Debug

    const pedido = response.data;
    const modalBody = document.getElementById('pedidoModalBody');
    
    modalBody.innerHTML = `
        <div class="container">
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">Fecha</label>
                    <input type="text" class="form-control" value="${pedido.fecha}" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Unidad</label>
                    <input type="text" class="form-control" value="${pedido.unidad}" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Empresa</label>
                    <input type="text" class="form-control" value="${pedido.nombre_empresa}" readonly>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-12">
                    <label class="form-label">Punto de Entrega</label>
                    <input type="text" class="form-control" value="${pedido.punto_entrega || ''}" readonly>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-12">
                    <label class="form-label">Detalles</label>
                    <textarea class="form-control" rows="3" readonly>${pedido.detalles || ''}</textarea>
                </div>
            </div>

            <h4>Items a Cotizar</h4>
            <div class="table-responsive">
                <table class="table" id="tablaCotizacion">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.isArray(pedido.items) ? pedido.items.map((item, index) => `
                            <tr>
                                <td>${item.item || '-'}</td>
                                <td>${item.cantidad || '0'}</td>
                                <td>
                                    <input type="number" 
                                           class="form-control precio-unitario" 
                                           data-index="${index}"
                                           data-cantidad="${item.cantidad}"
                                           onchange="calcularSubtotal(this)"
                                           min="0"
                                           step="0.01">
                                </td>
                                <td>
                                    <span class="subtotal-item">0.00</span>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">No hay items disponibles</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="row mt-3">
                <div class="col-md-6 offset-md-6">
                    <table class="table table-bordered">
                        <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td class="text-end" id="subtotalGeneral">0.00</td>
                        </tr>
                        <tr>
                            <td><strong>IGV (18%):</strong></td>
                            <td class="text-end" id="igv">0.00</td>
                        </tr>
                        <tr>
                            <td><strong>Total:</strong></td>
                            <td class="text-end" id="total">0.00</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Agregar botones al footer del modal
    const modalFooter = document.getElementById('pedidoModalFooter');
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        <button type="button" class="btn btn-primary" onclick="guardarCotizacion('${pedido.id}')">
            Guardar Cotización
        </button>
    `;

    const modal = new bootstrap.Modal(document.getElementById('pedidoModal'));
    modal.show();
}
// Función para ver detalles del pedido
window.verPedido = function(id) {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const params = new URLSearchParams({
        action: 'obtenerPedido',
        id: id,
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol
        })
    });

    loadJSONP(`${API_URL}?${params.toString()}&callback=mostrarDetallePedido`);
}

// Función para cotizar pedido
window.cotizarPedido = function(id) {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const params = new URLSearchParams({
        action: 'obtenerPedido',
        id: id,
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol
        })
    });

    loadJSONP(`${API_URL}?${params.toString()}&callback=mostrarFormularioCotizacion`);
}



// Función para calcular subtotal por item
window.calcularSubtotal = function(input) {
    const cantidad = parseFloat(input.dataset.cantidad);
    const precioUnitario = parseFloat(input.value) || 0;
    const subtotal = cantidad * precioUnitario;
    
    // Actualizar subtotal del item
    const row = input.closest('tr');
    row.querySelector('.subtotal-item').textContent = subtotal.toFixed(2);
    
    // Recalcular totales
    calcularTotales();
}

// Función para calcular totales generales
function calcularTotales() {
    const subtotales = Array.from(document.querySelectorAll('.subtotal-item'))
        .map(el => parseFloat(el.textContent) || 0);
    
    const subtotalGeneral = subtotales.reduce((a, b) => a + b, 0);
    const igv = subtotalGeneral * 0.18;
    const total = subtotalGeneral + igv;

    document.getElementById('subtotalGeneral').textContent = subtotalGeneral.toFixed(2);
    document.getElementById('igv').textContent = igv.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

// Función para guardar la cotización
window.guardarCotizacion = function(idPedido) {
    const items = Array.from(document.querySelectorAll('#tablaCotizacion tbody tr')).map(row => ({
        item: row.cells[0].textContent,
        cantidad: parseFloat(row.cells[1].textContent),
        precio_unitario: parseFloat(row.querySelector('.precio-unitario').value) || 0,
        subtotal: parseFloat(row.querySelector('.subtotal-item').textContent)
    }));

    const subtotal = parseFloat(document.getElementById('subtotalGeneral').textContent);
    const igv = parseFloat(document.getElementById('igv').textContent);
    const total = parseFloat(document.getElementById('total').textContent);

    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const params = new URLSearchParams({
        action: 'guardarCotizacion',
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol,
            usuario: userData.usuario
        }),
        datos: JSON.stringify({
            id_pedido: idPedido,
            items: items,
            subtotal: subtotal,
            igv: igv,
            total: total,
            fecha_cotizacion: new Date().toISOString()
        })
    });

    loadJSONP(`${API_URL}?${params.toString()}&callback=handleGuardarCotizacion`);
}

function handleGuardarCotizacion(response) {
    if (response.error) {
        alert('Error al guardar la cotización: ' + response.message);
        return;
    }

    alert('Cotización guardada exitosamente');
    const modal = bootstrap.Modal.getInstance(document.getElementById('pedidoModal'));
    modal.hide();
    cargarPedidosAprobados(); // Recargar la lista
}