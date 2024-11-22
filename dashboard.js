document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay usuario logueado
    const usuarioData = sessionStorage.getItem('usuario');
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }

    const usuario = JSON.parse(usuarioData);
    document.getElementById('userName').textContent = usuario.nombre;
    document.getElementById('userNameTop').textContent = usuario.nombre;

    // Aplicar restricciones según rol
    aplicarPermisosSegunRol(usuario.rol);
});

function aplicarPermisosSegunRol(rol) {
    console.log('Aplicando permisos para rol:', rol);

    // Obtener todos los elementos del menú con data-ventana
    const menuItems = document.querySelectorAll('[data-ventana]');
    
    menuItems.forEach(item => {
        const ventana = item.getAttribute('data-ventana');
        const tieneAcceso = tienePermiso(rol, ventana, 'acceso');
        
        console.log(`Ventana: ${ventana}, Acceso: ${tieneAcceso}`);
        
        // Mostrar u ocultar según permisos
        item.closest('li').style.display = tieneAcceso ? '' : 'none';
    });

    // Si es la primera carga, redirigir a la primera página disponible
    if (document.getElementById('contentFrame').src.endsWith('form.html')) {
        const primerItemVisible = document.querySelector('[data-ventana]:not([style*="display: none"])');
        if (primerItemVisible) {
            const href = primerItemVisible.getAttribute('onclick');
            if (href) {
                const url = href.match(/'([^']+)'/)[1];
                cargarPagina(url);
            }
        }
    }
}

function cargarPagina(url) {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const ventana = obtenerVentanaDesdeUrl(url);
    
    if (tienePermiso(usuario.rol, ventana, 'acceso')) {
        document.getElementById('contentFrame').src = url;
        document.getElementById('pageTitle').textContent = getTituloPagina(url);
    } else {
        alert('No tienes permiso para acceder a esta página');
    }
}

function obtenerVentanaDesdeUrl(url) {
    switch(url) {
        case 'form.html': return 'registrar-solicitud';
        case 'lista-pedidos.html': return 'solicitudes';
        case 'pedidos-aprobados.html': return 'pedidos-aprobados';
        case 'cotizaciones.html': return 'cotizaciones';
        default: return '';
    }
}

function getTituloPagina(url) {
    switch(url) {
        case 'form.html': return 'Registrar Solicitud';
        case 'lista-pedidos.html': return 'Solicitudes';
        case 'pedidos-aprobados.html': return 'Pedidos Aprobados';
        case 'cotizaciones.html': return 'Cotizaciones';
        default: return 'Bienvenido';
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('usuario');
    window.location.href = 'index.html';
}