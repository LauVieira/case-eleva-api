class UpdateError extends Error {
  constructor (message, cause) {
    super(message);
    this.name = 'UpdateError';
    this.cause = cause;
  }
}

module.exports = UpdateError;
