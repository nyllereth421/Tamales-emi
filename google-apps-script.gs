const SPREADSHEET_ID = "1t4jxP39_mRBDfaPvUVDOB49xhhHQzrkA3yxdMDR_dg8";
const SHEET_NAME = "Registro de Pedidos";
const START_ROW = 4;
const PRECIO_UNITARIO = 6000;

function doGet(e) {
  if (e.parameter && e.parameter.payload) {
    return registrarPedido(e);
  }

  if (e.parameter && e.parameter.test === "1") {
    return registrarPedido({
      parameter: {
        payload: JSON.stringify({
          nombre: "Prueba Registro",
          telefono: "3000000000",
          sabores: [{ sabor: "Cerdo", cantidad: 1 }],
          cantidadTotal: 1,
          termico: "Caliente",
          entrega: "Domicilio",
          fecha: "2026-06-13",
          hora: "12:00",
          direccion: "Direccion de prueba",
          pago: "Efectivo",
          notas: "Prueba desde Apps Script",
          total: 6000
        })
      }
    });
  }

  return responder({
    ok: true,
    message: "El registro de pedidos esta activo."
  });
}

function doPost(e) {
  return registrarPedido(e);
}

function registrarPedido(e) {
  try {
    const pedido = leerPedido(e);
    const sheet = obtenerHojaPedidos();
    const sabores = (pedido.sabores || []).filter((item) => Number(item.cantidad) > 0);
    const fechaPedido = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    let fila = obtenerPrimeraFilaDisponible(sheet);

    sabores.forEach((item) => {
      const cantidad = Number(item.cantidad) || 0;

      sheet.getRange(fila, 1, 1, 14).setValues([[
        fechaPedido,
        pedido.nombre || "",
        pedido.telefono || "",
        item.sabor || "",
        cantidad,
        PRECIO_UNITARIO,
        cantidad * PRECIO_UNITARIO,
        "Pagado",
        "",
        pedido.fecha || "",
        pedido.hora || "",
        pedido.termico || "",
        pedido.direccion || "",
        pedido.notas || ""
      ]]);

      fila++;
    });

    return responder({ ok: true, filasRegistradas: sabores.length });
  } catch (error) {
    return responder({ ok: false, error: error.message });
  }
}

function leerPedido(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  throw new Error("No se recibieron datos del pedido.");
}

function obtenerHojaPedidos() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('No existe la hoja "' + SHEET_NAME + '". Revisa el nombre de la pestana.');
  }

  return sheet;
}

function obtenerPrimeraFilaDisponible(sheet) {
  const maxRows = sheet.getMaxRows();
  const cantidadFilas = Math.max(maxRows - START_ROW + 1, 1);
  const valores = sheet.getRange(START_ROW, 2, cantidadFilas, 4).getValues();

  for (let index = 0; index < valores.length; index++) {
    const cliente = valores[index][0];
    const telefono = valores[index][1];
    const cantidad = valores[index][3];

    if (!cliente && !telefono && !cantidad) {
      return START_ROW + index;
    }
  }

  sheet.insertRowsAfter(maxRows, 1);
  return maxRows + 1;
}

function responder(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}