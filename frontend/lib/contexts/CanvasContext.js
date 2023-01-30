'use client';

import { createContext } from 'react';

const CanvasContext = createContext({
    scoreRange: { min: 0, max: 1 },
    hiddenLabels: [],
    metadata: {}
});


export default CanvasContext;
