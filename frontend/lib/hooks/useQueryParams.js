import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react";

const useQueryParams = () => {
    const router = useRouter();
    const urlParams = useSearchParams();

    const params = useMemo(() => {
        const placeholder = {};

        urlParams.forEach(param => {
            placeholder[param] = urlParams.get(param);
        })

        return placeholder;
    }, [urlParams]);

    const updateParams = useCallback((updatedParams) => {
        const current = new URLSearchParams(urlParams.toString());
        for (const param in updatedParams) {
            if (!!current.get(param)) {
                current.delete(param);
            }

            current.append(param, updatedParams[param]);
        }

        router.push(`/?${current.toString()}`)
    }, [urlParams, router]);

    return {
        params,
        updateParams
    }

}

export default useQueryParams;