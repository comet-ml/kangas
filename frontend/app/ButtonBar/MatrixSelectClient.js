import { unstable_useRefreshRoot as useRefreshRoot } from 'next/streaming';

import Select from 'react-select';


// Ideally, we wouldn't need to import a third-party library for a select component here,
// but native select components are annoying to style
const MatrixSelect = ({ query, options }) => {
    const refresh = useRefreshRoot();
    const customStyles = {
        menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
    };

    // FIXME: don't use endsWith, but something smarter
    return (
        <Select
	    id={'matrix-select-pulldown'}
            defaultValue={
                options.find((item) => item.value.endsWith(query?.dgid)) || ''
            }
            options={options}
            styles={customStyles}
        />
    );
};

export default MatrixSelect;
