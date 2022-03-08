export function createEmpty({ rows, columns }) {
    return [...(new Array(rows).keys())]
        .map(() => [...(new Array(columns).keys())].map(() => null));
}

export function blitFramedRect(overlay, lb, ub, frameStyle, fill=' ', version=0) {
    for (let y=lb.y; y<=ub.y; y++) {
        for (let x=lb.x; x<=ub.x; x++) {
            let chr = fill;
            if (y === lb.y) {
                if (x === lb.x) {
                    chr = frameStyle.corner.nw[version];
                } else if (x === ub.x) {
                    chr = frameStyle.corner.ne[version];
                } else {
                    chr = frameStyle.horizontal[version];
                }
            } else if (y === ub.y) {
                if (x === lb.x) {
                    chr = frameStyle.corner.sw[version];
                } else if (x === ub.x) {
                    chr = frameStyle.corner.se[version];
                } else {
                    chr = frameStyle.horizontal[version];
                }
            } else if (x === lb.x || x === ub.x) {
                chr = frameStyle.vertical[version];
            }
            overlay[y][x] = chr;
        }
    }
}

function wrapText(text, maxWidth) {
    const arr = [...text];
    const rows = [];
    while (true) {
        const idxSpace = arr.slice(0, maxWidth).lastIndexOf(' ');
        let row = arr.splice(0, idxSpace / maxWidth > .7 ? idxSpace : maxWidth);
        row = [...row.join('').trim()];
        rows.push(row);
        if (arr.length === 0) break;
    }
    return rows;
}

function padLine(line, maxWidth, align, padChr=' ') {
    switch (align) {
        case 'left':
            return line.concat([...new Array(maxWidth - line.length).keys()].map(() => padChr))
        case 'right':
            return [...new Array(maxWidth - line.length).keys()].map(() => padChr).concat(line);
        case 'center':
            return [...new Array(Math.floor((maxWidth - line.length) / 2)).keys()].map(() => padChr)
                .concat(line)
                .concat([...new Array(Math.ceil((maxWidth - line.length) / 2)).keys()].map(() => padChr));
        default:
            return line;
    }
}

export function writeInRect(overlay, lb, ub, contents, padding=1, padChr=' ') {
    const width = ub.x - 2 * padding - lb.x + 1;
    let y = lb.y + padding;
    const maxY = ub.y - padding;
    for (let cRow=0; cRow<contents.length; cRow++) {
        const { text, align } = contents[cRow];
        const wrappedTextRows = wrapText(text, width);
        for (let r=0; r<wrappedTextRows.length && y<=maxY; r++) {
            y++;
            padLine(wrappedTextRows[r], width, align, padChr)
                .map((chr, column) => { overlay[y][lb.x + padding + column] = chr; })

        }
    }
}
