> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/PandasVsKangas.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!
---

# "Make Your Pandas Code Lightning Fast"

This notebook is a further exploration of Rob Mulla's excellent video on the topic of "Make Your Pandas Code Lightning Fast":


```python
from IPython.display import YouTubeVideo
```


```python
YouTubeVideo("SAFmrTnEHLg")
```

You should watch it to get an understanding of some of the issues working with Pandas, and writing code that runs fast.

But, there are other things not considered in this video:

1. What do you do if you have a larger dataset?
2. What happens if all of the data won't easily fit into memory?
3. What about the time that it takes to learn the intricacies of Pandas?

The intricacies of Pandas are numerous, and glossed over in the video. It assumes that you already are a Pandas Master. For example:

* Why use the comparisons `&` and `|` rather than `and` and `or`?
* What is `df.loc[]`?
* Where does `df.apply()` save the results?
* What does `axis=1` mean?

The point here is that when writing fast code in Pandas, that does not account for learning a language different from Python. Pandas has its own mini-language inside Python, and you must know it in order to get such speed results.

Or do you?

This notebook explores Kangas DataGrid that can optimize your code in different dimensions:

1. Allowing for much larger dataset, even ones that don't fit in memory
2. Ability to use native Python syntax for filtering and column definitions

## Setup

As per Rob's video, we import the necessary libraries, create a function to return a dataframe, and define a function to perform the logic.

You'll probably need to:



```python
%pip install kangas --quiet
```

```python
import pandas as pd
import numpy as np
import kangas as kg
```


```python
def get_data(size=10_000):
    df = pd.DataFrame()
    df["age"] = np.random.randint(0, 100, size)
    df["time_in_bed"] = np.random.randint(0, 9, size)
    df["pct_sleeping"] = np.random.rand(size)
    df["favorite_food"] = np.random.choice(["pizza", "taco", "ice-cream"], size)
    df["hate_food"] = np.random.choice(["broccoli", "candy corn", "eggs-cream"], size)
    return df
```


```python
df = get_data()
df
```





  <div id="df-5e437f01-3567-47d8-80f1-a85353ad4c7a">
    <div class="colab-df-container">
      <div>

<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>age</th>
      <th>time_in_bed</th>
      <th>pct_sleeping</th>
      <th>favorite_food</th>
      <th>hate_food</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>4</td>
      <td>6</td>
      <td>0.650790</td>
      <td>ice-cream</td>
      <td>broccoli</td>
    </tr>
    <tr>
      <th>1</th>
      <td>23</td>
      <td>2</td>
      <td>0.551140</td>
      <td>pizza</td>
      <td>eggs-cream</td>
    </tr>
    <tr>
      <th>2</th>
      <td>77</td>
      <td>7</td>
      <td>0.655011</td>
      <td>ice-cream</td>
      <td>broccoli</td>
    </tr>
    <tr>
      <th>3</th>
      <td>90</td>
      <td>6</td>
      <td>0.312947</td>
      <td>taco</td>
      <td>candy corn</td>
    </tr>
    <tr>
      <th>4</th>
      <td>99</td>
      <td>3</td>
      <td>0.226989</td>
      <td>taco</td>
      <td>eggs-cream</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>9995</th>
      <td>27</td>
      <td>2</td>
      <td>0.532450</td>
      <td>ice-cream</td>
      <td>candy corn</td>
    </tr>
    <tr>
      <th>9996</th>
      <td>80</td>
      <td>0</td>
      <td>0.144693</td>
      <td>pizza</td>
      <td>broccoli</td>
    </tr>
    <tr>
      <th>9997</th>
      <td>74</td>
      <td>0</td>
      <td>0.128222</td>
      <td>ice-cream</td>
      <td>broccoli</td>
    </tr>
    <tr>
      <th>9998</th>
      <td>43</td>
      <td>3</td>
      <td>0.654261</td>
      <td>pizza</td>
      <td>eggs-cream</td>
    </tr>
    <tr>
      <th>9999</th>
      <td>79</td>
      <td>8</td>
      <td>0.843021</td>
      <td>pizza</td>
      <td>broccoli</td>
    </tr>
  </tbody>
</table>
<p>10000 rows × 5 columns</p>
</div>
 
```python
def reward_calc(row):
    if row["age"] >= 90:
        return row["favorite_food"]
    elif row["time_in_bed"] and row["pct_sleeping"] > 0.5:
        return row["favorite_food"]
    else:
        return row["hate_food"]
```

Below, we replicate Rob's three levels.

## Level 1 - Loop


```python
%%timeit
for index, row in df.iterrows():
    df.loc[index, "reward"] = reward_calc(row)
```

    5.82 s ± 84.8 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)


## Level 2 - Apply


```python
%%timeit
df.apply(reward_calc, axis=1)
```

    171 ms ± 1.15 ms per loop (mean ± std. dev. of 7 runs, 10 loops each)


## Level 3 - Vectorized


```python
%%timeit
df["reward"] = df["hate_food"]
df.loc[((df["pct_sleeping"] > 0.5) &
        (df["time_in_bed"] > 5)) |
       (df["age"] >= 90), "reward"] = df["favorite_food"]
```

    2.01 ms ± 94.7 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)


## Summary

We get roughly the same results as Rob:

Level | Time
------|------
1     | 2190 ms
2     |  332 ms
3     |    2 ms

But let's consider the two orthogonal dimensions:

1. Allowing for much larger dataset, even ones that don't fit in memory
2. Ability to use native Python syntax for filtering and column definitions

## Level X - Kangas DataGrid

First, we turn a dataframe into a Kangas DataGrid:


```python
dg = kg.read_dataframe(get_data())
dg.save("reward-with-food.datagrid")
```

```python
dg
```




<table><th colspan='1' >          row-id </th> <th colspan='1' >             age </th> <th colspan='1' >     time_in_bed </th> <th colspan='1' >    pct_sleeping </th> <th colspan='1' >   favorite_food </th> <th colspan='1' >       hate_food </th> <tr>
<td colspan='1' >               1 </td> <td colspan='1' >              82 </td> <td colspan='1' >               5 </td> <td colspan='1' > 0.6713029304542 </td> <td colspan='1' >            taco </td> <td colspan='1' >      eggs-cream </td> <tr>
<td colspan='1' >               2 </td> <td colspan='1' >              30 </td> <td colspan='1' >               6 </td> <td colspan='1' > 0.0416295932538 </td> <td colspan='1' >            taco </td> <td colspan='1' >      candy corn </td> <tr>
<td colspan='1' >               3 </td> <td colspan='1' >               2 </td> <td colspan='1' >               8 </td> <td colspan='1' > 0.2581160879880 </td> <td colspan='1' >           pizza </td> <td colspan='1' >      candy corn </td> <tr>
<td colspan='1' >               4 </td> <td colspan='1' >              31 </td> <td colspan='1' >               2 </td> <td colspan='1' > 0.3011619044266 </td> <td colspan='1' >            taco </td> <td colspan='1' >        broccoli </td> <tr>
<td colspan='1' >               5 </td> <td colspan='1' >              21 </td> <td colspan='1' >               3 </td> <td colspan='1' > 0.9938268518094 </td> <td colspan='1' >            taco </td> <td colspan='1' >        broccoli </td> <tr>
<tr><td colspan='6' style='text-align: left;'>...</td></tr><td colspan='1' >            9996 </td> <td colspan='1' >              57 </td> <td colspan='1' >               7 </td> <td colspan='1' > 0.2306798232168 </td> <td colspan='1' >            taco </td> <td colspan='1' >      candy corn </td> <tr>
<td colspan='1' >            9997 </td> <td colspan='1' >               3 </td> <td colspan='1' >               3 </td> <td colspan='1' > 0.7656398670260 </td> <td colspan='1' >            taco </td> <td colspan='1' >      eggs-cream </td> <tr>
<td colspan='1' >            9998 </td> <td colspan='1' >              43 </td> <td colspan='1' >               8 </td> <td colspan='1' > 0.7432438826116 </td> <td colspan='1' >            taco </td> <td colspan='1' >      eggs-cream </td> <tr>
<td colspan='1' >            9999 </td> <td colspan='1' >              43 </td> <td colspan='1' >               7 </td> <td colspan='1' > 0.8112412364868 </td> <td colspan='1' >           pizza </td> <td colspan='1' >      candy corn </td> <tr>
<td colspan='1' >           10000 </td> <td colspan='1' >               8 </td> <td colspan='1' >               2 </td> <td colspan='1' > 0.4340274273214 </td> <td colspan='1' >       ice-cream </td> <td colspan='1' >      eggs-cream </td> <tr>
<tr>
<td colspan='6' style="text-align: left;"> [10000 rows x 5 columns] </td> <tr>
<tr><td colspan='6' style='text-align: left;'></td></tr><tr><td colspan='6' style='text-align: left;'>*  Use DataGrid.show() to start user interface</td></tr></table>



The DataGrid looks very similar to a DataFrame. However, you can also:

```python
dg.show()
```

to see a UI in the notebook to perform operations without code:

![Kangas DataGrid Image](https://github.com/caleb-kaiser/kangas_examples/raw/master/Oct-25-2022%2016-43-56.gif)

If you were to try to write out the logic of the reward function in Python, one might write:

```python
{"favorite_food"} if (({"time_in_bed"} > 5 and {"pct_sleeping"} > 0.5) or ({"age"} >= 90)) else {"hate_food"}
```

Here, we are using the special syntax `{"column name"}` to represent a column in the datagrid.

We can use that directly to create a new dataframe using Python syntax:


```python
%%timeit
results = dg.select_dataframe(
    computed_columns={
        "reward": '{"favorite_food"} if (({"time_in_bed"} > 5 and {"pct_sleeping"} > 0.5) or ({"age"} >= 90)) else {"hate_food"}'
     }
)
```

    89 ms ± 10.2 ms per loop (mean ± std. dev. of 7 runs, 10 loops each)


On my computer, that took about 110 ms. Not quite Level 3, but better than Level 2. But this is doing a lot:

1. creates a "computed column", i.e. one that exists only as an expression
2. selects all of the data from the datagrid
3. converts the data into a dataframe

But there's more to be gained! You can use this part of the expression as a filter in the UI and see the paged results almost instantly:

```python
({"time_in_bed"} > 5 and {"pct_sleeping"} > 0.5) or ({"age"} >= 90)
```

How is Kangas so fast when making a query? Because it is able to parse the Python-esque filter directly into SQL.

Give it a try:


```python
dg.show('(({"time_in_bed"} > 5 and {"pct_sleeping"} > 0.5) or ({"age"} >= 90))')
```

Once you have a DataGrid, there is much more one can do, without knowing any Pandas magic. For example, try "Group by" on "favorite_food" or "hate_food". If this were real data, you might find some hidden connections. Which is what many of are trying to do when working with Pandas. And you can mix in multimedia and metadata into the rows.

We're big fans of Pandas. But remember: there are more **dimensions than just the time the code takes to run** when working on a problem.

Thanks! You can find out more about Kangas DataGrid here:

https://github.com/comet-ml/kangas

---
> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/PandasVsKangas.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!
