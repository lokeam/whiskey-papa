import type { LogLevel } from "@/lib/hatchet/types";

/**
 * Extracts the step name from Hatchet's actionId format.
 *
 * @param actionId - The full action ID (e.g., "workflow:step-name")
 * @returns The step name without the workflow prefix
 *
 * @example
 * extractStepName("document-pipeline:upload") // → "upload"
 * extractStepName("upload") // → "upload"
 */
export function extractStepName(actionId: string): string {
  const stepNameArr = actionId.split(':');

  return stepNameArr.length > 1 ? stepNameArr[1] : actionId;
}


/**
 * Formats duration from milliseconds to human-readable seconds.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "3.5s")
 *
 * @example
 * formatDuration(3001) // → "3.0s"
 * formatDuration(500)  // → "0.5s"
 */
export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}


// Translator: Translates technical event types to UI semantic log levels
/*
  INFO logs -> gray/blue
  SUCCESS -> green
  WARN -> yellow/orange
  ERROR -> red
*/

/**
 * Maps Hatchet event types to UI log levels.
 *
 * @param eventType - The Hatchet event type
 * @returns The corresponding log level for UI display
 *
 * @example
 * mapEventTypeToLogLevel("FINISHED") // → "SUCCESS"
 * mapEventTypeToLogLevel("FAILED")   // → "ERROR"

*/
export function mapEventTypeToLogLevel(eventType: string): LogLevel {
  switch(eventType) {
    case 'ASSIGNED':
      return 'INFO';
    case 'DEBUG':
      return 'INFO';
    case 'SENT_TO_WORKER':
      return 'INFO';
    case 'STARTED':
      return 'INFO';
    case 'QUEUED':
      return 'INFO';
    case 'PENDING':
      return 'INFO';
    case 'RUNNING':
      return 'INFO';
    case 'COMPLETED':
      return 'SUCCESS';
    case 'FINISHED':
      return 'SUCCESS';
    case 'SUCCEEDED':
      return 'SUCCESS';
    case 'FAILED':
      return 'ERROR';
    case 'CANCELLED':
      return 'WARN';
    case 'REQUEUED_NO_WORKER':
      return 'WARN';
    default:
      return 'INFO';
  }
}
