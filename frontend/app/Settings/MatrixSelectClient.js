'use client';

import Select from 'react-select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import useQueryParams from '../../lib/hooks/useQueryParams';

// Ideally, we wouldn't need to import a third-party library for a select component here,
// but native select components are annoying to style
const MatrixSelect = ({ query, options=['blah'] }) => {
    const { params, updateParams } = useQueryParams();

    const changeDatagrid = useCallback((e) => {
        updateParams({
            dgid: e.value
        })
    }, [updateParams]);

    const customStyles = {
        menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
    };

    // FIXME: don't use endsWith, but something smarter
    return (
        <Select
            id={'matrix-select-pulldown'}
            defaultValue={
                options.find((item) => item?.value?.endsWith(params?.dgid)) || ''
            }
            options={options}
            styles={customStyles}
            onChange={changeDatagrid}
        />
    );
};

export default MatrixSelect;
