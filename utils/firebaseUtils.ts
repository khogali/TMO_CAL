// Helper to prevent Firebase errors by removing undefined values from objects before saving.
export const cleanForFirebase = (obj: any): any => {
    if (obj === null || obj === undefined) return null; // Return null for undefined values
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => cleanForFirebase(item));
    
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = cleanForFirebase(value);
        }
        return acc;
    }, {} as { [key: string]: any });
};
