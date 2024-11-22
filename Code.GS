function doGet(e) {
  console.log('Iniciando doGet');
  console.log('Evento completo:', JSON.stringify(e));
  
  if (!e) {
    console.log('Evento es null o undefined');
    return ContentService.createTextOutput(
      JSON.stringify({error: true, message: 'No se recibió evento'})
    );
  }
  
  if (!e.parameter) {
    console.log('e.parameter es null o undefined');
    console.log('Contenido de e:', e);
    return ContentService.createTextOutput(
      JSON.stringify({error: true, message: 'No se recibieron parámetros'})
    );
  }

  console.log('Parámetros recibidos:', JSON.stringify(e.parameter));
  
  try {
    console.log('Iniciando doGet con evento:', e);
    
    // Verificar si e y e.parameter existen
    if (!e || !e.parameter) {
      throw new Error('No se recibieron parámetros');
    }

    const callback = e.parameter.callback;
    const action = e.parameter.action;
    const datos = e.parameter.datos ? JSON.parse(e.parameter.datos) : null;
    
    console.log('Acción solicitada:', action);
    console.log('Datos recibidos:', datos);

    let result;
    
    switch(action) {
      case 'getMatrizDatos':
        result = getMatrizDatos();
        break;
      case 'getMatrizItems':
        result = getMatrizItems();
        break;
      case 'getRegistros':
        result = getRegistros();
        break;
    case 'login':
        result = validarUsuario(e.parameter.usuario, e.parameter.password);
        break;
      case 'guardarRegistro':
        if (!datos) {
          throw new Error('No se recibieron datos para guardar');
        }
        result = guardarRegistro(datos);
        break;
      
      case 'obtenerPedidos':  // Agregamos este caso
        if (!e.parameter.usuarioData) {
          throw new Error('No se recibieron datos del usuario');
        }
        result = obtenerPedidos(e);
        break;
        case 'obtenerPedido':
    if (!e.parameter.id || !e.parameter.usuarioData) {
        throw new Error('Faltan parámetros para obtener el pedido');
    }
        result = obtenerPedido(e);
        break;
        case 'actualizarPedido':
    if (!e.parameter.usuarioData || !e.parameter.datos) {
        throw new Error('Faltan parámetros para actualizar el pedido');
    }
        result = actualizarPedido(e);
        break; 
    case 'actualizarEstadoPedido':
        if (!e.parameter.usuarioData || !e.parameter.datos) {
          throw new Error('Faltan parámetros para actualizar el estado');
        }
        result = actualizarEstadoPedido(e);
        break; 
    case 'obtenerAprobados':
        if (!e.parameter.usuarioData) {
          throw new Error('Faltan parámetros para obtener pedidos aprobados');
        }
        result = obtenerAprobados(e);
        break;
        case 'guardarCotizacion':
    if (!e.parameter.usuarioData || !e.parameter.datos) {
        throw new Error('Faltan parámetros para guardar la cotización');
    }
        result = guardarCotizacion(e);
        break; 
              case 'obtenerCotizacion':  // Agregamos esta línea
        result = obtenerCotizacion(e);
        break;
     case 'obtenerCotizaciones':
        if (!e.parameter.usuarioData) {
          throw new Error('Faltan parámetros para obtener cotizaciones');
        }
        result = obtenerCotizaciones(e);
        break;

      case 'obtenerDetalleCotizacion':
        if (!e.parameter.usuarioData || !e.parameter.id) {
          throw new Error('Faltan parámetros para obtener detalle de cotización');
        }
        result = obtenerDetalleCotizacion(e);
        break;

      case 'actualizarEstadoCotizacion':
        if (!e.parameter.usuarioData || !e.parameter.datos) {
          throw new Error('Faltan parámetros para actualizar estado de cotización');
        }
        result = actualizarEstadoCotizacion(e);
        break; 

              case 'guardarCotizacion':
        result = guardarCotizacion(e);
        break;  

      default:
        result = { error: true, message: 'Acción no válida: ' + action };
    }

    // Verificar que tenemos un callback
    if (!callback) {
      throw new Error('No se recibió callback');
    }

    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    output.setContent(callback + '(' + JSON.stringify(result) + ')');
    
    console.log('Respuesta preparada:', result);
    
    return output;

  } catch (error) {
    console.error('Error en doGet:', error);
    
    // Si tenemos callback, devolver error formateado
    if (e && e.parameter && e.parameter.callback) {
      const output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JAVASCRIPT);
      output.setContent(e.parameter.callback + '(' + JSON.stringify({
        error: true,
        message: error.toString()
      }) + ')');
      return output;
    }
    
    // Si no hay callback, devolver error simple
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: error.toString()
    }));
  }
}

function guardarRegistro(datos) {
  try {
    console.log('Iniciando guardarRegistro');
    console.log('Datos recibidos:', datos);
    
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('registros');
    
    // Verificar si la hoja existe
    if (!sheet) {
      console.log('Creando hoja de registros');
      sheet = ss.insertSheet('registros');
      const headers = [
        'ID',
        'Fecha',
        'ID_Usuario',
        'Nombre_Usuario',
        'Rol_Usuario',
        'ID_Empresa',
        'Nombre_Empresa',
        'Unidad',
        'Punto_Entrega',
        'Detalles',
        'Estado',
        'Items'  // Columna única para todos los items
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Crear fila con los datos recibidos
    const row = [
      datos.id,
      datos.fecha,
      datos.id_usuario,
      datos.nombre_usuario,
      datos.rol_usuario,
      datos.id_empresa,
      datos.nombre_empresa,
      datos.unidad,
      datos.punto_entrega,
      datos.detalles,
      datos.estado,
      JSON.stringify(datos.items)  // Convertir array de items a string JSON
    ];
    
    // Insertar la fila
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);
    
    console.log('Registro guardado exitosamente');
    return { error: false, message: 'Registro guardado exitosamente' };
    
  } catch (error) {
    console.error('Error en guardarRegistro:', error.toString());
    console.error('Stack:', error.stack);
    return { error: true, message: error.toString() };
  }
}



function getMatrizDatos() {
  try {
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('matriz datos');
    const data = sheet.getDataRange().getValues();
    
    return {
      error: false,
      data: {
        headers: data[0],
        rows: data.slice(1)
      }
    };
  } catch (error) {
    return {
      error: true,
      message: error.toString()
    };
  }
}

function getMatrizItems() {
  try {
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('matriz items');
    const data = sheet.getDataRange().getValues();
    
    return {
      error: false,
      data: {
        headers: data[0],
        rows: data.slice(1)
      }
    };
  } catch (error) {
    return {
      error: true,
      message: error.toString()
    };
  }
}

function getRegistros() {
  try {
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('Registros');
    const data = sheet.getDataRange().getValues();
    
    // Agrupar los registros por sus datos principales
    const registros = [];
    let registroActual = null;
    
    // Omitir la fila de encabezados
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const [fecha, areaSolicitante, solicitante, sector, cliente, unidad, 
             administrador, liderZonal, ciudad, sucursal, categoria, item, 
             unidadMedida, cantidad, detalle] = row;
             
      // Si es un nuevo registro (cambian los datos principales)
      if (!registroActual || 
          registroActual.areaSolicitante !== areaSolicitante ||
          registroActual.cliente !== cliente ||
          registroActual.fecha.getTime() !== fecha.getTime()) {
        
        if (registroActual) {
          registros.push(registroActual);
        }
        
        registroActual = {
          fecha,
          areaSolicitante,
          solicitante,
          sector,
          cliente,
          unidad,
          administrador,
          liderZonal,
          ciudad,
          sucursal,
          items: []
        };
      }
      
      // Agregar el item al registro actual
      registroActual.items.push({
        categoria,
        item,
        unidadMedida,
        cantidad,
        detalle
      });
    }
    
    // Agregar el último registro
    if (registroActual) {
      registros.push(registroActual);
    }
    
    return {
      error: false,
      data: registros
    };
    
  } catch (error) {
    return {
      error: true,
      message: error.toString()
    };
  }
} 

function obtenerCotizaciones(e) {
  try {
    console.log('Iniciando obtenerCotizaciones');
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    console.log('Datos de usuario recibidos:', usuarioData);
    
    // Verificar el rol exactamente como está en usuarioData
    const rolesConAccesoTotal = ['Administrador', 'Cotizador'];
    const verTodasEmpresas = rolesConAccesoTotal.includes(usuarioData.rol);
    
    console.log('Rol del usuario:', usuarioData.rol);
    console.log('¿Puede ver todas las empresas?:', verTodasEmpresas);

    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('Cotizaciones');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Resto de la configuración de columnas...
    const columnas = {
      'ID_Pedido': headers.indexOf('ID_Pedido'),
      'Fecha_Cotizacion': headers.indexOf('Fecha_Cotizacion'),
      'Items_Cotizados': headers.indexOf('Items_Cotizados'),
      'Subtotal': headers.indexOf('Subtotal'),
      'IGV': headers.indexOf('IGV'),
      'Total': headers.indexOf('Total'),
      'Estado': headers.indexOf('Estado'),
      'Nombre_Usuario': headers.indexOf('Nombre_Usuario'),
      'ID_Empresa': headers.indexOf('ID_Empresa')
    };

    // Verificación de columnas...
    const columnasFaltantes = Object.entries(columnas)
      .filter(([nombre, indice]) => indice === -1)
      .map(([nombre]) => nombre);

    if (columnasFaltantes.length > 0) {
      throw new Error(`Columnas no encontradas: ${columnasFaltantes.join(', ')}`);
    }

    console.log('Total registros antes de filtrar:', data.length - 1);

    // Filtrar y mapear las cotizaciones
    const cotizaciones = data.slice(1)
      .filter(row => {
        if (verTodasEmpresas) {
          return true; // No aplicar filtro de empresa para roles con acceso total
        }
        return String(row[columnas['ID_Empresa']]) === String(usuarioData.empresaId);
      })
      .map(row => ({
        id_pedido: row[columnas['ID_Pedido']],
        fecha_cotizacion: row[columnas['Fecha_Cotizacion']] ? 
          new Date(row[columnas['Fecha_Cotizacion']]).toLocaleDateString() : '',
        items_cotizados: row[columnas['Items_Cotizados']],
        subtotal: row[columnas['Subtotal']] || 0,
        igv: row[columnas['IGV']] || 0,
        total: row[columnas['Total']] || 0,
        estado: row[columnas['Estado']] || 'Pendiente',
        nombre_usuario: row[columnas['Nombre_Usuario']]
      }));

    console.log(`Se encontraron ${cotizaciones.length} cotizaciones después del filtrado`);

    return {
      error: false,
      data: cotizaciones
    };

  } catch (error) {
    console.error('Error en obtenerCotizaciones:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}
function actualizarEstadoCotizacion(id, estado) {
  try {
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheetCotizaciones = ss.getSheetByName('Cotizaciones');
    const data = sheetCotizaciones.getDataRange().getValues();
    
    // Actualizar estado en todas las filas con el mismo ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheetCotizaciones.getRange(i + 1, 16).setValue(estado);
      }
    }
    
    // Actualizar hoja de seguimiento
    const sheetSeguimiento = ss.getSheetByName('Seguimiento');
    const seguimientoData = {
      id: id,
      fecha: new Date(),
      estado: estado
    };
    
    // Agregar registro en la hoja de seguimiento
    sheetSeguimiento.appendRow([
      seguimientoData.id,
      seguimientoData.fecha,
      '',  // Cliente (se puede agregar si es necesario)
      '',  // Solicitante
      '',  // Total
      seguimientoData.estado,
      new Date()  // Última actualización
    ]);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    throw new Error('Error al actualizar el estado de la cotización');
  }
}

// Agregar al Code.gs existente
function validarUsuario(usuario, password) {
  try {
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheetUsuarios = ss.getSheetByName('usuarios');
    const data = sheetUsuarios.getDataRange().getValues();
    
    // Omitir la fila de headers
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === usuario && data[i][1] === password) {
        return {
          success: true,
          usuario: {
            usuario: data[i][0],
            nombre: data[i][2],
            rol: data[i][3]
          }
        };
      }
    }
    
    return { success: false, message: 'Usuario o contraseña incorrectos' };
    
  } catch (error) {
    console.error('Error al validar usuario:', error);
    return { error: true, message: error.toString() };
  }
}

function obtenerPedidos(e) {
  try {
    console.log('Iniciando obtenerPedidos');
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    console.log('Datos de usuario recibidos:', usuarioData);

    // Verificar si puede ver todas las empresas según el rol
    const verTodasEmpresas = ['Administrador', 'Cotizador'].includes(usuarioData.rol);
    console.log('¿Puede ver todas las empresas?:', verTodasEmpresas);

    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('registros');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Obtener índices de las columnas
    const columnas = {
      'ID': headers.indexOf('ID'),
      'Fecha': headers.indexOf('Fecha'),
      'Nombre_Usuario': headers.indexOf('Nombre_Usuario'),
      'ID_Empresa': headers.indexOf('ID_Empresa'),
      'Estado': headers.indexOf('Estado')
    };

    console.log('Total registros antes de filtrar:', data.length - 1);

    // Filtrar y mapear los pedidos
    const pedidos = data.slice(1)
      .filter(row => {
        // Si el usuario puede ver todas las empresas, no aplicar filtro de empresa
        if (verTodasEmpresas) {
          return true;
        }
        // Si no, filtrar por empresa del usuario
        return String(row[columnas['ID_Empresa']]) === String(usuarioData.empresaId);
      })
      .map(row => ({
        id: row[columnas['ID']],
        fecha: row[columnas['Fecha']] instanceof Date ? 
          row[columnas['Fecha']].toLocaleDateString() : 
          new Date(row[columnas['Fecha']]).toLocaleDateString(),
        nombre_usuario: row[columnas['Nombre_Usuario']],
        estado: row[columnas['Estado']] || 'Pendiente'
      }));

    console.log(`Se encontraron ${pedidos.length} pedidos después del filtrado`);
    console.log('Filtro aplicado:', verTodasEmpresas ? 'Sin filtro de empresa' : `Filtrado por empresa: ${usuarioData.empresaId}`);

    return {
      error: false,
      data: pedidos
    };

  } catch (error) {
    console.error('Error en obtenerPedidos:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function obtenerPedido(e) {
  try {
    console.log('Iniciando obtenerPedido');
    const id = e.parameter.id;
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    
    console.log('Buscando pedido:', {
      id: id,
      usuarioData: usuarioData
    });

    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    
    // Primero buscar en la hoja de registros (pedidos nuevos)
    const sheetRegistros = ss.getSheetByName('registros');
    const dataRegistros = sheetRegistros.getDataRange().getValues();
    const headersRegistros = dataRegistros[0];

    // Obtener índices para la hoja de registros
    const indicesRegistros = {
      'ID': headersRegistros.indexOf('ID'),
      'Fecha': headersRegistros.indexOf('Fecha'),
      'ID_Usuario': headersRegistros.indexOf('ID_Usuario'),
      'Nombre_Usuario': headersRegistros.indexOf('Nombre_Usuario'),
      'ID_Empresa': headersRegistros.indexOf('ID_Empresa'),
      'Nombre_Empresa': headersRegistros.indexOf('Nombre_Empresa'),
      'Unidad': headersRegistros.indexOf('Unidad'),
      'Punto_Entrega': headersRegistros.indexOf('Punto_Entrega'),
      'Detalles': headersRegistros.indexOf('Detalles'),
      'Estado': headersRegistros.indexOf('Estado'),
      'Items': headersRegistros.indexOf('Items')
    };

    // Buscar el pedido en la hoja de registros
    let pedido = null;
    for (let i = 1; i < dataRegistros.length; i++) {
      const row = dataRegistros[i];
      if (String(row[indicesRegistros['ID']]) === String(id)) {
        pedido = {
          id: row[indicesRegistros['ID']],
          fecha: row[indicesRegistros['Fecha']] instanceof Date ? 
            row[indicesRegistros['Fecha']].toLocaleDateString() : 
            new Date(row[indicesRegistros['Fecha']]).toLocaleDateString(),
          id_usuario: row[indicesRegistros['ID_Usuario']],
          nombre_usuario: row[indicesRegistros['Nombre_Usuario']],
          id_empresa: row[indicesRegistros['ID_Empresa']],
          nombre_empresa: row[indicesRegistros['Nombre_Empresa']],
          unidad: row[indicesRegistros['Unidad']],
          punto_entrega: row[indicesRegistros['Punto_Entrega']],
          detalles: row[indicesRegistros['Detalles']],
          estado: row[indicesRegistros['Estado']],
          items: JSON.parse(row[indicesRegistros['Items']] || '[]')
        };
        break;
      }
    }

    console.log('Pedido encontrado:', pedido);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    return {
      error: false,
      data: pedido
    };

  } catch (error) {
    console.error('Error en obtenerPedido:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function actualizarPedido(e) {
  try {
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    const datos = JSON.parse(e.parameter.datos);
    
    console.log('Datos recibidos:', datos);
    console.log('Usuario data:', usuarioData);

    // Verificar rol de aprobador
    if (usuarioData.rol !== 'Aprobador') {
      throw new Error('No tiene permisos para actualizar pedidos');
    }

    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('Registros');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Encontrar índices de columnas
    const idIndex = headers.indexOf('ID');
    const unidadIndex = headers.indexOf('Unidad');
    const puntoEntregaIndex = headers.indexOf('Punto_Entrega');
    const detallesIndex = headers.indexOf('Detalles');
    const itemsIndex = headers.indexOf('Items');
    const empresaIdIndex = headers.indexOf('ID_Empresa');

    console.log('Buscando pedido con ID:', datos.id);
    console.log('Índices:', {
      id: idIndex,
      unidad: unidadIndex,
      puntoEntrega: puntoEntregaIndex,
      detalles: detallesIndex,
      items: itemsIndex,
      empresaId: empresaIdIndex
    });

    // Encontrar la fila del pedido
    let rowIndex = -1;
    data.forEach((row, index) => {
      const rowId = String(row[idIndex]); // Convertir a string para comparación
      const searchId = String(datos.id);
      console.log(`Comparando ID ${rowId} con ${searchId}`);
      if (rowId === searchId) {
        rowIndex = index;
        console.log('Pedido encontrado en fila:', index);
      }
    });

    if (rowIndex === -1) {
      console.log('No se encontró el pedido con ID:', datos.id);
      throw new Error('Pedido no encontrado');
    }

    // Verificar que el usuario tenga acceso a este pedido
    const empresaIdPedido = String(data[rowIndex][empresaIdIndex]);
    const empresaIdUsuario = String(usuarioData.empresaId);
    console.log('Comparando empresas:', empresaIdPedido, 'con', empresaIdUsuario);

    if (empresaIdPedido !== empresaIdUsuario) {
      throw new Error('No tiene acceso a este pedido');
    }

    // Actualizar los datos
    const row = data[rowIndex];
    row[unidadIndex] = datos.unidad;
    row[puntoEntregaIndex] = datos.punto_entrega;
    row[detallesIndex] = datos.detalles;
    row[itemsIndex] = JSON.stringify(datos.items);

    console.log('Datos actualizados:', row);

    // Guardar los cambios
    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);

    // Registrar el cambio en el historial si existe
    if (ss.getSheetByName('Historial')) {
      const historialSheet = ss.getSheetByName('Historial');
      historialSheet.appendRow([
        new Date(),
        datos.id,
        usuarioData.usuario,
        'Actualización',
        JSON.stringify({
          unidad: datos.unidad,
          punto_entrega: datos.punto_entrega,
          detalles: datos.detalles,
          items: datos.items
        })
      ]);
    }

    return {
      error: false,
      message: 'Pedido actualizado exitosamente'
    };

  } catch (error) {
    console.error('Error en actualizarPedido:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function actualizarEstadoPedido(e) {
  try {
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    const datos = JSON.parse(e.parameter.datos);
    
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheetRegistros = ss.getSheetByName('Registros');
    const dataRegistros = sheetRegistros.getDataRange().getValues();
    const headers = dataRegistros[0];
    
    // Encontrar índices
    const idIndex = headers.indexOf('ID');
    const estadoIndex = headers.indexOf('Estado');

    // Encontrar la fila del pedido
    let rowIndex = -1;
    dataRegistros.forEach((row, index) => {
      if (String(row[idIndex]) === String(datos.id)) {
        rowIndex = index;
      }
    });

    if (rowIndex === -1) {
      throw new Error('Pedido no encontrado');
    }

    // Actualizar estado
    const row = dataRegistros[rowIndex];
    row[estadoIndex] = datos.estado;

    // Guardar cambios en Registros
    sheetRegistros.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);

    // Si el estado es "Aprobado", copiar a Pedidos_Aprobados
    if (datos.estado === 'Aprobado') {
      const sheetAprobados = ss.getSheetByName('Pedidos_Aprobados');
      const headersAprobados = sheetAprobados.getRange(1, 1, 1, sheetAprobados.getLastColumn()).getValues()[0];
      
      // Crear nuevo registro manteniendo el orden de las columnas
      const nuevoRegistro = headersAprobados.map(header => {
        const indexEnRegistros = headers.indexOf(header);
        return indexEnRegistros !== -1 ? row[indexEnRegistros] : '';
      });

      sheetAprobados.appendRow(nuevoRegistro);
    }

    return {
      error: false,
      message: 'Estado actualizado exitosamente'
    };

  } catch (error) {
    console.error('Error en actualizarEstadoPedido:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function obtenerAprobados(e) {
  try {
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    console.log('Datos de usuario recibidos:', usuarioData);

    // Verificar el rol y acceso
    const rol = usuarioData.rol;
    const verTodasEmpresas = rol === 'Cotizador' || rol === 'Administrador';
    
    console.log('Análisis de permisos:', {
      rol: rol,
      verTodasEmpresas: verTodasEmpresas,
      empresaId: usuarioData.empresaId
    });

    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('Pedidos_Aprobados');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    console.log('Headers:', headers);
    console.log('Total de registros encontrados:', data.length - 1);

    // Obtener índices de las columnas necesarias
    const idIndex = headers.indexOf('ID');
    const fechaIndex = headers.indexOf('Fecha');
    const nombreEmpresaIndex = headers.indexOf('Nombre_Empresa');
    const empresaIdIndex = headers.indexOf('ID_Empresa');
    const estadoIndex = headers.indexOf('Estado');

    console.log('Índices encontrados:', {
      idIndex,
      fechaIndex,
      nombreEmpresaIndex,
      empresaIdIndex,
      estadoIndex
    });

    // Filtrar registros
    const pedidosAprobados = data.slice(1)
      .filter(row => {
        // Primero verificar que el estado sea 'Aprobado'
        const estaAprobado = row[estadoIndex] === 'Aprobado';
        
        if (!estaAprobado) {
          console.log('Registro descartado por estado:', row[estadoIndex]);
          return false;
        }

        // Si el usuario puede ver todas las empresas, incluir el registro
        if (verTodasEmpresas) {
          console.log('Incluyendo registro (acceso total):', row[idIndex]);
          return true;
        }
        
        // Si no, verificar que coincida la empresa
        const coincideEmpresa = String(row[empresaIdIndex]) === String(usuarioData.empresaId);
        console.log('Evaluando registro:', {
          id: row[idIndex],
          empresaRegistro: row[empresaIdIndex],
          empresaUsuario: usuarioData.empresaId,
          coincide: coincideEmpresa
        });
        
        return coincideEmpresa;
      })
      .map(row => {
        // Formatear la fecha
        const fecha = row[fechaIndex];
        const fechaFormateada = fecha instanceof Date ? 
            Utilities.formatDate(fecha, Session.getScriptTimeZone(), "dd/MM/yyyy") :
            new Date(fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

        return {
          id: row[idIndex],
          fecha: fechaFormateada,
          nombre_empresa: row[nombreEmpresaIndex]
        };
      });

    console.log(`Resultados finales: ${pedidosAprobados.length} pedidos aprobados`);

    return {
      error: false,
      data: pedidosAprobados
    };

  } catch (error) {
    console.error('Error en obtenerAprobados:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function guardarCotizacion(e) {
  try {
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    const datos = JSON.parse(e.parameter.datos);
    
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheetCotizaciones = ss.getSheetByName('Cotizaciones');
    
    // Verificar si ya existe una cotización para este pedido
    const dataCotizaciones = sheetCotizaciones.getDataRange().getValues();
    const headers = dataCotizaciones[0];
    
    const idPedidoIndex = headers.indexOf('ID_Pedido');
    const existeCotizacion = dataCotizaciones.slice(1).some(row => 
      String(row[idPedidoIndex]) === String(datos.id_pedido)
    );
    
    if (existeCotizacion) {
      throw new Error('Ya existe una cotización para este pedido');
    }
    
    // Preparar los datos para guardar
    const nuevaCotizacion = [
      datos.id_pedido,                    // ID_Pedido
      new Date(),                         // Fecha_Cotizacion
      JSON.stringify(datos.items),        // Items_Cotizados (como JSON)
      datos.subtotal,                     // Subtotal
      datos.igv,                          // IGV
      datos.total,                        // Total
      'Pendiente',                        // Estado
      usuarioData.usuario,                // Usuario_Cotizador
      usuarioData.empresaId               // ID_Empresa
    ];
    
    // Agregar la nueva cotización
    sheetCotizaciones.appendRow(nuevaCotizacion);
    
    // Registrar en historial
    if (ss.getSheetByName('Historial')) {
      const historialSheet = ss.getSheetByName('Historial');
      historialSheet.appendRow([
        new Date(),
        datos.id_pedido,
        usuarioData.usuario,
        'Creación de Cotización',
        `Total: ${datos.total}`
      ]);
    }

    return {
      error: false,
      message: 'Cotización guardada exitosamente'
    };

  } catch (error) {
    console.error('Error en guardarCotizacion:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function obtenerDetalleCotizacion(e) {
    try {
        const usuarioData = JSON.parse(e.parameter.usuarioData);
        const idPedido = e.parameter.id;
        
        console.log('Buscando pedido:', {
            idPedido: idPedido,
            usuarioData: usuarioData
        });

        const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
        const sheet = ss.getSheetByName('Pedidos'); // Cambiado a 'Pedidos'
        const data = sheet.getDataRange().getValues();
        const headers = data[0];

        console.log('Headers en la hoja:', headers);

        // Obtener índices para la hoja de Pedidos
        const indices = {
            'ID_Pedido': headers.indexOf('ID_Pedido'),
            'Fecha_Pedido': headers.indexOf('Fecha_Pedido'),
            'Items': headers.indexOf('Items'),
            'Unidad': headers.indexOf('Unidad'),
            'Empresa': headers.indexOf('Empresa'),
            'Estado': headers.indexOf('Estado'),
            'ID_Empresa': headers.indexOf('ID_Empresa')
        };

        console.log('Índices encontrados:', indices);

        // Encontrar el pedido
        const pedido = data.slice(1).find(row => 
            String(row[indices['ID_Pedido']]) === String(idPedido) && 
            String(row[indices['ID_Empresa']]) === String(usuarioData.empresaId)
        );

        if (!pedido) {
            throw new Error('Pedido no encontrado');
        }

        console.log('Pedido encontrado:', pedido);

        // Formatear la fecha
        let fechaFormateada;
        try {
            const fecha = pedido[indices['Fecha_Pedido']];
            fechaFormateada = fecha instanceof Date ? 
                Utilities.formatDate(fecha, Session.getScriptTimeZone(), "dd/MM/yyyy") :
                new Date(fecha).toLocaleDateString('es-PE');
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            fechaFormateada = pedido[indices['Fecha_Pedido']];
        }

        const respuesta = {
            error: false,
            data: {
                id_pedido: pedido[indices['ID_Pedido']],
                fecha_pedido: fechaFormateada,
                items: pedido[indices['Items']],
                unidad: pedido[indices['Unidad']] || 'No especificada',
                empresa: pedido[indices['Empresa']] || 'No especificada',
                estado: pedido[indices['Estado']]
            }
        };

        console.log('Respuesta preparada:', respuesta);
        return respuesta;

    } catch (error) {
        console.error('Error en obtenerDetalleCotizacion:', error);
        return {
            error: true,
            message: error.toString()
        };
    }
}

function actualizarEstadoCotizacion(e) {
  try {
    const usuarioData = JSON.parse(e.parameter.usuarioData);
    const datos = JSON.parse(e.parameter.datos);
    
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('Cotizaciones');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Obtener índices
    const idPedidoIndex = headers.indexOf('ID_Pedido');
    const estadoIndex = headers.indexOf('Estado');
    const empresaIdIndex = headers.indexOf('ID_Empresa');

    // Encontrar la fila de la cotización
    let rowIndex = -1;
    data.forEach((row, index) => {
      if (String(row[idPedidoIndex]) === String(datos.id_pedido) && 
          String(row[empresaIdIndex]) === String(usuarioData.empresaId)) {
        rowIndex = index;
      }
    });

    if (rowIndex === -1) {
      throw new Error('Cotización no encontrada');
    }

    // Actualizar estado
    sheet.getRange(rowIndex + 1, estadoIndex + 1).setValue(datos.estado);

    // Registrar en historial
    if (ss.getSheetByName('Historial')) {
      const historialSheet = ss.getSheetByName('Historial');
      historialSheet.appendRow([
        new Date(),
        datos.id_pedido,
        usuarioData.usuario,
        `Cotización ${datos.estado}`,
        ''
      ]);
    }

    return {
      error: false,
      message: 'Estado actualizado exitosamente'
    };

  } catch (error) {
    console.error('Error en actualizarEstadoCotizacion:', error);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function validarUsuario(usuario, password) {
  try {
    console.log('Iniciando validación de usuario:', usuario);
    console.log('Password recibido:', password);
    
    const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    console.log('Headers encontrados:', headers);

    // Obtener índices de las columnas
    const idIndex = headers.indexOf('ID');
    const usuarioIndex = headers.indexOf('Usuario');
    const passwordIndex = headers.indexOf('Password');
    const nombreIndex = headers.indexOf('Nombre');
    const rolIndex = headers.indexOf('Rol');
    const empresaIndex = headers.indexOf('Empresa');
    const empresaIdIndex = headers.indexOf('ID_Empresa');

    // Log de los índices encontrados
    console.log('Índices de columnas:', {
      ID: idIndex,
      Usuario: usuarioIndex,
      Password: passwordIndex,
      Nombre: nombreIndex,
      Rol: rolIndex,
      Empresa: empresaIndex,
      ID_Empresa: empresaIdIndex
    });

    // Verificar que se encontraron todas las columnas necesarias
    if (idIndex === -1 || usuarioIndex === -1 || passwordIndex === -1) {
      throw new Error('Columnas requeridas no encontradas: ID, Usuario, Password');
    }

    // Mostrar datos de la hoja (sin passwords)
    console.log('Datos en la hoja:');
    data.slice(1).forEach((row, index) => {
      console.log(`Fila ${index + 1}:`, {
        usuario: row[usuarioIndex],
        nombre: row[nombreIndex],
        rol: row[rolIndex],
        empresa: row[empresaIndex]
      });
    });

    // Buscar el usuario
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`Comparando usuario "${usuario}" con "${row[usuarioIndex]}"`);
      
      // Convertir a string y trim para comparación más segura
      const usuarioHoja = String(row[usuarioIndex]).trim();
      const passwordHoja = String(row[passwordIndex]).trim();
      const usuarioInput = String(usuario).trim();
      const passwordInput = String(password).trim();

      if (usuarioHoja === usuarioInput && passwordHoja === passwordInput) {
        console.log('¡Usuario y contraseña coinciden!');
        
        const userData = {
          id: row[idIndex],
          usuario: row[usuarioIndex],    // nombre de usuario para login
          nombre: row[nombreIndex],      // nombre completo
          rol: row[rolIndex],
          empresa: row[empresaIndex],
          empresaId: row[empresaIdIndex]
        };
        
        console.log('Datos del usuario encontrado:', userData);

        return {
          success: true,
          usuario: userData
        };
      }
    }

    console.log('Usuario no encontrado o contraseña incorrecta');
    return {
      success: false,
      message: 'Usuario o contraseña incorrectos'
    };

  } catch (error) {
    console.error('Error en validarUsuario:', error);
    console.error('Stack:', error.stack);
    return {
      error: true,
      message: error.toString()
    };
  }
}

function obtenerCotizacion(e) {
    try {
        const idPedido = e.parameter.id;
        const usuarioData = JSON.parse(e.parameter.usuarioData);
        
        console.log('Buscando cotización:', {
            idPedido: idPedido,
            usuarioData: usuarioData
        });

        const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
        const sheetCotizaciones = ss.getSheetByName('Cotizaciones');
        const sheetPedidos = ss.getSheetByName('Pedidos_Aprobados'); // Agregamos la hoja de pedidos
        
        if (!sheetCotizaciones || !sheetPedidos) {
            throw new Error('No se encontraron las hojas necesarias');
        }

        // Primero obtenemos los datos del pedido
        const dataPedidos = sheetPedidos.getDataRange().getValues();
        const headersPedidos = dataPedidos[0];
        const indicesPedidos = {
            'ID': headersPedidos.indexOf('ID'),
            'Nombre_Usuario': headersPedidos.indexOf('Nombre_Usuario'),
            'Nombre_Empresa': headersPedidos.indexOf('Nombre_Empresa'),
            'Unidad': headersPedidos.indexOf('Unidad')
        };

        const pedido = dataPedidos.slice(1).find(row => 
            String(row[indicesPedidos['ID']]) === String(idPedido)
        );

        // Luego obtenemos los datos de la cotización
        const dataCotizaciones = sheetCotizaciones.getDataRange().getValues();
        const headersCotizaciones = dataCotizaciones[0];
        const indicesCotizaciones = {
            'ID_Pedido': headersCotizaciones.indexOf('ID_Pedido'),
            'Fecha_Cotizacion': headersCotizaciones.indexOf('Fecha_Cotizacion'),
            'ID_Empresa': headersCotizaciones.indexOf('ID_Empresa'),
            'Items_Cotizados': headersCotizaciones.indexOf('Items_Cotizados'), // Cambiado de 'Items' a 'Items_Cotizados'
            'Subtotal': headersCotizaciones.indexOf('Subtotal'),
            'IGV': headersCotizaciones.indexOf('IGV'),
            'Total': headersCotizaciones.indexOf('Total'),
            'Estado': headersCotizaciones.indexOf('Estado')
        };

        const cotizacion = dataCotizaciones.slice(1).find(row => 
            String(row[indicesCotizaciones['ID_Pedido']]) === String(idPedido) &&
            String(row[indicesCotizaciones['ID_Empresa']]) === String(usuarioData.empresaId)
        );

       const respuesta = {
            error: false,
            data: {
                id_pedido: idPedido,
                fecha_cotizacion: cotizacion ? 
                    (cotizacion[indicesCotizaciones['Fecha_Cotizacion']] ? 
                        new Date(cotizacion[indicesCotizaciones['Fecha_Cotizacion']]).toLocaleDateString('es-PE') : 
                        new Date().toLocaleDateString('es-PE')) : 
                    new Date().toLocaleDateString('es-PE'),
                nombre_usuario: pedido ? pedido[indicesPedidos['Nombre_Usuario']] : '-',
                nombre_empresa: pedido ? pedido[indicesPedidos['Nombre_Empresa']] : '-',
                unidad: pedido ? pedido[indicesPedidos['Unidad']] : '-',
                items: cotizacion ? 
                    JSON.parse(cotizacion[indicesCotizaciones['Items_Cotizados']] || '[]') : // Cambiado aquí también
                    [],
                subtotal: cotizacion ? (cotizacion[indicesCotizaciones['Subtotal']] || 0) : 0,
                igv: cotizacion ? (cotizacion[indicesCotizaciones['IGV']] || 0) : 0,
                total: cotizacion ? (cotizacion[indicesCotizaciones['Total']] || 0) : 0,
                estado: cotizacion ? (cotizacion[indicesCotizaciones['Estado']] || 'Pendiente') : 'Pendiente'
            }
        };

        console.log('Respuesta preparada:', respuesta);
        return respuesta;

    } catch (error) {
        console.error('Error en obtenerCotizacion:', error);
        return {
            error: true,
            message: error.toString()
        };
    }
}

function actualizarEstadoCotizacion(e) {
    try {
        // Parsear datos
        const datos = JSON.parse(e.parameter.datos);
        const usuarioData = JSON.parse(e.parameter.usuarioData);
        
        console.log('Datos recibidos para actualización:', {
            datos: datos,
            usuarioData: usuarioData
        });

        // Validar que tenemos todos los campos necesarios
        if (!datos.ID_Pedido || !datos.Estado || !usuarioData.ID_Empresa) {
            throw new Error('Faltan campos requeridos en los datos');
        }

        // Obtener la hoja y los datos
        const ss = SpreadsheetApp.openById('1cMSgdjMOxIRdrUNTWOcHZk8trzChTH9S9SFkTb8ws_o');
        const sheet = ss.getSheetByName('Cotizaciones');
        
        if (!sheet) {
            throw new Error('No se encontró la hoja de Cotizaciones');
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        // Obtener índices
        const indices = {
            'ID_Pedido': headers.indexOf('ID_Pedido'),
            'ID_Empresa': headers.indexOf('ID_Empresa'),
            'Estado': headers.indexOf('Estado')
        };

        // Validar que encontramos todas las columnas
        if (indices.ID_Pedido === -1 || indices.ID_Empresa === -1 || indices.Estado === -1) {
            throw new Error('No se encontraron todas las columnas necesarias');
        }

        // Buscar la fila a actualizar
        let filaEncontrada = -1;
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][indices.ID_Pedido]) === String(datos.ID_Pedido) && 
                String(data[i][indices.ID_Empresa]) === String(usuarioData.ID_Empresa)) {
                filaEncontrada = i;
                break;
            }
        }

        if (filaEncontrada === -1) {
            throw new Error('No se encontró la cotización especificada');
        }

        // Actualizar el estado
        sheet.getRange(filaEncontrada + 1, indices.Estado + 1).setValue(datos.Estado);

        return {
            error: false,
            message: 'Estado actualizado correctamente',
            data: {
                ID_Pedido: datos.ID_Pedido,
                Estado: datos.Estado,
                filaActualizada: filaEncontrada + 1
            }
        };

    } catch (error) {
        console.error('Error en actualizarEstadoCotizacion:', error);
        return {
            error: true,
            message: error.toString()
        };
    }
}

// Función auxiliar para verificar si un rol puede ver todas las empresas
function puedeVerTodasEmpresas(rol) {
    return ['ADMINISTRADOR', 'COTIZADOR'].includes(rol.toUpperCase());
}