export class RunbookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunbookError";
  }
}

export class ValidationError extends RunbookError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
