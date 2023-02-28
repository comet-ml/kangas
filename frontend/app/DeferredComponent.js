'use client'

import { useEffect, useState } from "react";
import { CircularProgress } from "@material-ui/core";
import { useInView } from "react-intersection-observer";

const Deferred = ({ fallbackProps={}, children }) => {
  const [hasRendered, setHasRendered] = useState(false)
  const { ref, inView, entry } = useInView({
      threshold: 0,
  });

  useEffect(() => {
    if (inView && !hasRendered) {
      setHasRendered(true)
    }
  }, [inView, hasRendered]);


      return (
        <div ref={ref}>
          { !hasRendered && <div {...fallbackProps}> <CircularProgress /> </div> }
          { hasRendered && children }
        </div>
      )
};

export default Deferred;
