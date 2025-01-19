export default class Logger {
  namespace: string;
  constructor(namespace: string) {
    this.namespace = namespace;
  }

  /**
   * Log an error message
   * @param msg Message
   */
  error(msg: any) {
    console.error(`[${this.namespace} Error] ${msg}`);
  }

  /**
   * Log a warning message
   * @param msg Message
   */
  warn(msg: any) {
    console.warn(`[${this.namespace} Warning] ${msg}`);
  }

  /**
   * Log an info message
   * @param msg Message
   */
  info(msg: any) {
    console.info(`[${this.namespace} Info] ${msg}`);
  }

  /**
   * Log a debug message.
   * @param msg Message
   */
  debug(msg: any) {
    if (process.env.NODE_ENV != "production")
      console.debug(`[${this.namespace} Debug] ${msg}`);
  }
}
