'use client'

import { useEffect, useLayoutEffect } from "react";
import { useInView } from "react-intersection-observer";
import useQueryParams from "../../lib/hooks/useQueryParams";

const Boundary = ({ id, begin=false, children }) => {
    const { params, updateParams } = useQueryParams();

    const { ref, inView, entry } = useInView({
        threshold: 0,
    });

    useEffect(() => {
        if (inView) {
            //updateParams({ boundary: id + 20 })
        }
    }, [inView, updateParams, id]);

    useEffect(() => {
        if (begin) {
            updateParams({ begin: Math.max(id - 100, 0) })
        } else {
            updateParams({ boundary: id + 100 })
        }
    }, [id, updateParams, begin])


    return (
        <div ref={ref}>
            { children }
        </div>
    )
};

export default Boundary;
