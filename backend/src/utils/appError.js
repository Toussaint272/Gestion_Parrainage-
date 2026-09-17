/** Erreur applicative avec code HTTP (propagée proprement par errorHandler). */
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
