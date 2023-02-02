'use client'

import { getColor } from "../../../../lib/generateChartColor";
import { getContrastingColor } from "../../../../lib/generateChartColor";

const Label = ({ label, toggle }) => {
    const color = getColor(label.label);
    const textColor = getContrastingColor(color);
    return (
            <div onClick={() => toggle(label)} style={{ background: color, color: textColor}}>
            {`${label}`}
        </div>
    );
}

export default Label;