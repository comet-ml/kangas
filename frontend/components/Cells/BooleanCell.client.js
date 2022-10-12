import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons';

// It is physically painful that this needs to be rendered client-side, but MUI uses stateful hooks
const BooleanCellClient = ({ sign }) =>
    sign ? <CheckBox /> : <CheckBoxOutlineBlank />;

export default BooleanCellClient;
