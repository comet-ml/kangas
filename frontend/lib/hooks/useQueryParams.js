import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useContext } from "react";
import { ConfigContext } from '@kangas/app/contexts/ConfigContext';

import config from '@kangas/config';

const useQueryParams = () => {
    const { config } = useContext(ConfigContext);
    const router = useRouter();
    const urlParams = useSearchParams();

    const params = useMemo(() => {
        const placeholder = {};

        for (const [key, value] of urlParams) {
            placeholder[key] = value;
        };

        return placeholder;
    }, [urlParams]);

    const updateParams = useCallback((updatedParams) => {
        // FIXME: need to unify paramaters (does order matter?)
        // and handle defaults so that they match for caching
        // puposes
        const current = new URLSearchParams(urlParams.toString());
        for (const key in updatedParams) {
            if (current.has(key)) {
                current.delete(key);
            }

            if (typeof(updatedParams[key]) !== 'undefined') {
                current.append(key, updatedParams[key]);
            }
        }
        router.push(`${config.rootPath}?${current.toString()}`);
    }, [urlParams, router]);

    const prefetch = useCallback((updatedParams) => {
        const current = new URLSearchParams(urlParams.toString());
        for (const key in updatedParams) {
            if (!!current.get(key)) {
                current.delete(key);
            }

            if (typeof(updatedParams[key]) !== 'undefined') {
                current.append(key, updatedParams[key]);
            }
        }
        if (config.prefetch)
            router.prefetch(`${config.rootPath}?${current.toString()}`);
    }, [urlParams, router]);

    return {
        params,
        updateParams,
        prefetch
    };

}

export default useQueryParams;
