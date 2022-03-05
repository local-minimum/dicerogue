export function defog(fog) {
    fog.forEach(row => row.forEach((_, idx) => row[idx] = false));
}
