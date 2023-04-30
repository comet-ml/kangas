'use client'

import { useCallback, useContext, useMemo } from "react";
import { getColor } from "@kangas/lib/generateChartColor";
import { getContrastingColor } from "@kangas/lib/generateChartColor";
import { isTagHidden } from "@kangas/lib/tags";
import classNames from "classnames/bind";
import styles from './Label.module.scss';
import { CanvasContext } from "@kangas/app/contexts/CanvasContext";
const cx = classNames.bind(styles);


const Label = ({ label, toggle }) => {
    const { hiddenLabels } = useContext(CanvasContext);

    const formatTag = function(tag) {
        if (tag.startsWith("(uncategorized):")) {
            return tag.substring(17);
        }
        return tag;
    };

    const toggleLabel = useCallback(() => toggle(label), [toggle, label]);
    const disabled = useMemo(() => isTagHidden(hiddenLabels, label), [hiddenLabels, label]);
    const displayLabel = useMemo(() => formatTag(label), [label]);
    const color = useMemo(() => getColor(displayLabel), [displayLabel]);
    const textColor = useMemo(() => getContrastingColor(color), [color]);

    return (
        <div onClick={toggleLabel} className={cx('label', { disabled })} style={{ background: color, color: textColor}}>
            {`${displayLabel}`}
        </div>
    );
}

export default Label;
