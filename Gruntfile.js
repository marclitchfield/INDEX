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
    less: {
      default: {
        options: {
          cleancss: true
        },
        files: {
          'editor/css/themes/gray.css': 'editor/themes/gray.less',
          'editor/css/themes/green.css': 'editor/themes/green.less',
          'editor/css/themes/pink.css': 'editor/themes/pink.less'
        }
      }
    },
    watch: {
      scripts: {
        files: ['editor/**/*.jade', 'editor/**/*.less'],
        tasks: ['jade','less'],
        options: {
          spawn: false
        },
      },
    }    
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jade','less']);
};
