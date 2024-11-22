// Configuración
const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

// Variables globales
let categorias = ['Materiales', 'Herramientas', 'Equipos', 'Servicios']; // Categorías temporales

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

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar sesión
        const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
        if (!userData.usuario) {
            window.location.href = 'index.html';
            return;
        }

        console.log('Iniciando carga de datos...', userData);

        // Función auxiliar para establecer valor de forma segura
        function setValueIfExists(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.value = value;
                console.log(`Valor establecido para ${elementId}:`, value);
            } else {
                console.log(`Elemento ${elementId} no encontrado - puede ser normal si no estamos en la página correcta`);
            }
        }

        // Establecer valores solo si los elementos existen
        setValueIfExists('fecha', new Date().toLocaleDateString('es-PE'));
        setValueIfExists('nombreUsuario', userData.usuario); // Cambiado de 'usuario' a 'nombreUsuario'
        setValueIfExists('empresa', userData.empresa);
        setValueIfExists('usuarioId', userData.id);
        setValueIfExists('empresaId', userData.empresaId);

        // Agregar primer item solo si estamos en la página del formulario
        const itemsContainer = document.getElementById('itemsContainer');
        if (itemsContainer) {
            agregarItem();
            console.log('Primer item agregado');
        }
        
        console.log('Inicialización completada');
    } catch (error) {
        console.error('Error en la inicialización:', error);
        // No mostrar alert, solo registrar en consola
        console.log('Algunos campos podrían no estar disponibles:', error.message);
    }
});

// Funciones para manejo de items
function agregarItem() {
    const container = document.getElementById('itemsContainer');
    const itemIndex = container.children.length;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-form mb-3';
    itemDiv.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <label class="form-label">Categoría</label>
                <select class="form-control" id="categoria_${itemIndex}" required>
                    <option value="">Seleccione categoría</option>
                    ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Item</label>
                <input type="text" class="form-control" id="item_${itemIndex}" required>
            </div>
            <div class="col-md-2">
                <label class="form-label">Unidad de Medida</label>
                <input type="text" class="form-control" id="unidadMedida_${itemIndex}" required>
            </div>
            <div class="col-md-2">
                <label class="form-label">Cantidad</label>
                <input type="number" class="form-control" id="cantidad_${itemIndex}" min="1" required>
            </div>
            ${itemIndex > 0 ? `
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-danger" onclick="eliminarItem(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    container.appendChild(itemDiv);
}

function eliminarItem(button) {
    button.closest('.item-form').remove();
}

function obtenerItems() {
    const items = [];
    const container = document.getElementById('itemsContainer');
    
    for (let i = 0; i < container.children.length; i++) {
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
    
    console.log('Items obtenidos:', items); // Debug
    return items;
}
// Funciones de vista previa y guardado
function mostrarVistaPrevia() {
    // Obtener los datos generales
    const fecha = document.getElementById('fecha').value;
    const nombreUsuario = document.getElementById('nombreUsuario').value; // Cambiado de 'usuario' a 'nombreUsuario'
    const empresa = document.getElementById('empresa').value;
    const unidad = document.getElementById('unidad').value;
    const puntoEntrega = document.getElementById('puntoEntrega').value;
    const detalles = document.getElementById('detalles').value;

    // Validar campos requeridos
    if (!unidad || !puntoEntrega) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }

    // Obtener los items
    const items = obtenerItems();
    if (items.length === 0) {
        alert('Debe agregar al menos un item');
        return;
    }

    // Crear el contenido de la vista previa
    let previewHTML = `
        <div class="preview-section">
            <h4>Datos Generales</h4>
            <table class="table">
                <tr>
                    <td><strong>Fecha:</strong></td>
                    <td>${fecha}</td>
                </tr>
                <tr>
                    <td><strong>Usuario:</strong></td>
                    <td>${nombreUsuario}</td>
                </tr>
                <tr>
                    <td><strong>Empresa:</strong></td>
                    <td>${empresa}</td>
                </tr>
                <tr>
                    <td><strong>Unidad:</strong></td>
                    <td>${unidad}</td>
                </tr>
                <tr>
                    <td><strong>Punto de Entrega:</strong></td>
                    <td>${puntoEntrega}</td>
                </tr>
                <tr>
                    <td><strong>Detalles:</strong></td>
                    <td>${detalles || 'N/A'}</td>
                </tr>
            </table>
        </div>
        
        <div class="preview-section">
            <h4>Items</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Item</th>
                        <th>Unidad de Medida</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.categoria}</td>
                            <td>${item.item}</td>
                            <td>${item.unidadMedida}</td>
                            <td>${item.cantidad}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Mostrar la vista previa
    document.getElementById('previewContent').innerHTML = previewHTML;
    document.getElementById('previewModal').style.display = 'block';
}

function validarDatos(datosGenerales, items) {
    // Validar campos requeridos
    if (!datosGenerales.unidad) {
        alert('Por favor complete el campo Unidad');
        return false;
    }

    if (!datosGenerales.puntoEntrega) {
        alert('Por favor complete el campo Punto de Entrega');
        return false;
    }

    if (!items || items.length === 0) {
        alert('Debe agregar al menos un item');
        return false;
    }

    // Validar que cada item tenga todos sus campos
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.categoria || !item.item || !item.unidadMedida || !item.cantidad) {
            alert('Por favor complete todos los campos del item ' + (i + 1));
            return false;
        }
    }

    return true;
}

function guardarPedido() {
    try {
        const items = obtenerItems();
        
        if (!items || items.length === 0) {
            alert('Debe agregar al menos un item');
            return;
        }

        const datosPedido = {
            id: new Date().getTime().toString(),
            fecha: document.getElementById('fecha').value,
            id_usuario: document.getElementById('usuarioId').value,
            nombre_usuario: document.getElementById('nombreUsuario').value, // Cambiado de 'usuario' a 'nombreUsuario'
            rol_usuario: 'Comprador',
            id_empresa: document.getElementById('empresaId').value,
            nombre_empresa: document.getElementById('empresa').value,
            unidad: document.getElementById('unidad').value,
            punto_entrega: document.getElementById('puntoEntrega').value,
            detalles: document.getElementById('detalles').value,
            estado: 'Pendiente',
            items: items
        };

        console.log('Datos del pedido a enviar:', datosPedido); // Debug
        enviarPedido(datosPedido);

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar el pedido: ' + error.message);
    }
}
        
function enviarPedido(datosPedido) {
    const script = document.createElement('script');
    const callbackName = 'guardar_callback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(response) {
        delete window[callbackName];
        document.body.removeChild(script);
        
        if (response.error) {
            console.error('Error en respuesta:', response);
            alert('Error al guardar: ' + response.message);
        } else {
            alert('Pedido guardado exitosamente');
            cerrarVistaPrevia();
            limpiarFormulario();
        }
    };

    const params = new URLSearchParams({
        action: 'guardarRegistro',
        callback: callbackName,
        datos: JSON.stringify(datosPedido)
    });

    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}
        
        function cerrarVistaPrevia() {
            document.getElementById('previewModal').style.display = 'none';
        }
        
        function limpiarFormulario() {
            // Limpiar campos editables
            document.getElementById('unidad').value = '';
            document.getElementById('puntoEntrega').value = '';
            document.getElementById('detalles').value = '';
        
            // Limpiar items
            document.getElementById('itemsContainer').innerHTML = '';
            agregarItem();
        }
        
        // Función para cerrar el modal con el botón X o haciendo clic fuera
        window.onclick = function(event) {
            const modal = document.getElementById('previewModal');
            if (event.target === modal) {
                cerrarVistaPrevia();
            }
        }
