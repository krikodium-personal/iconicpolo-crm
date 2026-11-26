/**
 * Dirección pública de una lista de precios: /lista/<nombre>-<código>.
 *
 * El nombre la hace legible y el código la hace imposible de adivinar (si
 * fuera sólo el nombre, alguien podría probar otros y ver listas con
 * descuentos que no se le pasaron). La lista se busca por el código, así que
 * si se renombra, la dirección vieja sigue llevando a la nueva.
 */

/** Sin letras ni números que se confundan entre sí (l/1, o/0). */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
export const LARGO_CODIGO_LISTA = 6;

export function nuevoCodigoLista() {
  const bytes = crypto.getRandomValues(new Uint8Array(LARGO_CODIGO_LISTA));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
}

export function slugDeNombre(nombre: string) {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Lo que va después de /lista/. Sin código (lista vieja), el id. */
export function direccionLista(lista: { id: string; name: string; code?: string }) {
  if (!lista.code) return lista.id;
  const slug = slugDeNombre(lista.name);
  return slug ? `${slug}-${lista.code}` : lista.code;
}

/** El código al final de una dirección, o '' si no tiene la forma de uno. */
export function codigoDeDireccion(direccion: string) {
  const codigo = direccion.slice(direccion.lastIndexOf('-') + 1);
  return codigo.length === LARGO_CODIGO_LISTA && /^[a-z0-9]+$/.test(codigo) ? codigo : '';
}
