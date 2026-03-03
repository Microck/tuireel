export function launchStep(command: string): void {
  if (command.trim().length === 0) {
    throw new Error("Launch step command cannot be empty. Try: add a 'command' field to your launch step (e.g. 'node app.js').");
  }
}
