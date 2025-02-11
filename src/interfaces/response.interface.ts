export interface ResponseType<T> {
    success?: boolean;
    message?: string;
    result?: T;
    statusCode?: number;
}