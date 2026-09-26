# Barra inferior: se sacó el colapso al scrollear (decisión pendiente)

Fecha: 26 de septiembre de 2026. Commit que lo sacó: `ecfb261` (ajuste V7, rama
`redesign/v7-tabbar`).

**Estado: decisión abierta.** El dueño del producto va a elegir si la barra vuelve a achicarse
al scrollear o se queda fija. Hasta entonces queda fija.

## Qué había

Antes de V7, la barra de abajo en mobile era una pastilla centrada con tres íconos (sin nombre)
y el "+" al lado. Al scrollear hacia abajo la pastilla **se achicaba a un solo círculo con la
pestaña activa**, y al scrollear hacia arriba volvía a mostrar las tres. El "+" no se movía.

Cómo funcionaba:

- `ScrollContext` exponía `tabBarCollapsed`. `notifyScroll(scrollTop)`, que llaman todas las
  pantallas desde su contenedor de scroll, lo ponía en `true` al bajar pasados los 60px y en
  `false` al subir o al volver arriba de 60px.
- `FloatingTabBar` leía `tabBarCollapsed`: el padding de la pastilla pasaba de 8px a 4px, el
  espacio entre íconos de 4px a 0, y las pestañas inactivas animaban el ancho a 0 y la opacidad a
  0 (220ms / 200ms) hasta quedar sólo la activa, de 40px.

## Por qué se sacó

V7 dibuja la barra de borde a borde, de 62px, con el nombre debajo de cada ícono y la pestaña
ocupando `flex:1`. Achicar eso a un círculo cambia el ancho de toda la barra y mueve el "+", y el
prototipo ("Barra inferior" en `Jirens - Final violeta.dc.html`) no lo muestra. El addendum
tampoco lo menciona: dice que el comportamiento de pestañas y "+" no cambia, sin hablar del
colapso.

## Cómo volver a ponerlo

La lógica completa está en `main` antes de V7 (`9ee6730`):

```bash
git show 9ee6730:src/contexts/ScrollContext.tsx      # tabBarCollapsed y el umbral de 60px
git show 9ee6730:src/components/layout/FloatingTabBar.tsx   # la animación de la pastilla
```

Con la barra nueva habría que decidir cómo se achica, porque ya no es una pastilla angosta:

1. **Esconder los nombres** al bajar (queda la barra de 62px con sólo íconos, o baja a ~48px).
2. **Achicar al tab activo**, como antes: la pastilla se encoge hacia la izquierda y el "+" queda
   a la derecha, con el hueco en el medio.
3. **Esconder la barra entera** al bajar y mostrarla al subir (como Safari).

`notifyScroll` se sigue llamando desde todas las pantallas, así que volver a exponer un estado de
colapso desde `ScrollContext` no requiere tocar las páginas.
