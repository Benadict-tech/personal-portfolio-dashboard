// Tiny arithmetic evaluator: digits, + - * / %, parens, decimals. No eval().
export function evaluate(input) {
  const s = input.replace(/\s+/g, "");
  let i = 0;

  const peek = () => s[i];
  const eat = () => s[i++];

  function parseExpr() {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  function parseTerm() {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const r = parseFactor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }

  function parseFactor() {
    let v;
    if (peek() === "-") {
      eat();
      v = -parseFactor();
    } else if (peek() === "(") {
      eat();
      v = parseExpr();
      if (eat() !== ")") throw new Error("mismatched parens");
    } else {
      let num = "";
      while (/[\d.]/.test(peek() || "")) num += eat();
      if (!num || isNaN(Number(num))) throw new Error("bad number");
      v = Number(num);
    }
    // % is a postfix operator: 50% -> 0.5, (1+1)% -> 0.02
    while (peek() === "%") {
      eat();
      v /= 100;
    }
    return v;
  }

  const result = parseExpr();
  if (i !== s.length) throw new Error("trailing input");
  return result;
}
