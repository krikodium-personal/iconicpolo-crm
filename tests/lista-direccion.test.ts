import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LARGO_CODIGO_LISTA,
  codigoDeDireccion,
  direccionLista,
  nuevoCodigoLista,
  slugDeNombre,
} from '../lib/lista-direccion.ts';

test('la dirección lleva el nombre legible y el código al final', () => {
  assert.equal(
    direccionLista({ id: 'x', name: 'Friends & Family', code: 'k7p2xq' }),
    'friends-family-k7p2xq',
  );
  assert.equal(slugDeNombre('Organizaciones Ñandú 2027'), 'organizaciones-nandu-2027');
});

test('una lista sin código sigue usando su id', () => {
  assert.equal(direccionLista({ id: 'abc-123', name: 'Vieja', code: '' }), 'abc-123');
});

test('el código se lee del final de la dirección, sea cual sea el nombre', () => {
  assert.equal(codigoDeDireccion('organizaciones-k7p2xq'), 'k7p2xq');
  assert.equal(codigoDeDireccion('otro-nombre-k7p2xq'), 'k7p2xq');
  assert.equal(codigoDeDireccion('5cfd4da4-46cd-49db-998d-984b1c2c2880'), '');
});

test('los códigos nuevos tienen el largo y el alfabeto esperados', () => {
  const codigo = nuevoCodigoLista();
  assert.equal(codigo.length, LARGO_CODIGO_LISTA);
  assert.match(codigo, /^[a-hj-km-np-z2-9]+$/);
});
