const PRECIO_UNITARIO = 6000;
const NUMERO_WHATSAPP = "573104852208";
const URL_REGISTRO_EXCEL = "https://script.google.com/macros/s/AKfycbyVTcT__XtRo0iekFwxsjUE8S5G5Zfleri7T0uXTqG3D4dmPHzDx45BbXur_LIZ0n9hug/exec";

const form = document.getElementById("formPedido");
const cantidadesSabor = Array.from(document.querySelectorAll(".cantidad-sabor"));
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

function normalizarCantidad(valor) {
    const cantidad = Number.parseInt(valor, 10);
    return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0;
}

function obtenerSaboresPedido() {
    return cantidadesSabor
        .map((input) => ({
            sabor: input.dataset.sabor,
            cantidad: normalizarCantidad(input.value)
        }))
        .filter((item) => item.cantidad > 0);
}

function obtenerCantidadTotal(sabores = obtenerSaboresPedido()) {
    return sabores.reduce((total, item) => total + item.cantidad, 0);
}

function formatearSabores(sabores) {
    if (sabores.length === 0) {
        return "Sin sabores seleccionados";
    }

    return sabores
        .map((item) => {
            const unidad = item.cantidad === 1 ? "tamal" : "tamales";
            return `${item.cantidad} ${unidad} de ${item.sabor}`;
        })
        .join(", ");
}

function actualizarResumen() {
    const sabores = obtenerSaboresPedido();
    const cantidad = obtenerCantidadTotal(sabores);
    const total = cantidad * PRECIO_UNITARIO;

    resumenProducto.textContent = formatearSabores(sabores);
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

    if (datos.cantidadTotal < 1) {
        return "Agrega al menos 1 tamal en cualquier sabor.";
    }

    if (datos.entrega === "Domicilio" && !datos.direccion) {
        return "Escribe la direccion para el domicilio.";
    }

    return "";
}

function leerDatosFormulario() {
    const sabores = obtenerSaboresPedido();
    const cantidadTotal = obtenerCantidadTotal(sabores);

    return {
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        sabores,
        cantidadTotal,
        termico: obtenerValorRadio("termico"),
        entrega: obtenerValorRadio("entrega"),
        fecha: fechaInput.value,
        hora: document.getElementById("hora").value,
        direccion: direccionInput.value.trim(),
        pago: document.getElementById("pago").value,
        notas: document.getElementById("notas").value.trim(),
        total: cantidadTotal * PRECIO_UNITARIO
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
        "*Sabores:*",
        ...datos.sabores.map((item) => `- ${item.sabor}: ${item.cantidad}`),
        `*Cantidad total:* ${datos.cantidadTotal}`,
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

function guardarPedidoEnExcel(datos) {
    if (!URL_REGISTRO_EXCEL) {
        return Promise.resolve();
    }

    const payload = JSON.stringify(datos);

    // Se remueve navigator.sendBeacon ya que las extensiones bloqueadoras de publicidad (adblockers)
    // interceptan y bloquean sistemáticamente esta API por clasificarla como telemetría (ERR_BLOCKED_BY_CLIENT).
    // Usamos fetch normal con keepalive: true, que corre en segundo plano y tiene mayor compatibilidad.
    return fetch(URL_REGISTRO_EXCEL, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: {
            "Content-Type": "text/plain;charset=UTF-8"
        },
        body: payload
    });
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

    // Abrir WhatsApp inmediatamente en una pestaña nueva
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // Registrar pedido en Excel en segundo plano de manera no bloqueante
    guardarPedidoEnExcel(datos).catch((err) => {
        console.error("Error al registrar en Excel:", err);
    });
});

form.addEventListener("reset", () => {
    setTimeout(() => {
        configurarFechaMinima();
        alternarDireccion();
        actualizarResumen();
        mensajeError.textContent = "";
    }, 0);
});

cantidadesSabor.forEach((input) => {
    input.addEventListener("input", actualizarResumen);
});
form.querySelectorAll('input[name="entrega"]').forEach((radio) => {
    radio.addEventListener("change", alternarDireccion);
});

configurarFechaMinima();
alternarDireccion();
actualizarResumen();