// Configuración
const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

// Función para cargar datos usando JSONP
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

// Función para obtener el color según el estado
function getEstadoColor(estado) {
    switch(estado) {
        case 'Pendiente': return 'warning';
        case 'Aprobado': return 'success';
        case 'Rechazado': return 'danger';
        default: return 'secondary';
    }
}

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    if (!userData.usuario) {
        window.location.href = 'index.html';
        return;
    }
    
    cargarPedidos();
});

function cargarPedidos() {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    console.log('Datos de usuario para la consulta:', userData);

    const params = new URLSearchParams({
        action: 'obtenerPedidos',
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol
        })
    });

    console.log('URL de consulta:', `${API_URL}?${params.toString()}`);
    loadJSONP(`${API_URL}?${params.toString()}&callback=handlePedidos`);
}

function handlePedidos(response) {
    if (response.error) {
        console.error('Error en respuesta:', response);
        alert('Error al cargar pedidos: ' + response.message);
        return;
    }

    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const tabla = document.getElementById('tablaPedidos');
    
    // Crear una nueva tabla manteniendo el header original
    const headerRow = tabla.querySelector('thead tr').cloneNode(true);
    const newTable = document.createElement('table');
    newTable.className = 'table';
    const newThead = document.createElement('thead');
    const newTbody = document.createElement('tbody');
    
    // Agregar el header clonado
    newThead.appendChild(headerRow);
    newTable.appendChild(newThead);
    newTable.appendChild(newTbody);

    if (!response.data || response.data.length === 0) {
        newTbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay pedidos registrados</td></tr>';
    } else {
        response.data.forEach(pedido => {
            let fechaFormateada;
            try {
                const fecha = pedido.fecha.includes('/') ? 
                    pedido.fecha :
                    new Date(pedido.fecha).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                fechaFormateada = fecha;
            } catch (error) {
                console.error('Error al formatear fecha:', error);
                fechaFormateada = 'Fecha inválida';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pedido.id}</td>
                <td>${fechaFormateada}</td>
                <td>${pedido.nombre_usuario}</td>
                <td><span class="badge bg-${getEstadoColor(pedido.estado)}">${pedido.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-info btn-action" onclick="verPedido('${pedido.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${userData.rol === 'Aprobador' && pedido.estado === 'Pendiente' ? `
                        <button class="btn btn-sm btn-success btn-action" onclick="aprobarPedido('${pedido.id}')">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn btn-sm btn-danger btn-action" onclick="rechazarPedido('${pedido.id}')">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    ` : ''}
                </td>
            `;
            newTbody.appendChild(tr);
        });
    }

    // Reemplazar la tabla antigua con la nueva
    tabla.parentNode.replaceChild(newTable, tabla);
    newTable.id = 'tablaPedidos';
}

window.verPedido = function(id) {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const esAprobador = userData.rol === 'Aprobador';
    
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

function mostrarDetallePedido(response) {
    if (response.error) {
        alert('Error al cargar detalles del pedido: ' + response.message);
        return;
    }

    console.log('Datos recibidos:', response.data); // Debug

    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const esAprobador = userData.rol === 'Aprobador';
    const pedido = response.data;
    
    console.log('Detalles del pedido:', pedido.detalles); // Debug adicional

    const modalBody = document.getElementById('pedidoModalBody');
    const modalFooter = document.getElementById('pedidoModalFooter');

    modalBody.innerHTML = `
        <div class="container">
            <form id="pedidoForm" ${!esAprobador ? 'disabled' : ''}>
                <h4>Datos Generales</h4>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Fecha</label>
                        <input type="text" class="form-control" value="${pedido.fecha}" readonly>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Usuario</label>
                        <input type="text" class="form-control" value="${pedido.nombre_usuario}" readonly>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Empresa</label>
                        <input type="text" class="form-control" value="${pedido.nombre_empresa}" readonly>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Unidad</label>
                        <input type="text" class="form-control" id="unidad" value="${pedido.unidad}" 
                               ${esAprobador ? '' : 'readonly'}>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label class="form-label">Punto de Entrega</label>
                        <input type="text" class="form-control" id="puntoEntrega" 
                               value="${pedido.punto_entrega}"
                               ${esAprobador ? '' : 'readonly'}>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-12">
                        <label class="form-label">Detalles</label>
                        <textarea class="form-control" id="detalles" rows="3" 
                                ${esAprobador ? '' : 'readonly'}>${pedido.detalles || ''}</textarea>
                    </div>
                </div>

                <h4>Items</h4>
                <div class="table-responsive">
                    <table class="table" id="itemsTable">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Item</th>
                                <th>Unidad de Medida</th>
                                <th>Cantidad</th>
                                ${esAprobador ? '<th>Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${pedido.items.map((item, index) => `
                                <tr id="item_${index}">
                                    <td>
                                        ${esAprobador ? `
                                            <select class="form-control" id="categoria_${index}">
                                                <option value="Materiales" ${item.categoria === 'Materiales' ? 'selected' : ''}>Materiales</option>
                                                <option value="Servicios" ${item.categoria === 'Servicios' ? 'selected' : ''}>Servicios</option>
                                            </select>
                                        ` : item.categoria}
                                    </td>
                                    <td>
                                        ${esAprobador ? `
                                            <input type="text" class="form-control" id="item_${index}" 
                                                   value="${item.item}">
                                        ` : item.item}
                                    </td>
                                    <td>
                                        ${esAprobador ? `
                                            <select class="form-control" id="unidadMedida_${index}">
                                                <option value="unidad" ${item.unidadMedida === 'unidad' ? 'selected' : ''}>Unidad</option>
                                                <option value="kg" ${item.unidadMedida === 'kg' ? 'selected' : ''}>Kilogramo</option>
                                                <option value="lt" ${item.unidadMedida === 'lt' ? 'selected' : ''}>Litro</option>
                                                <option value="gl" ${item.unidadMedida === 'gl' ? 'selected' : ''}>Galón</option>
                                                <option value="m" ${item.unidadMedida === 'm' ? 'selected' : ''}>Metro</option>
                                                <option value="m2" ${item.unidadMedida === 'm2' ? 'selected' : ''}>Metro Cuadrado</option>
                                                <option value="m3" ${item.unidadMedida === 'm3' ? 'selected' : ''}>Metro Cúbico</option>
                                                <option value="bolsa" ${item.unidadMedida === 'bolsa' ? 'selected' : ''}>Bolsa</option>
                                            </select>
                                        ` : item.unidadMedida}
                                    </td>
                                    <td>
                                        ${esAprobador ? `
                                            <input type="number" class="form-control" id="cantidad_${index}" 
                                                   value="${item.cantidad}" min="1">
                                        ` : item.cantidad}
                                    </td>
                                    ${esAprobador ? `
                                        <td>
                                            <button class="btn btn-sm btn-danger" onclick="eliminarItem(${index})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    ` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${esAprobador ? `
                        <button type="button" class="btn btn-primary mb-3" onclick="agregarItem()">
                            <i class="fas fa-plus"></i> Agregar Item
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    modalFooter.innerHTML = esAprobador ? `
        <button type="button" class="btn btn-success" onclick="aprobarPedido('${pedido.id}')">
            <i class="fas fa-check"></i> Aprobar
        </button>
        <button type="button" class="btn btn-danger" onclick="rechazarPedido('${pedido.id}')">
            <i class="fas fa-times"></i> Rechazar
        </button>
        <button type="button" class="btn btn-primary" onclick="guardarCambios('${pedido.id}')">
            <i class="fas fa-save"></i> Guardar Cambios
        </button>
    ` : `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
    `;

    const modal = new bootstrap.Modal(document.getElementById('pedidoModal'));
    modal.show();
}

function aprobarPedido(id) {
    if (confirm('¿Está seguro de aprobar este pedido?')) {
        const params = new URLSearchParams({
            action: 'actualizarEstadoPedido',
            id: id,
            estado: 'Aprobado'
        });

        loadJSONP(`${API_URL}?${params.toString()}&callback=handleActualizacionEstado`);
    }
}

function rechazarPedido(id) {
    if (confirm('¿Está seguro de rechazar este pedido?')) {
        const params = new URLSearchParams({
            action: 'actualizarEstadoPedido',
            id: id,
            estado: 'Rechazado'
        });

        loadJSONP(`${API_URL}?${params.toString()}&callback=handleActualizacionEstado`);
    }
}

function handleActualizacionEstado(response) {
    if (response.error) {
        alert('Error al actualizar el estado: ' + response.message);
        return;
    }

    alert('Estado actualizado correctamente');
    cargarPedidos(); // Recargar la lista
}

window.agregarItem = function() {
    const tbody = document.querySelector('#itemsTable tbody');
    const newIndex = tbody.children.length;
    
    const tr = document.createElement('tr');
    tr.id = `item_${newIndex}`;
    tr.innerHTML = `
        <td>
            <select class="form-control" id="categoria_${newIndex}">
                <option value="Materiales">Materiales</option>
                <option value="Servicios">Servicios</option>
            </select>
        </td>
        <td>
            <input type="text" class="form-control" id="item_${newIndex}">
        </td>
        <td>
            <select class="form-control" id="unidadMedida_${newIndex}">
                <option value="unidad">Unidad</option>
                <option value="kg">Kilogramo</option>
                <option value="lt">Litro</option>
                <option value="gl">Galón</option>
                <option value="m">Metro</option>
                <option value="m2">Metro Cuadrado</option>
                <option value="m3">Metro Cúbico</option>
                <option value="bolsa">Bolsa</option>
            </select>
        </td>
        <td>
            <input type="number" class="form-control" id="cantidad_${newIndex}" min="1" value="1">
        </td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="eliminarItem(${newIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

window.eliminarItem = function(index) {
    if (confirm('¿Está seguro de eliminar este item?')) {
        const item = document.getElementById(`item_${index}`);
        item.remove();
    }
}

window.obtenerItemsEditados = function() {
    const items = [];
    const tbody = document.querySelector('#itemsTable tbody');
    
    for (let i = 0; i < tbody.children.length; i++) {
        const categoria = document.getElementById(`categoria_${i}`);
        const item = document.getElementById(`item_${i}`);
        const unidadMedida = document.getElementById(`unidadMedida_${i}`);
        const cantidad = document.getElementById(`cantidad_${i}`);
        
        if (categoria && item && unidadMedida && cantidad) {
            items.push({
                categoria: categoria.value,
                item: item.value,
                unidadMedida: unidadMedida.value,
                cantidad: cantidad.value
            });
        }
    }
    
    return items;
}

window.guardarCambios = function(id) {
    try {
        console.log('Guardando cambios para pedido:', id);
        const userData = JSON.parse(sessionStorage.getItem('usuario'));
        const items = obtenerItemsEditados();
        
        if (items.length === 0) {
            alert('Debe tener al menos un item');
            return;
        }

        // Obtener los demás campos editables
        const unidad = document.getElementById('unidad').value;
        const puntoEntrega = document.getElementById('puntoEntrega').value;
        const detalles = document.getElementById('detalles').value;

        console.log('Datos a enviar:', {
            id,
            unidad,
            puntoEntrega,
            detalles,
            items
        });

        const datosPedido = {
            id: id,
            unidad: unidad,
            punto_entrega: puntoEntrega,
            detalles: detalles,
            items: items
        };

        const params = new URLSearchParams({
            action: 'actualizarPedido',
            usuarioData: JSON.stringify({
                empresaId: userData.empresaId,
                rol: userData.rol,
                usuario: userData.usuario
            }),
            datos: JSON.stringify(datosPedido)
        });

        console.log('URL params:', params.toString());
        loadJSONP(`${API_URL}?${params.toString()}&callback=handleActualizacion`);

    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Error al guardar los cambios: ' + error.message);
    }
}

window.handleActualizacion = function(response) {
    if (response.error) {
        alert('Error al actualizar: ' + response.message);
        return;
    }

    alert('Cambios guardados exitosamente');
    const modal = bootstrap.Modal.getInstance(document.getElementById('pedidoModal'));
    modal.hide();
    cargarPedidos(); // Recargar la lista
}

window.aprobarPedido = function(id) {
    if (confirm('¿Está seguro de aprobar este pedido?')) {
        const userData = JSON.parse(sessionStorage.getItem('usuario'));
        
        const params = new URLSearchParams({
            action: 'actualizarEstadoPedido',
            usuarioData: JSON.stringify({
                empresaId: userData.empresaId,
                rol: userData.rol,
                usuario: userData.usuario
            }),
            datos: JSON.stringify({
                id: id,
                estado: 'Aprobado',
                observacion: '' // Opcional: podríamos agregar un campo para comentarios
            })
        });

        loadJSONP(`${API_URL}?${params.toString()}&callback=handleActualizacionEstado`);
    }
}

window.rechazarPedido = function(id) {
    // Podríamos mostrar un modal o prompt para pedir motivo del rechazo
    const motivo = prompt('Por favor, indique el motivo del rechazo:');
    if (motivo) {
        const userData = JSON.parse(sessionStorage.getItem('usuario'));
        
        const params = new URLSearchParams({
            action: 'actualizarEstadoPedido',
            usuarioData: JSON.stringify({
                empresaId: userData.empresaId,
                rol: userData.rol,
                usuario: userData.usuario
            }),
            datos: JSON.stringify({
                id: id,
                estado: 'Rechazado',
                observacion: motivo
            })
        });

        loadJSONP(`${API_URL}?${params.toString()}&callback=handleActualizacionEstado`);
    }
}

window.handleActualizacionEstado = function(response) {
    if (response.error) {
        alert('Error al actualizar estado: ' + response.message);
        return;
    }

    alert('Estado actualizado exitosamente');
    const modal = bootstrap.Modal.getInstance(document.getElementById('pedidoModal'));
    if (modal) {
        modal.hide();
    }
    cargarPedidos(); // Recargar la lista
}

function cargarAprobados() {
    const userData = JSON.parse(sessionStorage.getItem('usuario'));
    const params = new URLSearchParams({
        action: 'obtenerAprobados',
        usuarioData: JSON.stringify({
            empresaId: userData.empresaId,
            rol: userData.rol
        })
    });

    loadJSONP(`${API_URL}?${params.toString()}&callback=handleAprobados`);
}

function handleAprobados(response) {
    if (response.error) {
        alert('Error al cargar pedidos aprobados: ' + response.message);
        return;
    }

    const tbody = document.getElementById('tablaAprobados').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    response.data.forEach(pedido => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.fecha}</td>
            <td>${pedido.nombre_empresa}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verPedido('${pedido.id}')">Ver</button>
                <button class="btn btn-sm btn-primary" onclick="cotizarPedido('${pedido.id}')">Cotizar</button>
                <button class="btn btn-sm btn-success" onclick="aprobarPedido('${pedido.id}')">Aprobar</button>
                <button class="btn btn-sm btn-danger" onclick="rechazarPedido('${pedido.id}')">Rechazar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

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

    loadJSONP(`${API_URL}?${params.toString()}&callback=mostrarCotizacion`);
}

function mostrarCotizacion(response) {
    if (response.error) {
        alert('Error al cargar detalles del pedido: ' + response.message);
        return;
    }

    const pedido = response.data;
    const modalBody = document.getElementById('cotizacionModalBody');
    modalBody.innerHTML = `
        <h4>Detalles del Pedido</h4>
        <table class="table" id="cotizacionTable">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Precio</th>
                </tr>
            </thead>
            <tbody>
                ${pedido.items.map((item, index) => `
                    <tr>
                        <td>${item.item}</td>
                        <td><input type="number" class="form-control" id="precio_${index}" value="0" onchange="calcularTotal()"></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <h5>Subtotal: <span id="subtotal">0.00</span></h5>
        <h5>IGV (18%): <span id="igv">0.00</span></h5>
        <h5>Total: <span id="total">0.00</span></h5>
    `;

    const modal = new bootstrap.Modal(document.getElementById('cotizacionModal'));
    modal.show();
}

function calcularTotal() {
    const rows = document.querySelectorAll('#cotizacionTable tbody tr');
    let subtotal = 0;

    rows.forEach(row => {
        const precioInput = row.querySelector('input[type="number"]');
        const precio = parseFloat(precioInput.value) || 0;
        subtotal += precio;
    });

    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    document.getElementById('subtotal').innerText = subtotal.toFixed(2);
    document.getElementById('igv').innerText = igv.toFixed(2);
    document.getElementById('total').innerText = total.toFixed(2);
}