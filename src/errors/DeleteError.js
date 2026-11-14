class DeleteError extends Error {
  constructor (message, cause) {
    super(message);
    this.name = 'DeleteError';
    this.cause = cause;
  }
}

module.exports = DeleteError;
