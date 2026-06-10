const PRECIO_UNITARIO = 6000;
const NUMERO_WHATSAPP = "573104852208";

const form = document.getElementById("formPedido");
const cantidadInput = document.getElementById("cantidad");
const saborInput = document.getElementById("sabor");
const fechaInput = document.getElementById("fecha");
const direccionInput = document.getElementById("direccion");
const resumenProducto = document.getElementById("resumenProducto");
const totalPago = document.getElementById("totalPago");
const mensajeError = document.getElementById("mensajeError");

const formatoMoneda = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

function obtenerValorRadio(nombre) {
    const seleccionado = form.querySelector(`input[name="${nombre}"]:checked`);
    return seleccionado ? seleccionado.value : "";
}

function obtenerCantidad() {
    const cantidad = Number.parseInt(cantidadInput.value, 10);
    return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0;
}

function actualizarResumen() {
    const cantidad = obtenerCantidad();
    const sabor = saborInput.value;
    const total = cantidad * PRECIO_UNITARIO;
    const unidad = cantidad === 1 ? "tamal" : "tamales";

    resumenProducto.textContent = `${cantidad || 0} ${unidad} de ${sabor}`;
    totalPago.textContent = formatoMoneda.format(total);
}

function configurarFechaMinima() {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const fechaLocal = new Date(hoy.getTime() - offset * 60 * 1000);
    fechaInput.min = fechaLocal.toISOString().slice(0, 10);
    fechaInput.value = fechaInput.min;
}

function alternarDireccion() {
    const entrega = obtenerValorRadio("entrega");
    const esDomicilio = entrega === "Domicilio";

    direccionInput.required = esDomicilio;
    direccionInput.placeholder = esDomicilio
        ? "Barrio, calle, numero, apartamento o referencia"
        : "Indica quien recoge o alguna referencia";
}

function validarPedido(datos) {
    if (!datos.nombre || !datos.telefono || !datos.fecha || !datos.hora) {
        return "Completa nombre, telefono, fecha y hora para continuar.";
    }

    if (datos.cantidad < 1) {
        return "La cantidad debe ser minimo 1.";
    }

    if (datos.entrega === "Domicilio" && !datos.direccion) {
        return "Escribe la direccion para el domicilio.";
    }

    return "";
}

function leerDatosFormulario() {
    const cantidad = obtenerCantidad();

    return {
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        sabor: saborInput.value,
        cantidad,
        termico: obtenerValorRadio("termico"),
        entrega: obtenerValorRadio("entrega"),
        fecha: fechaInput.value,
        hora: document.getElementById("hora").value,
        direccion: direccionInput.value.trim(),
        pago: document.getElementById("pago").value,
        notas: document.getElementById("notas").value.trim(),
        total: cantidad * PRECIO_UNITARIO
    };
}

function crearMensajeWhatsApp(datos) {
    const direccion = datos.direccion || "No aplica";
    const notas = datos.notas || "Sin observaciones";

    return [
        "*Nuevo pedido de tamales*",
        "",
        `*Cliente:* ${datos.nombre}`,
        `*Telefono:* ${datos.telefono}`,
        "",
        `*Sabor:* ${datos.sabor}`,
        `*Cantidad:* ${datos.cantidad}`,
        `*Presentacion:* ${datos.termico}`,
        `*Precio unitario:* ${formatoMoneda.format(PRECIO_UNITARIO)}`,
        `*Total:* ${formatoMoneda.format(datos.total)}`,
        "",
        `*Entrega:* ${datos.entrega}`,
        `*Fecha:* ${datos.fecha}`,
        `*Hora:* ${datos.hora}`,
        `*Direccion o referencia:* ${direccion}`,
        `*Metodo de pago:* ${datos.pago}`,
        "",
        `*Observaciones:* ${notas}`
    ].join("\n");
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const datos = leerDatosFormulario();
    const error = validarPedido(datos);

    mensajeError.textContent = error;

    if (error) {
        return;
    }

    const mensaje = crearMensajeWhatsApp(datos);
    const whatsappUrl = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

form.addEventListener("reset", () => {
    setTimeout(() => {
        configurarFechaMinima();
        alternarDireccion();
        actualizarResumen();
        mensajeError.textContent = "";
    }, 0);
});

cantidadInput.addEventListener("input", actualizarResumen);
saborInput.addEventListener("change", actualizarResumen);
form.querySelectorAll('input[name="entrega"]').forEach((radio) => {
    radio.addEventListener("change", alternarDireccion);
});

configurarFechaMinima();
alternarDireccion();
actualizarResumen();
