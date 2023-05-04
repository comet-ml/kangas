'use client';

import fetchTimestamp from "@kangas/lib/fetchTimestamp";
import useQueryParams from "@kangas/lib/hooks/useQueryParams";
import { useCallback, useEffect, useRef, useContext } from "react";
import { ConfigContext } from "@kangas/app/contexts/ConfigContext";

const Polling = ({ children }) => {
    const { config } = useContext(ConfigContext);
    const { params, updateParams } = useQueryParams();
    const interval = useRef();

    const checkTimestamp = useCallback(async () => {
        if (!params?.datagrid) return;

        const mostRecent = await fetchTimestamp(params.datagrid, false);

        if (params?.timestamp != mostRecent) {
            updateParams({ timestamp: mostRecent });
        }
    }, [params?.datagrid, params?.timestamp, updateParams]);

    useEffect(() => {
	// If disabled, don't start
	if (!config.dynamic) return;

        if (!!interval.current) clearInterval(interval.current);

        interval.current = setInterval(checkTimestamp, 10000);

        return () => clearInterval(interval.current);
    }, [checkTimestamp]);


      return (
        <>
            { children }
        </>
      );
};

export default Polling;
