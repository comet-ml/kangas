'use client';

import Select from 'react-select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';


// Ideally, we wouldn't need to import a third-party library for a select component here,
// but native select components are annoying to style
const MatrixSelect = ({ query, options=['blah'] }) => {
    const params = useSearchParams();
    const router = useRouter();
    const dgid = useMemo(() => params.get('dgid'), [params]);

    const changeDatagrid = useCallback((e) => {
        const current = new URLSearchParams(params.toString())
        if (!!current.get('dgid')) {
            current.delete('dgid');
        }
        
        current.append('dgid', e.value);

        router.push(`/?${current.toString()}`)

    }, [params, router]);

    const customStyles = {
        menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
    };

    // FIXME: don't use endsWith, but something smarter
    return (
        <Select
            id={'matrix-select-pulldown'}
            defaultValue={
                options.find((item) => item?.value?.endsWith(dgid)) || ''
            }
            options={options}
            styles={customStyles}
            onChange={changeDatagrid}
        />
    );
};

export default MatrixSelect;
