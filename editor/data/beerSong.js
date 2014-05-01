function verse(number) {
  return capitalize(transform("$X bottle(s) of beer on the wall, $X bottle(s) of beer.\n" +
    "[Take $some down and pass it around|Go to the store and buy some more], " +
    "[$X-1|99] bottle(-1:s) of beer on the wall.\n"));

  function transform(pattern) {
    return pattern
      .replace(/\$X-1/g, numberText(number-1))
      .replace(/\$X/g, numberText(number))
      .replace(/\$some/g, number === 1 ? 'it' : 'one')
      .replace(/\(s\)/g, number === 1 ? '' : 's')
      .replace(/\(-1:s\)/g, number-1 === 1 ? '' : 's')
      .replace(/\[(.*?)\|(.*?)\]/g, number > 0 ? '$1' : '$2');
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function numberText(number) {
    return number === 0 ? 'no more' : number;
  }
}

function sing(fromNumber, toNumber) {
  if (fromNumber > (toNumber || 0)) {
    return verse(fromNumber) + '\n' + sing(fromNumber-1, toNumber);
  }
  return verse(fromNumber);
}

module.exports = {
  verse: verse,
  sing: sing
};
