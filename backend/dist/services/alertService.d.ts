export declare const sendAlertEmail: (to: string, subject: string, html: string) => Promise<any>;
export declare const sendAlertSMS: (to: string, body: string) => Promise<any>;
export declare const buildAlertPayload: (caseObj: any) => {
    subject: string;
    html: string;
    sms: string;
};
//# sourceMappingURL=alertService.d.ts.map