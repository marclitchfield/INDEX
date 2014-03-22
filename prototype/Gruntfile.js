module.exports = function(grunt) {
  grunt.initConfig({
    jade: {
      default: {
        options: {
          data: {
            debug: false
          }
        },
        files: {
          'visualCodeEditor/editor.html': 'visualCodeEditor/editor.jade'
        }
      }
    },
    watch: {
      scripts: {
        files: ['visualCodeEditor/*.jade'],
        tasks: ['jade'],
        options: {
          spawn: false,
        },
      },
    }    
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jade']);
};
