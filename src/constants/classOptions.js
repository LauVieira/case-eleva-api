const GRADES_BY_SEGMENT = Object.freeze({
  'Educação Infantil — Creche': Object.freeze(['Berçário', 'Maternal I', 'Maternal II']),
  'Educação Infantil — Pré-escola': Object.freeze(['Jardim I', 'Jardim II']),
  'Ensino Fundamental': Object.freeze(Array.from({ length: 9 }, (_, index) => `${index + 1}º ano`)),
  'Ensino Médio': Object.freeze(['1º ano', '2º ano', '3º ano']),
});
const SHIFTS = Object.freeze(['Matutino', 'Vespertino', 'Noturno', 'Integral']);
const STATUSES = Object.freeze(['current', 'completed']);

module.exports = { GRADES_BY_SEGMENT, SHIFTS, STATUSES };
