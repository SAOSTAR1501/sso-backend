export interface ResponseType<T> {
    message?: string;
    result?: T;
    statusCode?: number;
}