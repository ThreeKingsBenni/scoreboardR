export default class Logger {
    namespace: string;
    constructor(namespace: string) {
        this.namespace = namespace;
    }

    error(msg: any) {
        console.error(`[${this.namespace} Error] ${msg}`);
    }

    warn(msg: any) {
        console.warn(`[${this.namespace} Warning] ${msg}`);
    }

    info(msg: any) {
        console.info(`[${this.namespace} Info] ${msg}`);
    }

    debug(msg: any) {
        if (process.env.NODE_ENV != "production") console.debug(`[${this.namespace} Debug] ${msg}`)
    }
}