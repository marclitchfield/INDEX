var lowercaseWords = function(text) {
  return text.toLowerCase().match(/\w+/g);
};

var wordCounts = function(text) {
  var words = lowercaseWords(text);
  return words.reduce(function wordCounts(counts, word) { 
    counts[word] = (counts[word] || 0) + 1; 
    return counts;
  }, {});
};

module.exports = wordCounts;
