# Revisión del rediseño — deltas contra el diseño

Fecha: 14 de septiembre de 2026.
Fuente: revisión pantalla por pantalla del dueño del producto, con 22 capturas del diseño
comparadas contra lo implementado en `redesign/jirens`. Este documento las transcribe porque
las imágenes no sobreviven a la sesión.

Lo que **no** tiene observaciones: ingreso y registro (`5b`) — quedaron bien.

---

## 0. Transversal

### 0.1 Falta el encabezado de la app
Casi todas las pantallas perdieron la barra superior con **logo a la izquierda y avatar del
usuario a la derecha**. En la fase 9 la escondí en `/groups`, `/personal` y `/profile` para
evitar encabezados duplicados, y me pasé: el diseño sí tiene esa barra mínima, y es la única
forma de llegar al perfil. Hoy al perfil sólo se entra desde el home personal.

**Qué hace falta:** una barra mínima —marca + avatar— en las pantallas que hoy no la tienen,
con el avatar como entrada al perfil.

### 0.2 El selector de mes
El diseño lo dibuja como una **barra ancha** (rectángulo redondeado que ocupa casi todo el
ancho) entre las dos flechas circulares. Hoy es una pastilla compacta. Aplica a todas las
pantallas que muestran mes.

### 0.3 Las pestañas del grupo siguen siendo cinco
Las capturas muestran cuatro (`Gastos · Gente · Números · Ajustes`), pero **están viejas en ese
punto**: Vencimientos **sí es pestaña** y queda como está.

### 0.4 El paginador deja avanzar al futuro
Hoy la flecha `›` se apaga en el mes actual. Se habilita: un gasto en cuotas o una expensa a
crédito caen en meses que todavía no llegaron, y hay que poder ir a verlos.

---

## 1. Selector de grupos (`6e`)

| Hoy | Diseño |
|---|---|
| "Faltan 3 movimientos para quedar en cero" | "Sumando Casa y Bariloche. Dos movimientos y queda todo en cero." — nombra los grupos |
| Tarjeta "Tu plata": label arriba, cifra serif grande, "Disponible este mes", chevron | Fila: ícono cuadrado + "Tu plata" / "Ingresos, gastos y lo que te queda" + cifra **a la derecha en verde**, abreviada (`$530k`) |
| — | Eyebrow **"TUS GRUPOS"** sobre la lista |
| Tarjeta de grupo: nombre, "3 personas · septiembre abierto", saldo | Igual + **"a favor tuyo" / "debés"** debajo del monto, y una **segunda fila separada por línea**: "Último: Supermercado Jumbo · 12 jul" + link **"Saldar"** |
| Archivados: link chico al pie | "2 grupos archivados" a la izquierda + botón **"Ver"** (pastilla con borde) a la derecha |

---

## 2. Home personal (`1a`)

### 2.1 Los movimientos vuelven a ser secciones
La lista unificada que hice en la fase 4 se revierte. Vuelven **tres secciones**, cada una con
punto de color, título serif, total a la derecha, un subtítulo de contexto, ~4–5 filas y un
**"ver más"** al pie:

- **● Entró** · `$2.430.000` · "2 ingresos"
  - `Sueldo` [cada mes] / "Desde marzo 2026" → `$2.280.000` en verde
  - `Freelance landing` / "Extra · 09 jul" → `$150.000` en verde
- **● Gastos míos** · `$300.000` · "9 gastos · $58.000 son fijos"
  - `Spotify` [fijo] / "Suscripciones" → `$8.000`
  - `Carrefour semanal` / "Débito · 12 jul"
  - `Nafta ypf` / "Transporte · 10 jul"
  - `Prepaga` [fijo] / "Salud"
  - Botón de ancho completo **"Ver los 9 gastos"**
- **● Tu parte en grupos** · `$880.000` · "2 grupos · $145.000 a favor en Casa, $75.000 a pagar en Bariloche"
  - Tarjeta por grupo: avatar + nombre + "6 gastos · iguales entre 3" + total + saldo
    (`$665.000` / `+$145.000`), y debajo 3 gastos con su monto, "y 3 más" + link **"Ver Casa"**
  - Bariloche [EVENTO] · "4 gastos · entre 8" · `$215.000` / `−$75.000`

Al pie, la nota que cierra la cuenta: *"Los tres totales cierran contra lo que entró:
$300.000 + $880.000 + $1.250.000 que te quedan = $2.430.000."*

Separador entre el balance y las secciones: **"LO QUE SIGUE, SCROLLEANDO"**.

### 2.2 La tarjeta de balance
- "De **$2.430.000** que entraron." debajo de la cifra (hoy: "$X cuando cobres los $Y").
- La leyenda de la barra son **tres chips con porcentaje**: `● Míos 12%` `● Grupos 36%`
  `● Queda 51%`. Hoy son puntos con montos.

### 2.3 "Para cerrar"
Más compacto que hoy: una línea por grupo — "Te deben $145.000 en Casa / 2 movimientos para
cerrar julio" + botón **"Saldar"**. Hoy es una tarjeta con una fila por persona.

### 2.4 El alta en el grupo personal
Hoy usa la hoja de grupo. Debe ser su propio flujo:

**La matriz `2b`** — "¿Qué anotamos?" / "En tu plata, no en un grupo."
Ejes: columnas `UNA VEZ` / `CADA MES`, filas `SALE` / `ENTRA`. Cuatro celdas:

| | UNA VEZ | CADA MES |
|---|---|---|
| **SALE** | **Gasto** — "Súper, nafta, una cena" | **Fijo** — "Alquiler, Spotify, expensas" |
| **ENTRA** | **Extra** — "Freelance, un bono, un regalo" | **Sueldo** — "Lo que cobrás siempre" |

Nota al pie: *"Lo de la columna derecha se guarda **desde julio** y aparece solo todos los
meses. Lo de la izquierda vive sólo en julio."*

**Hoja de gasto personal** — `X Gasto` + pastilla **"Cambiar"** arriba a la derecha (vuelve a
la matriz). Segmented `Una vez` / `Cada mes · fijo` con su nota. Monto, ARS/USD, descripción,
chips de categoría con **"+5"** para el resto. **Sin pagador ni división.** El contexto va en
**filas dentro de una tarjeta**, no en pastillas: `Cuándo / Hoy · 12 jul ›` y `Pago / Débito ›`.

**Variante fija** — nota "Un gasto fijo no lleva fecha ni cuotas". En vez de fecha y pago, una
tarjeta **"DESDE CUÁNDO"** con "Julio 2026" + "Cambiar" y la explicación. Aviso: *"¿Es una
compra en 6 pagos? Va como Gasto con crédito."* Botón "Guardar gasto fijo".

**Hoja de ingreso** — un solo formulario para extra y sueldo, con segmented
`Una vez · extra` / `Cada mes · sueldo`. Campo "CÓMO SE LLAMA", tarjeta "DESDE CUÁNDO", y una
**caja verde** con la consecuencia: *"Con esto, en julio te va a quedar $1.250.000 después de
gastos."* Sin categoría.

**Duplicado dentro de la hoja** — caja roja "Esto ya está cargado" con la explicación y dos
botones: **"Ver el que ya está"** / **"Guardar igual"**, con el botón principal deshabilitado.

### 2.5 El contexto del alta son filas, no pastillas
Vale **también para el alta de grupo**, que ya está implementada con pastillas: "cuándo" y
"pago" van como **filas dentro de una tarjeta** (`Cuándo / Hoy · 12 jul ›`, `Pago / Débito ›`),
y en grupo se suman pagador y división por el mismo criterio. Los chips de categoría muestran
los primeros y un **`+5`** para el resto, en vez de scroll horizontal. Las teclas del teclado
numérico llevan **borde y fondo de tarjeta**, no planas.

---

## 3. Grupo · Gastos (`3e`)

- **Falta la tarjeta de saldo arriba de todo**: "A favor tuyo" + `+$145.000` en serif verde +
  botones **"Saldar cuentas"** (tinta) y **"Recordar"** (claro). Hoy el saldo se fue a Gente y
  desde Gastos no se ve si tenés a favor o debés.
- El paginador va **debajo** de esa tarjeta.
- "14 gastos en julio" + **"PDF del mes"** como pastilla con borde (hoy es un ícono).
- **La lista se agrupa por día**, con un encabezado de fecha por grupo: `VIERNES 12 JUL`,
  `MARTES 8 JUL`, en `muted-2`, uppercase, con letter-spacing.
- **La fila de gasto** (decidido, corregido): **emoji de categoría** en cuadrado claro —no el
  avatar del pagador—, la parte **en palabras** ("debés $120.000", "te deben $105.000",
  "no participás"), y **badges concretos** en vez del genérico "Reparto": `cada mes`, `3/6`,
  `USD 120`, `40/30/30`, `montos`.
- **El metadato pierde la fecha** (ya la dice el encabezado del día) y queda como
  "quién pagó · un calificador", con esta prioridad:
  1. USD → "al blue 1.485"
  2. crédito → "crédito"
  3. división → "iguales entre 3", "entre 4", "repartido a mano"
  4. porcentaje → nada: el badge `40/30/30` ya lo dice

---

## 4. Grupo · Gente (`3f`)

- Subtítulo del encabezado distinto al de Gastos: **"3 personas · desde marzo 2026"**.
- Tarjeta **"Con 2 pagos queda en cero"** + link **"¿Cómo?"**, y una fila por pago:
  `[G] → [F]  $85.000` + botón **"Listo"**.
- Eyebrow **"INTEGRANTES"**.
- Cada integrante es **su propia tarjeta**: avatar 40px, nombre + badge `vos · admin`,
  "Puso $1.240.000 este mes", saldo a la derecha, y **la barra de aporte abajo de todo**,
  de ancho completo.
- Al pie, la fila punteada "Invitar a alguien más · Link".
- **Conservar el selector de mes.**

---

## 5. Grupo · Números (`3g`)

- Subtítulo del encabezado: **"Julio 2026 · 14 gastos"**.
- En la tarjeta de los 6 meses, **"prom $1.78M"** arriba a la derecha, y las barras **sin
  etiqueta de valor encima**.
- Eyebrow **"EN QUÉ SE FUE"** sobre las categorías, con barra de ancho completo debajo de cada
  fila.
- El diseño **no tiene** los bloques "Gastos por pagador" ni "Débito vs crédito" que conservé.

---

## 6. Grupo · Vencimientos (`5c`)

- **Sigue siendo pestaña** (la captura estaba vieja). El subtítulo es "Te avisamos antes de
  cada uno".
- Botón **"Agregar vencimiento"** naranja, de ancho completo, fijo al pie.
- **El formulario**: "Nuevo vencimiento", campos con label adentro (`QUÉ VENCE`,
  `PRÓXIMA FECHA` con "jueves 9 de octubre"), chips de `CADA CUÁNTO` y `AVISARME`, la
  confirmación en palabras, y "Guardar vencimiento" naranja.

---

## 7. Saldar (`6c`)

- **El plan**: en las tarjetas de pago **no hay botones**; son informativas
  (`[G] → [F]` + "Guada te paga" + "Por súper, internet y sofá" + monto). Las acciones están
  al pie: **"Avisarles a los dos"** (tinta) y **"Marcar pagos uno por uno"** (link).
  **Decidido:** el botón se queda, resuelto con la hoja nativa de compartir — un solo mensaje
  que nombra los dos pagos. No necesita endpoint; cuando exista el push, se cambia por dentro.
- **El progreso es una pantalla propia**, no una hoja: `‹ Casa` + "Saldando julio" +
  "Falta 1 de 2 pagos" + barra. El pago hecho dice **"Hoy 9:36 · lo marcaste vos"**; el
  pendiente, **"Avisado hace 2 días"**. Eyebrow **"MIENTRAS TANTO"** sobre la nota.
- **El mes cerrado vive en la pestaña Gastos**, como tarjeta de tinta — no dentro de una hoja.
  Con "PDF de julio" (brand-soft) y "Reabrir" (borde tenue), la lista apagada con pastilla
  "SALDADO", y al pie: *"En julio no se puede cargar ni editar; «Reabrir» lo habilita. El «+»
  carga en el mes que estés viendo."*

---

## 8. Grupo de evento (`6d`)

- Encabezado: "Bariloche [EVENTO]" + "8 personas · jul 2026" + stack con "+5".
- Tarjeta de saldo: "Debés al viaje" + "$1.640.000 gastados" a la derecha, cifra serif roja,
  y **una frase que explica**: "Casi todo a Guada, que puso la cabaña." Botones
  **"Pagar mi parte"** y **"Ver plan"**.
- "9 gastos del viaje" + "PDF".
- Al pie: "Un evento no tiene meses: el saldo corre hasta que cierren el grupo."

---

## 9. Detalle de gasto (`5a`)

Muy parecido a lo implementado. Diferencias:

- En el grupo de 8, las filas del reparto muestran **la posición neta**, no la parte:
  "Guada · puso todo `+$840.000`", "Fran · vos `−$120.000`", y el encabezado aclara
  "8 personas · $120.000 cada uno".
  **Decidido:** se unifica en **posición neta** para todo tamaño de grupo, con tu fila marcada
  como `vos`. La parte de cada uno se dice en el encabezado de la tarjeta.
- En evento, las dos cajas son **"GASTO"** y **"TU PARTE"** (no "MONTO" / "TE DEBEN"), y la
  tercera celda es **"ESTADO / Sin saldar"**.

---

## 10. Ajustes (`3h`)

Casi igual a lo implementado. Diferencias:

- Subtítulo del encabezado: **"Sos admin de este grupo"**.
- La captura **sí incluye** las filas "División por defecto / Iguales ›" y
  "Moneda / ARS ›" — que se acordó **no** implementar hasta que `Group` tenga los campos.
- "Vencimientos del grupo" muestra **"4 cargados · el próximo, el 9 de octubre"**.
- Archivar y Salir: el botón va **a la derecha de la fila**, no debajo de ancho completo.

---

## 11. Perfil (`6f`)

- Salida **"‹ Volver"** arriba.
- Encabezado: avatar grande + nombre en serif + mail, con botón **"Editar"** a la derecha.
  Los datos dejan de ser un formulario siempre abierto y pasan a **filas compactas**:
  `Celular / Para avisos por WhatsApp → +54 9 11 ··· ›`, `Idioma → Español ›`,
  `Tema` con el segmented **en la misma fila**, `Cambiar contraseña ›`.
- "Cerrar sesión" con borde rojo, de ancho completo.
- Al pie: **"Jirens · versión 2.0"**.

---

## Estado de implementación

La revisión se ejecuta por tandas. Cada tanda cierra con `typecheck:ratchet`, `lint` y `build`
en verde y con el chequeo de §7 del README del handoff.

| Tanda | Alcance | Estado |
|---|---|---|
| A | §0 transversal — encabezado con marca + avatar, paginador ancho, meses futuros | hecho |
| B | §3 Grupo · Gastos — tarjeta de saldo, lista por día, fila con emoji, PDF pastilla | hecho |
| C | §7 Saldar — plan sin botones por fila, progreso como pantalla, mes cerrado en Gastos | hecho |
| D | §2.1–2.3 Home personal — secciones con "ver más", chips de porcentaje, "Para cerrar" | hecho |
| E | §2.4–2.5 Altas — matriz 2×2, hojas dedicadas, contexto en filas, teclado con borde | hecho |
| F | §1, §4, §5, §6, §8, §9, §10, §11 | hecho |

### Notas de la tanda C

- **Quién marcó y cuándo se avisó no existen en el backend.** Un pago marcado *es* el movimiento
  de categoría `prestamo` —no hay campo "lo marcó fulano"— y avisar no tiene endpoint. Las dos
  líneas que pide el diseño ("Hoy 9:36 · lo marcaste vos", "Avisado hace 2 días") salen de
  `src/utils/settleLog.ts`, un registro en `localStorage` de lo que **este dispositivo** hizo, y
  están redactadas como tales: *"le avisaste"*, no *"fue avisado"*. En otro teléfono la línea no
  aparece, que es la verdad. Cuando exista el push, el registro se reemplaza por el dato real.
- **`buildTransferExpense` fecha el pago con el día de hoy.** Marcar en septiembre un pago de
  julio crea un movimiento de septiembre: el saldo de julio no se mueve y el plan no avanza.
  Es anterior a esta tanda y toca semántica de plata, así que queda como está hasta decidirlo.
- **El conteo de la lista incluye los pagos.** "5 gastos en julio" cuenta los dos movimientos de
  `prestamo` además de los tres gastos reales. También es anterior a esta tanda.

### Notas de la tanda D

- **"Desde marzo 2026" en el sueldo no se puede decir con lo que trae el ledger.**
  `IncomeInstanceResponse` tiene `source` y `recurringIncomeId`, pero el `startYear`/`startMonth`
  vive en `RecurringIncomeResponse`, que hoy nadie pide en el home. Se puede agregar
  `listRecurringIncomes()` —el endpoint ya existe— a cambio de un request más por carga. Por
  ahora la fila recurrente lleva sólo el badge `cada mes`, y la puntual dice "Extra".
- **"6 gastos · iguales entre 3" queda en "4 gastos".** `MirroredShareItem` no trae la división
  del gasto original, y salir a buscarla sería un request por grupo.
- **El home ya no marca pagos.** La tarjeta "Para cerrar" pasó a una línea por grupo con un botón
  que abre `/groups/{id}/settle`. La misma acción en dos pantallas era lo que hacía que el home
  pesara media pantalla de saldar; ahora hay un solo lugar donde la plata se marca.
- `MovementsList.tsx` se borró: la cronología unificada de la fase 4 quedó reemplazada por las
  tres secciones.

### Notas de la tanda E

- **Piezas nuevas compartidas por el alta de grupo y la personal**: `ContextRows.tsx` (el
  contexto como filas de una tarjeta), `CategoryChips.tsx` (las primeras + `+N`, sin scroll
  horizontal) y `ContextPickers.tsx` (`PickerOverlay`, `DatePicker`, `PaymentPicker`,
  `StartMonthPicker`). El formulario de grupo perdió su `Pill` y sus dos selectores propios.
- **El "+" de lo personal ya no abre un menú**: abre la matriz. `PersonalAddActions` pasó de
  `{addIncome, addExpense, addRecurringExpense}` a `{openMatrix, pick}`, y los botones de
  escritorio de las secciones llaman `pick('extra')` / `pick('expense')` / `pick('fixed')`.
- **Borrados**: `AddIncomeDialog.tsx` y `AddRecurringExpenseDialog.tsx`, reemplazados por
  `PersonalIncomeSheet.tsx` y la variante fija de `PersonalExpenseSheet.tsx`. El baseline de
  typecheck bajó de 19 a 18 al irse un error preexistente con ellos.
- **Contraste en oscuro**: `bg-positive` y `bg-negative` invierten a colores claros en el tema
  oscuro, así que el texto blanco encima quedaba flojo. Los rellenos semánticos ahora llevan
  `text-white dark:text-ink`. Afectaba también al segmented "Gasto" del alta de grupo y al
  "Ya me pagó" de la pantalla de saldar, que son anteriores a esta tanda.

### Notas de la tanda F

- **No existe el concepto de admin.** Ni `Group` ni `GroupMember` traen rol, así que el subtítulo
  de Ajustes dice "Lo que se puede cambiar del grupo" en vez de "Sos admin de este grupo", y la
  tarjeta de cada integrante lleva sólo el badge `vos`. Si hace falta el rol, es campo nuevo en
  el backend.
- **El subtítulo del encabezado ahora depende de la pestaña** (`GroupLayout`): en Gastos los
  nombres, en Gente "3 personas · desde marzo 2026", en Números el mes, en Vencimientos y
  Ajustes su frase. En Números el diseño pide "Julio 2026 · 14 gastos": el conteo necesitaría
  que el layout pida el mes, que hoy sólo piden las pantallas.
- **"Gastos por pagador" y "Débito vs crédito" se conservan.** El diseño no los dibuja, pero son
  datos que ya existían; quedan debajo de "En qué se fue", en el mismo lenguaje de barras.
- **El idioma usa un segmented igual que el tema**, no un chevrón: con dos opciones, abrir un
  selector para elegir entre dos es un toque de más.
- **`nextOccurrence` salió de `GroupDueDatesPage` a `src/utils/dueDates.ts`**: ahora la usan la
  pantalla de vencimientos y la fila de Ajustes que dice cuándo cae el próximo.
- **El escaneo de ticket también en lo personal** (pedido aparte del §6): la hoja de gasto
  personal llama al mismo `parse-image` apuntado al grupo personal. En la variante fija descarta
  fecha y cuotas, que no aplican.
