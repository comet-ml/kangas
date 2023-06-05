import formatValue from "@kangas/lib/formatValue";
import { getContrastingColor, getColor } from "@kangas/lib/generateChartColor";

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

import labelStyles from '@kangas/app/cells/image/ImageCanvas/Label.module.scss';
const cx2 = classNames.bind(labelStyles);


const TextCell = ({ value, style, metadata, expanded=false }) => {

    if (!style)
        style = {};

    let className = cx("cell-content");
    let tag = false;

    if ((metadata && metadata?.other?.count_unique && metadata?.other?.count_unique < 2000) &&
        (value && value.length < 25)) {
        tag = true;
        const color = getColor(value);
        className = cx2('label');
        style.background = color;
        style.color = getContrastingColor(color);
        style.width = '80%';
        style.textAlign = 'center';
    }

    if (!expanded || tag || !value) {
        return (
            <div className={className} style={style} >
                {`${formatValue(value, 'TEXT')}`}
            </div>
        );
    } else {
        className = cx("cell-text-expanded");
        return (
            <div className={className} style={style} >
                {value}
            </div>
        );
    }
};

export default TextCell;
