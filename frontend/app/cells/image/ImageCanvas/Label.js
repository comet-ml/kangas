'use client'

import { useCallback } from "react";
import { getColor } from "../../../../lib/generateChartColor";
import { getContrastingColor } from "../../../../lib/generateChartColor";

const Label = ({ label, toggle }) => {
    const color = getColor(label);
    const textColor = getContrastingColor(color);
    const toggleLabel = useCallback(() => toggle(label), [toggle, label])
    return (
            <div onClick={toggleLabel} style={{ background: color, color: textColor}}>
            {`${label}`}
        </div>
    );
}

export default Label;