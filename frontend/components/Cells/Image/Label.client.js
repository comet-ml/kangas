import { useCallback, useMemo, useRef } from 'react';
import { getColor, getContrastingColor } from '../../../lib/generateChartColor';

const Label = ({ label, hidden, addLabel, removeLabel }) => {
    // TODO: Use something a bit more standard for classes
    const classes = useMemo(() => {
        if (hidden) return 'badge badge-label badge-disabled';
        return 'badge badge-label';
    }, [hidden]);

    const background = useMemo(() => {
        return getColor(label);
    }, [label]);

    const font = useMemo(() => {
        return getContrastingColor(getColor(label));
    }, [label]);

    const node = useRef();

    const click = useCallback(() => {
        if (!addLabel || !removeLabel) return;
        if (hidden) addLabel(label);
        else removeLabel(label);
    }, [hidden, label, addLabel, removeLabel]);

    return (
        <div
            ref={node}
            className={classes}
            style={{ backgroundColor: background, color: font }}
            onClick={click}
        >
            {`${label}`}
        </div>
    );
};

export default Label;
