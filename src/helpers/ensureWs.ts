export default function EnsureWs(
  originalMethod: any,
  ctx: ClassMethodDecoratorContext
) {
  const methodName = String(ctx.name);

  function replacement(this: any, ...args: any[]) {
    if (this.ws) {
      const result = originalMethod.call(this, ...args);

      return result;
    }
    throw new Error(`Cannot execute ${methodName}: WS is not defined`);
  }

  return replacement;
}
