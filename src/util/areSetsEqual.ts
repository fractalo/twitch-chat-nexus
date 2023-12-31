export const areSetsEqual = <T>(set1?: Set<T> | null, set2?: Set<T> | null): boolean => {
    if (!set1 || !set2) return false;
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
        if (!set2.has(item)) return false;
    }
    return true;
};