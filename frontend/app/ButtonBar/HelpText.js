const HelpText = () => (
    <div className="markdown-body">
        <p dir="auto">
            <b>DataGrid filter expressions</b> use Python syntax for selecting
            matching rows. To use the value of a column in the expression,
            enclosing the column name like <code>&#123;"Column Name"&rbrace;</code>.
            Some examples:
        </p>
        <p dir="auto">
            To select all of the rows that have a fitness score less than 0.1,
            given that you have a column named "Fitness":
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>&#123;"fitness"&rbrace; &lt; 0.1</code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <p dir="auto">
            Note that the column name is case-insensitive (i.e., you can use any
            case of letters inside quotes). Column values can be used any where
            in the filter expression. For example, if you wanted to select all
            of the rows where column "Score 1" was greater than or equal to
            "Score 2", you would write:
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>&#123;"score 1"&rbrace; &gt;= &#123;"score 2"&rbrace;</code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <p dir="auto">You can use any of Python's operators, including:</p>
        <ul dir="auto">
            <li>
                <code>&lt;</code> - less than
            </li>
            <li>
                <code>&lt;=</code> - less than or equal
            </li>
            <li>
                <code>&gt;</code> - greater than
            </li>
            <li>
                <code>&gt;=</code> - greater than or equal
            </li>
            <li>
                <code>==</code> - equal to
            </li>
            <li>
                <code>!=</code> - not equal to
            </li>
            <li>
                <code>is</code> - is the same (e.g., <code>is None</code>)
            </li>
            <li>
                <code>is not</code> - is not the same (e.g.{' '}
                <code>is not None</code>)
            </li>
            <li>
                <code>+</code> - addition
            </li>
            <li>
                <code>-</code> - subtraction
            </li>
            <li>
                <code>*</code> - multiplication
            </li>
            <li>
                <code>/</code> - division
            </li>
            <li>
                <code>//</code> - integer division
            </li>
            <li>
                <code>**</code> - raise to a power
            </li>
            <li>
                <code>not</code> - flip the boolean value
            </li>
            <li>
                <code>in</code> - is value in a list of values
            </li>
        </ul>
        <p dir="auto">
            Also you can use Python's comparison operator chaining. That is, any
            of the above operators can be used in a shorthand way as follows:
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>
    &#123;"column a"&rbrace; &lt; &#123;"column b"&rbrace; &lt; &#123;"column c"&rbrace;
                </code>
            </pre>
        </div>
        <p dir="auto">
            which is shorthand for:
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>
                  &#123;"column a"&rbrace; &lt; &#123;"column b"&rbrace; and &#123;"column b"&rbrace; &lt; &#123;"column c"&rbrace;
                </code>
            </pre>
        </div>
        <p dir="auto">
            Use <code>is None</code> and <code>is not None</code> for selecting
            rows that have null values. Otherwise, null values are ignored in
            most other uses.
        </p>
        <p dir="auto">
            You can combine comparisons using Python's <code>and</code> and{' '}
            <code>or</code> (use parentheses to force evaluation order different
            from Python's defaults):
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>
                    ((&#123;"loss"&rbrace; - &#123;"base line"&rbrace;) &lt; 0.5) or
                    (&#123;"loss"&rbrace; &gt; 0.95)
                </code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <h3 dir="auto">JSON attribute access</h3>
        <p dir="auto">
            For JSON and metadata columns, you can use the dot operator to access
            values:
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>&#123;"Image"&rbrace;.extension == "jpg"</code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <p dir="auto">or nested values:</p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>&#123;"Image"&rbrace;.labels.dog &gt; 1</code>
            </pre>
            <pre className="notranslate">
                <code>&#123;"Image"&rbrace;.labels.dog and &#123;"Image"&rbrace;.labels.cat</code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <p dir="auto">
             The dotted-name path following a column of JSON data deviates from Python
             semantics. In addition, the path can only be use for nested dictionaries.
             If the JSON has a list, then you will not be able to use the dotted-name syntax.
             However, you can use Python's list comprehension, like these examples:
        </p>
        <ul dir="auto">
	<li>
	  <code>any([x["label"] == 'dog' for x in &#123;"Image"&rbrace;.overlays])</code> - images with dogs
        </li>
	<li>
         <code>all([x["label"] == 'person' for x in &#123;"Image"&rbrace;.overlays])</code> - images with only people (no other labels)
	</li>
	<li>
        <code>any([x["label"] in ["car", "bicycle"] for x in &#123;"Image"&rbrace;.overlays])</code> - images with cars or bicycles
	</li>
	<li>
        <code>any([x["label"] == "cat" or x["label"] == "dog" for x in &#123;"Image"&rbrace;.overlays])</code> - images with dogs or cats
	</li>
	<li>
        <code>any([x["label"] == "cat" for x in &#123;"Image"&rbrace;.overlays]) and any([x["label"] == "dog" for x in &#123;"Image"&rbrace;.overlays])</code> - images with dogs and cats
	</li>
	<li>
        <code>any([x["score"] &gt; 0.999 for x in &#123;"Image"&rbrace;.overlays])</code> - images with an annotation score greater than 0.999
	</li>
     </ul>

        <p dir="auto">
             List comprehension also deviates slightly from standard Python semantics:
        </p>
        <ul dir="auto">
            <li>
             <code>[item for item in LIST]</code> - same as Python (item is each element in the list)
	    </li>
	    <li>
             <code>[item for item in DICT]</code> - item is the DICT
	    </li>
    </ul>
        <p dir="auto">
    Note that you will need to wrap the list comprehension in either
    <code>any()</code> or <code>all()</code>. You can also use <code>flatten()</code> around
    nested list comprehensions.
    </p>
        <p dir="auto">
            See below for more information on string and JSON methods.
        </p>
        <p dir="auto">
            Note that any mention of a column that contains an asset type (e.g.,
            an image) will automatically reference its metadata.
        </p>
        <h3 dir="auto">Python String and JSON methods</h3>
        <p dir="auto">These are mostly used with column values:</p>
        <ul dir="auto">
            <li>
                <code>STRING in &#123;"Column Name"&rbrace;</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.endswith(STRING)</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.startswith(STRING)</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.strip()</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.lstrip()</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.rstrip()</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.upper()</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.lower()</code>
            </li>
            <li>
                <code>&#123;"Column Name"&rbrace;.split(DELIM[, MAXSPLITS])</code>
            </li>
        </ul>
        <h3 dir="auto">Python if/else expression</h3>
        <p dir="auto">
            You can use Python's if/else expression to return one value or
            another.
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>
                    ("low" if &#123;"loss"&rbrace; &lt; 0.5 else "high") == "low"
                </code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <h3 dir="auto">Python Builtin Functions</h3>
        <p dir="auto">You can use any of these Python builtin functions:</p>
        <ul dir="auto">
            <li>
                <code>abs()</code> - absolute value
            </li>
            <li>
                <code>round()</code> - rounds to int
            </li>
            <li>
                <code>max(v1, v2, ...)</code> or <code>max([v1, v2, ...])</code>{' '}
                - maximum of list of values
            </li>
            <li>
                <code>min(v1, v2, ...)</code> or <code>min([v1, v2, ...])</code>{' '}
                - minimum of list of values
            </li>
            <li>
                <code>len()</code> - length of item
            </li>
        </ul>
        <h3 dir="auto">Aggregate Functions</h3>
        <p dir="auto">
            You can use the following aggregate functions. Note that these are
            more expensive to compute, as they require computing on all rows.
        </p>
        <ul dir="auto">
            <li>
                <code>AVG(&#123;"Column Name"&rbrace;)</code>
            </li>
            <li>
                <code>MAX(&#123;"Column Name"&rbrace;)</code>
            </li>
            <li>
                <code>MIN(&#123;"Column Name"&rbrace;)</code>
            </li>
            <li>
                <code>SUM(&#123;"Column Name"&rbrace;)</code>
            </li>
            <li>
                <code>TOTAL(&#123;"Column Name"&rbrace;)</code>
            </li>
            <li>
                <code>COUNT(&#123;"Column Name"&rbrace;)</code>
            </li>
            <li>
                <code>STDEV(&#123;"Column Name"&rbrace;)</code>
            </li>
        </ul>
        <p dir="auto">Examples:</p>
        <p dir="auto">
            Find all rows that have a loss value less than the average:
        </p>
        <div className="snippet-clipboard-content notranslate position-relative overflow-auto">
            <pre className="notranslate">
                <code>&#123;"loss"&rbrace; &lt; AVG(&#123;"loss"&rbrace;)</code>
            </pre>
            <div className="zeroclipboard-container position-absolute right-0 top-0"></div>
        </div>
        <h3 dir="auto">Python Library Functions and Values</h3>
        <p dir="auto">
            Functions from Python's <code>random</code> library:
        </p>
        <ul dir="auto">
            <li>
                <code>random.random()</code>
            </li>
            <li>
                <code>random.randint()</code>
            </li>
        </ul>
        <p dir="auto">
            Note that random values are regenerated on each call, and thus only
            have limited use. That means that every time the DataGrid is
            accessed, the values will change. This would result in bizarre
            results if you grouped or sorted by a random value.
        </p>
        <p dir="auto">
            Functions and values from Python's <code>math</code> library:
        </p>
        <ul dir="auto">
            <li>
                <code>math.pi</code>
            </li>
            <li>
                <code>math.sqrt()</code>
            </li>
            <li>
                <code>math.acos()</code>
            </li>
            <li>
                <code>math.acosh()</code>
            </li>
            <li>
                <code>math.asin()</code>
            </li>
            <li>
                <code>math.asinh()</code>
            </li>
            <li>
                <code>math.atan()</code>
            </li>
            <li>
                <code>math.atan2()</code>
            </li>
            <li>
                <code>math.atanh()</code>
            </li>
            <li>
                <code>math.ceil()</code>
            </li>
            <li>
                <code>math.cos()</code>
            </li>
            <li>
                <code>math.cosh()</code>
            </li>
            <li>
                <code>math.degrees()</code>
            </li>
            <li>
                <code>math.exp()</code>
            </li>
            <li>
                <code>math.floor()</code>
            </li>
            <li>
                <code>math.log()</code>
            </li>
            <li>
                <code>math.log10()</code>
            </li>
            <li>
                <code>math.log2()</code>
            </li>
            <li>
                <code>math.radians()</code>
            </li>
            <li>
                <code>math.sin()</code>
            </li>
            <li>
                <code>math.sinh()</code>
            </li>
            <li>
                <code>math.tan()</code>
            </li>
            <li>
                <code>math.tanh()</code>
            </li>
            <li>
                <code>math.trunc()</code>
            </li>
        </ul>
        <p dir="auto">
            Functions and values from Python's <code>datetime</code> library:
        </p>
        <ul dir="auto">
            <li>
                <code>datetime.date(YEAR, MONTH, DAY)</code>
            </li>
            <li>
                <code>
                    datetime.datetime(YEAR, MONTH, DAY[, HOUR, MINUTE, SECOND])
                </code>
            </li>
        </ul>
    </div>
);

export default HelpText;
