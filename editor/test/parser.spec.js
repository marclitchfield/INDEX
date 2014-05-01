describe('parser', function() {
  it('named reference', function() {
    whenParsed('ref');
    expect(parseTree.ref.name).toBe('ref');
  });

  it('variable declarations', function() {
    whenParsed('var ref1, ref2');
    expect(parseTree['var'][0].def.ref.name).toBe('ref1');
    expect(parseTree['var'][1].def.ref.name).toBe('ref2');
  });

  it('assignment', function() {
    whenParsed('lvalue=rvalue');
    expect(parseTree.assignment.lvalue.ref.name).toBe('lvalue');
    expect(parseTree.assignment.op).toBe('=');
    expect(parseTree.assignment.rvalue.ref.name).toBe('rvalue');
  });

  it('string literal', function() {
    whenParsed('"use strict"');
    expect(parseTree.literal.type).toBe('string');
    expect(parseTree.literal.value).toBe('use strict');
  });

  it('number literal', function() {
    whenParsed('123');
    expect(parseTree.literal.type).toBe('number');
    expect(parseTree.literal.value).toBe(123);
  });

  it('assignment to zero literal', function() {
    whenParsed('x=0');
    expect(parseTree.assignment.lvalue.ref.name).toBe('x');
    expect(parseTree.assignment.rvalue.literal.type).toBe('number');
    expect(parseTree.assignment.rvalue.literal.value).toBe(0);
  });

  it('boolean literal', function() {
    whenParsed('true');
    expect(parseTree.literal.type).toBe('boolean');
    expect(parseTree.literal.value).toBe(true);
  });

  it('undefined literal', function() {
    whenParsed('undefined');
    expect(parseTree.literal.type).toBe('undefined');
    expect(parseTree.literal.value).toBe('');
  });

  it('function definition', function() {
    whenParsed('function f(arg1,arg2) { ref }');
    expect(parseTree['function'].ref.name).toBe('f');
    expect(parseTree['function'].args[0].name).toBe('arg1');
    expect(parseTree['function'].args[1].name).toBe('arg2');
    expect(parseTree['function'].expressions[0].ref.name).toBe('ref');
  });

  it('function definition with expressions', function() {
    whenParsed('function f() { console.log("hello, world!"); }');
    expect(parseTree['function'].ref.name).toBe('f');
    var expression = parseTree['function'].expressions[0];
    expect(expression.call.object.prop.object.ref.name).toBe('console');
    expect(expression.call.object.prop.key.ref.name).toBe('log');
    expect(expression.call.args[0].literal.value).toBe('hello, world!');
  })

  it('function call', function() {
    whenParsed('f(x)');
    expect(parseTree.call.object.ref.name).toBe('f');
    expect(parseTree.call.args[0].ref.name).toBe('x');
  });

  it('property reference', function() {
    whenParsed('a.b.c.d');
    expect(parseTree.prop.object.prop.object.prop.object.ref.name).toBe('a');
    expect(parseTree.prop.object.prop.object.prop.key.ref.name).toBe('b');
    expect(parseTree.prop.object.prop.key.ref.name).toBe('c');
    expect(parseTree.prop.key.ref.name).toBe('d');
  });

  it('property of function call', function() {
    whenParsed('f(x).g');
    expect(parseTree.prop.object.call.object.ref.name).toBe('f');
    expect(parseTree.prop.object.call.args[0].ref.name).toBe('x');
    expect(parseTree.prop.key.ref.name).toBe('g');
  });

  it('property function call', function() {
    whenParsed('f(x).g(y).h');
    expect(parseTree.prop.object.call.object.prop.object.call.object.ref.name).toBe('f');
    expect(parseTree.prop.object.call.object.prop.object.call.args[0].ref.name).toBe('x');
    expect(parseTree.prop.object.call.object.prop.key.ref.name).toBe('g');
    expect(parseTree.prop.object.call.args[0].ref.name).toBe('y');
    expect(parseTree.prop.key.ref.name).toBe('h');
  });

  it('sub', function() {
    whenParsed('a[b]');
    expect(parseTree.sub.object.ref.name).toBe('a');
    expect(parseTree.sub.key.ref.name).toBe('b');
  });

  it('prop', function() {
    whenParsed('a.b');
    expect(parseTree.prop.object.ref.name).toBe('a');
    expect(parseTree.prop.key.ref.name).toBe('b');
  });

  it('prop and sub', function() {
    whenParsed('a.b[c]');
    expect(parseTree.sub.object.prop.object.ref.name).toBe('a');
    expect(parseTree.sub.object.prop.key.ref.name).toBe('b');
    expect(parseTree.sub.key.ref.name).toBe('c');
  });

  it('sub and prop', function() {
    whenParsed('a[b].c');
    expect(parseTree.prop.object.sub.object.ref.name).toBe('a');
    expect(parseTree.prop.object.sub.key.ref.name).toBe('b');
    expect(parseTree.prop.key.ref.name).toBe('c');
  });

  it('prop in sub', function() {
    whenParsed('a[b.c]');
    expect(parseTree.sub.object.ref.name).toBe('a');
    expect(parseTree.sub.key.prop.object.ref.name).toBe('b');
    expect(parseTree.sub.key.prop.key.ref.name).toBe('c');
  });

  it('prop and call', function() {
    whenParsed('a.b()');
    expect(parseTree.call.object.prop.object.ref.name).toBe('a');
    expect(parseTree.call.object.prop.key.ref.name).toBe('b');
  });

  it('prop and call in sub', function() {
    whenParsed('a[b().c]');
    expect(parseTree.sub.object.ref.name).toBe('a');
    expect(parseTree.sub.key.prop.object.call.object.ref.name).toBe('b');
    expect(parseTree.sub.key.prop.key.ref.name).toBe('c');
  });

  it('sub and call', function() {
    whenParsed('a()[b]');
    expect(parseTree.sub.object.call.object.ref.name).toBe('a');
    expect(parseTree.sub.key.ref.name).toBe('b');
  });

  it('binary operator', function() {
    whenParsed('1+2');
    expect(parseTree.binary.op).toBe('+');
    expect(parseTree.binary.left.literal.value).toBe(1);
    expect(parseTree.binary.right.literal.value).toBe(2);
  });

  it('unary operator', function() {
    whenParsed('!x');
    expect(parseTree.unary.op).toBe('!');
    expect(parseTree.unary.operand.ref.name).toBe('x');
  });

  it('ternary operator', function() {
    whenParsed('a?1:0');
    expect(parseTree.ternary['if'].ref.name).toBe('a');
    expect(parseTree.ternary['then'].literal.value).toBe(1);
    expect(parseTree.ternary['else'].literal.value).toBe(0);
  });

  it('if expression', function() {
    whenParsed('if (true) { a() } else { b() }');
    expect(parseTree['if'].condition.literal.value).toBe(true);
    expect(parseTree['if']['then'].expressions[0].call.object.ref.name).toBe('a');
    expect(parseTree['if']['else'].expressions[0].call.object.ref.name).toBe('b');
  });

  it('object literal', function() {
    whenParsed('return { "a": 1, "b": 2 }');
    expect(parseTree['return'].hash.entries[0].key.literal.value).toBe('a');
    expect(parseTree['return'].hash.entries[0].value.literal.value).toBe(1);
    expect(parseTree['return'].hash.entries[1].key.literal.value).toBe('b');
    expect(parseTree['return'].hash.entries[1].value.literal.value).toBe(2);
  });

  it('new', function() {
    whenParsed('new F(x)');
    expect(parseTree['new'].call.object.ref.name).toBe('F');
    expect(parseTree['new'].call.args[0].ref.name).toBe('x');
  });

  var parserInstance;
  var parseTree;

  function whenParsed(code) {
    parseTree = parserInstance.parse(code);
  }

  beforeEach(function(done) {
    if (parserInstance === undefined)
    {
      parser.load('javascript', function(instance) {
        parserInstance = instance;
        done();
      });
    } else {
      done();
    }
  });

});