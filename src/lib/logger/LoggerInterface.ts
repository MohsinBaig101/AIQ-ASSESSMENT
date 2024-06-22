import bunyan from 'bunyan';

export interface LoggerInterface {
    trace(msg: string, additional?: any): void;
    debug(msg: string, additional?: any): void;
    info(msg: string, additional?: any): void;
    warn(msg: string, additional?: any): void;
    error(msg: string, additional?: any): void;
    child(msg: unknown): bunyan;
}
