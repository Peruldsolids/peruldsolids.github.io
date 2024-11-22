const ROLES_CONFIG = {
    COMPRADOR: {
        nombre: 'Comprador',
        verTodasEmpresas: false,
        ventanas: {
            'registrar-solicitud': {
                acceso: true,
                botones: ['ver']
            },
            'solicitudes': {
                acceso: true,
                botones: ['ver'],
                modoLectura: true
            },
            'pedidos-aprobados': {
                acceso: false
            },
            'cotizaciones': {
                acceso: false
            }
        }
    },
    APROBADOR: {
        nombre: 'Aprobador',
        verTodasEmpresas: false,
        ventanas: {
            'registrar-solicitud': {
                acceso: true,
                botones: ['ver']
            },
            'solicitudes': {
                acceso: true,
                botones: ['ver', 'aprobar', 'rechazar']
            },
            'cotizaciones': {
                acceso: true,
                botones: ['ver', 'aceptar', 'rechazar']
            }
        }
    },
    COTIZADOR: {
        nombre: 'Cotizador',
        verTodasEmpresas: true,
        ventanas: {
            'pedidos-aprobados': {
                acceso: true,
                botones: ['cotizar']
            },
            'cotizaciones': {
                acceso: true,
                botones: ['ver']
            }
        }
    },
    ADMINISTRADOR: {
        nombre: 'Administrador',
        verTodasEmpresas: true,
        ventanas: {
            'registrar-solicitud': {
                acceso: true,
                botones: ['ver', 'editar', 'eliminar']
            },
            'solicitudes': {
                acceso: true,
                botones: ['ver', 'aprobar', 'rechazar', 'editar', 'eliminar']
            },
            'cotizaciones': {
                acceso: true,
                botones: ['ver', 'aceptar', 'rechazar', 'editar', 'eliminar']
            },
            'pedidos-aprobados': {
                acceso: true,
                botones: ['cotizar', 'ver', 'editar', 'eliminar']
            }
        }
    }
};

function tienePermiso(rol, ventana, accion) {
    console.log(`Verificando permiso - Rol: ${rol}, Ventana: ${ventana}, Acción: ${accion}`);
    
    if (!rol || !ventana) {
        console.log('Rol o ventana no proporcionados');
        return false;
    }
    
    const config = ROLES_CONFIG[rol.toUpperCase()];
    if (!config) {
        console.log('Configuración de rol no encontrada');
        return false;
    }

    if (rol.toUpperCase() === 'ADMINISTRADOR') {
        console.log('Es administrador, acceso total');
        return true;
    }
    
    const ventanaConfig = config.ventanas[ventana];
    if (!ventanaConfig) {
        console.log('Configuración de ventana no encontrada');
        return false;
    }

    if (!ventanaConfig.acceso) {
        console.log('No tiene acceso a la ventana');
        return false;
    }
    
    if (accion === 'acceso') {
        console.log('Verificando acceso a ventana:', ventanaConfig.acceso);
        return ventanaConfig.acceso;
    }

    console.log('Verificando botón específico:', ventanaConfig.botones.includes(accion.toLowerCase()));
    return ventanaConfig.botones.includes(accion.toLowerCase());
}

function puedeVerTodasEmpresas(rol) {
    const config = ROLES_CONFIG[rol.toUpperCase()];
    return config ? config.verTodasEmpresas : false;
}