import formatValue from "@kangas/lib/formatValue";
import { getContrastingColor, getColor } from "@kangas/lib/generateChartColor";

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

import labelStyles from '@kangas/app/cells/image/ImageCanvas/Label.module.scss';
const cx2 = classNames.bind(labelStyles);


const TextCell = ({ value, style, metadata }) => {

    if (!style)
        style = {};

    let className = cx("cell-content");

    if ((metadata && metadata?.other?.count_unique && metadata?.other?.count_unique < 2000) &&
        (value && value.length < 25)) {
        const color = getColor(value);
        className = cx2('label');
        style.background = color;
        style.color = getContrastingColor(color);
        style.width = '80%';
        style.textAlign = 'center';
    }

    return (
        <div className={className} style={style} >
            {`${formatValue(value, 'TEXT')}`}
        </div>
    );

}

export default TextCell;
