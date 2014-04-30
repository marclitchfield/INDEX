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

  it('function definition', function() {
    whenParsed('function f(arg1,arg2) { ref }');
    expect(parseTree['function'].ref.name).toBe('f');
    expect(parseTree['function'].args[0].name).toBe('arg1');
    expect(parseTree['function'].args[1].name).toBe('arg2');
    expect(parseTree['function'].expressions[0].ref.name).toBe('ref');
  });

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