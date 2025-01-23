export const getLangFromRequest = (req: Request): string => {
    return req.headers['accept-language'] || 'vi';
}