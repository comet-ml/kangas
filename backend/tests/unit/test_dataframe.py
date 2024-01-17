import numpy as np
import pandas as pd
from pandas._testing import (
    makeCustomDataframe,
    makeDataFrame,
    makeMixedDataFrame,
    makePeriodFrame,
    makeTimeDataFrame,
)

import kangas


def makeMissingDataframe():
    df = makeDataFrame()
    data = df.values
    data = np.where(data > 1, np.nan, data)
    return pd.DataFrame(data, index=df.index, columns=df.columns)

def test_makeCustomDataframe():
    df = makeCustomDataframe(100, 25)
    dg = kangas.read_dataframe(df)
    assert len(dg) == 100
    assert len(dg[0]) == 25
    dg.save()

def test_makeDataFrame():
    df = makeDataFrame()
    dg = kangas.read_dataframe(df)
    assert len(dg) == 30
    assert len(dg[0]) == 4
    dg.save()

def test_makeMissingDataframe():
    df = makeMissingDataframe()
    dg = kangas.read_dataframe(df)
    assert len(dg) == 30
    assert len(dg[0]) == 4
    dg.save()

def test_makeMixedDataFrame():
    df = makeMixedDataFrame()
    dg = kangas.read_dataframe(df)
    assert len(dg) == 5
    assert len(dg[0]) == 4
    dg.save()

def test_makePeriodFrame():
    df = makePeriodFrame()
    dg = kangas.read_dataframe(df)
    assert len(dg) == 30
    assert len(dg[0]) == 4
    dg.save()

def test_makeTimeDataFrame():
    df = makeTimeDataFrame()
    dg = kangas.read_dataframe(df)
    assert len(dg) == 30
    assert len(dg[0]) == 4
    dg.save()
