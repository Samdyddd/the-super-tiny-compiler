# 介绍

现在我们准备写一个编译器。是一个超级小型的编译器。它的实际代码只有200行左右。
准备将一些`lisp-like`函数编译成`C-like`函数。
如果你对其中一个不熟悉，现在给大家简单介绍下。

我们现有有两个函数`add`和`subtract`，类似如下：
|--|LISP-style|C-style|
|--|--|--|
|2+2|(add 2 2)|add(2,2)|
|4-2|(subtract 4 2)| subtract(4,2)|
|2+(4-2)|(add 2 (subtract 4 2)) |add(2, subtract(4, 2))|

以上很简单吧？

以上正是我们需要编译的。虽然这不是一个完整的LISP或C语法，但它足够演示现代编译器的许多主要部分。

# 编译器阶段

大多数编译器分解成以下3个阶段： Parsing(语法分析), Transformation(转换), code generation(代码生成)。

> 1. parsing：将原始代码转换成更抽象的表示。
  2. Transformation: 采用这种抽象表示，并按照编译器的要求进行操作。
  3. code generation: 将转换后的表示代码转换成新的代码。


## Parsing

Parsing(解析)通常分为两个阶段：词法分析和句法分析。

Lexical Analysis（词法分析器）获取原始代码，并通过一个名为分词器（tokenizer）（或lexer）的东西将其分解为这些称为记号的东西。

tokens是一组很小的对象，它们描述语法的一个独立部分。它们可以是数字、标签、标点符号、操作符等等。

Syntactic Analysis(词法分析器)标记并将它们重新格式化为一个表示，该表示描述语法的每个部分及其彼此之间的关系。这就是所谓的中间表示法（Intermediate Representation）或抽象语法树(Abstract Syntax Tree)。

Abstract Syntax Tree(AST,抽象语法树)，是一个深度嵌套的对象，它以一种既易于使用又能告诉我们很多信息的表示代码。

对于以下语法：

> (add 2 (subtract 4 2))

Tokens可能是如下：

> [
    {type: 'paren', value: '('      },
    {type: 'name', value: 'add'      },
    {type: 'number', value: '2'      },
    {type: 'paren', value: '('      },
    {type: 'name', value: 'subtract' },
    {type: 'number', value: '4'      },
    {type: 'number', value: '2'      },
    {type: 'paren', value: ')'      },
    {type: 'paren', value: ')'      },

  ]

Abstract Syntax Tree(AST)可能是如下：

> {
    type: 'Program',
    body: [{
      type: 'CallExpression',
      name: 'add',
      params: [{
        type: 'NumberListeral',
        value: '2',
      },{
        type: 'CallExpression',
        name: 'subtract',
        params: [{
          type: 'NumberLiteral',
          value: '4',
        },{
          type: 'NumberLiteral',
          value: '2',
        }]
      }]
    }]
  }

## Transformation

编译器的下一个阶段是转换（transformation）。同样，这只是从最后一步获取AST并对其进行更改。它可以在同一种语言中操作AST，也可以将它翻译成一种全新的语言。

看看如何转换AST。

你可能注意到，AST中的元素看起来非常相似。这些对象具有type属性。每个节点都称为AST节点。这些节点上定义了描述树的一个孤立部分的属性。

有一个节点"NumberLiteral":

> {
    type: 'NumberLiteral',
    value: '2',
  }

或一个节点"CallExpression":
> {
    type: 'CallExpression',
    name: 'subtract',
    params: [
      // 嵌套节点
    ],
  }

在转换AST时，我们可以通过添加、删除、替换属性来操作节点，可以添加新节点、删除节点，或者我们可以不使用现有的AST并基于它创建一个全新的AST。

由于我们的目标是一种新语言，所以我们将重点创建一个针对目标语言的全新AST。


## Traversal(遍历)

为了浏览所有这些节点，我们需要能够遍历它们。这个遍历过程首先遍历AST深度的每个节点。

> {
    type: 'Program',
    body: [{
      type: 'CallExpression',
      name: 'add',
      params: [{
        type: 'NumberLiteral',
        value: '2'
      },{
        type: 'CallExpression',
        name: 'subtract',
        params: [{
          type: 'NumberLiteral',
          value: '4'
        },{
          type: 'NumberLiteral',
          value: '2'
        }]
      }]
    }]
  }

对于上面的AST,我们会：

> 1. Program - 从AST的顶层开始
  2. CallExpression: - 移动到程序主体的第一个元素
  3. NumberLiteral: - 移动到CallExpression参数的第一个元素
  4. CallExpression(subtract): - 移动到CallExpression参数的第二个元素
  5. NumberLiteral(4): - 
  6. NumberLiteral(2): - 

如果我们直接操作这个AST, 而不是创建一个单独的AST,我们可能会在这里引入各种抽象。但是仅仅访问树中的每个节点就足够了。

### Visitor(访问者)

将创建一个visitor对象来接受不同类型的节点。

> var visitor = {
    NumberLiteral() {},
    CallExpression() {},
  }

当我们遍历AST时，无论何时

> var visitor = {
  NumberLiteral(node, parent) {},
  CallExpression(node, parent) {},
}

但是，在"exit"时也存在调用事物的可能性。想象一下树结构从以前的列表形式：
> * Program
    * CallExpression
      * NumberLiteral
      * CallExpression
        * NumberLiteral
        * NumberLiteral

当我们向下走时，会到达没有尽头的分支。当我们完成树的每个分支时，我们“exit”,因此，沿着树向下“enter”时，然后向上“exit”。

> * \rightarrow Program(enter)
    * \rightarrow CallExpression(enter)
      * \rightarrow NumberLiteral(enter)
      * \leftarrow NumberLiteral(exit)
      * \rightarrow CallExpression(enter)
        * \rightarrow NumberLiteral(enter)
        * \leftarrow NumberLiteral(exit)
        * \rightarrow NumberLiteral(enter)
        * \leftarrow NumberLiteral(exit)
      * \leftarrow CallExpression(exit)
    * \leftarrow CallExpression(exit)
  * \leftarrow Program(exit)

为了支持这一点，“visitor”最终形成以下：

> var visitor = {
    NumberLiteral: {
      enter(node, parent) {},
      exit(node, parent) {},
    }
  }


# Code Generation

编译器的最后一个阶段是代码生成。有时编译器会做一些与转换重叠的事情，大多情况下，代码生成意味着将AST和string-ify代码拿出来。

代码生成器工作有若干的方式，一些编译器会重用早期的tokens, 一些会以线性打印节点的单独的代码表示。
但是我们的方式是已以上创建的为准；

我们的代码生成器将指导如何“print”AST的所有不同节点类型，并将递归地调用自己来打印嵌套节点，直到所有内容都打印到一个长串代码中。

--------------------------------------

以上就是简单介绍编译器的工作步骤。



