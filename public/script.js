let carritoProductos = [];
let cartCount = 0;

const carrito = document.getElementById('carrito');
const lista = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
const enviarPedidoBtn = document.getElementById('enviar-pedido');
const cartCounter = document.getElementById('cart-counter');
const socket = io();

let nombreCliente;
let emailCliente;
let telefonoCliente;

socket.on('productosObtenidos', (productos) => {
    const secciones = [
        { id: 'lista-1', start: 0, end: 4 },
        { id: 'lista-2', start: 4, end: 8 },
        { id: 'lista-3', start: 8, end: 32 },
        { id: 'lista-4', start: 32, end: 56 },
        { id: 'lista-5', start: 56, end: 74 },
        { id: 'lista-6', start: 74, end: 92 },
        { id: 'lista-7', start: 92, end: 105 },
        { id: 'lista-8', start: 106, end: 120 },
        { id: 'lista-9', start: 120, end: 130 },
        { id: 'lista-10', start: 130, end: 136 },
        { id: 'lista-11', start: 136, end: 138 }
    ];

    secciones.forEach(seccion => {
        cargarProductosEnSeccion(productos, seccion.start, seccion.end, seccion.id);
        cargarEventListeners(seccion.id);
    });

    // Forzar redibujo de las secciones de productos
    secciones.forEach(seccion => {
        const listaProductos = document.getElementById(seccion.id);
        listaProductos.style.display = 'none'; // Ocultar temporalmente
        void listaProductos.offsetHeight; // Forzar redibujo
        listaProductos.style.display = 'none'; // Mostrar nuevamente
    });
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
    nombreCliente = prompt('Ingrese su nombre:');
    emailCliente = prompt('Ingrese su correo electrónico:');
    telefonoCliente = prompt('Ingrese su número de teléfono:');

    if (nombreCliente && emailCliente && telefonoCliente) {
        const productosCarrito = obtenerProductosCarrito();
        mostrarResumen(productosCarrito, nombreCliente, emailCliente, telefonoCliente);
    } else {
        alert('Debe ingresar su nombre, correo electrónico y teléfono para realizar el pedido.');
    }
});

function cargarEventListeners(idSeccion) {
    const seccion = document.getElementById(idSeccion);
    seccion.addEventListener('click', function (event) {
        if (event.target.classList.contains('borrar')) {
            eliminarElemento(event.target.dataset.id);
        } else if (event.target.classList.contains('agregar-carrito')) {
            comprarElemento(event);
        }
    });

    vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
    document.querySelector('.submenu').addEventListener('click', function (event) {
        event.stopPropagation();
    });
}

function comprarElemento(e) {
    e.preventDefault();

    if (e.target.classList.contains('agregar-carrito')) {
        const elemento = e.target.closest('.box');

        if (elemento) {
            const infoElemento = leerDatosElemento(elemento);
            agregarAlCarrito(infoElemento);
        }
    }
}

function leerDatosElemento(elemento) {
    const infoElemento = {
        imagen: elemento.querySelector('img').src,
        nombre: elemento.querySelector('h3').textContent,
        descripcion: elemento.querySelector('p').textContent,
        precio: parseFloat(elemento.querySelector('.precio').textContent.replace('$', '')),
        id: elemento.querySelector('a').dataset.id,
        cantidad: 1,
    };

    const existenteIndex = carritoProductos.findIndex((producto) => producto.id === infoElemento.id);

    if (existenteIndex !== -1) {
        carritoProductos[existenteIndex].cantidad++;
        actualizarFila(existenteIndex);
    } else {
        carritoProductos.push(infoElemento);
        insertarCarrito(infoElemento);
    }
    actualizarTotal();
    actualizarContadorCarrito(1);
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
        <td class="total">${(elemento.precio * elemento.cantidad).toFixed(2)} $</td>
        <td>
            <button class="borrar" data-id="${elemento.id}">&#10006;</button>
        </td>
    `;

    lista.appendChild(row);

    row.querySelector('.incrementar').addEventListener('click', function (event) {
        event.stopPropagation();
        incrementarCantidad(elemento.id);
    });

    row.querySelector('.decrementar').addEventListener('click', function (event) {
        event.stopPropagation();
        decrementarCantidad(elemento.id);
    });

    row.querySelector('.borrar').addEventListener('click', function (event) {
        event.stopPropagation();
        eliminarElemento(elemento.id);
    });
}

function incrementarCantidad(id) {
    const index = carritoProductos.findIndex((producto) => producto.id === id);
    if (index !== -1) {
        carritoProductos[index].cantidad++;
        actualizarFila(index);
        actualizarContadorCarrito(1);
    }
}

function decrementarCantidad(id) {
    const index = carritoProductos.findIndex((producto) => producto.id === id);
    if (index !== -1 && carritoProductos[index].cantidad > 1) {
        carritoProductos[index].cantidad--;
        actualizarFila(index);
        actualizarContadorCarrito(-1);
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
        const cantidadEliminada = carritoProductos[index].cantidad;
        carritoProductos.splice(index, 1);

        const filaEliminada = document.querySelector(`[data-id="${id}"]`);
        filaEliminada.remove();

        actualizarTotal();
        actualizarContadorCarrito(-cantidadEliminada);
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
    cartCount = 0;
    cartCounter.textContent = cartCount;
    cartCounter.style.display = 'none';
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

    if (!document.getElementById('aceptar-compra-btn')) {
        agregarBotonAceptarCompra(productosCarrito, nombreCliente, emailCliente, telefonoCliente);
    }

    agregarBotonCancelarCompra();
}

function agregarBotonAceptarCompra(productosCarrito, nombreCliente, emailCliente, telefonoCliente) {
    const aceptarCompraBtn = document.createElement('button');
    aceptarCompraBtn.setAttribute('id', 'aceptar-compra-btn');
    aceptarCompraBtn.textContent = 'Aceptar Compra';

    aceptarCompraBtn.addEventListener('click', async function () {
        aceptarCompraBtn.disabled = true;

        alert('Pedido enviado con éxito. ¡Gracias por su compra!');
        vaciarCarrito();

        try {
            const respuestaServidor = await enviarPedidoAlServidor(productosCarrito, {
                nombre: nombreCliente,
                email: emailCliente,
                telefono: telefonoCliente
            });

            alert(respuestaServidor.mensaje);
            reiniciarEstado();
        } finally {
            aceptarCompraBtn.disabled = false;
        }
    });

    document.getElementById('resumen-popup').appendChild(aceptarCompraBtn);
}

function reiniciarEstado() {
    document.getElementById('resumen-popup').style.display = 'none';
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

function actualizarContadorCarrito(cantidad) {
    cartCount += cantidad;
    cartCounter.textContent = cartCount;
    cartCounter.style.display = cartCount > 0 ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.agregar-carrito').forEach(button => {
        button.addEventListener('click', function() {
            cartCount++;
            cartCounter.textContent = cartCount;
            cartCounter.style.display = 'block';
        });
    });

    vaciarCarritoBtn.addEventListener('click', function() {
        cartCount = 0;
        cartCounter.style.display = 'none';
    });

    enviarPedidoBtn.addEventListener('click', function() {
        // Lógica para enviar el pedido
    });

    const resumenPopup = document.getElementById('resumen-popup');
    const aceptarCompraBtn = document.getElementById('aceptar-compra-btn');

    if (aceptarCompraBtn) {
        aceptarCompraBtn.addEventListener('click', function() {
            resumenPopup.classList.toggle('show');
        });
    }
});

function scrollToSection(id) {
    const section = document.getElementById(id);
    section.scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var scrollTopBtn = document.getElementById("scrollTopBtn");

    window.onscroll = function() {
        scrollFunction();
    };

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollTopBtn.style.display = "block";
        } else {
            scrollTopBtn.style.display = "none";
        }
    }

    scrollTopBtn.onclick = function() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };
});

function toggleCarrito() {
    var carrito = document.getElementById('carrito');
    carrito.style.display = (carrito.style.display === 'none' || carrito.style.display === '') ? 'block' : 'none';
}
