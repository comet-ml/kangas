> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/Integrations.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!

---

# Kangas DataGrid - Integrations

Before using Kangas DataGrid, you'll need to install it. We can do that in a notebook
with the `%pip install kangas` command:


```python
%pip install kangas --quiet
```

    [K     |████████████████████████████████| 11.9 MB 4.6 MB/s
    [K     |████████████████████████████████| 34.5 MB 225 kB/s
    [?25h

Once installed, we can import it. We'll just import the top-level `kangas` module as `kg` and use that throughout this demo.


```python
import kangas as kg
kg.__version__
```




    '1.1.31'



# Pandas DataFrame

This demonstrates using images with Kangas from a pandas DataFrame.

This is based on: https://towardsdatascience.com/rendering-images-inside-a-pandas-dataframe-3631a4883f60

First, we build a pandas DataFrame:


```python
import pandas as pd
```


```python
df = pd.DataFrame([
    [2768571, 130655, 1155027, 34713051, 331002277],
    [1448753, 60632, 790040, 3070447, 212558178],
    [654405, 9536, 422931, 19852167, 145934619],
    [605216, 17848, 359891, 8826585, 1379974505],
    [288477, 9860, 178245, 1699369, 32969875]],
    columns=['Total Cases', 'Total Deaths', 'Total Recovered', 'Total Tests', 'Population'])
```


```python
dg = kg.read_dataframe(df)
```

    Reading DataFrame...


    5it [00:00, 3719.67it/s]
    100%|██████████| 5/5 [00:00<00:00, 7077.80it/s]



```python
flags = [
  'https://www.countries-ofthe-world.com/flags-normal/flag-of-United-States-of-America.png',
  'https://www.countries-ofthe-world.com/flags-normal/flag-of-Brazil.png',
  'https://www.countries-ofthe-world.com/flags-normal/flag-of-Russia.png',
  'https://www.countries-ofthe-world.com/flags-normal/flag-of-India.png',
  'https://www.countries-ofthe-world.com/flags-normal/flag-of-Peru.png'
]
```


```python
from kangas.datatypes.utils import download_filename
```


```python
dg.append_column("Flag", [kg.Image(download_filename(url)) for url in flags])
```


```python
dg
```




<table><th colspan='1' >          row-id </th> <th colspan='1' >     Total Cases </th> <th colspan='1' >    Total Deaths </th> <th colspan='1' > Total Recovered </th> <th colspan='1' >     Total Tests </th> <th colspan='1' >      Population </th> <th colspan='1' >            Flag </th> <tr>
<td colspan='1' >               1 </td> <td colspan='1' >         2768571 </td> <td colspan='1' >          130655 </td> <td colspan='1' >         1155027 </td> <td colspan='1' >        34713051 </td> <td colspan='1' >       331002277 </td> <td colspan='1' > &lt;Image, asse </td> <tr>
<td colspan='1' >               2 </td> <td colspan='1' >         1448753 </td> <td colspan='1' >           60632 </td> <td colspan='1' >          790040 </td> <td colspan='1' >         3070447 </td> <td colspan='1' >       212558178 </td> <td colspan='1' > &lt;Image, asse </td> <tr>
<td colspan='1' >               3 </td> <td colspan='1' >          654405 </td> <td colspan='1' >            9536 </td> <td colspan='1' >          422931 </td> <td colspan='1' >        19852167 </td> <td colspan='1' >       145934619 </td> <td colspan='1' > &lt;Image, asse </td> <tr>
<td colspan='1' >               4 </td> <td colspan='1' >          605216 </td> <td colspan='1' >           17848 </td> <td colspan='1' >          359891 </td> <td colspan='1' >         8826585 </td> <td colspan='1' >      1379974505 </td> <td colspan='1' > &lt;Image, asse </td> <tr>
<td colspan='1' >               5 </td> <td colspan='1' >          288477 </td> <td colspan='1' >            9860 </td> <td colspan='1' >          178245 </td> <td colspan='1' >         1699369 </td> <td colspan='1' >        32969875 </td> <td colspan='1' > &lt;Image, asse </td> <tr>
<tr>
<td colspan='7' style="text-align: left;"> [5 rows x 6 columns] </td> <tr>
<tr><td colspan='7' style='text-align: left;'></td></tr><tr><td colspan='7' style='text-align: left;'>*  Use DataGrid.save() to save to disk</td></tr><tr><td colspan='7' style='text-align: left;'>** Use DataGrid.show() to start user interface</td></tr></table>




```python
dg.show()
```

    Saving data...


    100%|██████████| 5/5 [00:00<00:00, 13374.69it/s]


    Saving datagrid to '/tmp/tmpokt9wedz/untitled.datagrid'...
    Extending data...


    100%|██████████| 5/5 [00:00<00:00, 2139.30it/s]


    Computing statistics...


    100%|██████████| 8/8 [00:00<00:00, 3939.24it/s]



    <IPython.core.display.Javascript object>


# CSV Files

From https://www.kaggle.com/code/stassl/displaying-inline-images-in-pandas-dataframe/data download:

* `labels.csv`
* `test.zip`

And save in this folder (or upload if you are on Google Colab).


```python
! mkdir -p train
! unzip -o -q train.zip -d train
```


```python
dg = kg.read_csv("labels.csv")
```

    Loading CSV file 'labels.csv'...


    10223it [00:00, 65439.28it/s]
    100%|██████████| 10222/10222 [00:00<00:00, 18376.24it/s]



```python
dg
```




<table><th colspan='1' >          row-id </th> <th colspan='1' >              id </th> <th colspan='1' >           breed </th> <tr>
<td colspan='1' >               1 </td> <td colspan='1' > 000bec180eb18c7 </td> <td colspan='1' >     boston_bull </td> <tr>
<td colspan='1' >               2 </td> <td colspan='1' > 001513dfcb2ffaf </td> <td colspan='1' >           dingo </td> <tr>
<td colspan='1' >               3 </td> <td colspan='1' > 001cdf01b096e06 </td> <td colspan='1' >        pekinese </td> <tr>
<td colspan='1' >               4 </td> <td colspan='1' > 00214f311d5d224 </td> <td colspan='1' >        bluetick </td> <tr>
<td colspan='1' >               5 </td> <td colspan='1' > 0021f9ceb3235ef </td> <td colspan='1' > golden_retrieve </td> <tr>
<tr><td colspan='3' style='text-align: left;'>...</td></tr><td colspan='1' >           10218 </td> <td colspan='1' > ffd25009d635cfd </td> <td colspan='1' >          borzoi </td> <tr>
<td colspan='1' >           10219 </td> <td colspan='1' > ffd3f636f7f379c </td> <td colspan='1' >  dandie_dinmont </td> <tr>
<td colspan='1' >           10220 </td> <td colspan='1' > ffe2ca6c940cddf </td> <td colspan='1' >        airedale </td> <tr>
<td colspan='1' >           10221 </td> <td colspan='1' > ffe5f6d8e2bff35 </td> <td colspan='1' > miniature_pinsc </td> <tr>
<td colspan='1' >           10222 </td> <td colspan='1' > fff43b07992508b </td> <td colspan='1' > chesapeake_bay_ </td> <tr>
<tr>
<td colspan='3' style="text-align: left;"> [10222 rows x 2 columns] </td> <tr>
<tr><td colspan='3' style='text-align: left;'></td></tr><tr><td colspan='3' style='text-align: left;'>*  Use DataGrid.save() to save to disk</td></tr><tr><td colspan='3' style='text-align: left;'>** Use DataGrid.show() to start user interface</td></tr></table>




```python
dogs = kg.DataGrid(
    name="Dog Breeds",
    columns=["Breed", "Image"],
)
```


```python
for row in dg.to_dicts():
    dogs.append([row["breed"], kg.Image("train/" + row["id"] + ".jpg")])
```


```python
dogs.show()
```

    Saving data...


    100%|██████████| 10222/10222 [00:00<00:00, 101740.54it/s]

    Saving datagrid to 'dog-breeds.datagrid'...





    Extending data...


    100%|██████████| 10222/10222 [00:02<00:00, 3462.81it/s]


    Computing statistics...


    100%|██████████| 4/4 [00:30<00:00,  7.61s/it]



    <IPython.core.display.Javascript object>


# HuggingFace



```python
%pip install datasets --quiet
```

    [K     |████████████████████████████████| 441 kB 5.1 MB/s
    [K     |████████████████████████████████| 163 kB 67.9 MB/s
    [K     |████████████████████████████████| 95 kB 4.4 MB/s
    [K     |████████████████████████████████| 115 kB 73.7 MB/s
    [K     |████████████████████████████████| 212 kB 51.7 MB/s
    [K     |████████████████████████████████| 127 kB 46.8 MB/s
    [K     |████████████████████████████████| 115 kB 36.0 MB/s
    [?25h


```python
from datasets import load_dataset
```


```python
dataset = load_dataset("beans", split="train")
```

    WARNING:datasets.builder:Found cached dataset beans (/root/.cache/huggingface/datasets/beans/default/0.0.0/90c755fb6db1c0ccdad02e897a37969dbf070bed3755d4391e269ff70642d791)



```python
dg = kg.DataGrid(dataset, name="beans")
```

    100%|██████████| 1034/1034 [01:44<00:00,  9.90it/s]



```python
dg.show()
```

# URLs and Archived Files

Kangas can read URLs, and archived formats (including "zip", and "tgz" file formats).


```python
dg = kg.read_datagrid("https://github.com/dsblank/examples/raw/main/mnist-60000-after-5-epochs.datagrid.zip")
```


```python
dg.show()
```


    <IPython.core.display.Javascript object>


---

> This is a Jupyter Notebook example using Kangas. You can open and run it in <a href="https://colab.research.google.com/github/comet-ml/kangas/blob/main/notebooks/Integrations.ipynb">Google's Colab</a>. If you appreciate this project, give us a star!


