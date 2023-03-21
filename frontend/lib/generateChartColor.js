// Color functions

/*
// Full color spectrum:
const getUniqueColor = (hash) => {
    const n = hash % 124;
    // Must return lowercase hex
    // so that getContrastingColor will work
    const rgb = [0, 0, 0];
    let counter = n;
    for (let i = 0; i < 24; i++) {
	rgb[i % 3] <<= 1;
	rgb[i % 3] |= counter & 0x01;
	counter >>= 1;
    }
    return `#${rgb.reduce(
      (a, c) => (c > 0x0f ? c.toString(16) : `0${c.toString(16)}`) + a,
      ''
    )}`;
};
*/

// Constrained to a given color pallete:
const getUniqueColor = (hash) => {
    // 144 color palette
    /*
    const colors = [
	'#1a293f', '#22334d', '#2a3c5a', '#324669', '#3a5077', '#435a86', '#4d6595', '#5670a4', '#607ab4', '#6b85c4', '#7690d4', '#819be4',
	'#2a253e', '#342e4a', '#3e3757', '#483f64', '#534972', '#5e5280', '#695b8e', '#75659c', '#806fab', '#8d79ba', '#9983c9', '#a68dd8',
	'#3a223a', '#452a46', '#513252', '#5e3a5f', '#6a426b', '#774b78', '#845486', '#925c93', '#9f65a1', '#ad6faf', '#bb78bd', '#c981cb',
	'#451c2e', '#522238', '#602941', '#6d2f4b', '#7b3655', '#8a3d60', '#98456a', '#a74c75', '#b65380', '#c65b8b', '#d56396', '#e56ba1',
	'#4a1a1e', '#571f24', '#65252b', '#732b31', '#813138', '#8f383f', '#9d3e47', '#ac454e', '#bb4b55', '#cb525d', '#da5964', '#ea606c',
	'#0c343c', '#11414b', '#154e5a', '#1a5c69', '#1f6a79', '#247988', '#298799', '#2e96a9', '#33a6ba', '#38b5cb', '#3dc5dd', '#42d5ee',
	'#0a382a', '#0f4636', '#135542', '#18644f', '#1c745c', '#21846a', '#259578', '#2aa686', '#2fb795', '#33c9a4', '#38dab3', '#3cecc3',
	'#222f11', '#2d3d18', '#394c1f', '#445b27', '#516a2f', '#5d7b37', '#6a8b3f', '#779c48', '#84ad51', '#91bf5a', '#9fd163', '#ace36c',
	'#4f4114', '#5b4b18', '#66551c', '#725f20', '#7e6925', '#8a7429', '#967e2d', '#a28932', '#af9437', '#bc9f3b', '#c8ab40', '#d5b645',
	'#492c12', '#563517', '#643d1c', '#714621', '#7f5026', '#8d592b', '#9c6231', '#ab6c36', '#ba763c', '#c98041', '#d88a47', '#e8944d',
	'#462514', '#542d1a', '#623520', '#713e26', '#80472c', '#8f5032', '#9f5939', '#af6240', '#bf6c46', '#cf754d', '#e07f54', '#f1895b',
	'#daf96b', '#a4f986', '#6df6a9', '#35efcb', '#1de5e7', '#53d7f8', '#8ac6fc', '#b8b2f1', '#db9ed9', '#f08bb9', '#f77f95', '#f07b72'
    ];
    */
    // 15 color palette
    const colors = [
        '#ffd51d',
        '#ffbd00',
        '#ff8900',
        '#fb7628',
        '#ff4747',
        '#e51772',
        '#cf0057',
        '#6e1d89',
        '#860dab',
        '#49a5bd',
        '#0096c7',
        '#00b4d8',
        '#12a592',
        '#16cab2',
        '#41ead4',
    ];
    return colors[hash % colors.length];
};

export const getColor = (text = '0') => {
    if (!text)
	return '#000000'; // black, error
    // Must return lowercase hex
    // so that getContrastingColor will work
    if (['1', 'true', 't', 'yes'].includes(text.toLowerCase()))
        return '#12a592'; // green from palette
    if (['0', 'false', 'f', 'no'].includes(text.toLowerCase()))
        return '#cf0057'; // red from palette
    const hash = [...text].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return getUniqueColor(Math.abs(hash));
};

export const hexToRgb = (hex) => {
    const result = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/);
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
    ];
};

export const getContrastingColor = (hex) => {
    const colors = hexToRgb(hex);
    const r = colors[0];
    const g = colors[1];
    const b = colors[2];
    const o = Math.round((r * 299 + g * 587 + b * 114) / 1000);
    return o > 125 ? '#000000' : '#ffffff';
};
