DataGrid filter expressions use Python syntax for selecting matching
rows. To use the value of a column in the expression, enclosing the
column name like `{"Column Name"}`. Some examples:

To select all of the rows that have a fitness score less than 0.1,
given that you have a column named "Fitness":

```
{"fitness"} < 0.1
```

Note that the column name is case-insensitive (i.e., you can use any
case of letters inside quotes). Column values can be used any where in
the filter expression. For example, if you wanted to select all of the
rows where column "Score 1" was greater than or equal to "Score 2",
you would write:

```
{"score 1"} >= {"score 2"}
```

You can use any of Python's operators, including:

* `<` - less than
* `<=` - less than or equal
* `>` - greater than
* `>=` - greater than or equal
* `==` - equal to
* `!=` - not equal to
* `is` - is the same (e.g., `is None`)
* `is not` - is not the same (e.g. `is not None`)
* `+` - addition
* `-` - subtraction
* `*` - multiplication
* `/` - division
* `//` - integer division
* `**` - raise to a power
* `not` - flip the boolean value
* `in` - is value in a list of values

Use `is None` and `is not None` for selecting rows that have null values. Otherwise,
null values are ignored in most other uses.

You can combine comparisons using Python's `and` and `or` (use parentheses to force
evaluation order different from Python's defaults):

```
(({"loss"} - {"base line"}) < 0.5) or ({"loss"} > 0.95)
```

JSON attribute access
=====================

For JSON and metdata columns, you can use the dot
operator to access values:

```
{"Image"}.extension == "jpg"
```

or nested values:

```
{"Image"}.overlay.labels.contains("dog")
```

See below for more information on `contains()` and other string and JSON
methods.

Note that any mention of a column that contains an asset type (e.g.,
an image) will automatically reference its metadata.

Python String and JSON methods
==============================

These are mostly used with column values:

* `{"Column Name"}.contains(STRING)`
* `{"Column Name"}.endswith(STRING)`
* `{"Column Name"}.startswith(STRING)`
* `{"Column Name"}.strip()`
* `{"Column Name"}.lstrip()`
* `{"Column Name"}.rstrip()`
* `{"Column Name"}.upper()`
* `{"Column Name"}.lower()`


Python if/else expression
=========================

You can use Python's if/else expression to return one
value or another.

```
("low" if {"loss"} < 0.5 else "high") == "low"
```

Python Builtin Functions
========================

You can use any of these Python builtin functions:

* `abs()` - absolute value
* `round()` - rounds to int
* `max(v1, v2, ...)` or `max([v1, v2, ...])` - maximum of list of values
* `min(v1, v2, ...)` or `min([v1, v2, ...])` - minimum of list of values
* `len()` - length of item

Aggregate Functions
===================

You can use the following aggregate functions. Note that these
are more expensive to compute, as they require computing on all
rows.

* `AVG({"Column Name"})`
* `MAX({"Column Name"})`
* `MIN({"Column Name"})`
* `SUM({"Column Name"})`
* `TOTAL({"Column Name"})`
* `COUNT({"Column Name"})`
* `STDEV({"Column Name"})`

Examples:

Find all rows that have a loss value less than the average:

```
{"loss"} < AVG({"loss"})
```

Python Library Functions and Values
===================================

Functions from Python's `random` library:

* `random.random()`
* `random.randint()`

Note that random values are regenerated on each call, and thus
only have limited use. That means that every time the
DataGrid is accessed, the values will change. This would
result in bizarre results if you grouped or sorted by
a random value.

Functions and values from Python's `math` library:

* `math.pi`
* `math.sqrt()`
* `math.acos()`
* `math.acosh()`
* `math.asin()`
* `math.asinh()`
* `math.atan()`
* `math.atan2()`
* `math.atanh()`
* `math.ceil()`
* `math.cos()`
* `math.cosh()`
* `math.degrees()`
* `math.exp()`
* `math.floor()`
* `math.log()`
* `math.log10()`
* `math.log2()`
* `math.radians()`
* `math.sin()`
* `math.sinh()`
* `math.tan()`
* `math.tanh()`
* `math.trunc()`

Functions and values from Python's `datetime` library:

* `datetime.date(YEAR, MONTH, DAY)`
* `datetime.datetime(YEAR, MONTH, DAY[, HOUR, MINUTE, SECOND])`
