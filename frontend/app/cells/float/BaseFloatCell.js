import {useMemo} from 'react';
import formatValue from "@kangas/lib/formatValue";
import {createColormap} from "@kangas/lib/createColormap";
import {getContrastingColor} from "@kangas/lib/generateChartColor";

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const BaseFloatCell = ({ value, style, metadata }) => {
    const colormap = createColormap({colormap: 'bone', "nshades": 64});

    const backgroundColor = useMemo(() => {
        if (metadata) {
            const minimum = metadata.minimum;
            const maximum = metadata.maximum;
            if (minimum !== null && maximum !== null && minimum !== maximum && value !== null) {
                return colormap[Math.floor(((value - minimum) / (maximum - minimum)) * 64)];
            }
        }
        return '#ffffff';
    }, [value, metadata]);

    const color = useMemo(() => {
        if (backgroundColor)
            return getContrastingColor(backgroundColor);
        return "#000000";
    }, [backgroundColor]);

    return (
        <div className={cx("cell-content")} style={ {...style, backgroundColor, color} }>
            {`${formatValue(value, 'FLOAT')}`}
        </div>
    );
}

export default BaseFloatCell;
