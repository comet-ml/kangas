import {useMemo} from 'react';
import formatValue from "@kangas/lib/formatValue";
import {createColormap} from "@kangas/lib/createColormap";
import {getContrastingColor} from "@kangas/lib/generateChartColor";

import classNames from 'classnames/bind';
import styles from '../Cell.module.scss';
const cx = classNames.bind(styles);

const COLORMAPS = {};

const BaseFloatCell = ({ value, style, metadata }) => {
    const colormapName = 'bone';
    const nshades = 64;
    const key = `${colormapName}-${nshades}`;
    if (!Object.keys(COLORMAPS).includes(key)) {
	COLORMAPS[key] = createColormap({colormap: colormapName, nshades});
    }
    const colormap = COLORMAPS[key];

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
