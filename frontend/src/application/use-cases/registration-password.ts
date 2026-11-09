const MIN_PASSWORD_BYTES = 12;
const MAX_PASSWORD_BYTES = 72;

export function registrationPasswordError(password: string): string | null {
  if ([...password].length < MIN_PASSWORD_BYTES) {
    return `Usa una contraseña de al menos ${MIN_PASSWORD_BYTES} caracteres.`;
  }
  const byteLength = new TextEncoder().encode(password).length;
  if (byteLength > MAX_PASSWORD_BYTES) {
    return 'La contraseña es demasiado larga. Prueba con una más corta.';
  }
  return null;
}
