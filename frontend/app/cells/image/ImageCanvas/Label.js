'use client'

import { useCallback, useContext, useMemo } from "react";
import { getColor } from "../../../../lib/generateChartColor";
import { getContrastingColor } from "../../../../lib/generateChartColor";
import { isTagHidden } from "../../../../lib/tags";
import classNames from "classnames/bind";
import styles from './Label.module.scss';
import { CanvasContext } from "../../../contexts/CanvasContext";
const cx = classNames.bind(styles);


const Label = ({ label, toggle }) => {
    const color = getColor(label);
    const { hiddenLabels } = useContext(CanvasContext);
    const textColor = getContrastingColor(color);
    const toggleLabel = useCallback(() => toggle(label), [toggle, label])

    const disabled = useMemo(() => isTagHidden(hiddenLabels, label), [hiddenLabels, label]);

    return (
        <div onClick={toggleLabel} className={cx('label', { disabled })} style={{ background: color, color: textColor}}>
            {`${label}`}
        </div>
    );
}

export default Label;
