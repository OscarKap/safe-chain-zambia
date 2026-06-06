export declare const signAccessToken: (payload: {
    sub: string;
    role: string;
    email: string;
}) => string;
export declare const signRefreshToken: (payload: {
    sub: string;
}) => string;
export declare const verifyAccessToken: (token: string) => {
    sub: string;
    role: string;
    email: string;
};
export declare const verifyRefreshToken: (token: string) => {
    sub: string;
};
//# sourceMappingURL=jwtService.d.ts.map