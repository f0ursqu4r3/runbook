export class RunbookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunbookError";
  }
}

export class CommandResultError extends RunbookError {
  readonly details: unknown;

  constructor(message: string, details: unknown) {
    super(message);
    this.name = "CommandResultError";
    this.details = details;
  }
}

export class ValidationError extends RunbookError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class FlowStepError extends RunbookError {
  readonly flowId: string;
  readonly step: string;
  readonly cause: unknown;

  constructor(flowId: string, step: string, cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(`[flow:${flowId} step:${step}] ${causeMessage}`);
    this.name = "FlowStepError";
    this.flowId = flowId;
    this.step = step;
    this.cause = cause;
  }
}
