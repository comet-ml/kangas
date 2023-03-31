# Kangas DataGrid - Getting Started

Before using Kangas DataGrid, you'll need to install it. We can do that in a notebook
with the `%pip install kangas` command:


```python
%pip install kangas --quiet
```

Once installed, we can import it. We'll just import the top-level `kangas` module as `kg` and use that throughout this demo.


```python
import kangas as kg
kg.__version__
```




    '1.1.26'



## Quick Overview

The easiest way to create a Kangas DataGrid is to read one that someone has already created.

This line will download, unzip, and read a zip file containing a datagrid of the same name:


```python
dg = kg.read_datagrid("https://github.com/dsblank/examples/raw/main/mnist-60000-after-5-epochs.datagrid.zip")
```

To get a quick look at the first few, and last few rows, you just evaluate the DataGrid:


```python
dg
```




<table><th colspan='1' >          row-id </th> <th colspan='1' >              ID </th> <th colspan='1' >           Image </th> <th colspan='1' >           guess </th> <th colspan='1' >           truth </th> <th colspan='1' >         score_0 </th> <th colspan='1' >         score_1 </th> <th colspan='1' >         score_2 </th> <th colspan='1' >         score_3 </th> <th colspan='1' >         score_4 </th> <th colspan='1' >         score_5 </th> <th colspan='1' >         score_6 </th> <th colspan='1' >         score_7 </th> <th colspan='1' >         score_8 </th> <th colspan='1' >         score_9 </th> <tr>
<td colspan='1' >               1 </td> <td colspan='1' >             0_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               5 </td> <td colspan='1' >               5 </td> <td colspan='1' > 0.0003801159327 </td> <td colspan='1' > 0.0001277869014 </td> <td colspan='1' > 0.0002037321683 </td> <td colspan='1' > 0.0735469013452 </td> <td colspan='1' > 9.9519216746557 </td> <td colspan='1' > 0.9205805659294 </td> <td colspan='1' > 0.0001330216473 </td> <td colspan='1' > 0.0012975619174 </td> <td colspan='1' > 0.0017528240568 </td> <td colspan='1' > 0.0018781156977 </td> <tr>
<td colspan='1' >               2 </td> <td colspan='1' >             1_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               0 </td> <td colspan='1' >               0 </td> <td colspan='1' > 0.9992853999137 </td> <td colspan='1' > 7.9931724030757 </td> <td colspan='1' > 8.1648780906107 </td> <td colspan='1' > 0.0001033976732 </td> <td colspan='1' > 1.2082227840437 </td> <td colspan='1' > 0.0003204728418 </td> <td colspan='1' > 1.9551858713384 </td> <td colspan='1' > 0.0001656513777 </td> <td colspan='1' > 1.2528664228739 </td> <td colspan='1' > 3.2318600915459 </td> <tr>
<td colspan='1' >               3 </td> <td colspan='1' >             2_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               4 </td> <td colspan='1' >               4 </td> <td colspan='1' > 1.2911040414564 </td> <td colspan='1' > 2.5293978978879 </td> <td colspan='1' > 0.0013196486979 </td> <td colspan='1' > 4.2376654164399 </td> <td colspan='1' > 0.9972282052040 </td> <td colspan='1' > 5.7346933317603 </td> <td colspan='1' > 5.9833600971614 </td> <td colspan='1' > 0.0006686503184 </td> <td colspan='1' > 1.1407437341404 </td> <td colspan='1' > 0.0005871452158 </td> <tr>
<td colspan='1' >               4 </td> <td colspan='1' >             3_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               1 </td> <td colspan='1' >               1 </td> <td colspan='1' > 1.7145330275525 </td> <td colspan='1' > 0.9984493255615 </td> <td colspan='1' > 0.0002102825528 </td> <td colspan='1' > 3.8886493712197 </td> <td colspan='1' > 6.9065579737070 </td> <td colspan='1' > 4.0109098335960 </td> <td colspan='1' > 0.0001045667522 </td> <td colspan='1' > 0.0001345542550 </td> <td colspan='1' > 0.0008927863673 </td> <td colspan='1' > 4.3187377741560 </td> <tr>
<td colspan='1' >               5 </td> <td colspan='1' >             4_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               9 </td> <td colspan='1' >               9 </td> <td colspan='1' > 1.5619488635820 </td> <td colspan='1' > 4.1327712096972 </td> <td colspan='1' > 2.2574981812795 </td> <td colspan='1' > 0.0002893423661 </td> <td colspan='1' > 0.0010175879579 </td> <td colspan='1' > 6.5922569774556 </td> <td colspan='1' > 1.3011796795581 </td> <td colspan='1' > 0.0003477171703 </td> <td colspan='1' > 0.0005523857544 </td> <td colspan='1' > 0.9976830482482 </td> <tr>
<tr><td colspan='15' style='text-align: left;'>...</td></tr><td colspan='1' >           59996 </td> <td colspan='1' >         59995_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               8 </td> <td colspan='1' >               8 </td> <td colspan='1' > 3.2505617127753 </td> <td colspan='1' > 2.5870547688100 </td> <td colspan='1' > 0.0002041866682 </td> <td colspan='1' > 0.0028061096090 </td> <td colspan='1' > 4.3806480789498 </td> <td colspan='1' > 0.0002726390375 </td> <td colspan='1' > 1.5543423614872 </td> <td colspan='1' > 3.1183614623842 </td> <td colspan='1' > 0.9965282082557 </td> <td colspan='1' > 0.0001243160804 </td> <tr>
<td colspan='1' >           59997 </td> <td colspan='1' >         59996_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               3 </td> <td colspan='1' >               3 </td> <td colspan='1' > 1.1184209142811 </td> <td colspan='1' > 1.5324691048590 </td> <td colspan='1' > 0.0004596766957 </td> <td colspan='1' > 0.9982267022132 </td> <td colspan='1' > 1.2172682772870 </td> <td colspan='1' > 3.3583441108930 </td> <td colspan='1' > 6.3583303067105 </td> <td colspan='1' > 0.0001746603957 </td> <td colspan='1' > 0.0005389639409 </td> <td colspan='1' > 0.0005386720877 </td> <tr>
<td colspan='1' >           59998 </td> <td colspan='1' >         59997_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               5 </td> <td colspan='1' >               5 </td> <td colspan='1' > 2.4464738089591 </td> <td colspan='1' > 8.7551825345144 </td> <td colspan='1' > 2.1635760276694 </td> <td colspan='1' > 0.0001473767042 </td> <td colspan='1' > 7.5291827670298 </td> <td colspan='1' > 0.9989750385284 </td> <td colspan='1' > 8.9653323811944 </td> <td colspan='1' > 1.9890239855158 </td> <td colspan='1' > 0.0004213855136 </td> <td colspan='1' > 0.0002358685160 </td> <tr>
<td colspan='1' >           59999 </td> <td colspan='1' >         59998_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               6 </td> <td colspan='1' >               6 </td> <td colspan='1' > 2.3057298676576 </td> <td colspan='1' > 0.0001034079032 </td> <td colspan='1' > 0.0001432461285 </td> <td colspan='1' > 3.6937350955668 </td> <td colspan='1' > 0.0005181649466 </td> <td colspan='1' > 0.0003082071198 </td> <td colspan='1' > 0.9988954067230 </td> <td colspan='1' > 2.3212633095681 </td> <td colspan='1' > 4.3824447857332 </td> <td colspan='1' > 1.4624255300077 </td> <tr>
<td colspan='1' >           60000 </td> <td colspan='1' >         59999_0 </td> <td colspan='1' > &lt;Image, asse </td> <td colspan='1' >               8 </td> <td colspan='1' >               8 </td> <td colspan='1' > 0.0001333609689 </td> <td colspan='1' > 1.6963807865977 </td> <td colspan='1' > 3.2436306355521 </td> <td colspan='1' > 0.0004209050675 </td> <td colspan='1' > 1.5265825368260 </td> <td colspan='1' > 0.0010179193923 </td> <td colspan='1' > 7.9014253060449 </td> <td colspan='1' > 1.0736092548313 </td> <td colspan='1' > 0.9981248974800 </td> <td colspan='1' > 0.0002439306845 </td> <tr>
<tr>
<td colspan='15' style="text-align: left;"> [60000 rows x 14 columns] </td> <tr>
<tr><td colspan='15' style='text-align: left;'></td></tr><tr><td colspan='15' style='text-align: left;'>*  Use DataGrid.show() to start user interface</td></tr></table>



You can also use `dg.head()` and `dg.tail()` respectively for the first and last rows.

The most powerful feature of datagrid is the ability to visualize the data through a powerful UX.

To start the UX, simply:


```python
dg.show()
```



<iframe
    width="100%"
    height="750px"
    src="http://127.0.1.1:4000/?datagrid=mnist-60000-after-5-epochs.datagrid"
    frameborder="0"
    allowfullscreen

></iframe>



What are you seeing? And what can you do?

First, you are looking at a spreadsheet-like view of the data. You might recognize the `Image` column as members of the MNIST dataset.

This particular DataGrid has the following columns:


```python
dg.info()
```

    DataGrid (on disk)
        Name   : MNIST-60000-after-5-epochs
        Rows   : 60,000
        Columns: 14
    #   Column                Non-Null Count DataGrid Type
    --- -------------------- --------------- --------------------
    1   ID                            60,000 TEXT
    2   Image                         60,000 IMAGE-ASSET
    3   guess                         60,000 INTEGER
    4   truth                         60,000 INTEGER
    5   score_0                       60,000 FLOAT
    6   score_1                       60,000 FLOAT
    7   score_2                       60,000 FLOAT
    8   score_3                       60,000 FLOAT
    9   score_4                       60,000 FLOAT
    10  score_5                       60,000 FLOAT
    11  score_6                       60,000 FLOAT
    12  score_7                       60,000 FLOAT
    13  score_8                       60,000 FLOAT
    14  score_9                       60,000 FLOAT


Each column represents the following information:
1. ID - the data scientist's unique ID for each row
2. Image - a representation of the input to a deep learning neural network
3. guess - what the neural network 'thinks' the input is a picture of
4. truth - the actual category of what the picture is of
5. score_N - the values of the 10 output units of the neural network

Some things you can do:

* Group the DataGrid by the column `truth`. That will show all of the pictures of ones together, twos together, etc. There should be exactly 10 rows, one for each kind of digit pictured.
* Then change the filter to be: `{"epoch"} == 0` That will show the results before training.
* Then change the filter to be: `{"epoch"} == 5` That will show the results after 5 epochs of training.
* Then change the filter to be: `{"epoch"} == 5 and {"guess"} == {"truth"}` That will show the results after 5 epochs of training for all of the inputs that it got correct.
* Then change the filter to be: `{"epoch"} == 5 and {"guess"} != {"truth"}` That will show the results after 5 epochs of training for all of the inputs that it got wrong.

Things to note:

* Use the form `{"column name"}` to refer to a column
* Use Python syntax to construct filter expressions that evaluate to either True or False

For more information on filters, see: https://github.com/comet-ml/kangas/wiki/Filter-Expressions

## Constructing a DataGrid

The second easiest way to create a Kangas DataGrid is to use the class `DataGrid` from the `kangas` package and create one:


```python
dg = kg.DataGrid()
```

That's it! Now you can beging to add rows to the DataGrid, either one at a time with `DataGrid.append()` or multiple rows with `DataGrid.extend()`:


```python
dg.append([None, 2.0, "hello, world", True, "2023/12/01"])
```

Here we append a row with five values: a null value, a float, a string, a boolean, and a string in the YYYY/MM/DD date format.

We can ask to see the first few rows of the DataGrid with the `DataGrid.head()`:


```python
dg.head()
```


<table><th colspan='1' >          row-id </th> <th colspan='1' >               A </th> <th colspan='1' >               B </th> <th colspan='1' >               C </th> <th colspan='1' >               D </th> <th colspan='1' >               E </th> <tr>
<td colspan='1' >               1 </td> <td colspan='1' >            None </td> <td colspan='1' >             2.0 </td> <td colspan='1' >    hello, world </td> <td colspan='1' >            True </td> <td colspan='1' > 2023-12-01 00:0 </td> <tr>
<tr>
<td colspan='6' style="text-align: left;"> [1 rows x 5 columns] </td> <tr>
</table>


Note that an additional column, `row-id` was added automatically. This is column is always added and contains the row number, starting at 1.

In addition, you can see what DataGrid has inferred about the data so far:


```python
dg.info()
```

    DataGrid (in memory)
        Name   : Untitled
        Rows   : 1
        Columns: 5
    #   Column                Non-Null Count DataGrid Type
    --- -------------------- --------------- --------------------
    1   A                                  0 None
    2   B                                  1 FLOAT
    3   C                                  1 TEXT
    4   D                                  1 BOOLEAN
    5   E                                  1 DATETIME


Some things to take note of so far:

First, you may recognize that some of these methods replicate those in pandas DataFrame. These have similar functionality as to those in a DataFrame. However, most of the things you can do in a DataFrame are not supported in a DataGrid. We'll see examples of uses of DataGrid below.

Also note that `dg.info()` shows that this is an "in memory" DataGrid. That is, it hasn't been saved to disk yet. At this stage in the DataGrid construction, it is attempting to infer the types of each column of data. As we appended a None in column A, we see that the `DataGrid Type` is None for column A.

Let's append another row, and check out the info:


```python
dg.append([5, 6, "another string", False, "2023/12/02"])
```


```python
dg.info()
```

    DataGrid (in memory)
        Name   : Untitled
        Rows   : 2
        Columns: 5
    #   Column                Non-Null Count DataGrid Type
    --- -------------------- --------------- --------------------
    1   A                                  1 INTEGER
    2   B                                  2 FLOAT
    3   C                                  2 TEXT
    4   D                                  2 BOOLEAN
    5   E                                  2 DATETIME


We see that the DataGrid is still in memory, but the DataGrid Type of column A is now INTEGER.

Let's add another row:


```python
dg.append([4.0, 6, "another string", False, "2023/12/02"])
```


```python
dg.info()
```

    DataGrid (in memory)
        Name   : Untitled
        Rows   : 3
        Columns: 5
    #   Column                Non-Null Count DataGrid Type
    --- -------------------- --------------- --------------------
    1   A                                  2 FLOAT
    2   B                                  3 FLOAT
    3   C                                  3 TEXT
    4   D                                  3 BOOLEAN
    5   E                                  3 DATETIME


After appending a float to column A, the Type has become FLOAT. DataGrid attempts to identify specific types of the data, but allows the types to become more general with additional rows.

Now, let's save the DataGrid to disk:


```python
dg.save()
```

    Saving data...


    100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 3/3 [00:00<00:00, 15630.95it/s]


    Saving datagrid to '/tmp/tmpetn8ma0g/untitled.datagrid'...
    Extending data...


    100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 3/3 [00:00<00:00, 2401.32it/s]


    Computing statistics...


    100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 6/6 [00:00<00:00, 4442.33it/s]


At this point, the DataGrid is now operating in a different mode. All data is now stored on disk, and Types are no longer allowed to change.

Let's add a new row, using the value 87 for the boolean column D:


```python
dg.extend([[5.0, 6, "another string", 87, "2023/12/02"]])
```

    Extending data...


    100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 1/1 [00:00<00:00, 1056.23it/s]


    Computing statistics...


    100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 6/6 [00:00<00:00, 6454.43it/s]



```python
dg.info()
```

    DataGrid (on disk)
        Name   : Untitled
        Rows   : 4
        Columns: 5
    #   Column                Non-Null Count DataGrid Type
    --- -------------------- --------------- --------------------
    1   A                                  3 FLOAT
    2   B                                  4 FLOAT
    3   C                                  4 TEXT
    4   D                                  4 BOOLEAN
    5   E                                  4 DATETIME


Now the DataGrid Type of column D cannot change, and remains a "BOOLEAN". If we had appended this row before saving, the DataGrid type would have become "TEXT", the highest encompasing type.

What does DataGrid do with an 87 in a boolean column?


```python
dg.head()
```


<table><th colspan='1' >          row-id </th> <th colspan='1' >               A </th> <th colspan='1' >               B </th> <th colspan='1' >               C </th> <th colspan='1' >               D </th> <th colspan='1' >               E </th> <tr>
<td colspan='1' >               1 </td> <td colspan='1' >            None </td> <td colspan='1' >             2.0 </td> <td colspan='1' >    hello, world </td> <td colspan='1' >            True </td> <td colspan='1' > 2023-12-01 00:0 </td> <tr>
<td colspan='1' >               2 </td> <td colspan='1' >             5.0 </td> <td colspan='1' >             6.0 </td> <td colspan='1' >  another string </td> <td colspan='1' >           False </td> <td colspan='1' > 2023-12-02 00:0 </td> <tr>
<td colspan='1' >               3 </td> <td colspan='1' >             4.0 </td> <td colspan='1' >             6.0 </td> <td colspan='1' >  another string </td> <td colspan='1' >           False </td> <td colspan='1' > 2023-12-02 00:0 </td> <tr>
<td colspan='1' >               4 </td> <td colspan='1' >             5.0 </td> <td colspan='1' >             6.0 </td> <td colspan='1' >  another string </td> <td colspan='1' >            True </td> <td colspan='1' > 2023-12-02 00:0 </td> <tr>
<tr>
<td colspan='6' style="text-align: left;"> [4 rows x 5 columns] </td> <tr>
</table>


It is able to convert it to a boolean, True.

But that doesn't mean it can convert any value to any type. Let's try to append the value "Nope!" to a float column:


```python
dg.extend([["Nope!", 6, "another string", 87, "2023/12/02"]])
```


    ---------------------------------------------------------------------------

    Exception                                 Traceback (most recent call last)

    Input In [40], in <cell line: 1>()
    ----> 1 dg.append(["Nope!", 6, "another string", 87, "2023/12/02"])


    File ~/comet/kangas/backend/kangas/datatypes/datagrid.py:1123, in DataGrid.append(self, row)
       1114 """
       1115 Append this row onto the datagrid data.
       1116
       (...)
       1120 ```
       1121 """
       1122 if self._on_disk:
    -> 1123     raise Exception(
       1124         "Appending to a DataGrid on disk is slow: use DataGrid.extend([row, row, ...]) instead"
       1125     )
       1127 self.extend([row])


    Exception: Appending to a DataGrid on disk is slow: use DataGrid.extend([row, row, ...]) instead


And indeed, nope that doesn't work.

## Specifying Columns

If you would like, you can name the columns when you first create a DataGrid:


```python
dg = kg.DataGrid(name="Example 1", columns=["Category", "Loss", "Fitness", "Timestamp"])
```

## Making Large DataGrids

If you can create your DataGrid in memory, that is much faster. However, if you need to create larger datagrids, you can save the DataGrid first, and then append or extend after it is on disk.


```python
import random
import datetime
```


```python
for i in range(10000):
    dg.append([
        random.choice(["dog", "cat", "mouse", "duck"]),
        random.random() - 2.0,
        random.random() * 10,
        datetime.datetime.now()
    ])
```


```python
dg.save()
```

    Saving data...


    100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 10000/10000 [00:00<00:00, 50670.29it/s]


    Saving datagrid to 'example-1.datagrid'...
    Extending data...


    100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 10000/10000 [00:00<00:00, 15379.24it/s]


    Computing statistics...


    100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 5/5 [00:00<00:00, 87.72it/s]



```python
dg.show()
```



<iframe
    width="100%"
    height="750px"
    src="http://127.0.1.1:4000/?datagrid=example-1.datagrid"
    frameborder="0"
    allowfullscreen

></iframe>



Try grouping the above DataGrid on category.

1. Is this a balanced dataset?
2. What is the average fitness for dogs? For ducks? Which is doing better?
