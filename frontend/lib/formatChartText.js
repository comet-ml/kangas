const formatChartText = (value, columnType) => {
    if (!value) return '';

    if (columnType === 'DATETIME') {
        const timestampObj = new Date(value);
        return timestampObj.toISOString().substring(0, 18);
    } else if (typeof value !== 'string') {
        return value.toString().substring(0, 18);
    }

    return value.substring(0, 18);
};

export default formatChartText;
