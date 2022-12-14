import truncateValue from './truncateValue';

function formatValue(value, columnType) {
    if (value === null) {
        return 'None';
    }

    let retval = value;
    if (columnType === 'DATETIME') {
        const timestampObj = new UnixTime(value);
        retval = timestampObj.format('YYYY-MM-DD HH:mm:ss');
    } else if (columnType === 'FLOAT') {
        retval = truncateValue(value).toString();
    } else if (typeof value !== 'string') {
        retval = value.toString();
    }
    return retval;
}

function pad(item, size, padding = '0') {
    return String(item).padStart(size, padding);
}

class UnixTime {
    constructor(datetime) {
        this.obj = new Date(datetime * 1000);
        this.year = pad(this.obj.getFullYear(), 4);
        this.month = pad(this.obj.getMonth() + 1, 2);
        this.day = pad(this.obj.getDate(), 2);
        this.hour = pad(this.obj.getHours(), 2);
        this.minute = pad(this.obj.getMinutes(), 2);
        this.second = pad(this.obj.getSeconds(), 2);
    }

    format() {
        // Hard coded for now: 'YYYY-MM-DD HH:mm:ss'
        if (
            this.hour === '00' &&
            this.minute === '00' &&
            this.second === '00'
        ) {
            return `${this.year}-${this.month}-${this.day}`;
        } else {
            return `${this.year}-${this.month}-${this.day} ${this.hour}:${this.minute}:${this.second}`;
        }
    }
}

export default formatValue;
