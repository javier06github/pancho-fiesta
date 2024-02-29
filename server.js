require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const path = require('path');
const { getProductos, actualizarPrecio } = require('./views/productos');  // Importamos el módulo de productos
const ejs = require('ejs');
const nodemailer = require('nodemailer');

const usuarios = [
    { username: 'dueño', password: 'contraseña123' },
    { username: 'nombreUsuario2', password: 'contraseña2' },
    // Agrega más usuarios según sea necesario
];

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port:587,
     secure: false, // Usar SSL/TLS
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
    },
   
});
module.exports=transporter

module.exports.getProductos = getProductos;

app.get('/actualizar-precios', (req, res) => {
    res.render('actualizar-precios', { productos: getProductos() || [] });
});

app.post('/actualizar-precios', (req, res) => {
    const nuevosPrecios = req.body;

    // Actualizar precios en el módulo de productos
    Object.keys(nuevosPrecios).forEach(id => {
        actualizarPrecio(id, nuevosPrecios[id]);
    });

    // Emitir evento a todas las conexiones para actualizar precios en tiempo real
    io.emit('preciosActualizados', getProductos());

    res.json({ mensaje: 'Precios actualizados con éxito.' });
});

app.post('/enviar-correo', (req, res) => {
    const { productos, nombre, email, telefono } = req.body;

    if (productos && nombre && email && telefono) {
        const mailOptionsCliente = {
            from: 'licrissojavier@gmail.com',
            to: email,
            subject: 'Resumen de tu compra',
            html: generarCorreoHTML(productos, nombre, email, telefono),
        };

        const mailOptionsNegocio = {
            from: 'licrissojavier@gmail.com',
            to: 'licrissojavier@gmail.com',
            subject: `Nuevo pedido en la tienda de cliente: ${nombre}`,
            html: generarCorreoHTML(productos, nombre, email, telefono),
        };

        transporter.sendMail(mailOptionsCliente, (errorCliente, infoCliente) => {
            if (errorCliente) {
                console.error('Error al enviar el correo al cliente:', errorCliente);
                res.status(500).json({ mensaje: 'Error al enviar el resumen de la compra al cliente.' });
            } else {
                console.log('Correo al cliente enviado con éxito:', infoCliente.response);

                transporter.sendMail(mailOptionsNegocio, (errorNegocio, infoNegocio) => {
                    if (errorNegocio) {
                        console.error('Error al enviar el correo al negocio:', errorNegocio);
                        res.status(500).json({ mensaje: 'Error al procesar el pedido.' });
                    } else {
                        console.log('Correo al negocio enviado con éxito:', infoNegocio.response);
                        res.json({ mensaje: 'Pedido recibido con éxito.' });
                    }
                });
            }
        });
    } else {
        res.status(400).json({ mensaje: 'Faltan datos del cliente o productos.' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        const usuario = usuarios.find(user => user.username === username && user.password === password);

        if (usuario) {
            res.redirect('/actualizar-precios');
        } else {
            res.render('login', { mensaje: 'Usuario o contraseña incorrectos' });
        }
    } else {
        res.status(400).json({ mensaje: 'Faltan datos del usuario.' });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { mensaje: '' });
});

function generarCorreoHTML(productosCarrito, nombreCliente, emailCliente, telefonoCliente) {
    let resumenHTML = `
        <h2>Resumen de la Compra</h2>
        <p>Cliente: ${nombreCliente}</p>
        <p>Correo Electrónico: ${emailCliente}</p>
        <p>Teléfono: ${telefonoCliente}</p>
        <table style="width:100%; border-collapse: collapse; border: 1px solid #ddd; text-align: left;">
            <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ddd;">Artículo</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Descripción</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Cantidad</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Valor por Artículo</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Total por Artículo</th>
            </tr>
    `;
    let totalCompra = 0;

    productosCarrito.forEach((producto) => {
        const totalPorArticulo = producto.precio * producto.cantidad;
        totalCompra += totalPorArticulo;

        resumenHTML += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${producto.nombre}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${producto.descripcion}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${producto.cantidad}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">$${producto.precio.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">$${totalPorArticulo.toFixed(2)}</td>
            </tr>
        `;
    });

    resumenHTML += `
        <tr>
            <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total de la Compra:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${totalCompra.toFixed(2)}</td>
        </tr>
    </table>
    `;

    return resumenHTML;
}



// Manejar conexiones Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    // Enviar la lista de productos al cliente cuando se conecta
    socket.emit('productosObtenidos', getProductos());

    // Manejar la actualización de precios desde el cliente
    socket.on('actualizarPrecio', ({ id, nuevoPrecio }) => {
        actualizarPrecio(id, nuevoPrecio);

        // Emitir evento 'preciosActualizados' después de actualizar precios
        io.emit('preciosActualizados', getProductos());
    });
});

const PORT =process.env.PORT 

// Iniciar el servidor en el puerto 3000
http.listen(PORT,function ()  {
    console.log('Servidor escuchando en el puerto 3000')
});