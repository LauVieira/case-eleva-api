function normaliseName (value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : value;
}

module.exports = normaliseName;
