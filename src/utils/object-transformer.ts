import { camelCase } from "change-case";

export const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [camelCase(key)]: toCamelCase(obj[key]),
            }),
            {},
        );
    } else {
        return obj;
    }
}