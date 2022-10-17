import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

const BooleanCellClient = ({ value }) => {
    if (value === null) return <>None</>;
    else return (value === 1) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />;
};

export default BooleanCellClient;
