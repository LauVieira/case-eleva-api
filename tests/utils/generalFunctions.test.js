/* global it, describe, expect */

const generalFunctions = require('../../src/utils/generalFunctions');

describe('sanitiseObj - function created to use the lib strip-html with any known/unknown object', () => {
  it('It should return the same object', () => {
    const obj = {
      id: 1,
      secretKey: 'uuid_gerado_aleatoriamente',
      status: 'whitePlay',
    };

    const expected = generalFunctions.sanitiseObj(obj);
    expect(expected).toEqual(obj);
  });

  it('It should return the same object, without modifying the array inside', () => {
    const obj = {
      id: 2,
      secretKey: 'uuid_gerado_aleatoriamente',
      status: ['whitePlay', 2],
      obj1: {
        id: 1,
        secretKey: 'uuid_gerado_aleatoriamente',
        status: 'whitePlay',
      },
    };

    const expected = generalFunctions.sanitiseObj(obj);
    expect(expected).toEqual(obj);
  });

  it('It should return the same object, without the html tag', () => {
    const obj = {
      id: 3,
      secretKey: '<h1>malicious key</h1>',
      status: ['whitePlay', 2],
    };
    const expectedObj = {
      id: 3,
      secretKey: 'malicious key',
      status: ['whitePlay', 2],
    };

    const expected = generalFunctions.sanitiseObj(obj);
    expect(expected).toEqual(expectedObj);
  });

  it('It should clean off the array and remove the tags', () => {
    const array = ['<h1>Tag1</h1>', '<ul>not closed ul', '</ul> closing ul tag'];
    const expectedArray = ['Tag1', 'not closed ul', 'closing ul tag'];

    const expected = generalFunctions.sanitiseObj(array);
    expect(expected).toEqual(expectedArray);
  });

  it('should return null when function is called with a non-object parameter', () => {
    const parameter = 'not object';

    const expected = generalFunctions.sanitiseObj(parameter);
    expect(expected).toBe(null);
  });

  it.each([null, undefined, 42, true])('returns null for unsupported input %s', (input) => {
    expect(generalFunctions.sanitiseObj(input)).toBe(null);
  });

  it('sanitises nested objects and arrays without mutating the input', () => {
    const input = {
      name: '<h1>School &amp; Co</h1>',
      nested: {
        values: ['<b>Alpha</b>', { name: '<i>Beta</i>', missing: null }, 2, false],
      },
      missing: null,
      optional: undefined,
      count: 0,
    };
    const original = {
      name: '<h1>School &amp; Co</h1>',
      nested: {
        values: ['<b>Alpha</b>', { name: '<i>Beta</i>', missing: null }, 2, false],
      },
      missing: null,
      optional: undefined,
      count: 0,
    };

    const result = generalFunctions.sanitiseObj(input);

    expect(result).toEqual({
      name: 'School & Co',
      nested: { values: ['Alpha', { name: 'Beta', missing: null }, 2, false] },
      missing: null,
      optional: undefined,
      count: 0,
    });
    expect(input).toEqual(original);
    expect(result).not.toBe(input);
    expect(result.nested).not.toBe(input.nested);
    expect(result.nested.values).not.toBe(input.nested.values);
    expect(result.nested.values[1]).not.toBe(input.nested.values[1]);
  });

  it('trims surrounding spaces, preserves internal spaces and removes empty tags', () => {
    expect(generalFunctions.sanitiseObj({
      name: '  Escola   Central  ', empty: '<b></b>', spaces: '   ',
    })).toEqual({ name: 'Escola   Central', empty: '', spaces: '' });
  });

  it.each([{}, []])('returns a new empty container for %p', (input) => {
    const result = generalFunctions.sanitiseObj(input);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  it.each([
    [{ status: '<b>completed</b>' }, { status: 'completed' }],
    [null, null],
    ['<b>texto</b>', 'texto'],
  ])('preserves __proto__ as an own data property without inheriting its fields: %p', (value, sanitised) => {
    const input = JSON.parse(JSON.stringify({ ['__proto__']: value }));
    const result = generalFunctions.sanitiseObj(input);

    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(true);
    expect(result.__proto__).toEqual(sanitised);
    expect(result.status).toBeUndefined();
    expect(JSON.stringify(result)).toBe(JSON.stringify({ ['__proto__']: sanitised }));
    expect(input.__proto__).toEqual(value);
  });

  it('preserves special keys in objects nested inside arrays and keeps sanitising their text', () => {
    const input = JSON.parse('{"items":[{"__proto__":{"status":"<b>completed</b>"},"name":"<i>Turma A</i>"}]}');
    const result = generalFunctions.sanitiseObj(input);

    expect(Array.isArray(result.items)).toBe(true);
    expect(Object.keys(result.items[0])).toEqual(['__proto__', 'name']);
    expect(result.items[0].status).toBeUndefined();
    expect(result.items[0].__proto__).toEqual({ status: 'completed' });
    expect(result.items[0].name).toBe('Turma A');
    expect(input.items[0].__proto__.status).toBe('<b>completed</b>');
    expect(input.items[0].name).toBe('<i>Turma A</i>');
  });
});
