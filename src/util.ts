export function ID(): string {
  return `_${Math.random().toString(36).substr(2, 9)}`;
}

function formatConsoleMessage(message: any, type?: string): string {
  return `[${Game.time}]${type ? ` [${type}]` : ''} ${message}`;
}

export function log(message: string, type?: string): void {
  console.log('{LOG} ' + formatConsoleMessage(message, type));
}

export function error(error: any, type?: string): void {
  console.log(
    '{ERROR} ' + formatConsoleMessage((error && error.stack) || error, type)
  );
}
