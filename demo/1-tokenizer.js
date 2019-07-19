/**
 * tokenizer.js
 * 我们充第一个阶段解析开始，词法分析， tokenizer。
 * 
 * (add 2 (subtract 4 2)) => [{type: 'paren', value: '('}]
 */

//  首先接受一个输入字符串，然后设置两个东西

function tokenizer(input) {
  // 一个‘current’变量，用于像光标一样跟踪代码中的位置
  let current = 0;

  // 
  let tokens = [];

  // 创建一个while选好，在其中设置current,变量要根据内部递增
  // 
  // 多次递增current循环，tokens是任意长度；
  // 
  while(current < input.length) {
    
    let char = input[current];

    if(char === '(') {
      tokens.push({
        type: 'paren',
        value: '(',
      });
    
    
    current++;

    continue;
    }

    if(char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    let WHITESPACE = /\s/;
    if(WHITESPACE.test(char)) {
      current++;
      continue;
    }

    let NUMBERS = /[0-9]/;
    if(NUMBERS.test(char)) {
      let value = '';

      while(NUMBERS.test(char)) {
        value += char;
        char = input [++current];
      }

      tokens.push({type: 'number', value});

      continue;
    }

    if(char === '"') {
      let value = '';
      char = input[++current];

      while(char !== '"') {
        value += char;
        char = input[++current];
      }

      char = input[++current];

      tokens.push({type: 'string', value});

      continue;
    }

    let LETTERS = /[a-z]/i;
    if(LETTERS.test(char)) {
      let value = '';

      while(LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({type: 'name', value});

      continue;
    }

    throw new TypeError('I dont konw what this caracter is: ' + char);

  }

  return tokens;

}

module.exports = tokenizer;





