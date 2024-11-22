const API_URL = 'https://script.google.com/macros/s/AKfycbzIdrtFkXtAw7vKFo5SxFfzvda67ee5cWe7qqYym6vG/dev';

function login(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    
    if (!usuario || !password) {
        alert('Por favor complete todos los campos');
        return;
    }

    const script = document.createElement('script');
    const callbackName = 'loginCallback_' + Math.round(100000 * Math.random());
    
    window[callbackName] = function(response) {
        delete window[callbackName];
        document.body.removeChild(script);
        
        console.log('Respuesta del servidor:', response); // Debug
        
        if (response.error) {
            alert(response.message);
            return;
        }
        
        if (response.success) {
            // Asegurarnos de que tenemos todos los datos necesarios
            if (!response.usuario) {
                console.error('Respuesta sin datos de usuario:', response);
                alert('Error: Respuesta del servidor incompleta');
                return;
            }

            const userData = {
                id: response.usuario.id,
                nombre: response.usuario.nombre,        // Cambiamos 'usuario' por 'nombre'
                usuario: response.usuario.usuario,      // Este será el nombre de usuario
                rol: response.usuario.rol,
                empresa: response.usuario.empresa,
                empresaId: response.usuario.empresaId
            };
            
            console.log('Datos a guardar en sessionStorage:', userData); // Debug
            
            // Guardar en sessionStorage
            sessionStorage.setItem('usuario', JSON.stringify(userData));
            
            // También guardar empresaId en localStorage si es necesario
            if (userData.empresaId) {
                localStorage.setItem('empresaId', userData.empresaId);
            }
            
            window.location.href = 'dashboard.html';
        } else {
            alert('Usuario o contraseña incorrectos');
        }
    };
    
    const params = new URLSearchParams({
        action: 'login',
        callback: callbackName,
        usuario: usuario,
        password: password
    });
    
    script.src = `${API_URL}?${params.toString()}`;
    document.body.appendChild(script);
}