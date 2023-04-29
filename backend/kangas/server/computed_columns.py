# -*- coding: utf-8 -*-
######################################################
#     _____                  _____      _     _      #
#    (____ \       _        |  ___)    (_)   | |     #
#     _   \ \ ____| |_  ____| | ___ ___ _  _ | |     #
#    | |  | )/ _  |  _)/ _  | |(_  / __) |/ || |     #
#    | |__/ ( ( | | | ( ( | | |__| | | | ( (_| |     #
#    |_____/ \_||_|___)\_||_|_____/|_| |_|\____|     #
#                                                    #
#    Copyright (c) 2023 Kangas Development Team      #
#    All rights reserved                             #
######################################################

import ast

import astor

## FIXME:
## 1. No support for substrings
## 2. No support for slices, [:]


class AttributeNode:
    def __init__(self, obj, attr):
        self.obj = obj
        self.attr = attr

    def __str__(self):
        if self.obj in ["random", "math", "datetime", "statistics"]:
            raise Exception(
                "uncalled or unknown method '%s.%s'" % (self.obj, self.attr)
            )

        return "json_extract({obj}, '$.{attr}')".format(
            obj=self.obj,
            attr=self.attr,
        )

    def __repr__(self):
        return "{obj}.{attr}".format(
            obj=self.obj,
            attr=self.attr,
        )


class Evaluator:
    def __init__(self):
        # Selections keep track of aggregate select clauses
        self.selections = {}
        self.operators = {
            ast.Mod: "({leftOperand} % {rightOperand})",
            ast.Add: "({leftOperand} + {rightOperand})",
            ast.Sub: "({leftOperand} - {rightOperand})",
            ast.Mult: "({leftOperand} * {rightOperand})",
            ast.Div: "({leftOperand} / {rightOperand})",
            ast.Pow: "POW({leftOperand}, {rightOperand})",
            ast.Not: "not {operand}",
            ast.FloorDiv: "(CAST (({leftOperand} / {rightOperand}) AS INT))",
            ast.USub: "-{operand}",
        }

    def eval_expr(self, pyexp):
        """
        Given a Python expression as a string, evaluate it
        returning it as a SQL expression.
        """
        node = ast.parse(pyexp, mode="eval").body
        return str(self.eval_node(node))

    def eval_node(self, node):
        """
        Given an AST node, evaluate it and return as an SQL expression
        """
        if isinstance(node, ast.Num):
            return str(node.n)
        elif isinstance(node, ast.BinOp):
            template = self.operators[type(node.op)]
            args = {
                "leftOperand": self.eval_node(node.left),
                "rightOperand": self.eval_node(node.right),
            }
            return template.format(**args)
        elif isinstance(node, ast.UnaryOp):
            template = self.operators[type(node.op)]
            args = {
                "operand": self.eval_node(node.operand),
            }
            return template.format(**args)
        elif isinstance(node, ast.Name):
            return str(node.id)
        elif isinstance(node, (ast.Constant, ast.NameConstant)):
            if node.value is None:
                return "null"
            else:
                return repr(node.value)
        elif isinstance(node, ast.Call):
            function_name = self.eval_node(node.func)
            args = [self.eval_node(arg) for arg in node.args]
            if function_name in [
                "AVG",
                "MAX",
                "MIN",
                "SUM",
                "TOTAL",
                "COUNT",
                "STDEV",
            ]:
                if len(args) != 1:
                    raise Exception(
                        "Aggregate functions take one argument, the {'Column name'}"
                    )
                elif not (args[0].startswith("{'") and args[0].endswith("'}")):
                    raise Exception(
                        "Aggregate function must be applied to a column: got %r"
                        % args[0]
                    )
                # aggregate functions here
                column_name = args[0][2:-2].lower()
                expr = "{function_name}({{'{column_name}'}})".format(
                    function_name=function_name,
                    column_name=column_name,
                )
                # Associate selection with aggregate:
                aggregate_selection_name = "%s_aggregate_column_%s" % (function_name, 1)
                self.selections[aggregate_selection_name] = expr
                return aggregate_selection_name
            elif function_name in [
                "any",
                "all",
                "len",
                "flatten",
                "avg",
                "sum",
                "range",
            ]:
                ## Sqlite functions
                function_map = {
                    "any": "ANY_IN_GROUP",
                    "all": "ALL_IN_GROUP",
                    "len": "LENGTH",
                    "avg": "MEAN",
                    "flatten": "FLATTEN",
                    "sum": "SUM_OF_LIST",
                    "range": "RANGE",
                }
                sargs = ", ".join([str(arg) for arg in args])
                expr = "{function_name}({sargs})".format(
                    function_name=function_map[function_name],
                    sargs=sargs,
                )
                return expr
            elif function_name in ["abs", "round", "max", "min"]:
                # Special case to deal with Python's min([...]), max([...])
                # to turn into SQL's min(...), max(...)
                if args[0].startswith("(") and args[0].endswith(")"):
                    args[0] = args[0][1:-1]
                sargs = ", ".join([str(arg) for arg in args])
                expr = "{function_name}({sargs})".format(
                    function_name=function_name,
                    sargs=sargs,
                )
                if function_name == "round":
                    return "CAST(%s AS int)" % expr
                else:
                    return expr
            elif isinstance(function_name, AttributeNode):
                if function_name.obj == "random":
                    if function_name.attr == "random":
                        return "(((random() / 9223372036854775808) + 1.0) / 2.0)"
                    elif function_name.attr == "randint":
                        if len(args) < 2:
                            raise Exception(
                                "missing arguments to %r" % repr(function_name)
                            )

                        start = int(args[0])
                        stop = int(args[1])
                        span = stop - start
                        return "CAST(((((random() / 9223372036854775808) + 1.0) / 2) * {span} + {start}) AS int)".format(
                            span=span, start=start
                        )
                    else:
                        raise Exception("unsupported method %r" % repr(function_name))
                elif function_name.obj == "datetime":
                    if function_name.attr == "date":
                        # datetime.date(year, month, day)
                        if len(args) < 3:
                            raise Exception(
                                "missing arguments to %r" % repr(function_name)
                            )

                        year = int(args[0])
                        month = int(args[1])
                        day = int(args[2])
                        return (
                            """strftime('%s', '{year}-{month:02d}-{day:02d}')""".format(
                                year=year, month=month, day=day
                            )
                        )
                    elif function_name.attr == "datetime":
                        # YYYY-MM-DD HH:MM:SS
                        if len(args) < 3:
                            raise Exception(
                                "missing arguments to %r" % repr(function_name)
                            )

                        year = int(args[0])
                        month = int(args[1])
                        day = int(args[2])
                        hour = int(args[3]) if len(args) > 3 else 0
                        minute = int(args[4]) if len(args) > 4 else 0
                        second = int(args[5]) if len(args) > 5 else 0

                        return """strftime('%s', '{year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}')""".format(
                            year=year,
                            month=month,
                            day=day,
                            hour=hour,
                            minute=minute,
                            second=second,
                        )
                    else:
                        raise Exception("unsupported method %r" % repr(function_name))
                elif function_name.obj == "statistics":
                    if len(args) == 0:
                        raise Exception(
                            "missing argument to method %r" % repr(function_name)
                        )

                    sargs = ", ".join([str(arg) for arg in args])
                    if function_name.attr == "mean":
                        expr = "MEAN({sargs})".format(
                            sargs=sargs,
                        )
                        return expr
                    else:
                        raise Exception("unsupported method %r" % repr(function_name))
                elif function_name.obj == "math":
                    if len(args) == 0:
                        raise Exception(
                            "missing argument to method %r" % repr(function_name)
                        )

                    sargs = ", ".join([str(arg) for arg in args])
                    if function_name.attr == "sqrt":
                        expr = "sqrt({sargs})".format(
                            sargs=sargs,
                        )
                        return expr
                    elif function_name.attr == "acos":
                        return "acos({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "acosh":
                        return "acosh({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "asin":
                        return "asin({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "asinh":
                        return "asinh({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "atan":
                        return "atan({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "atan2":
                        return "atan2({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "atanh":
                        return "atanh({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "ceil":
                        return "ceil({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "cos":
                        return "cos({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "cosh":
                        return "cosh({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "degrees":
                        return "degrees({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "exp":
                        return "exp({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "floor":
                        return "CAST({sargs} AS int)".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "log":
                        return "log({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "log10":
                        return "log10({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "log2":
                        return "log2({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "radians":
                        return "radians({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "sin":
                        return "sin({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "sinh":
                        return "sinh({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "tan":
                        return "tan({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "tanh":
                        return "tanh({sargs})".format(
                            sargs=sargs,
                        )
                    elif function_name.attr == "trunc":
                        return "trunc({sargs})".format(
                            sargs=sargs,
                        )
                    else:
                        raise Exception("unsupported method %r" % repr(function_name))

                elif function_name.attr in [
                    "contains",
                    "endswith",
                    "startswith",
                ]:
                    # FIXME: remove contains... that was a mistake: use IN

                    # FIXME: args[0] could be a string, or a field_name
                    # Assuming string for now in contains, startswith, endswith
                    # because of special form in SQL:

                    if (
                        len(args) != 1
                        or len(args[0]) < 2
                        or len(set([args[0][0], args[0][-1]])) != 1
                        or args[0][0] not in ["'", '"']
                    ):
                        raise Exception(
                            "%r function requires a string" % function_name.attr
                        )

                    if function_name.attr == "contains":
                        return "like('%s', %s)" % (
                            "%" + args[0][1:-1] + "%",
                            function_name.obj,
                        )
                    elif function_name.attr == "endswith":
                        return "like('%s', %s)" % (
                            "%" + args[0][1:-1],
                            function_name.obj,
                        )
                        pass
                    elif function_name.attr == "startswith":
                        return "like('%s', %s)" % (
                            args[0][1:-1] + "%",
                            function_name.obj,
                        )

                elif function_name.attr == "strip":
                    return "trim(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "lstrip":
                    return "ltrim(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "rstrip":
                    return "rtrim(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "upper":
                    return "upper(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "lower":
                    return "lower(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "split":
                    return "SPLIT(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "keys":
                    return "KEYS_OF(%s)" % ", ".join([str(function_name.obj)] + args)
                elif function_name.attr == "values":
                    return "VALUES_OF(%s)" % ", ".join([str(function_name.obj)] + args)
                else:
                    raise Exception("unknown method %r" % repr(function_name))
            else:
                raise ValueError("invalid function %s" % repr(function_name))

        elif isinstance(node, ast.IfExp):
            args = {
                "result_1": self.eval_node(node.body),
                "test_1": self.eval_node(node.test),
                "result_2": self.eval_node(node.orelse),
            }
            return "(CASE WHEN {test_1} THEN {result_1} ELSE {result_2} END)".format(
                **args
            )
        elif isinstance(node, ast.Compare):
            comparators = [self.eval_node(arg) for arg in node.comparators]
            ops = [self.eval_node(arg) for arg in node.ops]
            left = self.eval_node(node.left)

            if ops[0] in [" IN ", " NOT IN "]:
                if not (
                    isinstance(comparators[0], str) and comparators[0].startswith("(")
                ):
                    if ops[0] == " IN ":
                        return "IN_OBJ(%s, %s)" % (left, comparators[0])
                    elif ops[0] == " NOT IN ":
                        return "NOT IN_OBJ(%s, %s)" % (left, comparators[0])

            retval = ""
            for op, right in zip(ops, comparators):
                if retval:
                    retval += " and "
                retval += "{left} {op} {right}".format(left=left, op=op, right=right)
                left = right
            return retval

        elif isinstance(node, ast.Attribute):
            obj = self.eval_node(node.value)
            attr = node.attr
            ## Special case
            if obj == "math" and attr == "pi":
                return "pi()"

            return AttributeNode(obj, attr)

        elif isinstance(node, ast.Lt):
            return "<"
        elif isinstance(node, ast.Gt):
            return ">"
        elif isinstance(node, ast.Eq):
            return "="
        elif isinstance(node, ast.Is):
            return "is"
        elif isinstance(node, ast.LtE):
            return "<="
        elif isinstance(node, ast.GtE):
            return ">="
        elif isinstance(node, ast.NotEq):
            return "!="
        elif isinstance(node, ast.IsNot):
            return "is not"
        elif isinstance(node, ast.And):
            return "and"
        elif isinstance(node, ast.Or):
            return "or"
        elif isinstance(node, ast.BoolOp):
            values = [self.eval_node(value) for value in node.values]
            op = self.eval_node(node.op)
            return "(" + (" %s " % op).join([str(value) for value in values]) + ")"
        elif isinstance(node, ast.Tuple):
            args = [self.eval_node(arg) for arg in node.elts]
            return "(" + (", ".join([str(arg) for arg in args])) + ")"
        elif isinstance(node, ast.In):
            return " IN "
        elif isinstance(node, ast.NotIn):
            return " NOT IN "
        elif isinstance(node, ast.List):
            args = [self.eval_node(arg) for arg in node.elts]
            if len(args) == 0:
                return "null"

            return "(" + (", ".join([str(arg) for arg in args])) + ")"
        elif isinstance(node, ast.Set):
            ## Special format for delayed evaluation of computed
            ## columns
            computed_column_name = self.eval_node(node.elts[0])
            return "{%s}" % computed_column_name.lower()
        elif isinstance(node, ast.Str):
            ## Python 3.7
            return repr(node.s)
        elif isinstance(node, ast.Index):
            return self.eval_node(node.value)
        elif isinstance(node, ast.Subscript):
            index = self.eval_node(node.slice)
            obj = self.eval_node(node.value)
            return "json_extract(%s, '$[%s]')" % (obj, index)
        elif isinstance(node, ast.ListComp):
            # [x for y in json_list if ...]
            # [x.label == 'hello' for x in {"image"}.overlays if ...]
            x = astor.to_source(node.elt).strip()
            y = astor.to_source(node.generators[0].target).strip()
            json_list = self.eval_node(node.generators[0].iter)
            ifs = ",".join(
                escape(astor.to_source(node).strip()) for node in node.generators[0].ifs
            )
            return 'ListComprehension("%s", "%s", %s, "%s")' % (
                escape(x),
                escape(y),
                json_list,
                ifs,
            )

        raise TypeError(node)


def escape(string):
    s1 = str(string).replace("{'", "__lbrace__").replace("'}", "__rbrace__")
    s2 = s1.replace("'", "&#39;").replace('"', "&#34;").replace(",", "&#44;")
    s3 = s2.replace("__lbrace__", "{'").replace("__rbrace__", "'}")
    return s3


def eval_computed_columns(computed_columns, where_expr=None):
    """
    Takes: list of computed_columns: {
      "New date": {
         "field_expr": "{'date'} + 7",
         "field_name": "cc1"
         "type": "INTEGER"
      }
    }

    and a where_expr (with computed expressions) and returns:

    {NAME: {
        "field_expr": "...",
        "field_name": "...",
        "type": "..."
    }, SELECTIONS

    where:
        * NAME is the SQL field name
        * expr is the SQL expression
        * type is a DATAGRID types (INTEGER, IMAGE-ASSET, etc)
        * SELECTIONS is a dict of NAME mapped to SQL sub selects
    """
    evaluator = Evaluator()
    where_sql = None
    # new columns:
    new_columns = {}
    if computed_columns:
        for name in computed_columns:
            expr = computed_columns[name]["field_expr"]
            pyexp = str(expr)
            sql_expr = evaluator.eval_expr(pyexp)
            new_columns[name] = {
                "field_expr": sql_expr,
                "type": computed_columns[name]["type"],
                "field_name": computed_columns[name]["field_name"],
            }

    if where_expr:
        where_sql = evaluator.eval_expr(where_expr)

    return (
        new_columns,
        evaluator.selections,
        where_sql,
    )


def update_state(
    computed_columns,
    metadata,
    databases,
    columns,
    select_expr_as,
    where_expr=None,
):
    """
    The top-level function to evaluate computed columns and computed
    expressions.

    The side effects are that the fields are added to `metadata`,
    the needed computed aggregates are added to `databases`,
    the new computed columns are added to `columns`, and the
    additional select-as expressions are added to select_expr_as.

    Returns the SQL where clause, if `where_expr` is provided.
    """
    new_columns, select_map, where_sql = eval_computed_columns(
        computed_columns, where_expr
    )

    def name_to_key(name):
        """
        Replace names with their metadata fields
        in order to query JSON data.
        """
        if name.endswith("--metadata"):
            name = name[0:-10]
        return "'%s'" % name.lower()

    columns_to_field_name = {
        name_to_key(name): metadata[name]["field_name"] for name in metadata
    }
    columns_to_field_name.update(
        {name_to_key(name): new_columns[name]["field_name"] for name in new_columns}
    )
    columns_to_field_expr = {
        name_to_key(name): metadata[name]["field_name"] for name in metadata
    }
    columns_to_field_expr.update(
        {name_to_key(name): new_columns[name]["field_expr"] for name in new_columns}
    )

    if where_sql:
        where_sql = where_sql.format(**columns_to_field_name)

    ## Database views to select from:
    for select_name in select_map:
        select_expr = select_map[select_name]
        database = "(SELECT rowid, %s AS %s FROM datagrid)" % (
            select_expr,
            select_name,
        )
        database = database.format(**columns_to_field_expr)
        databases.append(database)

    ## Add to metadata, columns and add to select_expr_as:
    for column_name in new_columns:
        field_expr = new_columns[column_name]["field_expr"].format(
            **columns_to_field_name
        )
        field_type = new_columns[column_name]["type"]
        field_name = new_columns[column_name]["field_name"]
        ## Computed columns expr based on prior computed columns
        ## names should replace {"prev column"} with prev column
        ## expr_field:
        columns_to_field_name[name_to_key(column_name)] = field_expr
        columns.append(column_name)
        metadata[column_name] = {
            "field_expr": field_expr,
            "type": field_type,
            "field_name": field_name,
        }
        sub_select = "%s AS %s" % (field_expr, field_name)
        select_expr_as.append(sub_select)

    return where_sql


def unify_computed_columns(computed_columns):
    if computed_columns:
        # Turn quick form into full form.
        # Updates computed_columns in place
        for i, (column_name, expr) in enumerate(computed_columns.items()):
            if isinstance(expr, str):
                computed_columns[column_name] = {
                    "field_expr": expr,
                    "field_name": "cc%d" % i,
                    "type": "TEXT",
                }
            else:
                if "type" not in computed_columns[column_name]:
                    computed_columns[column_name]["type"] = "TEXT"
                if "field_name" not in computed_columns[column_name]:
                    computed_columns[column_name]["field_name"] = "cc%d" % i
                if "expr" in computed_columns[column_name]:
                    computed_columns[column_name]["field_expr"] = computed_columns[
                        column_name
                    ]["expr"]
                    del computed_columns[column_name]["expr"]
