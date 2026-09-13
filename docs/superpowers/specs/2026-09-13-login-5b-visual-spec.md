# `5b` Ingreso y registro — spec visual

Fecha: 13 de septiembre de 2026.
Fuente: dos capturas de Claude Design entregadas por el dueño del producto, que **fijan la
pantalla al pixel**. Este documento las transcribe porque las imágenes no sobreviven a la
sesión. Manda sobre la descripción en prosa de `design_handoff_jirens_redesign/README.md`
§6.11 donde haya diferencia; la paleta y la tipografía siguen siendo las de §3.

Se implementa en la **fase 8** del plan de rediseño, sobre `src/pages/LoginPage.tsx`
(la página ya alterna ingreso ⇄ registro en un solo componente, que es lo que el diseño pide).

---

## Común a las dos pantallas

- **Fondo de pantalla completa: `ink`.** No hay mitad clara: la tarjeta `paper` flota sobre
  tinta y la tinta llega hasta abajo de todo.
- Margen lateral **20px**. La tarjeta ocupa el ancho entre márgenes.
- **Tarjeta `paper`, radio 24px**, padding ~20px, separación de 12px entre sus bloques.
- El marco de iPhone y la barra de estado ("9:41", batería) son cromo de la maqueta. No se
  implementan.

### El patrón de campo (label adentro de la caja)

Es el elemento nuevo que más se repite y **no estaba descrito en el README**. Conviene
extraerlo como componente reutilizable (lo va a necesitar también el alta de gasto):

```
┌─────────────────────────────────┐
│ MAIL                            │  ← label 700 10.5px, .13em, uppercase, muted-2
│ fran@jirens.app                 │  ← valor ink ~16px
└─────────────────────────────────┘
```

- Caja `surface` (blanca), borde `line-strong` 1px, radio 12px, alto ~72px, padding 12–14px.
- **Foco: borde `ink` de 2px** — no `brand`. (En la captura de ingreso, el campo de
  contraseña está enfocado y se ve así.)
- Un campo puede llevar una **acción a la derecha** ("Ver" en contraseña, alineada al centro
  vertical de la caja, ~13px, `ink`).
- Un campo puede llevar una **aclaración inline junto al label**, en minúscula y `muted-2`:
  `CELULAR  opcional · para avisos por WhatsApp`.

---

## Pantalla de ingreso

De arriba a abajo, sobre tinta:

1. **Logo monolínea** (§9 del README), trazo `paper`, ~40px de alto, alineado al margen
   izquierdo. El punto y las dos líneas de acento van en `brand`.
2. **Título** en Instrument Serif, `paper`, 34px/1.15, en **dos líneas con corte explícito**:
   `Las cuentas` / `de la casa, claras.`
3. **Línea de apoyo**, ~15px/1.5, `muted-on-dark`:
   `Gastos compartidos, tu plata personal y quién le debe a quién — en un solo lugar.`
4. **Tarjeta `paper`** con, en orden:
   - **`Seguir con Google`** — botón `surface` de ancho completo, alto ~56px, radio 12px,
     borde `line-strong`; logo real de Google de 4 colores a 20px + texto `ink` 600 15px.
     Sigue siendo mock (no hay OAuth en el backend); decisión ya tomada.
   - **Separador** `O CON TU MAIL` — 600 11px, `.14em`, uppercase, `muted-2`, con hairline
     `line-strong` a cada lado.
   - Campo **`MAIL`**.
   - Campo **`CONTRASEÑA`** con la acción **`Ver`** a la derecha.
   - **`Entrar`** — botón `brand` de ancho completo, alto ~56px, radio 12px, texto blanco
     700 15px.
   - Pie: `¿Primera vez?` en `muted-1` + **`Creá tu cuenta`** en `brand-ink` 700.

## Pantalla de registro

1. **Barra superior**: `‹ Entrar` a la izquierda (`muted-on-dark`, ~14px) y el logo chico
   (~28px) a la derecha.
2. **Título** serif `paper` ~30px: `Creá tu cuenta`.
3. **Apoyo** `muted-on-dark`: `Después te sumás a un grupo con un link, o armás el tuyo.`
4. **Tarjeta `paper`**:
   - `CÓMO TE LLAMAMOS`
   - `MAIL`
   - `CELULAR` + aclaración inline `opcional · para avisos por WhatsApp`
   - **Dos columnas**: `CONTRASEÑA` y `REPETIR`
   - **`Crear cuenta`** — botón `brand` de ancho completo.
5. **Aviso de iOS, por fuera de la tarjeta**, sobre la tinta: caja de radio ~16px,
   fondo `rgba(255,255,255,.05)`, borde `rgba(255,255,255,.08)`, padding 14px.
   A la izquierda un círculo de 32px con fondo `brand` tenue y una flecha hacia abajo en
   `brand-soft`. Texto `muted-on-dark` 13px/1.45:
   `En iPhone, agregá Jirens a la pantalla de inicio: es la única forma de recibir avisos.`
   + **`Cómo se hace`** en `brand-soft` 700.

---

## Lo que no se puede perder al reescribir la pantalla (§7 + código actual)

- El redirect `?next=` **sólo same-origin** (`LoginPage.tsx`: `startsWith('/')` y
  `!startsWith('//')`).
- El **aviso de conexión lenta a los 5 segundos**.
- El **mensaje de credenciales inválidas** (`auth.invalidCredentials`).
- El **toggle de ver contraseña**, que pasa de ícono de ojo a la acción textual `Ver`.
- Todo el copy nuevo va a `es.json` / `en.json`. El de arriba es el literal de `es.json`.
