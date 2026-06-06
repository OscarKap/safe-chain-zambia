/**
 * Suggest responders for a given case based on district, incident type and availability.
 * Returns an array of responder objects ordered by relevance.
 */
export declare const suggestResponders: (caseId: string) => Promise<any>;
/**
 * Bulk assign responders to a case and log the assignment.
 */
export declare const assignResponders: (caseId: string, responderIds: string[], assignerId: string) => Promise<void>;
//# sourceMappingURL=assignmentService.d.ts.map