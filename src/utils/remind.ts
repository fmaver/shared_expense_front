/**
 * Recordar un pago, por el canal que la persona ya usa.
 *
 * No hay endpoint de aviso: la hoja nativa de compartir deja elegir WhatsApp, mensajes o lo que
 * tenga a mano, y donde esa hoja no existe se cae a un link de wa.me con el texto ya escrito.
 * Las dos cosas funcionan hoy y ninguna miente sobre lo que hace. Cuando exista el push, se
 * cambia acá adentro y las pantallas no se enteran.
 *
 * Devuelve `false` si el usuario canceló, para no anotar un aviso que nunca salió.
 */
export async function shareReminder(text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // Cancelar no es un error, pero tampoco es haber avisado.
      return false;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  return true;
}
