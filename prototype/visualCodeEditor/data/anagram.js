var Word = function(letters) {
  var lowercaseLetters = letters.toLowerCase();
  var lowercaseSortedLetters = sortedLetters(lowercaseLetters);

  function sortedLetters(letters) {
    return letters.split('').sort().join('');
  }

  return {
    isDifferentThan: function(otherWord) {
      return lowercaseLetters !== otherWord.toLowerCase();
    },
    hasSameLettersAs: function(otherWord) {
      return lowercaseSortedLetters === sortedLetters(otherWord.toLowerCase());
    }
  };
}

var Anagram = function(letters) {
  var word = new Word(letters);

  function isAnagramOf(testWord) {
    return word.isDifferentThan(testWord) && word.hasSameLettersAs(testWord);
  }

  return {
    match: function(testWords) {
      return testWords.filter(isAnagramOf);
    }
  };
};

module.exports = Anagram;