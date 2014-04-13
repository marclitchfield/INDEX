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
          'editor/editor.html': 'editor/editor.jade'
        }
      }
    },
    watch: {
      scripts: {
        files: ['editor/**/*.jade'],
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
