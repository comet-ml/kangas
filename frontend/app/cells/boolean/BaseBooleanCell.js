"use client";

import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

const BooleanCell = ({ value, style }) => {
    console.log("BaseBooleanCell!");
    return (
        <div className="cell-content" style={style}>
            {
                (value === null) ?
                    <>None</> :
                    ((value === 1) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />)
            }
        </div>
    );
};

export default BooleanCell;
