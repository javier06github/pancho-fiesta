let carritoProductos = [];

const carrito = document.getElementById('carrito');
const elementos1 = document.getElementById('lista-1');
const lista = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
const enviarPedidoBtn = document.getElementById('enviar-pedido');
const socket = io();

let productosCarrito;
let nombreCliente;
let emailCliente;
let telefonoCliente;

socket.on('productosObtenidos', (productos) => {
    cargarProductosEnSeccion(productos, 0, 8, 'lista-1');
    cargarProductosEnSeccion(productos, 8, 44, 'lista-2');
    cargarProductosEnSeccion(productos, 44, 80, 'lista-3');
    cargarProductosEnSeccion(productos, 80, 107, 'lista-4');
    cargarProductosEnSeccion(productos, 107, 134, 'lista-5');
    cargarProductosEnSeccion(productos, 134, 155, 'lista-6');
    cargarProductosEnSeccion(productos, 155, 176, 'lista-7');
    cargarProductosEnSeccion(productos, 176, 191, 'lista-8');
    cargarProductosEnSeccion(productos, 191, 200, 'lista-9');
    cargarProductosEnSeccion(productos, 200, 202, 'lista-10');

    cargarEventListeners('lista-1');
    cargarEventListeners('lista-2');
    cargarEventListeners('lista-3');
    cargarEventListeners('lista-4');
    cargarEventListeners('lista-5');
    cargarEventListeners('lista-6');
    cargarEventListeners('lista-7');
    cargarEventListeners('lista-8');
    cargarEventListeners('lista-9');
    cargarEventListeners('lista-10');
    
});


function cargarProductosEnSeccion(productos, desde, hasta, idSeccion) {
    const listaProductos = document.getElementById(idSeccion);
    listaProductos.innerHTML = '';

    for (let i = desde; i < hasta && i < productos.length; i++) {
        const producto = productos[i];
        const divBox = document.createElement('div');
        divBox.className = 'box';

        const img = document.createElement('img');
        img.src = producto.imagen;
        img.alt = producto.nombre;

        const divProductTxt = document.createElement('div');
        divProductTxt.className = 'product-txt';

        const h3 = document.createElement('h3');
        h3.textContent = producto.nombre;

        const p1 = document.createElement('p');
        p1.textContent = producto.descripcion;

        const p2 = document.createElement('p');
        p2.className = 'precio';
        p2.id = `precio-producto-${producto.id}`;
        p2.textContent = `$${producto.precio.toFixed(2)}`;

        const a = document.createElement('a');
        a.href = '#';
        a.className = 'agregar-carrito btn-3';
        a.dataset.id = producto.id;
        a.textContent = 'Agregar al carrito';

        divProductTxt.appendChild(h3);
        divProductTxt.appendChild(p1);
        divProductTxt.appendChild(p2);
        divProductTxt.appendChild(a);

        divBox.appendChild(img);
        divBox.appendChild(divProductTxt);

        listaProductos.appendChild(divBox);
    }
}





enviarPedidoBtn.addEventListener('click', async function () {
    // Habilitar el botón de enviar pedido para un nuevo pedido
    enviarPedidoBtn.disabled = false;

    // Pedir nombre, correo electrónico y teléfono
    nombreCliente = prompt('Ingrese su nombre:');
    emailCliente = prompt('Ingrese su correo electrónico:');
    telefonoCliente = prompt('Ingrese su número de teléfono:');

    if (nombreCliente && emailCliente && telefonoCliente) {
        productosCarrito = obtenerProductosCarrito();
        console.log(nombreCliente, emailCliente, telefonoCliente); // Asegúrate de que estos valores estén definidos
        // Mostrar el resumen sin enviar el correo al servidor
        mostrarResumen(productosCarrito, nombreCliente, emailCliente, telefonoCliente);
    } else {
        alert('Debe ingresar su nombre, correo electrónico y teléfono para realizar el pedido.');
        // Habilitar el botón en caso de que el usuario quiera intentarlo de nuevo
        enviarPedidoBtn.disabled = false;
    }
});

function cargarEventListeners(idSeccion) {
    const seccion = document.getElementById(idSeccion);
    seccion.addEventListener('click', function (event) {
        const botonEliminar = event.target.closest('.borrar');

        if (botonEliminar) {
            eliminarElemento(event, botonEliminar);
        } else {
            comprarElemento(event);
        }
    });

    // Seleccionar el icono del carrito
    const iconoCarrito = document.querySelector('#carrito');

    // Añadir evento de clic al icono del carrito
    iconoCarrito.addEventListener('click', function (event) {
        // Alternar la clase carrito-abierto al hacer clic en el icono
        document.querySelector('.submenu').classList.toggle('carrito-abierto');

        // Detener la propagación del evento para evitar que se cierre automáticamente
        event.stopPropagation();
    });

    vaciarCarritoBtn.addEventListener('click', vaciarCarrito);

    // Cerrar el carrito si se hace clic en cualquier parte del documento
    document.addEventListener('click', function () {
        const carritoSubMenu = document.querySelector('.submenu');
        if (carritoSubMenu.classList.contains('carrito-abierto')) {
            carritoSubMenu.classList.remove('carrito-abierto');
        }
    });

    // Evitar que el carrito se cierre al hacer clic dentro del carrito
    document.querySelector('.submenu').addEventListener('click', function (event) {
        event.stopPropagation();
    });
}


    function comprarElemento(e) {
        e.preventDefault();
    
        if (e.target.classList.contains('agregar-carrito')) {
            const elemento = e.target.closest('.box'); // Obtener el contenedor 'box' más cercano
    
            if (elemento) {
                leerDatosElemento(elemento);
            }
        }
    }
    

    function leerDatosElemento(elemento) {
        const infoElemento = {
            imagen: elemento.querySelector('img').src,
            nombre: elemento.querySelector('h3').textContent,
            descripcion: elemento.querySelector('p').textContent,
            precio: parseFloat(elemento.querySelector('.precio').textContent.replace('$', '')),
            id: elemento.querySelector('a').getAttribute('data-id'),
            cantidad: 1,
        };
    
    const existenteIndex = carritoProductos.findIndex((producto) => producto.id === infoElemento.id);

    if (existenteIndex !== -1) {
        carritoProductos[existenteIndex].cantidad++;
        const filaExistente = document.querySelector(`[data-id="${infoElemento.id}"]`);
        filaExistente.children[3].textContent = carritoProductos[existenteIndex].cantidad;
        filaExistente.children[4].textContent = (infoElemento.precio * carritoProductos[existenteIndex].cantidad).toFixed(2) + ' $';
    } else {
        carritoProductos.push(infoElemento);
        insertarCarrito(infoElemento);
    }
    actualizarTotal();
}

function insertarCarrito(elemento) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', elemento.id);
    row.innerHTML = `
       
        <td>
            ${elemento.nombre}
            <p>${elemento.descripcion}</p>
        </td>
        <td>
            ${elemento.precio.toFixed(2)} $
        </td>
        <td>
            <button class="decrementar">-</button>
            <span class="cantidad">${elemento.cantidad}</span>
            <button class="incrementar">+</button>
        </td>
        <td>
            <span class="total">${(elemento.precio * elemento.cantidad).toFixed(2)} $</span>
        </td>
        <td>
            <button class="borrar" data-id="${elemento.id}">&#10006;</button>
        </td>
    `;

    lista.appendChild(row);

    const botonIncrementar = row.querySelector('.incrementar');
    botonIncrementar.addEventListener('click', function () {
        incrementarCantidad(elemento.id);
    });

    const botonDecrementar = row.querySelector('.decrementar');
    botonDecrementar.addEventListener('click', function () {
        decrementarCantidad(elemento.id);
    });

    const botonBorrar = row.querySelector('.borrar');
    botonBorrar.addEventListener('click', function () {
        eliminarElemento(elemento.id);
    });

    actualizarTotal();
}

function incrementarCantidad(id) {
    const index = carritoProductos.findIndex((producto) => producto.id === id);
    if (index !== -1) {
        carritoProductos[index].cantidad++;
        actualizarFila(index);
    }
}

function decrementarCantidad(id) {
    const index = carritoProductos.findIndex((producto) => producto.id === id);
    if (index !== -1 && carritoProductos[index].cantidad > 1) {
        carritoProductos[index].cantidad--;
        actualizarFila(index);
    }
}

function actualizarFila(index) {
    const filaExistente = document.querySelector(`[data-id="${carritoProductos[index].id}"]`);
    filaExistente.querySelector('.cantidad').textContent = carritoProductos[index].cantidad;
    filaExistente.querySelector('.total').textContent = (carritoProductos[index].precio * carritoProductos[index].cantidad).toFixed(2) + ' $';
    actualizarTotal();
}

function actualizarTotal() {
    let totalCompra = 0;
    carritoProductos.forEach((producto) => {
        totalCompra += producto.precio * producto.cantidad;
    });

    document.getElementById('total').textContent = totalCompra.toFixed(2) + ' $';
}

function eliminarElemento(id) {
    const index = carritoProductos.findIndex((producto) => producto.id === id);

    if (index !== -1) {
        const totalProductoEliminado = carritoProductos[index].precio * carritoProductos[index].cantidad;
        carritoProductos.splice(index, 1);

        const filaEliminada = document.querySelector(`[data-id="${id}"]`);
        filaEliminada.remove();

        actualizarTotal(-totalProductoEliminado);
        console.log('Elemento eliminado con éxito');
    } else {
        console.log('Elemento no encontrado en el carrito');
    }
}

function vaciarCarrito() {
    while (lista.firstChild) {
        lista.removeChild(lista.firstChild);
    }
    carritoProductos = [];
    document.getElementById('resumen-popup').style.display = 'none';
    return false;
}

function obtenerProductosCarrito() {
    return carritoProductos;
}

function mostrarResumen(productosCarrito, nombreCliente, emailCliente, telefonoCliente) {
    let resumenHTML = `
        <h2>Resumen de la Compra</h2>
        <p>Cliente: ${nombreCliente}</p>
        <p>Correo Electrónico: ${emailCliente}</p>
        <p>Teléfono: ${telefonoCliente}</p>
        <table style="width:100%">
            <tr>
                <th>Artículo</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Valor por Artículo</th>
                <th>Total por Artículo</th>
            </tr>
    `;
    let totalCompra = 0;

    productosCarrito.forEach((producto) => {
        const totalPorArticulo = producto.precio * producto.cantidad;
        totalCompra += totalPorArticulo;

        resumenHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.descripcion}</td>
                <td>${producto.cantidad}</td>
                <td>$${producto.precio.toFixed(2)}</td>
                <td>$${totalPorArticulo.toFixed(2)}</td>
            </tr>
        `;
    });

    resumenHTML += `
        <tr>
            <td colspan="4" style="text-align:right">Total de la Compra:</td>
            <td>$${totalCompra.toFixed(2)}</td>
        </tr>
    </table>
    `;

    const resumenPopup = document.getElementById('resumen-popup');
    resumenPopup.innerHTML = resumenHTML;
    resumenPopup.style.display = 'block';

    const aceptarCompraBtn = document.getElementById('aceptar-compra-btn');
    if (!aceptarCompraBtn) {
        agregarBotonAceptarCompra(productosCarrito, nombreCliente, emailCliente, telefonoCliente);
    }

    agregarBotonCancelarCompra();
}


function agregarBotonAceptarCompra(productosCarrito, nombreCliente, emailCliente, telefonoCliente) {
    const aceptarCompraBtn = document.createElement('button');
    aceptarCompraBtn.setAttribute('id', 'aceptar-compra-btn');
    aceptarCompraBtn.textContent = 'Aceptar Compra';

    aceptarCompraBtn.addEventListener('click', async function () {
        // Deshabilitar el botón después de hacer clic para evitar múltiples clics
        aceptarCompraBtn.disabled = true;

        // Mostrar mensaje de éxito y vaciar el carrito
        alert('Pedido enviado con éxito. ¡Gracias por su compra!');
        vaciarCarrito();

        // Enviar datos del cliente junto con los productos al servidor
        try {
            const respuestaServidor = await enviarPedidoAlServidor(productosCarrito, {
                nombre: nombreCliente,
                email: emailCliente,
                telefono: telefonoCliente
            });

            alert(respuestaServidor.mensaje);

            // Restablecer el estado de la aplicación para permitir realizar un nuevo pedido
            reiniciarEstado();

        } finally {
            // Asegurémonos de habilitar el botón después de completar la operación.
            aceptarCompraBtn.disabled = false;
        }
    });

    document.getElementById('resumen-popup').appendChild(aceptarCompraBtn);
}

function reiniciarEstado() {
    document.getElementById('resumen-popup').innerHTML = resumenHTML;
    document.getElementById('resumen-popup').style.display = 'block';

    // Habilitar el botón de enviar pedido para permitir un nuevo pedido
    document.getElementById('enviar-pedido').disabled = false;
}


function agregarBotonCancelarCompra() {
    const cancelarCompraBtn = document.createElement('button');
    cancelarCompraBtn.setAttribute('id', 'cancelar-compra-btn');
    cancelarCompraBtn.textContent = 'Cancelar Compra';

    cancelarCompraBtn.addEventListener('click', function () {
        vaciarCarrito();
    });

    document.getElementById('resumen-popup').appendChild(cancelarCompraBtn);
}





async function enviarPedidoAlServidor(productosCarrito, datosCliente) {
    const data = {
        productos: productosCarrito,
        nombre: datosCliente.nombre,
        email: datosCliente.email,
        telefono: datosCliente.telefono,
    };

    console.log('Datos que se envían al servidor:', data);

    try {
        const respuestaServidor = await fetch('https://pancho-fiesta.onrender.com/enviar-correo', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
});

        if (respuestaServidor.ok) {
            console.log('Correo enviado con éxito');
            alert('Pedido enviado con éxito. ¡Gracias por su compra!');
            vaciarCarrito();
        } else {
            console.error('Error al enviar el pedido:', respuestaServidor.statusText);
            alert('Error al enviar el pedido. Por favor, inténtelo de nuevo más tarde.');
        }
    } catch (error) {
        console.error('Error al enviar el pedido:', error);
        alert('Error al enviar el pedido. Por favor, inténtelo de nuevo más tarde.');
    }
}



const formActualizarPrecios = document.querySelector('#form-actualizar-precios');

if (formActualizarPrecios) {
    formActualizarPrecios.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Obtén los nuevos precios del formulario
        const nuevosPrecios = {};
        document.querySelectorAll('[id^="precio-"]').forEach(input => {
            const id = input.id.split('-')[1];
            nuevosPrecios[id] = parseFloat(input.value);
        });

        // Envía los nuevos precios al servidor
        try {
            const respuesta = await fetch('/actualizar-precios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevosPrecios),
            });

            if (respuesta.ok) {
                alert('Precios actualizados con éxito.');
            } else {
                alert('Error al actualizar los precios. Por favor, inténtelo de nuevo.');
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error en la solicitud. Por favor, inténtelo de nuevo.');
        }
    });
}
function cargarProductosEnSeccion(productos, desde, hasta, idSeccion) {
    const listaProductos = document.getElementById(idSeccion);
    listaProductos.innerHTML = '';

    for (let i = desde; i < hasta && i < productos.length; i++) {
        const producto = productos[i];
        const divBox = document.createElement('div');
        divBox.className = 'box';

        const img = document.createElement('img');
        img.src = producto.imagen;
        img.alt = producto.nombre;

        const divProductTxt = document.createElement('div');
        divProductTxt.className = 'product-txt';

        const h3 = document.createElement('h3');
        h3.textContent = producto.nombre;

        const p1 = document.createElement('p');
        p1.textContent = producto.descripcion;

        const p2 = document.createElement('p');
        p2.className = 'precio';
        p2.id = `precio-producto-${producto.id}`;
        p2.textContent = `$${producto.precio.toFixed(2)}`;

        const a = document.createElement('a');
        a.href = '#';
        a.className = 'agregar-carrito btn-3';
        a.dataset.id = producto.id;
        a.textContent = 'Agregar al carrito';

        divProductTxt.appendChild(h3);
        divProductTxt.appendChild(p1);
        divProductTxt.appendChild(p2);
        divProductTxt.appendChild(a);

        divBox.appendChild(img);
        divBox.appendChild(divProductTxt);

        listaProductos.appendChild(divBox);
    }
}
function scrollToSection(id) {
    const section = document.getElementById(id);
    section.scrollIntoView({ behavior: 'smooth' });
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});
document.addEventListener("DOMContentLoaded", function () {
    var scrollTopBtn = document.getElementById("scrollTopBtn");

    window.onscroll = function () {
        scrollFunction();
    };

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollTopBtn.style.display = "block";
        } else {
            scrollTopBtn.style.display = "none";
        }
    }

    scrollTopBtn.onclick = function () {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };
});

function toggleCarrito() {
    var carrito = document.getElementById('carrito');
    carrito.style.display = (carrito.style.display === 'none' || carrito.style.display === '') ? 'block' : 'none';
}
function actualizarFila(index) {
    const filaExistente = document.querySelector(`[data-id="${carritoProductos[index].id}"]`);
    filaExistente.querySelector('.cantidad').textContent = carritoProductos[index].cantidad;
    filaExistente.querySelector('.total').textContent = (carritoProductos[index].precio * carritoProductos[index].cantidad).toFixed(2) + ' $';
    actualizarTotal();
}

function eliminarElemento(id) {
    const index = carritoProductos.findIndex((producto) => producto.id === id);

    if (index !== -1) {
        const totalProductoEliminado = carritoProductos[index].precio * carritoProductos[index].cantidad;
        carritoProductos.splice(index, 1);

        const filaEliminada = document.querySelector(`[data-id="${id}"]`);
        filaEliminada.remove();

        actualizarTotal(-totalProductoEliminado);
        console.log('Elemento eliminado con éxito');
    } else {
        console.log('Elemento no encontrado en el carrito');
    }
    function abrirWhatsApp() {
        window.open("https://wa.me/+5491157136759", "_blank");
        // Reemplaza 'TUNUMERO' con tu número de WhatsApp, incluyendo el código del país.
       
    }
}
