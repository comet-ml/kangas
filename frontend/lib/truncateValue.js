// Config
import config from '../config';

const countDecimals = (value) => {
    if (Math.floor(value) === value) return 0;

    const [, decimalPart = ''] = value.toString().split('.');

    return decimalPart.length;
};

const truncateValue = (value, customDecimalsPrecision) => {
    const decimalsPrecision =
        customDecimalsPrecision ?? config.defaultDecimalPrecision;

    if (decimalsPrecision === null) return value;

    const numberValue = Number(value);

    if (isNaN(numberValue)) return value;

    if (
        Number.isInteger(numberValue) ||
        countDecimals(numberValue) <= decimalsPrecision
    ) {
        return numberValue;
    }

    const exponential = 10 ** decimalsPrecision;

    return Math.floor(numberValue * exponential) / exponential;
};

export default truncateValue;
