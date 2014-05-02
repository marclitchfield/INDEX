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
    jshint: {
      default: {
        src: ['editor/js/*.js']
      }
    },
    exec: {
      git_add: {
        cmd: 'git add -A',
        stdout: true,
        stderr: true
      },
      git_commit: { 
        cmd: 'git commit -m "' + grunt.option('m') + '"',
        stdout: true,
        stderr: true
      },
      git_push_master: {
        cmd: 'git push origin master',
        stdout: true,
        stderr: true
      },
      git_checkout_ghpages: {
        cmd: 'git checkout gh-pages',
        stdout: true,
        stderr: true
      },
      git_merge_master: {
        cmd: 'git merge master',
        stdout: true,
        stderr: true
      },
      git_push_ghpages: {
        cmd: 'git push origin gh-pages',
        stdout: true,
        stderr: true
      },
      git_checkout_master: {
        cmd: 'git checkout master',
        stdout: true,
        stderr: true
      }
    },
    watch: {
      scripts: {
        files: ['editor/**/*.jade', 'editor/**/*.less', 'editor/js/*.js'],
        tasks: ['jade','less','jshint'],
        options: {
          spawn: false
        },
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['jade','less','jshint']);
  grunt.registerTask('commit', ['jade','less','jshint','exec:git_add','exec:git_commit','exec:git_push_master', 'exec:git_checkout_ghpages','exec:git_merge_master','exec:git_push_ghpages','exec:git_checkout_master' ]);
};
